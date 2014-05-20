// ==UserScript==
// @name           Hero List
// @description    Scripts adds functionality to order your heroes
// @version        1.1
// @author         Never
// @include        http*://*.world-of-dungeons.*/wod/spiel/settings/heroes.php*
// ==/UserScript==

(function(window, undefined) {

function $(selector, parentNode, resultAsArray) {
    var context = parentNode || document;

    if (!selector || typeof selector !== 'string' || !(context.nodeType === 9 || context.nodeType === 1)) {
        return null;
    }

    var selectors = selector.split(/\s+/), result = [context], returnArray = resultAsArray || false;

    for (var i = 0, cnt = selectors.length; i < cnt; i++) {
        var new_result = [], m_elem = selectors[i].match(/^([\.#]?[a-z0-9\-_]+\w*)/i), sel = m_elem ? m_elem[1] : '', s = selectors[i].replace(sel, ''), re_attr = /(\[([a-z]+)([\*\^\$]?=)"(\w+)"\])/gi, filters = [], filter;

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
                    filter = filters[l];
                    var attr = elem.getAttribute(filter.attribute);

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
var innerText = function (elem, value) {
    if (!elem)
        return '';
    if (typeof value === 'undefined') {
        return elem.innerText ? elem.innerText : elem.textContent;
    }
    if (elem.innerText) {
        elem.innerText = value;
    } else {
        elem.textContent = value;
    }
};

var add = function (value, parentNode) {
    var newElem = typeof value !== 'object' ? document.createElement(value) : value;
    if (parentNode && parentNode.nodeType)
        parentNode.appendChild(newElem);
    return newElem;
};

var attr = function (elem, nameOrMap, value, remove) {
    if (remove) {
        elem.removeAttribute(nameOrMap);
    } else if (typeof nameOrMap === 'object') {
        for (var key in nameOrMap) {
            if (nameOrMap.hasOwnProperty(key)) {
                elem.setAttribute(key, nameOrMap[key]);
            }
        }
    } else if (value) {
        elem.setAttribute(nameOrMap, value);
    } else {
        return elem.getAttribute(nameOrMap);
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
var g_heroes = $('#main_content form table'), g_rows = g_heroes ? $('tr', g_heroes) : null;

if (g_rows && g_rows.constructor !== Array)
    g_rows = [g_rows];

var saveWeights = function () {
    if (!g_rows || g_rows.length < 1)
        return;

    for (var i = 1, cnt = g_rows.length; i < cnt; i++) {
        var cells = g_rows[i].cells, hid = Number($('input', cells[0]).value).toString(), weight = Number($('input', cells[5]).value);

        if (isNaN(weight))
            weight = 0;

        GM_setValue(hid, weight);
    }

    var form = document.forms['the_form'];

    if (form)
        form.submit();
};

var orderHeroes = function () {
    if (!g_rows || g_rows.length < 1)
        return;

    var heroes = [], holder = g_heroes.parentNode, position = g_heroes.nextSibling, newTable = add('table'), newTbody = add('tbody', newTable);

    attr(newTable, 'class', 'content_table');

    var headerWeight = add('th'), label = add('span', headerWeight), buttonSave = add('input', headerWeight);

    label.innerHTML = 'weight<br/>';
    attr(buttonSave, { 'type': 'button', 'value': 'Save', 'class': 'button clickable' });
    buttonSave.addEventListener('click', saveWeights, false);

    g_rows[0].appendChild(headerWeight);

    newTbody.appendChild(g_rows[0]);

    var i, cnt, hero;

    for (i = 1, cnt = g_rows.length; i < cnt; i++) {
        var cells = g_rows[i].cells, hid = Number($('input', cells[0]).value).toString(), level = Number(innerText(cells[2]));

        hero = {
            'weight': level === 0 ? 100 : level,
            'row': g_rows[i]
        };

        var val = GM_getValue(hid);

        if (typeof (val) !== 'undefined')
            hero.weight = Number(val);

        heroes.push(hero);
    }

    heroes.sort(function (x, y) {
        return x.weight - y.weight;
    });

    for (i = 0, cnt = heroes.length; i < cnt; i++) {
        hero = heroes[i];

        var row = hero.row, colWeight = add('td', row), txt = add('input');

        attr(row, 'class', 'row' + i % 2);
        attr(colWeight, 'align', 'center');
        attr(txt, { 'type': 'text', 'style': 'width: 30px', 'value': hero.weight });

        add(txt, colWeight);
        add(heroes[i].row, newTbody);
    }

    holder.insertBefore(newTable, position);
    holder.removeChild(g_heroes);
};

if (g_rows)
    orderHeroes();
})();