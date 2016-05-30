// ==UserScript==
// @name           Hero List
// @description    Scripts adds functionality to order your heroes
// @version        1.2.0
// @author         Never
// @include        http*://*.world-of-dungeons.*/wod/spiel/settings/heroes.php*
// @run-at         document-start
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_xmlhttpRequest
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
var insertAfter = function (node) {
    var elems = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        elems[_i - 1] = arguments[_i];
    }
    var parent = node.parentNode;
    elems.forEach(function (elem) {
        parent.insertBefore(elem, node.nextSibling);
        node = elem;
    });
};
function httpFetch(url, method) {
    if (method === void 0) { method = 'GET'; }
    return new Promise(function (resolve, reject) {
        GM_xmlhttpRequest({
            method: method,
            url: url,
            onload: function (request) {
                if (request.readyState !== 4)
                    return;
                if (request.status >= 200 && request.status < 300)
                    resolve(request.responseText);
                else
                    reject(request.responseText);
            }
        });
    });
}
function main() {
    var table_heroes = document.querySelector('#main_content form table'), rows = table_heroes ? Array.from(table_heroes.querySelectorAll('tr')) : null;
    if (rows) {
        var saveWeights = function () {
            var promises = [];
            var _loop_1 = function(i) {
                var row = rows[i], cells = row.cells, hid = Number(cells[0].querySelector('input').value).toString(), weight = Number(cells[6].querySelector('input').value), group_1 = 'no group';
                if (isNaN(weight))
                    weight = 0;
                var p = httpFetch('/wod/spiel/hero/profile.php?id=' + hid);
                p.then(function (data) {
                    var n = data.indexOf('group:'), group = data.slice(n, n + 200).split('<a')[1].split(/[><]/)[1];
                    console.log(group);
                    GM_setValue(hid, JSON.stringify({ weight: weight, group: group }));
                });
                promises.push(p);
            };
            for (var i = 1; i < rows.length; i++) {
                _loop_1(i);
            }
            Promise.all(promises).then(function () {
                var form = document.forms.the_form;
                if (form)
                    form.submit();
            });
        };
        var newTable = add('table'), newTbody_1 = add('tbody', newTable);
        attr(newTable, 'class', 'content_table');
        var headerWeight = add('th'), label = add('span', headerWeight), buttonSave = add('input', headerWeight);
        label.innerHTML = 'weight<br/>';
        attr(buttonSave, { 'type': 'button', 'value': 'Update', 'class': 'button clickable' });
        buttonSave.addEventListener('click', saveWeights, false);
        rows[0].appendChild(headerWeight);
        newTbody_1.appendChild(rows[0]);
        var groupName = add('th');
        textContent(groupName, 'group');
        rows[0].insertBefore(groupName, rows[0].cells[4]);
        var heroes = [];
        for (var i = 1; i < rows.length; i++) {
            var row = rows[i], cells = row.cells, hid = Number(cells[0].querySelector('input').value).toString(), level = Number(textContent(cells[2])), next = cells[4], tooltip = attr(next, 'onmouseover'), time = textContent(cells[4]).trim(), value = GM_getValue(hid), info = value ? JSON.parse(value) : {}, weight = info.weight || (level === 0 ? 100 : level);
            if (tooltip) {
                var dungeon = tooltip.split("'")[1];
                var localTime = time.split('/')[0];
                textContent(next, localTime + " - " + dungeon);
                next.setAttribute('onmouseover', "return wodToolTip(this,\"" + dungeon + " <br/> " + time + "\");");
            }
            var timeCell = add('td');
            textContent(timeCell, time);
            heroes.push({ 'weight': Number(weight), row: row, group: info.group || 'no group' });
        }
        heroes.sort(function (a, b) { return a.weight - b.weight; });
        var group_2;
        var makeInput_1 = function (row, value) {
            var colWeight = add('td', row), txt = add('input');
            attr(txt, { 'type': 'text', 'style': 'width: 30px', 'value': value });
            attr(colWeight, 'align', 'center');
            add(txt, colWeight);
        };
        var color_1 = 0;
        heroes.forEach(function (hero, i) {
            var row = hero.row;
            makeInput_1(row, hero.weight);
            attr(row, 'class', 'row' + (color_1++ % 2));
            var c = add('td');
            textContent(c, hero.group);
            row.insertBefore(c, row.cells[4]);
            if (i > 0 && group_2 !== hero.group) {
                group_2 = hero.group;
            }
            add(hero.row, newTbody_1);
        });
        insertAfter(table_heroes, newTable);
        table_heroes.parentNode.removeChild(table_heroes);
    }
}
if (!window.__karma__)
    document.addEventListener('DOMContentLoaded', function () { return main(); });

})();
