// IE11 Polyfill for common ES6 features
// This helps prevent errors in older browsers like SiteKiosk

// Broader IE detection - will catch IE11 and below
window.isIE = function() {
  // Detect IE11
  var isIE11 = !!window.MSInputMethodContext && !!document.documentMode;
  
  // Detect IE10 and below
  var isOlderIE = false;
  
  // Check for older versions of IE
  if (!isIE11 && typeof document.documentMode !== 'undefined') {
    isOlderIE = true;
  }
  
  // Check for very old IE
  if (!isIE11 && !isOlderIE && typeof window.attachEvent !== 'undefined') {
    isOlderIE = true;
  }
  
  return isIE11 || isOlderIE;
}();

// For backwards compatibility - keep the old isIE11 property
window.isIE11 = window.isIE;

// Polyfill for String.prototype.includes
if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    'use strict';
    if (typeof start !== 'number') {
      start = 0;
    }
    
    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}

// Polyfill for Promise
if (typeof Promise === 'undefined') {
  // Load a simple promise polyfill - this isn't a full implementation
  // but should handle basic cases
  window.Promise = function(executor) {
    var self = this;
    self.status = 'pending';
    self.value = null;
    self.reason = null;
    self.onResolvedCallbacks = [];
    self.onRejectedCallbacks = [];

    function resolve(value) {
      if (self.status === 'pending') {
        self.status = 'resolved';
        self.value = value;
        for (var i = 0; i < self.onResolvedCallbacks.length; i++) {
          self.onResolvedCallbacks[i](value);
        }
      }
    }

    function reject(reason) {
      if (self.status === 'pending') {
        self.status = 'rejected';
        self.reason = reason;
        for (var i = 0; i < self.onRejectedCallbacks.length; i++) {
          self.onRejectedCallbacks[i](reason);
        }
      }
    }

    try {
      executor(resolve, reject);
    } catch (e) {
      reject(e);
    }
  };

  Promise.prototype.then = function(onResolved, onRejected) {
    var self = this;
    var promise2 = new Promise(function(resolve, reject) {
      if (self.status === 'resolved') {
        try {
          var x = onResolved(self.value);
          resolve(x);
        } catch (e) {
          reject(e);
        }
      }
      if (self.status === 'rejected') {
        try {
          var x = onRejected(self.reason);
          resolve(x);
        } catch (e) {
          reject(e);
        }
      }
      if (self.status === 'pending') {
        self.onResolvedCallbacks.push(function(value) {
          try {
            var x = onResolved(value);
            resolve(x);
          } catch (e) {
            reject(e);
          }
        });
        self.onRejectedCallbacks.push(function(reason) {
          try {
            var x = onRejected(reason);
            resolve(x);
          } catch (e) {
            reject(e);
          }
        });
      }
    });
    return promise2;
  };

  Promise.prototype.catch = function(onRejected) {
    return this.then(null, onRejected);
  };
}

// Event constructor polyfill for IE
(function() {
  // Only create if it doesn't exist
  if (typeof window.CustomEvent === "function") return false;
  
  function CustomEvent(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: null };
    
    // Handle different ways to create events in different IE versions
    var evt;
    
    try {
      // Try the modern way first
      evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    } catch (e) {
      try {
        // Fallback for older IE
        evt = document.createEvent('Event');
        evt.initEvent(event, params.bubbles, params.cancelable);
        evt.detail = params.detail;
      } catch (e2) {
        // Last resort for very old browsers
        evt = document.createEventObject();
        evt.type = event;
        evt.bubbles = params.bubbles;
        evt.cancelable = params.cancelable;
        evt.detail = params.detail;
      }
    }
    
    return evt;
  }
  
  // Use defineProperty if available (IE9+), otherwise just set the property
  try {
    Object.defineProperty(window, 'CustomEvent', {
      value: CustomEvent,
      writable: false,
      configurable: false
    });
  } catch (e) {
    // Fallback for very old IE
    window.CustomEvent = CustomEvent;
  }
})();

// Add try-catch for navigator.clipboard API
if (window.isIE) {
  // Create a mock clipboard API for IE
  try {
    window.navigator.clipboard = window.navigator.clipboard || {
      writeText: function(text) {
        // Try to use the IE-specific clipboardData if available
        if (window.clipboardData && window.clipboardData.setData) {
          try {
            window.clipboardData.setData('Text', text);
            return {
              then: function(callback) { 
                if (callback) callback(); 
                return this; 
              },
              catch: function() { return this; }
            };
          } catch (e) {
            console.log('Clipboard fallback: ' + text);
          }
        }
        
        // Return a promise-like object for compatibility
        return {
          then: function(callback) { 
            if (callback) callback(); 
            return this; 
          },
          catch: function() { return this; }
        };
      }
    };
  } catch (e) {
    // Ignore errors, just keep going
  }
}

// Optional: Handle console logs in IE
if (window.isIE && typeof console !== 'undefined') {
  try {
    // Save original console methods
    var oldLog = console.log;
    var oldWarn = console.warn;
    var oldError = console.error;
    
    // Create safe logging functions
    console.log = function() {
      try {
        // Only log errors by default
        if (arguments[0] && typeof arguments[0] === 'string' && 
            (arguments[0].indexOf('Error') === 0 || arguments[0].indexOf('error') === 0)) {
          return oldLog.apply(console, arguments);
        }
      } catch (e) {}
    };
    
    console.warn = function() {
      try {
        return oldWarn.apply(console, arguments);
      } catch (e) {}
    };
    
    console.error = function() {
      try {
        return oldError.apply(console, arguments);
      } catch (e) {}
    };
  } catch (e) {
    // Ignore errors with console handling
  }
}

// Improve resize handling in older IE
document.addEventListener('DOMContentLoaded', function() {
  try {
    // Function to force multiple resize events for IE
    function triggerIEResize() {
      if (window.isIE) {
        // IE needs multiple resize events with different delays to properly render
        for (var delay = 10; delay <= 1000; delay *= 2) {
          setTimeout(function() {
            try {
              // Try several methods to dispatch resize event
              if (typeof window.dispatchEvent === 'function') {
                try {
                  var evt = new CustomEvent('resize');
                  window.dispatchEvent(evt);
                } catch (e) {
                  try {
                    var evt2 = document.createEvent('UIEvents');
                    evt2.initUIEvent('resize', true, false, window, 0);
                    window.dispatchEvent(evt2);
                  } catch (e2) {
                    // Last resort for very old IE
                    if (typeof window.fireEvent === 'function') {
                      window.fireEvent('onresize');
                    }
                  }
                }
              }
            } catch (e) {
              // Ignore errors, just continue
            }
          }, delay);
        }
      }
    }
    
    // Fix background issues in IE
    if (window.isIE) {
      // Fix gray background area
      fixBackgroundIssues();
      
      // Reapply after a delay to ensure it takes effect
      setTimeout(fixBackgroundIssues, 500);
      setTimeout(fixBackgroundIssues, 1500);
    }
    
    // Trigger on DOMContentLoaded
    triggerIEResize();
    
    // Also trigger on window load when all resources are fully loaded
    if (window.addEventListener) {
      window.addEventListener('load', function() {
        triggerIEResize();
        
        // Fix background again on load
        if (window.isIE) {
          fixBackgroundIssues();
          
          // Apply again after a delay
          setTimeout(fixBackgroundIssues, 200);
          setTimeout(fixBackgroundIssues, 1000);
        }
        
        // Special fix for navigation menu in IE
        if (window.isIE) {
          var navigation = document.getElementById('navigation');
          if (navigation) {
            // Force IE to recalculate fixed-bottom layout
            ensureNavigationVisibility(navigation);
            
            // Re-check visibility after a delay
            setTimeout(function() {
              ensureNavigationVisibility(navigation);
            }, 500);
            
            // Add click handler to ensure navigation remains visible
            try {
              document.body.addEventListener('click', function() {
                setTimeout(function() {
                  ensureNavigationVisibility(navigation);
                }, 100);
              });
            } catch (e) {
              // Fallback for very old IE
              try {
                document.body.attachEvent('onclick', function() {
                  setTimeout(function() {
                    ensureNavigationVisibility(navigation);
                  }, 100);
                });
              } catch (e2) {}
            }
          }
        }
      });
    } else if (window.attachEvent) {
      // For very old IE
      window.attachEvent('onload', function() {
        triggerIEResize();
        
        // Fix background again on load
        if (window.isIE) {
          fixBackgroundIssues();
          
          // Apply again after a delay
          setTimeout(fixBackgroundIssues, 200);
          setTimeout(fixBackgroundIssues, 1000);
        }
      });
    }
    
    // For fixed bottom elements specifically
    var fixedElements = document.querySelectorAll('.fixed-bottom');
    if (fixedElements.length > 0 && window.isIE) {
      // Additional fix specifically for fixed-bottom elements in IE
      setTimeout(function() {
        for (var i = 0; i < fixedElements.length; i++) {
          try {
            // Force a reflow by accessing the offsetHeight property
            var force = fixedElements[i].offsetHeight;
            // Temporarily toggle the display to force a repaint
            var currentDisplay = fixedElements[i].style.display;
            fixedElements[i].style.display = 'none';
            // Force a reflow/repaint
            var force2 = fixedElements[i].offsetHeight;
            fixedElements[i].style.display = currentDisplay;
          } catch (e) {
            // Ignore errors, continue with next element
          }
        }
        
        try {
          if (typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new CustomEvent('resize'));
          } else if (typeof window.fireEvent === 'function') {
            window.fireEvent('onresize');
          }
        } catch (e) {}
      }, 300);
    }
  } catch (e) {
    // Global error handler - catch and ignore to prevent script breaking
  }
}, false);

// Helper function to fix background issues in IE
function fixBackgroundIssues() {
  try {
    // STEP 1: Fix the body background
    var bodyElement = document.body;
    if (bodyElement) {
      // Force a background image if needed
      try {
        // Set essential body styles for proper layout
        bodyElement.style.minHeight = '100vh';
        bodyElement.style.position = 'relative';
        bodyElement.style.overflow = 'auto';
        
        // Ensure the body background is visible
        var computedStyle = window.getComputedStyle ? window.getComputedStyle(bodyElement) : bodyElement.currentStyle;
        var bgImage = computedStyle ? computedStyle.backgroundImage : '';
        
        if (bgImage && bgImage !== 'none') {
          bodyElement.style.backgroundRepeat = 'no-repeat';
          bodyElement.style.backgroundSize = 'cover';
          bodyElement.style.backgroundPosition = 'center center';
          bodyElement.style.backgroundAttachment = 'fixed';
        }
      } catch (e) {
        // Fallback if we can't get computed style
        bodyElement.style.backgroundRepeat = 'no-repeat';
        bodyElement.style.backgroundPosition = 'center center';
      }
    }
    
    // STEP 2: Target specific containers but preserve layout
    // List of containers to make transparent without changing display properties
    var transparentSelectors = [
      '#text', '#text-text', '#search-results', '.container-fluid', 
      '.col-12', '.col-md-9', '.col-md-3'
    ];
    
    // Create a list of elements to make transparent
    var elementsToMakeTransparent = [];
    
    // Add specific elements by ID
    var specificIds = ['text', 'text-text', 'search-results', 'search'];
    for (var i = 0; i < specificIds.length; i++) {
      var element = document.getElementById(specificIds[i]);
      if (element) {
        elementsToMakeTransparent.push(element);
      }
    }
    
    // Try to add elements by selectors
    try {
      for (var s = 0; s < transparentSelectors.length; s++) {
        try {
          var elements = document.querySelectorAll(transparentSelectors[s]);
          for (var e = 0; e < elements.length; e++) {
            // Skip navigation element
            if (elements[e].id !== 'navigation') {
              elementsToMakeTransparent.push(elements[e]);
            }
          }
        } catch (e) {}
      }
    } catch (e) {}
    
    // STEP 3: Fix content elements but preserve display properties
    for (var i = 0; i < elementsToMakeTransparent.length; i++) {
      var element = elementsToMakeTransparent[i];
      if (!element) continue;
      
      try {
        // Force transparency without changing display
        element.style.backgroundColor = 'transparent';
        element.style.background = 'none';
        
        // Ensure visibility without changing display mode
        element.style.visibility = 'visible';
        
        // Ensure proper z-index (but don't mess with navigation)
        if (element.id !== 'navigation') {
          // Only set position if not already set
          if (!element.style.position || element.style.position === 'static') {
            element.style.position = 'relative';
          }
          element.style.zIndex = '1';
        }
      } catch (e) {}
    }
    
    // STEP 4: Fix layout for search bar and main content
    try {
      // Special handling for layout
      var searchCol = document.querySelector('.col-md-3');
      var contentCol = document.querySelector('.col-md-9');
      
      if (searchCol && contentCol) {
        // Make sure search stays on the right on larger screens
        if (window.innerWidth >= 768) {
          searchCol.style.cssFloat = 'right';
          contentCol.style.cssFloat = 'left';
        }
      }
      
      // Find row elements and ensure they maintain flex layout
      var rowElements = document.querySelectorAll('.row');
      for (var r = 0; r < rowElements.length; r++) {
        var row = rowElements[r];
        if (row.parentElement && row.parentElement.id === 'navigation') continue;
        
        row.style.display = 'flex';
        if (isOldIE()) {
          row.style.display = 'table';
          var children = row.children;
          for (var c = 0; c < children.length; c++) {
            children[c].style.display = 'table-cell';
          }
        }
      }
      
      // Find main content container
      var textContainer = document.getElementById('text');
      if (textContainer) {
        // Keep original layout but ensure content is visible
        textContainer.style.minHeight = '200px';
        textContainer.style.overflow = 'auto';
        textContainer.style.marginBottom = '150px'; // Space for footer
      }
      
      // Make search results visible with proper spacing
      var searchResults = document.getElementById('search-results');
      if (searchResults) {
        searchResults.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'; // Semi-transparent background
        searchResults.style.padding = '10px';
        searchResults.style.marginBottom = '150px'; // Space for footer
        searchResults.style.zIndex = '5'; // Above background
        searchResults.style.overflow = 'auto';
      }
      
      // Find the search bar container
      var searchBar = document.querySelector('form.search');
      if (searchBar) {
        searchBar.style.visibility = 'visible';
        searchBar.style.zIndex = '5';
      }
    } catch (e) {}
    
    // STEP 5: Fix any gray backgrounds more precisely
    try {
      // Look for gray backgrounds, specifically in content areas
      var contentAreas = document.querySelectorAll('.container-fluid, .col-12, .col-md-9, .col-md-3, #text, #text-text, #search-results');
      for (var i = 0; i < contentAreas.length; i++) {
        var element = contentAreas[i];
        if (element.id === 'navigation') continue; // Skip navigation
        
        try {
          var style = window.getComputedStyle ? window.getComputedStyle(element) : element.currentStyle;
          var bgColor = style ? style.backgroundColor : '';
          
          // Check if it has a gray background
          if (bgColor) {
            // Match any gray shade using RGB analysis
            if (bgColor.indexOf('rgb(') === 0) {
              var rgb = bgColor.match(/\d+/g);
              if (rgb && rgb.length >= 3) {
                var r = parseInt(rgb[0]);
                var g = parseInt(rgb[1]);
                var b = parseInt(rgb[2]);
                
                // If colors are close to each other, it's a gray tone
                var isGray = Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30;
                if (isGray) {
                  element.style.backgroundColor = 'transparent';
                  element.style.background = 'none';
                }
              }
            }
          }
        } catch (e) {}
      }
    } catch (e) {}
    
    // STEP 6: Ensure footer has proper spacing and preserve layout
    var navigation = document.getElementById('navigation');
    if (navigation) {
      // Ensure fixed position
      navigation.style.position = 'fixed';
      navigation.style.bottom = '0';
      navigation.style.left = '0';
      navigation.style.right = '0';
      navigation.style.zIndex = '1030';
      
      // Add a spacer div if it doesn't exist
      var spacer = document.getElementById('footer-spacer');
      if (!spacer) {
        try {
          spacer = document.createElement('div');
          spacer.id = 'footer-spacer';
          spacer.style.height = '150px';
          spacer.style.width = '100%';
          spacer.style.clear = 'both';
          document.body.appendChild(spacer);
        } catch (e) {}
      }
    }
  } catch (e) {
    // Global catch to prevent script breaking
  }
}

// Helper function to check if element has a class (for IE8 and below)
function hasClass(element, className) {
  if (!element) return false;
  
  if (element.classList) {
    return element.classList.contains(className);
  } else {
    return new RegExp('(^| )' + className + '( |$)', 'gi').test(element.className);
  }
}

// Helper function to ensure footer navigation is visible in IE
function ensureNavigationVisibility(navigation) {
  try {
    if (!navigation) return;
    
    // Force visibility of navigation container
    try {
      var navStyle = window.getComputedStyle ? 
                    window.getComputedStyle(navigation) : 
                    navigation.currentStyle;
                    
      var display = navStyle ? navStyle.display : '';
      
      if (display === 'none') {
        navigation.style.display = 'block';
      }
    } catch (e) {
      // Fallback if getComputedStyle fails
      navigation.style.display = 'block';
    }
    
    // Get navigation children
    var navRows = navigation.getElementsByClassName ? 
                 navigation.getElementsByClassName('row') : 
                 findElementsByClass(navigation, 'row');
                 
    for (var i = 0; i < navRows.length; i++) {
      // Force visibility on each row
      navRows[i].style.display = 'flex';
      
      // Fallback for older IE that doesn't support flex
      if (isOldIE()) {
        navRows[i].style.display = 'block';
      }
      
      navRows[i].style.visibility = 'visible';
    }
    
    // Special handling for the language selection row
    var localeElement = document.getElementById('text-locale');
    if (localeElement && localeElement.parentElement) {
      // Make sure the language row is visible
      localeElement.parentElement.style.display = 'flex';
      
      // Fallback for older IE that doesn't support flex
      if (isOldIE()) {
        localeElement.parentElement.style.display = 'block';
      }
      
      localeElement.parentElement.style.visibility = 'visible';
    }
    
    // Special IE positioning fix
    if (window.innerWidth >= 768 || 
        (document.documentElement && document.documentElement.clientWidth >= 768)) {
      navigation.style.position = 'fixed';
      navigation.style.bottom = '0';
      navigation.style.left = '0';
      navigation.style.right = '0';
      navigation.style.zIndex = '1030';
      
      // Check if we need to force menu visibility
      var menuRow = navRows.length > 1 ? navRows[1] : null;
      if (menuRow) {
        try {
          var menuStyle = window.getComputedStyle ? 
                         window.getComputedStyle(menuRow) : 
                         menuRow.currentStyle;
                         
          var menuDisplay = menuStyle ? menuStyle.display : '';
          
          if (menuDisplay === 'none') {
            menuRow.style.display = 'flex';
            
            // Fallback for older IE that doesn't support flex
            if (isOldIE()) {
              menuRow.style.display = 'block';
            }
          }
        } catch (e) {
          // Fallback if getComputedStyle fails
          menuRow.style.display = 'block';
        }
      }
    }
  } catch (e) {
    // Global catch to prevent script breaking
  }
}

// Helper function to find elements by class for older IE
function findElementsByClass(container, className) {
  if (!container) return [];
  
  var result = [];
  var allElements = container.getElementsByTagName('*');
  
  for (var i = 0; i < allElements.length; i++) {
    if (hasClass(allElements[i], className)) {
      result.push(allElements[i]);
    }
  }
  
  return result;
}

// Helper function to detect IE8 and below
function isOldIE() {
  // Check for very old versions of IE (8 and below)
  return window.isIE && typeof document.addEventListener !== 'function' && typeof document.attachEvent === 'function';
} 