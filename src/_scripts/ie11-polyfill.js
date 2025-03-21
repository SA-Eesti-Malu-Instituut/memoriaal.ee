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
    // Check for common elements that might have background issues
    var bodyElement = document.body;
    if (bodyElement) {
      // Ensure body has proper background handling
      try {
        var computedStyle = window.getComputedStyle(bodyElement);
        if (computedStyle && computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
          bodyElement.style.backgroundRepeat = 'no-repeat';
          bodyElement.style.backgroundSize = 'cover';
          bodyElement.style.backgroundPosition = 'center center';
        }
      } catch (e) {
        // Fallback for older IE that may not support getComputedStyle
        if (bodyElement.currentStyle && bodyElement.currentStyle.backgroundImage && 
            bodyElement.currentStyle.backgroundImage !== 'none') {
          bodyElement.style.backgroundRepeat = 'no-repeat';
          // Note: backgroundSize not supported in IE8 and below
          bodyElement.style.backgroundPosition = 'center center';
        }
      }
    }
    
    // Clear any unwanted gray backgrounds
    var potentialGrayElements = [
      document.getElementById('text'), 
      document.getElementById('text-text'),
      document.getElementById('search-results')
    ];
    
    // Add container-fluid elements that aren't navigation
    try {
      var containerFluids = document.querySelectorAll('.container-fluid');
      for (var k = 0; k < containerFluids.length; k++) {
        if (!containerFluids[k].id || containerFluids[k].id !== 'navigation') {
          potentialGrayElements.push(containerFluids[k]);
        }
      }
    } catch (e) {}
    
    // Check each potential gray element
    for (var i = 0; i < potentialGrayElements.length; i++) {
      var element = potentialGrayElements[i];
      if (element) {
        try {
          // Try using modern getComputedStyle first
          var style = window.getComputedStyle(element);
          var bgColor = style ? style.backgroundColor : '';
          
          // For older IE, try currentStyle
          if (!bgColor && element.currentStyle) {
            bgColor = element.currentStyle.backgroundColor;
          }
          
          // Check if this element has a gray background
          if (bgColor && 
              (bgColor.indexOf('rgb(128, 128, 128') !== -1 || 
               bgColor.indexOf('rgb(211, 211, 211') !== -1 ||
               bgColor.indexOf('rgb(169, 169, 169') !== -1 ||
               bgColor.indexOf('rgb(192, 192, 192') !== -1 ||
               bgColor.indexOf('rgb(220, 220, 220') !== -1 ||
               bgColor.indexOf('rgb(240, 240, 240') !== -1 ||
               bgColor.indexOf('rgb(245, 245, 245') !== -1 ||
               bgColor.indexOf('#808080') !== -1 ||
               bgColor.indexOf('#d3d3d3') !== -1 ||
               bgColor.indexOf('#a9a9a9') !== -1 ||
               bgColor.indexOf('#c0c0c0') !== -1 ||
               bgColor.indexOf('#dcdcdc') !== -1 ||
               bgColor.indexOf('#f0f0f0') !== -1 ||
               bgColor.indexOf('#f5f5f5') !== -1 ||
               bgColor.indexOf('gray') !== -1 ||
               bgColor.indexOf('grey') !== -1 ||
               bgColor.indexOf('lightgray') !== -1 ||
               bgColor.indexOf('lightgrey') !== -1 ||
               bgColor.indexOf('darkgray') !== -1 ||
               bgColor.indexOf('darkgrey') !== -1)) {
            // Remove the gray background
            element.style.backgroundColor = 'transparent';
            element.style.background = 'none';
          }
          
          // Ensure content containers don't block background
          if (element.id === 'text' || element.id === 'text-text' || element.id === 'search-results') {
            element.style.backgroundColor = 'transparent';
            element.style.background = 'none';
            
            // Fix z-index to ensure it doesn't block background
            if ((style && (style.position === 'relative' || style.position === 'absolute')) ||
                (element.currentStyle && 
                 (element.currentStyle.position === 'relative' || 
                  element.currentStyle.position === 'absolute'))) {
              element.style.zIndex = '1';
            }
          }
        } catch (e) {
          // Ignore errors and continue with next element
          element.style.backgroundColor = 'transparent';
          element.style.background = 'none';
        }
      }
    }
    
    // Check for any modal or overlay backgrounds
    try {
      var overlaySelectors = ['.modal-backdrop', '.bg-light', '.bg-secondary', '.bg-gray'];
      for (var s = 0; s < overlaySelectors.length; s++) {
        try {
          var overlays = document.querySelectorAll(overlaySelectors[s]);
          for (var j = 0; j < overlays.length; j++) {
            if (overlays[j] && !hasClass(overlays[j], 'fixed-bottom')) {
              var overlayStyle = window.getComputedStyle ? 
                                 window.getComputedStyle(overlays[j]) : 
                                 overlays[j].currentStyle;
                                 
              var display = overlayStyle ? overlayStyle.display : '';
              
              if (!display || display !== 'none') {
                // If this is a full-screen overlay with gray, make it transparent
                overlays[j].style.backgroundColor = 'transparent';
                overlays[j].style.background = 'none';
              }
            }
          }
        } catch (e) {
          // Ignore errors with specific selectors
        }
      }
    } catch (e) {
      // Ignore errors with querySelectorAll
    }
    
    // Check for any gray search area
    var searchArea = document.getElementById('search');
    if (searchArea) {
      searchArea.style.backgroundColor = 'transparent';
      searchArea.style.background = 'none';
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