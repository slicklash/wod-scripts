
// --- Main

var g_heroes = $('#main_content form table'),
    g_rows = g_heroes ? $('tr', g_heroes) : null;

    if (g_rows && g_rows.constructor != Array) g_rows = [g_rows];

var saveWeights = function () {

    if (!g_rows || g_rows.length < 1) return;

    for (var i = 1, cnt = g_rows.length; i < cnt; i++) {
        var cells     = g_rows[i].cells,
            hid       = Number($('input', cells[0]).value),
            weight    = Number($('input', cells[5]).value);

        if (isNaN(weight)) weight = 0;

        GM_setValue(hid, weight);
    }

    var form = document.forms['the_form'];

    if (form) form.submit();
}

var orderHeroes = function (weights) {

    if (!g_rows || g_rows.length < 1) return;

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

    for (var i = 1, cnt = g_rows.length; i < cnt; i++) {
        var cells     = g_rows[i].cells,
            hid       = Number($('input', cells[0]).value),
            level     = Number(innerText(cells[2])),
            hero      = {
                'weight'    : level == 0 ? 100 : level,
                'row'       : g_rows[i]
            };

        var val = GM_getValue(hid);

        if (typeof(val) != 'undefined') hero.weight = Number(val);

        heroes.push(hero);
    }

    heroes.sort(function(x, y) { return x.weight - y.weight; });

    for (var i = 0, cnt = heroes.length; i < cnt; i++) {
        var hero = heroes[i],
            row = hero.row,
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

if (g_rows) orderHeroes();
