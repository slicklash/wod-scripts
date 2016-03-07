// ==UserScript==
// @name           Hero List
// @description    Scripts adds functionality to order your heroes
// @version        1.1.1
// @author         Never
// @include        http*://*.world-of-dungeons.*/wod/spiel/settings/heroes.php*
// @run-at         document-start
// @grant          GM_getValue
// @grant          GM_setValue
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
function main() {
    var table_heroes = document.querySelector('#main_content form table'), rows = table_heroes ? Array.from(table_heroes.querySelectorAll('tr')) : null;
    if (rows) {
        var saveWeights = function () {
            for (var i = 1; i < rows.length; i++) {
                var row = rows[i], cells = row.cells, hid = Number(cells[0].querySelector('input').value).toString(), weight = Number(cells[5].querySelector('input').value);
                if (isNaN(weight))
                    weight = 0;
                GM_setValue(hid, weight);
            }
            var form = document.forms.the_form;
            if (form)
                form.submit();
        };
        var newTable = add('table'), newTbody_1 = add('tbody', newTable);
        attr(newTable, 'class', 'content_table');
        var headerWeight = add('th'), label = add('span', headerWeight), buttonSave = add('input', headerWeight);
        label.innerHTML = 'weight<br/>';
        attr(buttonSave, { 'type': 'button', 'value': 'Save', 'class': 'button clickable' });
        buttonSave.addEventListener('click', saveWeights, false);
        rows[0].appendChild(headerWeight);
        newTbody_1.appendChild(rows[0]);
        var heroes = [];
        for (var i = 1; i < rows.length; i++) {
            var row = rows[i], cells = row.cells, hid = Number(cells[0].querySelector('input').value).toString(), level = Number(textContent(cells[2])), weight = (GM_getValue(hid) || (level === 0 ? 100 : level));
            heroes.push({ 'weight': Number(weight), 'row': row });
        }
        heroes.sort(function (a, b) { return a.weight - b.weight; });
        heroes.forEach(function (hero, i) {
            var row = hero.row, colWeight = add('td', row), txt = add('input');
            attr(row, 'class', 'row' + i % 2);
            attr(colWeight, 'align', 'center');
            attr(txt, { 'type': 'text', 'style': 'width: 30px', 'value': hero.weight });
            add(txt, colWeight);
            add(hero.row, newTbody_1);
        });
        var parentNode = table_heroes.parentNode, position = table_heroes.nextSibling;
        parentNode.insertBefore(newTable, position);
        parentNode.removeChild(table_heroes);
    }
}
if (!window.__karma__)
    document.addEventListener('DOMContentLoaded', function () { return main(); });

})();
