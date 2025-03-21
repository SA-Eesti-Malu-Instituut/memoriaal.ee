// IE11 Polyfill for common ES6 features
// This helps prevent errors in older browsers like SiteKiosk

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

// Helper function to check if we're running in IE11
window.isIE11 = !!window.MSInputMethodContext && !!document.documentMode;

// Event constructor polyfill for IE11
(function() {
  if (typeof window.CustomEvent === "function") return false;
  
  function CustomEvent(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: null };
    var evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  }
  
  window.CustomEvent = CustomEvent;
})();

// Add try-catch for navigator.clipboard API used in script.js
if (window.isIE11) {
  // Create a mock clipboard API for IE11
  window.navigator.clipboard = window.navigator.clipboard || {
    writeText: function(text) {
      console.log('Clipboard polyfill: ' + text);
      return Promise.resolve();
    }
  };
}

// Optional: Disable console logs in IE11 if desired
if (window.isIE11 && typeof console !== 'undefined') {
  // Replace console log with silent version
  var oldLog = console.log;
  console.log = function() {
    // Do nothing or implement a custom logger
    // You could still log critical errors if needed
    if (arguments[0] && typeof arguments[0] === 'string' && arguments[0].indexOf('Error') === 0) {
      oldLog.apply(console, arguments);
    }
  };
}

// Improve resize handling in IE11
document.addEventListener('DOMContentLoaded', function() {
  // Function to force multiple resize events for IE11
  function triggerIE11Resize() {
    if (window.isIE11) {
      // IE11 needs multiple resize events with different delays to properly render fixed elements
      setTimeout(function() {
        window.dispatchEvent(new CustomEvent('resize'));
      }, 10);
      
      setTimeout(function() {
        window.dispatchEvent(new CustomEvent('resize'));
      }, 100);
      
      setTimeout(function() {
        window.dispatchEvent(new CustomEvent('resize'));
      }, 500);
      
      // Final resize after all content should be loaded
      setTimeout(function() {
        window.dispatchEvent(new CustomEvent('resize'));
      }, 1000);
    }
  }
  
  // Trigger on DOMContentLoaded
  triggerIE11Resize();
  
  // Also trigger on window load when all resources are fully loaded
  window.addEventListener('load', function() {
    triggerIE11Resize();
    
    // Special fix for navigation menu in IE11
    if (window.isIE11) {
      var navigation = document.getElementById('navigation');
      if (navigation) {
        // Force IE11 to recalculate fixed-bottom layout
        ensureNavigationVisibility(navigation);
        
        // Re-check visibility after a delay
        setTimeout(function() {
          ensureNavigationVisibility(navigation);
        }, 500);
        
        // Add click handler to ensure navigation remains visible when interacted with
        document.body.addEventListener('click', function() {
          setTimeout(function() {
            ensureNavigationVisibility(navigation);
          }, 100);
        });
      }
    }
  });
  
  // For fixed bottom elements specifically
  var fixedElements = document.querySelectorAll('.fixed-bottom');
  if (fixedElements.length > 0 && window.isIE11) {
    // Additional fix specifically for fixed-bottom elements in IE11
    setTimeout(function() {
      for (var i = 0; i < fixedElements.length; i++) {
        // Force a reflow by accessing the offsetHeight property
        var force = fixedElements[i].offsetHeight;
        // Temporarily toggle the display to force a repaint
        var currentDisplay = fixedElements[i].style.display;
        fixedElements[i].style.display = 'none';
        // Force a reflow/repaint
        var force2 = fixedElements[i].offsetHeight;
        fixedElements[i].style.display = currentDisplay;
      }
      window.dispatchEvent(new CustomEvent('resize'));
    }, 300);
  }
});

// Helper function to ensure footer navigation is visible in IE11
function ensureNavigationVisibility(navigation) {
  if (!navigation) return;
  
  // Force visibility of navigation container
  if (window.getComputedStyle(navigation).display === 'none') {
    navigation.style.display = 'block';
  }
  
  // Get navigation children
  var navRows = navigation.getElementsByClassName('row');
  for (var i = 0; i < navRows.length; i++) {
    // Force visibility on each row
    navRows[i].style.display = 'flex';
    navRows[i].style.visibility = 'visible';
  }
  
  // Special handling for the language selection row
  var localeElement = document.getElementById('text-locale');
  if (localeElement && localeElement.parentElement) {
    // Make sure the language row is visible
    localeElement.parentElement.style.display = 'flex';
    localeElement.parentElement.style.visibility = 'visible';
  }
  
  // Special IE11 positioning fix
  if (window.innerWidth >= 768) {
    navigation.style.position = 'fixed';
    navigation.style.bottom = '0';
    navigation.style.left = '0';
    navigation.style.right = '0';
    navigation.style.zIndex = '1030';
    
    // Check if we need to force menu visibility
    var menuRow = navRows.length > 1 ? navRows[1] : null;
    if (menuRow && window.getComputedStyle(menuRow).display === 'none') {
      menuRow.style.display = 'flex';
    }
  }
} 