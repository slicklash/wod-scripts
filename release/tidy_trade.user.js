// ==UserScript==
// @name           Tidy Trade
// @description    Sorts trade items and calculates the total sum of uses
// @version        1.1.1
// @author         Never
// @include        http*://*.world-of-dungeons.net/wod/spiel/trade/exchange_details*
// @include        http*://*.world-of-dungeons.net/wod/module/search/select_item.*
// @run-at         document-start
// @grant          none
// ==/UserScript==

(function() {
'use strict';
    
if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(predicate) {
    if (this === null) {
      throw new TypeError('Array.prototype.findIndex called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return i;
      }
    }
    return -1;
  };
}
    
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
// number of tds in table row is not same for offer and offering side
function tidyTrade(table, index) {
    var rows = Array.from(table.cloneNode(true).querySelectorAll('tr'));
    if (rows.length < 1)
        return;
    var holder = table.parentNode, position = table.nextSibling, newTable = add('table'), items = [], sums = {}, re_uses = /\(([0-9]+)\/[0-9]+\)/;
    rows.forEach(function (row) {
        var cells  = row.cells;
        // number of icons before name is not fixed (for example lesser emblem of agility)
        var aIdx = Array.from(cells[index].children).findIndex(function isPrime(element, index, array) {
            return element.nodeName === "A";
        });
        var icons  = Array.from(cells[index].querySelectorAll('img')), 
            before = icons.slice(0, aIdx),
            after = icons.slice(aIdx),
            link = cells[index].querySelector('a'), 
            control = cells.length > (index + 1) ? cells[index + 1].querySelector('input') : null, 
            name = textContent(link), 
            size = textContent(cells[index]).replace(name, '').trim(), 
            m_uses = size.match(re_uses), 
            uses = m_uses ? Number(m_uses[1]) : 1, 
            sum = sums[name], 
            item = { name: name, size: size, uses: uses, link: link, control: control, cells: cells, before: before, after: after };
        items.push(item);
        sums[name] = sum ? sum + uses : uses;
    });
    items.sort(function (x, y) {
        var diff = x.name.toLowerCase().localeCompare(y.name.toLowerCase());
        return diff === 0 ? x.uses - y.uses : diff;
    });
    items.forEach(function (item, i) {
        var size = '&nbsp;' + item.size, row = add('tr', newTable);
        attr(add('td', row), 'align', 'right').innerHTML = i + 1;
        var td = attr(add('td', row), 'valign', 'top');
        item.before.forEach(function(item) {
           add(item, td);
        });
        var c_link = add('span', td);
        item.after.forEach(function(item) {
           add(item, td);
        });
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
    holder.removeChild(table);
    holder.insertBefore(newTable, position);
}
function main() {
    var main = document.querySelector('#main_content'), h1 = main.querySelector('h1');
    if (textContent(h1).indexOf('Trade with') > -1) {
        var tables = main.querySelectorAll('table'), tb_sell = tables[1], tb_buy = tables[2];
        if (tb_sell)
            tidyTrade(tb_sell, 2);
        if (tb_buy)
            tidyTrade(tb_buy, 1);
    }
}
document.addEventListener('DOMContentLoaded', main);

})();
