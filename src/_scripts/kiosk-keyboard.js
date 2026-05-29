/*
 * On-screen keyboard for the memoriaal.ee kiosk.
 *
 * The kiosk runs desktop Chrome, which does not reliably raise an OS
 * touch keyboard from a web page. Phones/tablets keep using their native
 * keyboard; this script only activates in kiosk mode and never touches the
 * normal web experience.
 *
 * Enable:  open any page with ?kiosk=1  (persisted in localStorage)
 * Disable: open any page with ?kiosk=0
 */
(function () {
    'use strict'

    var STORAGE_KEY = 'memoriaalKiosk'

    function getParam(name) {
        var match = location.search.match(new RegExp('[?&]' + name + '=([^&]+)(&|$)'))
        return match ? decodeURIComponent(match[1]) : null
    }

    // Resolve / persist kiosk mode.
    try {
        var flag = getParam('kiosk')
        if (flag === '1') { localStorage.setItem(STORAGE_KEY, '1') }
        else if (flag === '0') { localStorage.removeItem(STORAGE_KEY) }
    } catch (e) { /* localStorage unavailable */ }

    var enabled = false
    try { enabled = localStorage.getItem(STORAGE_KEY) === '1' } catch (e) {}
    if (getParam('kiosk') === '1') { enabled = true }
    if (!enabled) { return }

    // ---- Layouts -----------------------------------------------------------
    var LAYOUTS = {
        et: [
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
            ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'ü', 'õ'],
            ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ö', 'ä'],
            ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'š', 'ž', '-', "'"]
        ],
        ru: [
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
            ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
            ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
            ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', 'ё', '-']
        ]
    }

    var LABELS = {
        et: { space: 'tühik', search: 'Otsi', clear: 'Tühjenda', close: 'Sulge', layout: 'РУ' },
        ru: { space: 'пробел', search: 'Поиск', clear: 'Очистить', close: 'Закрыть', layout: 'ABC' }
    }

    function pickLayout() {
        var lang = (document.documentElement.getAttribute('lang') || '').toLowerCase()
        return lang === 'ru' ? 'ru' : 'et'
    }

    var current = pickLayout()
    var active = null
    var root = null
    var keysWrap = null

    // ---- Selectors of fields the keyboard should serve ---------------------
    var EXCLUDED_TYPES = { date: 1, 'datetime-local': 1, month: 1, week: 1, time: 1, radio: 1, checkbox: 1, hidden: 1, submit: 1, button: 1, range: 1, color: 1, file: 1 }

    function isTextField(el) {
        if (!el) { return false }
        var tag = el.tagName
        if (tag === 'TEXTAREA') { return true }
        if (tag !== 'INPUT') { return false }
        var type = (el.getAttribute('type') || 'text').toLowerCase()
        return !EXCLUDED_TYPES[type]
    }

    // ---- Editing helpers ---------------------------------------------------
    function fireInput(el) {
        try { el.dispatchEvent(new Event('input', { bubbles: true })) } catch (e) {}
        try { el.dispatchEvent(new Event('change', { bubbles: true })) } catch (e) {}
    }

    function insertText(text) {
        var el = active
        if (!el) { return }
        var start = el.selectionStart
        var end = el.selectionEnd
        if (start === null || start === undefined) {
            el.value += text
        } else {
            el.value = el.value.slice(0, start) + text + el.value.slice(end)
            var pos = start + text.length
            try { el.setSelectionRange(pos, pos) } catch (e) {}
        }
        fireInput(el)
    }

    function backspace() {
        var el = active
        if (!el) { return }
        var start = el.selectionStart
        var end = el.selectionEnd
        if (start === null || start === undefined) {
            el.value = el.value.slice(0, -1)
        } else if (start !== end) {
            el.value = el.value.slice(0, start) + el.value.slice(end)
            try { el.setSelectionRange(start, start) } catch (e) {}
        } else if (start > 0) {
            el.value = el.value.slice(0, start - 1) + el.value.slice(start)
            try { el.setSelectionRange(start - 1, start - 1) } catch (e) {}
        }
        fireInput(el)
    }

    function clearField() {
        var el = active
        if (!el) { return }
        el.value = ''
        try { el.setSelectionRange(0, 0) } catch (e) {}
        fireInput(el)
    }

    function submitForm() {
        var el = active
        if (!el || !el.form) { return }
        var form = el.form
        var btn = form.querySelector('button[type="submit"], input[type="submit"], button:not([type])')
        if (btn) { btn.click() }
        else if (form.requestSubmit) { form.requestSubmit() }
        else { form.submit() }
    }

    // ---- DOM construction --------------------------------------------------
    function makeKey(label, opts) {
        opts = opts || {}
        var b = document.createElement('button')
        b.type = 'button'
        b.className = 'kiosk-kb-key' + (opts.cls ? ' ' + opts.cls : '')
        b.textContent = label
        b.setAttribute('data-action', opts.action || 'char')
        if (opts.action === 'char' || !opts.action) { b.setAttribute('data-char', opts.value != null ? opts.value : label) }
        return b
    }

    function renderKeys() {
        keysWrap.innerHTML = ''
        var rows = LAYOUTS[current]
        for (var r = 0; r < rows.length; r++) {
            var rowEl = document.createElement('div')
            rowEl.className = 'kiosk-kb-row'
            for (var k = 0; k < rows[r].length; k++) {
                rowEl.appendChild(makeKey(rows[r][k]))
            }
            keysWrap.appendChild(rowEl)
        }

        var lbl = LABELS[current]
        var bottom = document.createElement('div')
        bottom.className = 'kiosk-kb-row kiosk-kb-row-bottom'
        bottom.appendChild(makeKey(lbl.layout, { action: 'layout', cls: 'kiosk-kb-fn' }))
        bottom.appendChild(makeKey('.', { value: '.' }))
        bottom.appendChild(makeKey('@', { value: '@' }))
        bottom.appendChild(makeKey(lbl.space, { action: 'char', value: ' ', cls: 'kiosk-kb-space' }))
        bottom.appendChild(makeKey('⌫', { action: 'backspace', cls: 'kiosk-kb-fn' }))
        bottom.appendChild(makeKey(lbl.clear, { action: 'clear', cls: 'kiosk-kb-fn' }))
        bottom.appendChild(makeKey(lbl.search, { action: 'submit', cls: 'kiosk-kb-go' }))
        keysWrap.appendChild(bottom)
    }

    function build() {
        root = document.createElement('div')
        root.className = 'kiosk-kb'
        root.setAttribute('aria-hidden', 'true')

        var bar = document.createElement('div')
        bar.className = 'kiosk-kb-bar'
        var close = document.createElement('button')
        close.type = 'button'
        close.className = 'kiosk-kb-close'
        close.setAttribute('data-action', 'close')
        close.textContent = '✕'
        bar.appendChild(close)
        root.appendChild(bar)

        keysWrap = document.createElement('div')
        keysWrap.className = 'kiosk-kb-keys'
        root.appendChild(keysWrap)

        renderKeys()
        document.body.appendChild(root)

        // One delegated handler. Use pointerdown when available so taps never
        // blur the focused input (preventDefault keeps focus on the field).
        var evt = window.PointerEvent ? 'pointerdown' : 'mousedown'
        root.addEventListener(evt, onKey, false)
    }

    function onKey(e) {
        var target = e.target
        while (target && target !== root && !target.getAttribute('data-action')) {
            target = target.parentNode
        }
        if (!target || target === root) { return }
        e.preventDefault() // keep focus on the active field

        var action = target.getAttribute('data-action')
        switch (action) {
            case 'char': insertText(target.getAttribute('data-char')); break
            case 'backspace': backspace(); break
            case 'clear': clearField(); break
            case 'submit': submitForm(); break
            case 'close': hide(); break
            case 'layout':
                current = current === 'et' ? 'ru' : 'et'
                renderKeys()
                break
        }
    }

    function show() {
        if (!root) { build() }
        root.classList.add('is-open')
        document.body.classList.add('kiosk-kb-open')
        if (active && active.scrollIntoView) {
            try { active.scrollIntoView({ block: 'center' }) } catch (e) { active.scrollIntoView() }
        }
    }

    function hide() {
        if (root) { root.classList.remove('is-open') }
        document.body.classList.remove('kiosk-kb-open')
        if (active && active.blur) { active.blur() }
        active = null
    }

    function injectCss() {
        var css =
            '.kiosk-kb{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;' +
            'background:#1c1c1e;color:#fff;box-shadow:0 -6px 24px rgba(0,0,0,.45);' +
            'padding:8px 10px 14px;display:none;font-family:Montserrat,Arial,sans-serif;' +
            '-webkit-user-select:none;user-select:none;touch-action:manipulation}' +
            '.kiosk-kb.is-open{display:block}' +
            'body.kiosk-kb-open{padding-bottom:46vh!important}' +
            '.kiosk-kb-bar{display:flex;justify-content:flex-end;margin-bottom:6px}' +
            '.kiosk-kb-close{width:48px;height:48px;border:0;border-radius:8px;' +
            'background:#3a3a3c;color:#fff;font-size:20px;cursor:pointer}' +
            '.kiosk-kb-row{display:flex;gap:6px;justify-content:center;margin-bottom:6px}' +
            '.kiosk-kb-key{flex:1 1 0;min-width:0;height:62px;border:0;border-radius:8px;' +
            'background:#3a3a3c;color:#fff;font-size:24px;line-height:1;cursor:pointer;' +
            'padding:0;-webkit-tap-highlight-color:transparent}' +
            '.kiosk-kb-key:active{background:#5a5a5e}' +
            '.kiosk-kb-row-bottom .kiosk-kb-key{font-size:18px}' +
            '.kiosk-kb-space{flex:5 1 0}' +
            '.kiosk-kb-fn{background:#2c2c2e}' +
            '.kiosk-kb-go{background:#da3832;flex:2 1 0;font-weight:700;text-transform:uppercase}' +
            '.kiosk-kb-go:active{background:#b22b26}'
        var style = document.createElement('style')
        style.type = 'text/css'
        if (style.styleSheet) { style.styleSheet.cssText = css } else { style.appendChild(document.createTextNode(css)) }
        document.head.appendChild(style)
    }

    function init() {
        injectCss()
        document.addEventListener('focusin', function (e) {
            if (isTextField(e.target)) {
                active = e.target
                show()
            }
        }, false)
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init)
    } else {
        init()
    }
})()
