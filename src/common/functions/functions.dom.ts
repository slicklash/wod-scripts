
var innerText = function(elem, value?) {
    if (!elem) return '';
    if (typeof value === 'undefined') {
        return elem.innerText ? elem.innerText : elem.textContent;
    }
    if (elem.innerText) {
        elem.innerText = value;
    }
    else {
        elem.textContent = value;
    }
};

var add = function(value, parentNode?) {
    var newElem = typeof value !== 'object' ? document.createElement(value) : value;
    if (parentNode && parentNode.nodeType) parentNode.appendChild(newElem);
    return newElem;
};

var attr = function(elem, nameOrMap, value?, remove?: boolean) {
    if (remove) {
        elem.removeAttribute(nameOrMap);
    }
    else if (typeof nameOrMap === 'object') {
        for (var key in nameOrMap) {
            if (nameOrMap.hasOwnProperty(key)) {
                elem.setAttribute(key, nameOrMap[key]);
            }
        }
    }
    else if (value) {
        elem.setAttribute(nameOrMap, value);
    }
    else {
        return elem.getAttribute(nameOrMap);
    }
    return elem;
};

var cssClass = function(elem, name: string, toggle?: boolean) {
    var has = elem.className.indexOf(name) !== -1;
    if (typeof toggle !== 'boolean') return has;
    if (has && toggle) return elem;
    elem.className = toggle ? elem.className + ' ' + name : elem.className.replace(name,'').replace(/^\s+|\s+$/g,'');
    return elem;
};
