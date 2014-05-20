
// --- Main ---

var tidyTrade = function (table) {
    var rows = $('tr', table.cloneNode(true));

    if (rows && rows.constructor !== Array) rows = [rows];
    if (!rows || rows.length < 1) return;

    var holder   = table.parentNode,
        position = table.nextSibling,
        newTable = add('table'),
        items    = [],
        sums     = {},
        re_uses  = /\(([0-9]+)\/[0-9]+\)/;

    var i, cnt, item, size;

    for (i = 0, cnt = rows.length; i < cnt; i++) {
        var cells     = rows[i].cells,
            condition = $('img', cells[1]),
            link      = $('a', cells[2]),
            control   = cells.length > 3 ? $('input', cells[3]) : null,
            name      = innerText(link);

        size = innerText(cells[2]).replace(name, '').trim();

        var m_uses    = size.match(re_uses),
            uses      = m_uses ? Number(m_uses[1]) : 1,
            sum       = sums[name];

        item = {
            'name'      : name,
            'condition' : condition,
            'size'      : size,
            'uses'      : uses,
            'link'      : link,
            'control'   : control
        };

        items.push(item);

        sums[name] = sum ? sum + uses : uses;
    }

    items.sort(function(x,y) { var diff = x.name.toLowerCase().localeCompare(y.name.toLowerCase()); return diff === 0 ? x.uses - y.uses : diff; });

    var row;

    for (i = 0, cnt = items.length; i < cnt; i++) {
        item = items[i];
        size = '&nbsp;' + item.size;
        row    = add('tr', newTable);
        attr(add('td', row), 'align', 'right').innerHTML = i + 1;
        add(item.condition, attr(add('td', row), 'valign', 'top'));

        var c_link = attr(add('td', row), {'valign': 'top', 'align': 'left'});

        if (item.control) add(item.control, add('td', row));

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
}

var g_main = $('#main_content'),
    g_h1 = $('h1', g_main);

if (innerText(g_h1).indexOf('Trade with') > -1) {
    var tables = $('table', g_main),
        tb_sell = tables[1],
        tb_buy = tables[2];

    if (tb_sell) tidyTrade(tb_sell);
    if (tb_buy)  tidyTrade(tb_buy);
}
