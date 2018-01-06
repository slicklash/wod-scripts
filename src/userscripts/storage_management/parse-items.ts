import { attr } from '@common/dom/attr';
import { textContent } from '@common/dom/text-content';
import { StorageItem } from './storage-item';
import { SELECTION_OPTIONS } from './selection-options';

export function getItems(elem) {
  const table = getTable(elem);
  const rows = table ? <any> Array.from(table.querySelectorAll('tr')) : [];
  const items = parseItems(rows);
  return { items, table };
}

export function getTable(main_content) {

  let scope: any = main_content.querySelectorAll('input[type="submit"][name^="ITEMS_LAGER_DO_SORT"][class*="table_h"]');

  if (!scope || !scope.length) scope = main_content.querySelectorAll('input[type="submit"][name^="ITEMS_KELLER_DO_SORT"][class*="table_h"]');
  if (!scope || !scope.length) scope = main_content.querySelectorAll('input[type="submit"][name^="ITEMS_GROUPCELLAR_DO_SORT"][class*="table_h"]');

  try { scope = scope[0].parentNode.parentNode.parentNode.parentNode.querySelector('tbody'); } catch (ex) { scope = null; }

  return scope;
}

export function parseItems(rows: HTMLTableRowElement[]): StorageItem[] {

  const re_uses = /\(([0-9]+)\/[0-9]+\)/;

  return rows.reduce((acc, row) => {

    if (!row || !row.cells || row.cells.length < 2) return acc;

    const cells         = row.cells;
    const link          = cells[1].querySelector('a');
    const name          = textContent(link).replace(/!$/, '');
    const uses          = textContent(cells[1]).replace(name, '').trim();
    const tooltip       = link ? attr(link, 'onmouseover') : false;
    const classes       = link ? attr(link, 'class') : '';
    const ctrl_location = cells.length > 2 ? cells[2].querySelector('select') : null;
    const ctrl_select   = cells.length > 2 ? cells[2].querySelector('input[type="checkbox"][name^="doEquip"]') : null;
    let ctrl_sell       = cells.length > 3 ? cells[3].querySelector('input[type="checkbox"][name^="Sell"]') : null;
    let price           = cells.length > 3 ? Number(cells[3].textContent.trim()) : 0;
    const ctrl_group    = cells.length > 6 ? cells[6].querySelector('input[type="checkbox"][name^="SetGrpItem"]') : null;

    if (!ctrl_sell && cells.length > 4) {
      ctrl_sell = cells[4].querySelector('input[type="checkbox"]');
      price = Number(cells[4].textContent.trim());
    }

    const item = new StorageItem();
    item.name = name;

    const m = uses.match(re_uses);
    if (m) {
      item.isConsumable = true;
      item.uses = m[1];
    }
    item.isUsable = classes.indexOf('item_unusable') === -1;
    item.isGroupItem = tooltip ? tooltip.indexOf('group item') > -1 : false;

    item.ctrlLocationSelect = <any> ctrl_location;
    item.ctrlLocationCheckbox = <any> ctrl_select;
    item.ctrlSellCheckbox = <any> ctrl_sell;
    item.ctrlGroupCheckbox = <any> ctrl_group;

    item.price = price;

    for (const option of SELECTION_OPTIONS) {
      if (option.predicate && option.predicate(item)) {
        if (item.ctrlLocationSelect) option.count = (option.count || 0) + 1;
        if (item.ctrlSellCheckbox) option.countSell = (option.countSell || 0) + 1;
      }
    }

    acc.push(item);
    return acc;

  }, []);
}
