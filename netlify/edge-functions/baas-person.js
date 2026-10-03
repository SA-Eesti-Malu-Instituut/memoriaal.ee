/*
 * EMMA single record pages - /baas/<id>/<NAME> and /en/baas/<id>/<NAME>.
 *
 * The page behind these addresses is the static /baas/ page (see the rewrites
 * in netlify.toml), it reads the record id from the address and renders the
 * record in the browser. Search engines and link previews do not run that
 * script, so this function completes the page on its way out: the record's
 * title, description, canonical address and structured data go into the head
 * and the record itself is handed over, which saves the page from searching
 * for it once more.
 *
 * It only ever adds to the plain page - when something fails here, that page
 * is served as it is and finds the record on its own.
 */
import '../../src/baas/record.js'

const { esc, name, path, place, title, description } = globalThis.baasRecord

const SEARCH = '/.netlify/functions/baas_search'
const RECORD_PATH = /^(\/(?:en\/)?baas\/)(\d{10})(?:\/[^/]*)?\/?$/

// Left in the page by baas_layout.pug and baas/index.pug
const HEAD_START = '<!--!seo-->'
const HEAD_END = '<!--!/seo-->'
const SUMMARY = '<!--!record-->'
const LOCALE = /<script[^>]*\bid="baas-locale"[^>]*>([\s\S]*?)<\/script>/

// JSON that is safe inside a <script>
const json = (data) => JSON.stringify(data).replace(/</g, '\\u003c')

// One record by id, from the same function the page searches with
const lookup = async (origin, id) => {
    const response = await fetch(origin + SEARCH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: { match: { id } },
            _source: { excludes: ['searchable_text', 'pereseosed.relationship_text'] },
            _size: 1
        }),
        signal: AbortSignal.timeout(5000)
    })
    if (!response.ok) { throw new Error('search answered ' + response.status) }

    const hits = (await response.json()).hits.hits
    const hit = hits.find(({ _source }) => _source.id === id)

    return hit ? hit._source : null
}

// Records merged into another one point to it with `redirect`
const find = async (origin, id) => {
    let record = await lookup(origin, id)

    for (let hops = 0; record && record.redirect && hops < 3; hops++) {
        record = await lookup(origin, record.redirect)
    }

    return record && !record.redirect ? record : null
}

// The page and the person in schema.org terms
const structured = (record, locale, url) => {
    const date = (text) => /^\d{4}(-\d{2}){0,2}$/.test(text || '') ? text : undefined
    const spot = (text) => place(text) ? { '@type': 'Place', name: place(text) } : undefined
    const parents = [[record.isanimi, 'Male'], [record.emanimi, 'Female']]
        .filter(([parent]) => parent)
        .map(([parent, gender]) => ({ '@type': 'Person', name: parent, gender: 'https://schema.org/' + gender }))
    const sources = (record.kirjed || [])
        .filter((kirje) => kirje.allika_nimetus || kirje.allikas)
        .slice(0, 20)
        .map((kirje) => ({
            '@type': 'CreativeWork',
            name: kirje.allika_nimetus || kirje.allikas,
            identifier: kirje.kirjekood,
            url: kirje.viide || undefined
        }))

    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'ItemPage',
                '@id': url,
                url,
                name: title(record, locale),
                description: description(record, locale),
                inLanguage: locale.lang,
                isPartOf: { '@type': 'WebSite', name: locale.siteTitle, url: locale.home },
                mainEntity: { '@id': url + '#person' },
                breadcrumb: { '@id': url + '#breadcrumb' },
                publisher: { '@type': 'Organization', name: locale.source.maintainer, url: locale.home },
                dateCreated: record.created_at,
                dateModified: record.updated_at
            },
            {
                '@type': 'Person',
                '@id': url + '#person',
                name: name(record) || undefined,
                givenName: record.eesnimi,
                familyName: record.perenimi,
                birthDate: date(record.sünd),
                deathDate: date(record.surm),
                birthPlace: spot(record.sünnikoht),
                deathPlace: spot(record.surmakoht),
                parent: parents.length ? parents : undefined,
                identifier: { '@type': 'PropertyValue', propertyID: locale.source.id, value: record.id },
                url,
                subjectOf: sources.length ? sources : undefined
            },
            {
                '@type': 'BreadcrumbList',
                '@id': url + '#breadcrumb',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: locale.siteTitle, item: locale.home },
                    { '@type': 'ListItem', position: 2, name: locale.dataset, item: locale.site + locale.root },
                    { '@type': 'ListItem', position: 3, name: title(record, locale) }
                ]
            }
        ]
    }
}

// What search engines and link previews read - goes between the seo marks
const head = (record, locale, id) => {
    const handed = `<script type="application/json" id="baas-record">${json({ id, record })}</script>`

    if (!record) {
        return `<title>${esc(locale.notFound + ' · ' + locale.dataset)}</title><meta name="robots" content="noindex">` + handed
    }

    const url = locale.site + path(locale.root, record)
    const heading = title(record, locale)
    const text = description(record, locale)

    return [
        `<title>${esc(heading + ' · ' + locale.dataset)}</title>`,
        `<meta name="description" content="${esc(text)}">`,
        name(record) ? '' : '<meta name="robots" content="noindex">',
        `<link rel="canonical" href="${url}">`,
        ...locale.alternates.map((alternate) => `<link rel="alternate" hreflang="${alternate.lang}" href="${locale.site + path(alternate.root, record)}">`),
        '<meta property="og:type" content="profile">',
        `<meta property="og:url" content="${url}">`,
        `<meta property="og:title" content="${esc(heading)}">`,
        `<meta property="og:description" content="${esc(text)}">`,
        record.eesnimi ? `<meta property="profile:first_name" content="${esc(record.eesnimi)}">` : '',
        record.perenimi ? `<meta property="profile:last_name" content="${esc(record.perenimi)}">` : '',
        `<script type="application/ld+json">${json(structured(record, locale, url))}</script>`,
        handed
    ].join('')
}

// The record in plain words, for readers that do not run scripts
const summary = (record, locale) => {
    const text = (value) => esc(String(value || '').replace(/(\\n|\\r)+/g, ' '))
    const entries = (record.kirjed || []).map((kirje) => (
        `<li><strong>${text([kirje.allikas, kirje.kirjekood].filter(Boolean).join(' '))}</strong> ${text(kirje.kirje)}</li>`
    ))
    const family = (record.pereseosed || []).map((relative) => (
        `<li><a href="${locale.root + esc(relative.persoon)}">${text(relative.seos)}</a> ${text(relative.kirje)}</li>`
    ))

    return '<noscript><div class="search-result">'
        + `<h1 class="search-result-name">${esc(title(record, locale))}</h1>`
        + `<p>${esc(description(record, locale))}</p>`
        + (entries.length + family.length ? `<ul>${entries.concat(family).join('')}</ul>` : '')
        + '</div></noscript>'
}

// The page with the record (or the lack of it) written in
const fill = (html, record, id) => {
    const locale = JSON.parse(html.match(LOCALE)[1])
    const start = html.indexOf(HEAD_START)
    const end = html.indexOf(HEAD_END)

    if (start === -1 || end < start) { throw new Error('the page has no seo marks') }

    return html.slice(0, start + HEAD_START.length)
        + head(record, locale, id)
        + html.slice(end).replace(SUMMARY, () => record ? summary(record, locale) : '')
}

export default async (request, context) => {
    const url = new URL(request.url)
    const [, root, id] = url.pathname.match(RECORD_PATH) || []

    if (!id || !['GET', 'HEAD'].includes(request.method)) { return }

    let record
    try {
        record = await find(url.origin, id)
    } catch (error) {
        // the page will search on its own
        console.error(`baas-person: looking up ${id} failed -`, error)
        return
    }

    // one address per record - /baas/<id> and outdated names move to the current one
    if (record && url.pathname.replace(/\/$/, '') !== path(root, record)) {
        return Response.redirect(new URL(path(root, record) + url.search, url), 301)
    }

    const response = await context.next()
    const html = await response.text()
    const headers = new Headers(response.headers)
    let page = html

    if (html) {
        try {
            page = fill(html, record, id)
            // of the page as it was
            headers.delete('content-length')
            headers.delete('etag')
        } catch (error) {
            console.error(`baas-person: filling in ${id} failed -`, error)
        }
    }

    return new Response(page, { status: response.ok && !record ? 404 : response.status, headers })
}

export const config = {
    path: ['/baas/:id', '/baas/:id/:name', '/en/baas/:id', '/en/baas/:id/:name'],
    onError: 'bypass'
}
