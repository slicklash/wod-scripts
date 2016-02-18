/// <reference path="../common/prototypes/array.ts" />

/// <reference path="../common/functions/dom/add.ts" />
/// <reference path="../common/functions/dom/attr.ts" />
/// <reference path="../common/functions/dom/textContent.ts" />

// --- Main ---

function tidyTrade(table) {

    let rows = Array.from(table.cloneNode(true).querySelectorAll('tr'));

    if (rows.length < 1) return;

    let holder   = table.parentNode,
        position = table.nextSibling,
        newTable = add('table'),
        items    = [],
        sums     = {},
        re_uses  = /\(([0-9]+)\/[0-9]+\)/;

    rows.forEach(row => {

        let cells     = row.cells,
            icons     = Array.from(cells[2].querySelectorAll('img')),
            rarity    = icons[0],
            condition = icons[1],
            link      = cells[2].querySelector('a'),
            control   = cells.length > 3 ? cells[3].querySelector('input') : null,
            name      = textContent(link),
            size      = textContent(cells[2]).replace(name, '').trim(),
            m_uses    = size.match(re_uses),
            uses      = m_uses ? Number(m_uses[1]) : 1,
            sum       = sums[name],
            item      = { name, condition, rarity, size, uses, link, control, cells };

        items.push(item);

        sums[name] = sum ? sum + uses : uses;
    });

    items.sort((x,y) => {
        let diff = x.name.toLowerCase().localeCompare(y.name.toLowerCase());
        return diff === 0 ? x.uses - y.uses : diff;
    });

    items.forEach((item, i) => {

        let size = '&nbsp;' + item.size,
            row  = add('tr', newTable);

        attr(add('td', row), 'align', 'right').innerHTML = i + 1;
        add(item.rarity, attr(add('td', row), 'valign', 'top'));
        add(item.condition, attr(add('td', row), 'valign', 'top'));

        let c_link = attr(add('td', row), {'valign': 'top', 'align': 'left'});

        if (item.control) add(item.control, add('td', row));

        add(item.link, c_link);
        add('span', c_link).innerHTML = size;

        if (sums[item.name] > 1) {
            let summ = add('span', c_link);
            attr(summ, 'style', 'color: #666').innerHTML = '&nbsp;<sup>&sum;=' + sums[item.name] + '</sup>';
            sums[item.name] = 0;
        }

    });

    holder.removeChild(table);
    holder.insertBefore(newTable, position);
}

function main() {

    let main = document.querySelector('#main_content'),
        h1 = main.querySelector('h1');

    if (textContent(h1).indexOf('Trade with') > -1) {

        let tables = main.querySelectorAll('table'),
            tb_sell = tables[1],
            tb_buy = tables[2];

        if (tb_sell) tidyTrade(tb_sell);
        if (tb_buy)  tidyTrade(tb_buy);
    }
}

document.addEventListener('DOMContentLoaded', main);
