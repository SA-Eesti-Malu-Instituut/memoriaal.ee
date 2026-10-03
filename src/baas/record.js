/*
 * EMMA record helpers - how a record is named, addressed and summed up.
 *
 * Used in two places that have to agree: the /baas/ page (included from
 * index.pug) and netlify/edge-functions/baas-person.js, which prepares the
 * same page on the server. Keep this file free of DOM and jQuery, it has to
 * run in both.
 *
 * `locale` is the content of the page's #baas-locale block, see index.pug.
 */
globalThis.baasRecord = (function () {
    // What is shown of a record. The page and baas-person.js both ask the search
    // for exactly these, so a record looks the same whichever way it arrives.
    const fields = [
        'redirect',
        'isperson', 'kivi', 'emem', 'evo', 'wwii', 'evokirje', 'mv',
        'perenimi', 'eesnimi', 'isanimi', 'emanimi', 'perenimed', 'eesnimed',
        'sünd', 'surm', 'sünnikoht', 'surmakoht', 'id',
        'kirjed.kirje', 'kirjed.kirjekood', 'kirjed.viide', 'kirjed.allikas', 'kirjed.allika_nimetus',
        'pereseosed.persoon', 'pereseosed.kirje',
        'pereseosed.seos', 'pereseosed.suund', 'pereseosed.kirjed',
        'tahvlikirje.kirjekood', 'tahvlikirje.kirje', 'tahvlikirje.tahvel', 'tahvlikirje.tulp', 'tahvlikirje.rida',
        'episoodid.kirjekood', 'episoodid.asukoht', 'episoodid.nimetus',
        'created_at', 'updated_at'
    ]

    const esc = (text) => String(text == null ? '' : text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

    // 'ILMAR-JAAN TAMM'
    const name = (p) => [p.eesnimi, p.perenimi].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()

    // 'JÜRI ÕUN' -> 'JURI-OUN', the readable tail of a record's address.
    // Only the id finds the record, so this may change when the name is corrected.
    const slug = (p) => name(p)
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

    // '/baas/0000344223/ILMAR-JAAN-TAMM' - root is '/baas/' or '/en/baas/'
    const path = (root, p) => root + p.id + (slug(p) ? '/' + slug(p) : '')

    // 'Eesti (endine)|Saare maakond|Kaarma vald|||||||' -> 'Eesti (endine), Saare maakond, Kaarma vald'
    const place = (text) => String(text || '').split('|').map((part) => part.trim()).filter(Boolean).join(', ')

    // '1905–1942', 'snd 1947', 'srn 1942' or ''
    const years = (p, locale) => {
        const born = String(p.sünd || '').slice(0, 4)
        const dead = String(p.surm || '').slice(0, 4)

        if (born && dead) { return born + '–' + dead }
        if (born) { return locale.bornShort + ' ' + born }
        if (dead) { return locale.deadShort + ' ' + dead }
        return ''
    }

    // 'JAAN TAMM (1905–1942)'
    const title = (p, locale) => (name(p) || p.id) + (years(p, locale) ? ' (' + years(p, locale) + ')' : '')

    // 'JAAN TAMM – sünd: 1905-05-28, KÜTI V; surm: 1942-04-13; isa: KAAREL; ema: AMALIE. Kirje ...'
    const description = (p, locale) => {
        const fact = (label, values) => {
            const value = values.filter(Boolean).join(', ')
            return value ? label + ': ' + value : ''
        }
        const facts = [
            fact(locale.born, [p.sünd, place(p.sünnikoht)]),
            fact(locale.dead, [p.surm, place(p.surmakoht)]),
            fact(locale.father, [p.isanimi]),
            fact(locale.mother, [p.emanimi])
        ].filter(Boolean)
        const lead = (name(p) || p.id) + (facts.length ? ' – ' + facts.join('; ') : '')

        return lead.replace(/\.$/, '') + '. ' + locale.summary
    }

    return { fields, esc, name, slug, path, place, years, title, description }
})()
