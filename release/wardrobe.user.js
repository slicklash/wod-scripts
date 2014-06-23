// ==UserScript==
// @name           Wardrobe
// @description    Adds support for equipment profiles
// @version        1.0
// @namespace      Never
// @include        http*://*.world-of-dungeons.*/wod/spiel/hero/items.php?*view=gear*
// ==/UserScript==

(function(window, undefined) {

var attr = function (elem, name, value, remove) {
    if (remove) {
        elem.removeAttribute(name);
    } else if (typeof name === 'object') {
        for (var key in name) {
            elem.setAttribute(key, name[key]);
        }
    } else if (value) {
        elem.setAttribute(name, value);
    } else {
        return elem.getAttribute(name);
    }
    return elem;
};

var cssClass = function (elem, name, toggle) {
    var has = elem.className.indexOf(name) !== -1;
    if (typeof toggle !== 'boolean')
        return has;
    if (has && toggle)
        return elem;
    elem.className = toggle ? elem.className + ' ' + name : elem.className.replace(name, '').replace(/^\s+|\s+$/g, '');
    return elem;
};

var add = function (value, parentNode) {
    var newElem = typeof value !== 'object' ? document.createElement(value) : value;
    if (parentNode && parentNode.nodeType)
        parentNode.appendChild(newElem);
    return newElem;
};

var get = function (url, callback, obj, async) {
    GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        onload: function (request) {
            if (request.readyState === 4) {
                if (request.status !== 200) {
                    alert('Data fetch failed. Please try again.');
                    return false;
                }
                if (typeof callback === 'function') {
                    if (!obj) {
                        callback(request.responseText);
                    } else {
                        callback.call(obj, request.responseText);
                    }
                }
            }
        }
    });
};

var innerText = function (elem) {
    if (!elem)
        return '';
    return elem.innerText ? elem.innerText : elem.textContent;
};

var parseTemplate = function (tpl, data) {
    try  {
        var code = "var p=[],print=function(){p.push.apply(p,arguments);};with(obj){p.push('" + tpl.replace(/[\r\t\n]/g, " ").replace(/'(?=[^#]*#>)/g, "\t").split("'").join("\\'").split("\t").join("'").replace(/<#=(.+?)#>/g, "',$1,'").split("<#").join("');").split("#>").join("p.push('") + "');}return p.join('');";
        var fn = new Function("obj", code);
        return fn(data);
    } catch (ex) {
        GM_log('parseTemplate: ' + ex);
    }
    return 'ERROR';
};

String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, '');
};

String.prototype.pad = function (len, str, left) {
    var res = this, tmp = str || ' ';
    if (left === true) {
        while (res.length < len)
            res = tmp + res;
    } else {
        while (res.length < len)
            res += tmp;
    }
    return res;
};

String.prototype.parseEffectiveValue = function () {
    var val = this.replace(/[a-z:,\s\n]+/gi, '').match(/([0-9]+)(\[([0-9\-]+)\])?/);
    if (val === null)
        return [0, 0];
    return val[3] ? [Number(val[1]), Number(val[3])] : [Number(val[1]), Number(val[1])];
};
function $(selector, parentNode, resultAsArray) {
    var context = parentNode || document;

    if (!selector || typeof selector !== 'string' || !(context.nodeType === 9 || context.nodeType === 1)) {
        return null;
    }

    var selectors = selector.split(/\s+/), result = [context], returnArray = resultAsArray || false;

    for (var i = 0, cnt = selectors.length; i < cnt; i++) {
        var new_result = [], m_elem = selectors[i].match(/^([\.#]?[a-z0-9\-_]+\w*)/i), sel = m_elem ? m_elem[1] : '', s = selectors[i].replace(sel, ''), re_attr = /(\[([a-z]+)([\*\^\$]?=)"(\w+)"\])/gi, filters = [];

        while ((filter = re_attr.exec(s))) {
            if (filter.index === re_attr.lastIndex) {
                re_attr.lastIndex++;
            }

            filters.push({ 'attribute': filter[2], 'condition': filter[3], 'value': filter[4] });
        }

        var j, c2, c3, k, v;

        switch (sel[0]) {
            case '#':
                new_result = [document.getElementById(sel.substring(1))];
                if (!new_result[0]) {
                    return null;
                }
                break;
            case '.':
                for (j = 0, c2 = result.length; j < c2; j++) {
                    v = result[j].getElementsByClassName(sel.substring(1));
                    for (k = 0, c3 = v.length; k < c3; new_result.push(v[k++]))
                        ;
                }
                break;
            default:
                for (j = 0, c2 = result.length; j < c2; j++) {
                    v = result[j].getElementsByTagName(sel);
                    for (k = 0, c3 = v.length; k < c3; new_result.push(v[k++]))
                        ;
                }
                break;
        }

        if (filters.length > 0) {
            result = [];
            for (var g = 0, cntg = new_result.length; g < cntg; g++) {
                var elem = new_result[g], ok = false;

                for (var l = 0, cntl = filters.length; l < cntl; l++) {
                    var filter = filters[l], attr = elem.getAttribute(filter.attribute);

                    if (attr) {
                        switch (filter.condition) {
                            case '*=':
                                ok = attr.indexOf(filter.value) > -1;
                                break;
                            case '^=':
                                ok = attr.indexOf(filter.value) === 0;
                                break;
                            case '$=':
                                ok = attr.indexOf(filter.value, attr.length - filter.value.length) > -1;
                                break;
                            default:
                                ok = attr === filter.value;
                                break;
                        }
                    }

                    if (ok === false) {
                        break;
                    }
                }

                if (ok === true) {
                    result.push(elem);
                }
            }
        } else {
            result = new_result;
        }
    }

    if (result.length === 0 || result[0] === context) {
        return null;
    }

    return !returnArray && result.length === 1 ? result[0] : result;
}
var container = add('div');

add('hr', container);

var labelCurrent = add('h1', container);
labelCurrent.innerHTML = 'Profile: default';

var select = add('select', container);
select.innerHTML = '<option>default</option>';

add('br', container);
add('br', container);

var buttonSave = add('input', container);
attr(buttonSave, { 'type': 'button', 'value': 'Save', 'class': 'button clickable' });

var buttonSaveAs = add('input', container);
attr(buttonSaveAs, { 'type': 'button', 'value': 'Save as', 'class': 'button clickable' });

var buttonLoad = add('input', container);
attr(buttonLoad, { 'type': 'button', 'value': 'Load', 'class': 'button clickable' });

var buttonDelete = add('input', container);
attr(buttonDelete, { 'type': 'button', 'value': 'Delete', 'class': 'button clickable' });

add('hr', container);

var configValidator = $('#htmlComponentCombatConfigValidator');
configValidator.parentNode.insertBefore(container, configValidator.nextSibling);

var form = document.forms['the_form'];
if (form && form.action.indexOf('&view=gear') === -1) {
    form.action += '&view=gear';
}

var onLoad = function () {
    var loadForm = add('form', document.body);
    loadForm.action = form.action;
    loadForm.method = 'POST';
    loadForm.name = 'the_form';

    var items = [
        { 'location': 'LocationEquip[go_kopf][0]', 'value': '20323058' },
        { 'location': 'LocationEquip[go_ohren][0]', 'value': '12681335' },
        { 'location': 'LocationEquip[go_tasche][16]', 'value': '17387957' }
    ];

    var item;

    for (var i = 0; i < items.length; i++) {
        item = items[i];
        var val = add('input', loadForm);
        attr(val, { 'type': 'hidden', 'name': item.location, 'value': item.value });
    }

    var post_id = add('input', loadForm);
    attr(post_id, { 'type': 'hidden', 'name': 'wod_post_id', 'value': form.wod_post_id.value });

    var ok = add('input', loadForm);
    attr(ok, { 'type': 'hidden', 'name': 'ok', 'value': 'Commit Changes' });

    loadForm.submit();
};

buttonLoad.addEventListener('click', onLoad, false);
})();