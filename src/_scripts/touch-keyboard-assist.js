/*
 * Native OS keyboard assist for regular web on touch devices (tablets/phones).
 *
 * Modern tablet browsers raise the soft keyboard on tap automatically, but some
 * embedded/WebView browsers only do so if focus happens inside a user gesture.
 * This nudges focus onto the tapped field during the touch, which reliably
 * invites the native keyboard. It is a no-op on desktop and is skipped entirely
 * in kiosk mode (where the in-page keyboard handles input instead).
 */
(function () {
    'use strict'

    // Skip in kiosk mode.
    try { if (localStorage.getItem('memoriaalKiosk') === '1') { return } } catch (e) {}
    if (/[?&]kiosk=1(&|$)/.test(location.search)) { return }

    // Touch devices only.
    var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)
    if (!isTouch) { return }

    var EXCLUDED_TYPES = { date: 1, 'datetime-local': 1, month: 1, week: 1, time: 1, radio: 1, checkbox: 1, hidden: 1, submit: 1, button: 1, range: 1, color: 1, file: 1 }

    function isTextField(el) {
        if (!el) { return false }
        var tag = el.tagName
        if (tag === 'TEXTAREA') { return true }
        if (tag !== 'INPUT') { return false }
        var type = (el.getAttribute('type') || 'text').toLowerCase()
        return !EXCLUDED_TYPES[type]
    }

    document.addEventListener('touchend', function (e) {
        var el = e.target
        if (!isTextField(el)) { return }
        // Only assist when the browser hasn't already focused the field; never
        // steal focus away from a field the user is already typing in.
        if (document.activeElement !== el && typeof el.focus === 'function') {
            el.focus()
        }
    }, false)
})()
