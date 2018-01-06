import { textContent } from '@common/dom/text-content';
import { add } from '@common/dom/add';
import { attr } from '@common/dom/attr';

// --- Main ---

export function getItemInfo(table): [any[], any] {

    const rows: any[]  = Array.from(table.cloneNode(true).querySelectorAll('tr'));

    if (!rows.length) return [[], null];

    const items    = [];
    const sums     = {};
    const re_uses  = /\(([0-9]+)\/[0-9]+\)/;

    rows.forEach(row => {

        const cells     = row.cells;
        const icons     = Array.from(cells[2].querySelectorAll('img'));
        const rarity    = icons[0];
        const condition = icons[1];
        const link      = cells[2].querySelector('a');
        const control   = cells.length > 3 ? cells[3].querySelector('input') : null;
        const name      = textContent(link);
        const size      = textContent(cells[2]).replace(name, '').trim();
        const m_uses    = size.match(re_uses);
        const uses      = m_uses ? Number(m_uses[1]) : 1;
        const sum       = sums[name];
        const item      = { name, condition, rarity, size, uses, link, control, cells };

        items.push(item);

        sums[name] = sum ? sum + uses : uses;
    });

    items.sort((x, y) => {
        const diff = x.name.toLowerCase().localeCompare(y.name.toLowerCase());
        return diff === 0 ? x.uses - y.uses : diff;
    });

    return [items, sums];
}

function tidyTrade(table) {

    const [items, sums] = getItemInfo(table);

    if (!items.length) return false;

    const newTable = add('table');

    items.forEach((item, i) => {

      const size = '&nbsp;' + item.size;
      const row  = add('tr', newTable);

      attr(add('td', row), 'align', 'right').innerHTML = i + 1;
      add(item.rarity, attr(add('td', row), 'valign', 'top'));
      add(item.condition, attr(add('td', row), 'valign', 'top'));

      const c_link = attr(add('td', row), {valign: 'top', align: 'left'});

      if (item.control) add(item.control, add('td', row));

      add(item.link, c_link);
      add<HTMLSpanElement>('span', c_link).innerHTML = size;

      if (sums[item.name] > 1) {
          const summ = add('span', c_link);
          attr(summ, 'style', 'color: #666').innerHTML = '&nbsp;<sup>&sum;=' + sums[item.name] + '</sup>';
          sums[item.name] = 0;
      }

    });

    const holder   = table.parentNode;
    const position = table.nextSibling;

    holder.removeChild(table);
    holder.insertBefore(newTable, position);
}

export function main(main_content?) {

    const content = main_content || document.querySelector('#main_content');
    const h1 = content ? content.querySelector('h1') : null;

    if (textContent(h1).indexOf('Trade with') < 0) return false;

    const tables = content.querySelectorAll('table');
    const tb_sell = tables[1];
    const tb_buy = tables[2];

    if (tb_sell) tidyTrade(tb_sell);
    if (tb_buy)  tidyTrade(tb_buy);

    return true;
}

if (!(<any> window).__karma__) document.addEventListener('DOMContentLoaded', () => main());
