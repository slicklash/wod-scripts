// ==UserScript==
// @name           Tidy Trade
// @description    Sorts trade items and calculates the total sum of uses
// @version        1.1
// @author         Never
// @include        http*://*.world-of-dungeons.net/wod/spiel/trade/exchange_details*
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
var tidyTrade = function (table) {
    var rows = $('tr', table.cloneNode(true));

    if (rows && rows.constructor !== Array)
        rows = [rows];
    if (!rows || rows.length < 1)
        return;

    var holder = table.parentNode, position = table.nextSibling, newTable = add('table'), items = [], sums = {}, re_uses = /\(([0-9]+)\/[0-9]+\)/;

    var i, cnt, item, size;

    for (i = 0, cnt = rows.length; i < cnt; i++) {
        var cells = rows[i].cells, icons = $('img', cells[2]);

        var rarity = icons[0], condition = icons[1], link = $('a', cells[2]), control = cells.length > 3 ? $('input', cells[3]) : null, name = innerText(link);

        size = innerText(cells[2]).replace(name, '').trim();

        var m_uses = size.match(re_uses), uses = m_uses ? Number(m_uses[1]) : 1, sum = sums[name];

        item = {
            'name': name,
            'condition': condition,
            'rarity': rarity,
            'size': size,
            'uses': uses,
            'link': link,
            'control': control
        };

        item.cells = cells;

        items.push(item);

        sums[name] = sum ? sum + uses : uses;
    }

    items.sort(function (x, y) {
        var diff = x.name.toLowerCase().localeCompare(y.name.toLowerCase());
        return diff === 0 ? x.uses - y.uses : diff;
    });

    var row;

    for (i = 0, cnt = items.length; i < cnt; i++) {
        item = items[i];
        size = '&nbsp;' + item.size;
        row = add('tr', newTable);
        attr(add('td', row), 'align', 'right').innerHTML = i + 1;
        add(item.rarity, attr(add('td', row), 'valign', 'top'));
        add(item.condition, attr(add('td', row), 'valign', 'top'));

        var c_link = attr(add('td', row), { 'valign': 'top', 'align': 'left' });

        if (item.control)
            add(item.control, add('td', row));

        add(item.link, c_link);
        add('span', c_link).innerHTML = size;

        if (sums[item.name] > 1) {
            var summ = add('span', c_link);
            attr(summ, 'style', 'color: #666').innerHTML = '&nbsp;<sup>&sum;=' + sums[item.name] + '</sup>';
            sums[item.name] = 0;
        }
    }

    holder.removeChild(table);
    holder.insertBefore(newTable, position);
};

var g_main = $('#main_content'), g_h1 = $('h1', g_main);

if (innerText(g_h1).indexOf('Trade with') > -1) {
    var tables = $('table', g_main), tb_sell = tables[1], tb_buy = tables[2];

    if (tb_sell)
        tidyTrade(tb_sell);
    if (tb_buy)
        tidyTrade(tb_buy);
}
})();