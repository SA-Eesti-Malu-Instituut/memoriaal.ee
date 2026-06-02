/*
 * Kiosk inactivity reset.
 *
 * In kiosk mode (?kiosk=1, see kiosk-keyboard.js) the screen should return to
 * the homepage when a visitor walks away. After 3 minutes without any
 * interaction on a non-home page, redirect back to the home page (keeping the
 * kiosk flag). The home page itself is left alone so the idle screen stays put.
 */
(function () {
    'use strict'

    var STORAGE_KEY = 'memoriaalKiosk'
    var IDLE_MS = 3 * 60 * 1000 // 3 minutes
    var HOME = '/?kiosk=1'

    function getParam(name) {
        var match = location.search.match(new RegExp('[?&]' + name + '=([^&]+)(&|$)'))
        return match ? decodeURIComponent(match[1]) : null
    }

    // Resolve kiosk mode the same way kiosk-keyboard.js does.
    var enabled = false
    try { enabled = localStorage.getItem(STORAGE_KEY) === '1' } catch (e) {}
    if (getParam('kiosk') === '1') { enabled = true }
    if (getParam('kiosk') === '0') { enabled = false }
    if (!enabled) { return }

    // Don't reset away from the home page (it is already the idle screen).
    function isHome() {
        var p = location.pathname.replace(/\/+$/, '')
        return p === '' || /^\/(en|ru)$/.test(p)
    }
    if (isHome()) { return }

    var timer = null

    function reset() {
        if (timer) { clearTimeout(timer) }
        timer = setTimeout(function () {
            location.href = HOME
        }, IDLE_MS)
    }

    var EVENTS = ['pointerdown', 'mousedown', 'touchstart', 'keydown', 'scroll', 'wheel']
    for (var i = 0; i < EVENTS.length; i++) {
        document.addEventListener(EVENTS[i], reset, true)
    }

    reset()
})()
