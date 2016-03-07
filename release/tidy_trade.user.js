// ==UserScript==
// @name           Tidy Trade
// @description    Sorts trade items and calculates the total sum of uses
// @version        1.1.1
// @author         Never
// @include        http*://*.world-of-dungeons.net/wod/spiel/trade/exchange_details*
// @run-at         document-start
// @grant          none
// ==/UserScript==

(function() {
'use strict';
var add = function (tag, parentNode) {
    var elem = typeof tag === 'string' ? document.createElement(tag) : tag;
    if (parentNode && parentNode.nodeType) {
        parentNode.appendChild(elem);
    }
    return elem;
};
var attr = function (elem, nameOrMap, value, remove) {
    if (remove) {
        elem.removeAttribute(nameOrMap);
    }
    else if (typeof nameOrMap === 'object') {
        Object.keys(nameOrMap).forEach(function (key) { elem.setAttribute(key, nameOrMap[key]); });
    }
    else if (value) {
        elem.setAttribute(nameOrMap, value);
    }
    else {
        return elem.getAttribute(nameOrMap);
    }
    return elem;
};
var textContent = function (elem, value) {
    if (!elem)
        return '';
    if (typeof value === 'undefined') {
        return elem.textContent;
    }
    elem.textContent = value;
};
function getItemInfo(table) {
    var rows = Array.from(table.cloneNode(true).querySelectorAll('tr'));
    if (!rows.length)
        return [[], null];
    var items = [], sums = {}, re_uses = /\(([0-9]+)\/[0-9]+\)/;
    rows.forEach(function (row) {
        var cells = row.cells, icons = Array.from(cells[2].querySelectorAll('img')), rarity = icons[0], condition = icons[1], link = cells[2].querySelector('a'), control = cells.length > 3 ? cells[3].querySelector('input') : null, name = textContent(link), size = textContent(cells[2]).replace(name, '').trim(), m_uses = size.match(re_uses), uses = m_uses ? Number(m_uses[1]) : 1, sum = sums[name], item = { name: name, condition: condition, rarity: rarity, size: size, uses: uses, link: link, control: control, cells: cells };
        items.push(item);
        sums[name] = sum ? sum + uses : uses;
    });
    items.sort(function (x, y) {
        var diff = x.name.toLowerCase().localeCompare(y.name.toLowerCase());
        return diff === 0 ? x.uses - y.uses : diff;
    });
    return [items, sums];
}
function tidyTrade(table) {
    var _a = getItemInfo(table), items = _a[0], sums = _a[1];
    if (!items.length)
        return false;
    var newTable = add('table');
    items.forEach(function (item, i) {
        var size = '&nbsp;' + item.size, row = add('tr', newTable);
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
    });
    var holder = table.parentNode, position = table.nextSibling;
    holder.removeChild(table);
    holder.insertBefore(newTable, position);
}
function main(main_content) {
    var main = main_content || document.querySelector('#main_content'), h1 = main ? main.querySelector('h1') : null;
    if (textContent(h1).indexOf('Trade with') < 0)
        return false;
    var tables = main.querySelectorAll('table'), tb_sell = tables[1], tb_buy = tables[2];
    if (tb_sell)
        tidyTrade(tb_sell);
    if (tb_buy)
        tidyTrade(tb_buy);
    return true;
}
if (!window.__karma__)
    document.addEventListener('DOMContentLoaded', function () { return main(); });

})();
