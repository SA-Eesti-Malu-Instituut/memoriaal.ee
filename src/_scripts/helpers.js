const get = document.getElementById.bind(document)
const query = document.querySelector.bind(document)
const queryAll = document.querySelectorAll.bind(document)

const copy2clipboard = function (DomE, transparentE = null) {
    if (!DomE) {
        console.error('copy2clipboard: missing DomE')
        return
    }
    const clip = DomE.getAttribute('clip')
    if (!clip) {
        console.error('copy2clipboard: missing clip')
        return
    }
    navigator.clipboard.writeText(clip)
    transparentE = transparentE || (DomE.firstChild && DomE.firstChild.nextSibling)
    if (transparentE) {
        transparentE.classList.remove('transparent')
        setTimeout(function() { 
            transparentE.classList.add('transparent') 
        }, 400)
    }
}

const qs = function (key) {
    key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&")
    var match = location.search.match(new RegExp("[?&]"+key+"=([^&]+)(&|$)"))
    return match && decodeURIComponent(match[1].replace(/\+/g, " "))
}

const replaceLinebreaks = function(text) {
    const replaced = text.replace(/(\\n\\r|\\n|\\r)+/g, '<br/>')
    return replaced
}

const triggerResizeAfterSearchUpdate = function() {
    // Wait for DOM to update
    setTimeout(function() {
        // Check if we're in IE11
        if (window.isIE11) {
            // Trigger more aggressive resizing for IE11
            setTimeout(function() { window.dispatchEvent(new CustomEvent('resize')) }, 10);
            setTimeout(function() { window.dispatchEvent(new CustomEvent('resize')) }, 100);
            setTimeout(function() { window.dispatchEvent(new CustomEvent('resize')) }, 500);
        } else {
            // For modern browsers, a single resize is enough
            window.dispatchEvent(new Event('resize'));
        }
    }, 100);
}
