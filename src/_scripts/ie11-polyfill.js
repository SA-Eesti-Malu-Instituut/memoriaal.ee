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