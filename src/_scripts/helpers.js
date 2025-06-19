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
            
            // Fix search results while preserving layout
            setTimeout(function() {
                try {
                    // Make sure search stays on the right on larger screens
                    var searchCol = document.querySelector('.col-md-3');
                    var contentCol = document.querySelector('.col-md-9');
                    
                    if (searchCol && contentCol && window.innerWidth >= 768) {
                        searchCol.style.cssFloat = 'right';
                        contentCol.style.cssFloat = 'left';
                    }
                    
                    // Ensure row elements maintain flex layout
                    var rowElements = document.querySelectorAll('.row');
                    for (var r = 0; r < rowElements.length; r++) {
                        var row = rowElements[r];
                        if (row.parentElement && row.parentElement.id === 'navigation') continue;
                        
                        // Preserve flex layout
                        row.style.display = 'flex';
                    }
                    
                    // Fix search results visibility without changing layout
                    var searchResults = document.getElementById('search-results');
                    if (searchResults) {
                        // Make results readable but keep layout
                        searchResults.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                        searchResults.style.visibility = 'visible';
                        searchResults.style.zIndex = '5';
                        searchResults.style.marginBottom = '150px';
                        searchResults.style.overflow = 'auto';
                    }
                    
                    // Ensure containers are visible but preserve layout
                    var containers = ['text', 'text-text', 'search-count'];
                    for (var i = 0; i < containers.length; i++) {
                        var el = document.getElementById(containers[i]);
                        if (el) {
                            el.style.visibility = 'visible';
                            el.style.backgroundColor = 'transparent';
                            el.style.position = el.style.position || 'relative';
                            el.style.zIndex = '1';
                        }
                    }
                    
                    // Ensure there's space for the footer
                    var spacer = document.getElementById('footer-spacer');
                    if (!spacer) {
                        spacer = document.createElement('div');
                        spacer.id = 'footer-spacer';
                        spacer.style.height = '150px';
                        spacer.style.width = '100%';
                        spacer.style.clear = 'both';
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
