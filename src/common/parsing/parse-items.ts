import { attr } from "@common/dom/attr";
import { textContent } from "@common/dom/text-content";
import { textNormalized } from "@common/dom/text-normalized";
import { SELECTION_OPTIONS } from "./selection-options";
import type { StorageItem } from "./storage-item";
import { createStorageItem, isConsumable } from "./storage-item";

const SORT_BUTTONS = ['input[type="submit"][name^="ITEMS_LAGER_DO_SORT"][class*="table_h"]', 'input[type="submit"][name^="ITEMS_KELLER_DO_SORT"][class*="table_h"]', 'input[type="submit"][name^="ITEMS_GROUPCELLAR_DO_SORT"][class*="table_h"]'];

export function parseItems(mainContent: Element) {
  for (const selector of SORT_BUTTONS) {
    const button = mainContent.querySelector<HTMLInputElement>(selector);
    const table = button?.parentElement?.parentElement?.parentElement?.parentElement?.querySelector("tbody");
    if (!table) continue;

    const items: StorageItem[] = [];

    for (const row of table.rows) {
      const cells = row.cells;
      if (cells.length < 2) continue;

      const link = cells[1].querySelector("a");
      const name = textContent(link).replace(/!$/, "");
      const uses = textNormalized(cells[1]).replace(name, "");
      const tooltip = link ? attr(link, "onmouseover") ?? "" : "";
      const classes = link ? attr(link, "class") ?? "" : "";

      const locationCell = cells[2];
      const sellCell = cells[3];
      const fallbackSellCell = cells[4];

      const locationSelect = locationCell?.querySelector<HTMLSelectElement>("select") ?? undefined;
      const locationCheckbox = locationCell?.querySelector<HTMLInputElement>('input[type="checkbox"][name^="doEquip"]') ?? undefined;
      let sellCheckbox = sellCell?.querySelector<HTMLInputElement>('input[type="checkbox"][name^="Sell"]') ?? undefined;
      let price = sellCell ? Number(textNormalized(sellCell)) : 0;

      if (!sellCheckbox && fallbackSellCell) {
        sellCheckbox = fallbackSellCell.querySelector<HTMLInputElement>('input[type="checkbox"]') ?? undefined;
        price = Number(textNormalized(fallbackSellCell));
      }

      const item = createStorageItem();
      item.name = name;
      item.isConsumable = isConsumable(item) || /\(([0-9]+)\/[0-9]+\)/.test(uses);
      const match = uses.match(/\(([0-9]+)\/[0-9]+\)/);
      if (match) item.uses = Number(match[1]);

      item.isUsable = !classes.includes("item_unusable");
      item.isGroupItem = tooltip.includes("group item");
      item.numberCell = cells[0];
      item.ctrlLocationSelect = locationSelect;
      item.ctrlLocationCheckbox = locationCheckbox;
      item.ctrlSellCheckbox = sellCheckbox;
      item.ctrlGroupCheckbox = cells[6]?.querySelector<HTMLInputElement>('input[type="checkbox"][name^="SetGrpItem"]') ?? undefined;
      item.price = price;

      for (const option of SELECTION_OPTIONS) {
        if (!option.predicate?.(item)) continue;
        if (locationSelect) option.count = (option.count || 0) + 1;
        if (sellCheckbox) option.countSell = (option.countSell || 0) + 1;
      }

      items.push(item);
    }

    return { items, table };
  }

  return { items: [], table: null };
}
