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
        // Check if we're in IE
        if (window.isIE) {
            // Trigger more aggressive resizing for IE
            setTimeout(function() { window.dispatchEvent(new CustomEvent('resize')) }, 10);
            setTimeout(function() { window.dispatchEvent(new CustomEvent('resize')) }, 100);
            setTimeout(function() { window.dispatchEvent(new CustomEvent('resize')) }, 500);
            
            // Ensure navigation visibility after search results load
            if (typeof ensureNavigationVisibility === 'function') {
                var navigation = document.getElementById('navigation');
                if (navigation) {
                    setTimeout(function() { 
                        ensureNavigationVisibility(navigation); 
                    }, 50);
                    
                    setTimeout(function() { 
                        ensureNavigationVisibility(navigation); 
                    }, 300);
                }
            }
            
            // Fix background issues after search results load
            if (typeof fixBackgroundIssues === 'function') {
                setTimeout(fixBackgroundIssues, 150);
                setTimeout(fixBackgroundIssues, 600);
            }
            
            // Ensure search results are properly visible
            setTimeout(function() {
                try {
                    var searchResults = document.getElementById('search-results');
                    if (searchResults) {
                        // Make search results visible with scrolling if needed
                        searchResults.style.display = 'block';
                        searchResults.style.visibility = 'visible';
                        searchResults.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                        searchResults.style.padding = '15px';
                        searchResults.style.position = 'relative';
                        searchResults.style.zIndex = '10';
                        searchResults.style.maxHeight = 'calc(100vh - 250px)';
                        searchResults.style.overflow = 'auto';
                        searchResults.style.marginBottom = '150px';
                    }
                    
                    // Also ensure any content containers are visible
                    var contentContainers = [
                        document.getElementById('text'),
                        document.getElementById('text-text')
                    ];
                    
                    for (var i = 0; i < contentContainers.length; i++) {
                        var container = contentContainers[i];
                        if (container) {
                            container.style.visibility = 'visible';
                            container.style.display = 'block';
                            container.style.position = 'relative';
                            container.style.zIndex = '1';
                        }
                    }
                    
                    // Ensure there's space for the footer
                    var spacer = document.getElementById('footer-spacer');
                    if (!spacer) {
                        spacer = document.createElement('div');
                        spacer.id = 'footer-spacer';
                        spacer.style.height = '150px';
                        spacer.style.width = '100%';
                        document.body.appendChild(spacer);
                    }
                } catch (e) {}
            }, 300);
        } else {
            // For modern browsers, a single resize is enough
            window.dispatchEvent(new Event('resize'));
        }
    }, 100);
}
