import { textContent } from '../common/dom/text-content'
import { add } from '../common/dom/add'
import { attr } from '../common/dom/attr'

// --- Main ---

export function getItemInfo(table) : [any[], any] {

    let rows: any[]  = Array.from(table.cloneNode(true).querySelectorAll('tr'));

    if (!rows.length) return [[], null];

    let items    = [],
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

    return [items, sums];
}

function tidyTrade(table) {

    let [items, sums] = getItemInfo(table);

    if (!items.length) return false;

    let newTable      = add('table');

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

    let holder    = table.parentNode,
        position  = table.nextSibling;

    holder.removeChild(table);
    holder.insertBefore(newTable, position);
}

export function main(main_content?) {

    let main = main_content || document.querySelector('#main_content'),
        h1 = main ? main.querySelector('h1') : null;

    if (textContent(h1).indexOf('Trade with') < 0) return false;

    let tables = main.querySelectorAll('table'),
        tb_sell = tables[1],
        tb_buy = tables[2];

    if (tb_sell) tidyTrade(tb_sell);
    if (tb_buy)  tidyTrade(tb_buy);

    return true;
}

if (!(<any>window).__karma__) document.addEventListener('DOMContentLoaded', () => main());
