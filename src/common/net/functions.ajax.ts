var get = function(url, callback, obj?, async?) {
  GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function(request) {
          if (request.readyState === 4) {
              if (request.status !== 200) {
                  alert('Data fetch failed. Please try again.');
                  return false;
              }
              if (typeof callback === 'function') {
                  if (!obj) {
                      callback(request.responseText);
                  }
                  else {
                      callback.call(obj, request.responseText);
                  }
              }
          }
      }
  });
};
