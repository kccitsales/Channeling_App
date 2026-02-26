export const INJECTED_JAVASCRIPT = `
(function() {
  if (window.KccBridge) return;

  var pendingRequests = {};
  var requestCounter = 0;

  function handleGetLocation(requestId, payload) {
    if (!navigator.geolocation) {
      var pending = pendingRequests[requestId];
      if (pending) {
        pending.reject(new Error('Geolocation not supported'));
        delete pendingRequests[requestId];
      }
      return true;
    }
    var options = {
      enableHighAccuracy: (payload && payload.highAccuracy !== undefined) ? payload.highAccuracy : true,
      timeout: 20000,
      maximumAge: 300000
    };
    navigator.geolocation.getCurrentPosition(
      function(position) {
        var p = pendingRequests[requestId];
        if (p) {
          p.resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            speed: position.coords.speed,
            timestamp: position.timestamp
          });
          delete pendingRequests[requestId];
        }
      },
      function(error) {
        var p = pendingRequests[requestId];
        if (p) {
          p.reject(new Error('Location error: ' + error.message));
          delete pendingRequests[requestId];
        }
      },
      options
    );
    return true;
  }

  // Material Symbols Outlined 폰트 주입 (CSS @import가 WebView에서 실패하는 경우 대비)
  (function injectFonts() {
    function doInject() {
      if (document.getElementById('kcc-material-symbols')) return;
      var link = document.createElement('link');
      link.id = 'kcc-material-symbols';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0';
      (document.head || document.documentElement).appendChild(link);
    }
    if (document.head) {
      doInject();
    } else {
      document.addEventListener('DOMContentLoaded', doInject);
    }
  })();

  window.KccBridge = {
    call: function(type, payload) {
      return new Promise(function(resolve, reject) {
        var requestId = 'req_' + (++requestCounter) + '_' + Date.now();
        pendingRequests[requestId] = { resolve: resolve, reject: reject };

        if (type === 'GET_LOCATION') {
          handleGetLocation(requestId, payload);
          return;
        }

        var message = JSON.stringify({
          type: type,
          requestId: requestId,
          payload: payload || {}
        });

        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(message);
        } else {
          delete pendingRequests[requestId];
          reject(new Error('ReactNativeWebView not available'));
        }

        setTimeout(function() {
          if (pendingRequests[requestId]) {
            pendingRequests[requestId].reject(new Error('Bridge request timeout'));
            delete pendingRequests[requestId];
          }
        }, 30000);
      });
    },

    _onResponse: function(response) {
      var pending = pendingRequests[response.requestId];
      if (pending) {
        if (response.success) {
          pending.resolve(response.data || {});
        } else {
          pending.reject(new Error(response.error || 'Unknown error'));
        }
        delete pendingRequests[response.requestId];
      }
    },

    _onEvent: function(type, data) {
      var event = new CustomEvent('kccbridge:' + type, { detail: data });
      window.dispatchEvent(event);
    }
  };

  true;
})();
`;
