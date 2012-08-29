
// --- Functions

var attr = function(elem, name, value, remove) {
    if (remove) {
        elem.removeAttribute(name);
    }
    else if (typeof name === 'object') {
        for (var key in name) {
            elem.setAttribute(key, name[key]);
        }
    }
    else if (value) {
        elem.setAttribute(name, value);
    }
    else {
        return elem.getAttribute(name);
    }
    return elem;
};

var cssClass = function(elem, name, toggle) {
    var has = elem.className.indexOf(name) !== -1;
    if (typeof toggle !== 'boolean') return has;
    if (has && toggle) return elem;
    elem.className = toggle ? elem.className + ' ' + name : elem.className.replace(name,'').replace(/^\s+|\s+$/g,'');
    return elem;
};

var add = function(value, parentNode) {
    var newElem = typeof value !== 'object' ? document.createElement(value) : value;
    if (parentNode && parentNode.nodeType) parentNode.appendChild(newElem);
    return newElem;
};

var get = function(url, callback, obj, async) {
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

var supportsInnerText = typeof Element.prototype !== 'undefined',
    innerText = function(elem) {
    if (!elem) return '';
    return supportsInnerText ? elem.innerText : elem.textContent;
};

var parseTemplate = function(tpl, data) {
    try {
        var code = "var p=[],print=function(){p.push.apply(p,arguments);};with(obj){p.push('" +
                   tpl.replace(/[\r\t\n]/g, " ").replace(/'(?=[^#]*#>)/g, "\t").split("'").join("\\'")
                   .split("\t").join("'").replace(/<#=(.+?)#>/g, "',$1,'").split("<#").join("');")
                   .split("#>").join("p.push('") + "');}return p.join('');";
            fn = new Function("obj", code);
        return fn(data);
    }
    catch (ex) {
        GM_log('parseTemplate: ' + ex);
    }
    return 'ERROR';
};
