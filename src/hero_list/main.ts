/// <reference path="../../lib/def/greasemonkey/greasemonkey.d.ts" />
/// <reference path="../common/functions/functions.dom.ts" />
/// <reference path="../common/prototypes/array.ts" />

// --- Main

var g_heroes = document.querySelector('#main_content form table'),
    g_rows: any = g_heroes ? Array.from(g_heroes.querySelectorAll('tr')) : null;

if (g_rows && !Array.isArray(g_rows)) {
    g_rows = [g_rows];
}

var saveWeights = function () {

    if (!g_rows || g_rows.length < 1) return;

    for (var i = 1, cnt = g_rows.length; i < cnt; i++) {
        var cells     = g_rows[i].cells,
            hid       = Number(cells[0].querySelector('input').value).toString(),
            weight    = Number(cells[5].querySelector('input').value);

        if (isNaN(weight)) weight = 0;

        GM_setValue(hid, weight);
    }

    var form = (<any>document.forms).the_form;

    if (form) form.submit();
}

var orderHeroes = function () {

    if (!g_rows || !g_rows.length) return;

    var heroes = [],
        holder    = g_heroes.parentNode,
        position  = g_heroes.nextSibling,
        newTable  = add('table'),
        newTbody  = add('tbody', newTable);

    attr(newTable, 'class', 'content_table');

    var headerWeight = add('th'),
        label = add('span', headerWeight),
        buttonSave = add('input', headerWeight);

    label.innerHTML = 'weight<br/>';
    attr(buttonSave, {'type': 'button', 'value': 'Save', 'class': 'button clickable'});
    buttonSave.addEventListener('click', saveWeights, false);

    g_rows[0].appendChild(headerWeight);

    newTbody.appendChild(g_rows[0]);

    var i, cnt, hero;

    // get values
    for (i = 1, cnt = g_rows.length; i < cnt; i++) {
        var cells     = g_rows[i].cells,
            hid       = Number(cells[0].querySelector('input').value).toString(),
            level     = Number(innerText(cells[2]));

        hero      = {
            'weight'    : level === 0 ? 100 : level,
            'row'       : g_rows[i]
        };

        var val = GM_getValue(hid);

        if (typeof(val) !== 'undefined') hero.weight = Number(val);

        heroes.push(hero);
    }

    heroes.sort(function(x, y) { return x.weight - y.weight; });

    // update list
    for (i = 0, cnt = heroes.length; i < cnt; i++) {

        hero = heroes[i];

        var row = hero.row,
            colWeight = add('td', row),
            txt = add('input');

        attr(row, 'class', 'row' + i % 2);
        attr(colWeight, 'align', 'center');
        attr(txt, {'type': 'text', 'style': 'width: 30px', 'value': hero.weight });

        add(txt, colWeight);
        add(heroes[i].row, newTbody);
    }

    holder.insertBefore(newTable, position);
    holder.removeChild(g_heroes);
}

orderHeroes();
