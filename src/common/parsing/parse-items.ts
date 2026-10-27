import { attr } from "@common/dom/attr";
import { textContent } from "@common/dom/text-content";
import { SELECTION_OPTIONS } from "./selection-options";
import { StorageItem } from "./storage-item";

const SORT_BUTTONS = [
  'input[type="submit"][name^="ITEMS_LAGER_DO_SORT"][class*="table_h"]',
  'input[type="submit"][name^="ITEMS_KELLER_DO_SORT"][class*="table_h"]',
  'input[type="submit"][name^="ITEMS_GROUPCELLAR_DO_SORT"][class*="table_h"]',
];

export function parseItems(mainContent: Element) {
  for (const selector of SORT_BUTTONS) {
    const button = mainContent.querySelector<HTMLInputElement>(selector);
    // prettier-ignore
    const table = button?.parentElement?.parentElement?.parentElement?.parentElement?.querySelector("tbody");
    if (!table) continue;

    const items: StorageItem[] = [];

    for (const row of table.rows) {
      const cells = row.cells;
      if (cells.length < 2) continue;

      const link = cells[1].querySelector("a");
      const name = textContent(link).replace(/!$/, "");
      const uses = textContent(cells[1]).replace(name, "").trim();
      const tooltip = link ? attr(link, "onmouseover") : "";
      const classes = link ? attr(link, "class") : "";

      const locationCell = cells[2];
      const sellCell = cells[3];
      const fallbackSellCell = cells[4];

      // prettier-ignore
      const locationSelect = locationCell?.querySelector<HTMLSelectElement>("select") ?? undefined;
      // prettier-ignore
      const locationCheckbox = locationCell?.querySelector<HTMLInputElement>('input[type="checkbox"][name^="doEquip"]') ?? undefined;
      // prettier-ignore
      let sellCheckbox = sellCell?.querySelector<HTMLInputElement>('input[type="checkbox"][name^="Sell"]') ?? undefined;
      let price = sellCell ? Number(sellCell.textContent?.trim()) : 0;

      if (!sellCheckbox && fallbackSellCell) {
        // prettier-ignore
        sellCheckbox = fallbackSellCell.querySelector<HTMLInputElement>('input[type="checkbox"]') ?? undefined;
        price = Number(fallbackSellCell.textContent?.trim());
      }

      const item = new StorageItem();
      item.name = name;
      item.isConsumable = /\(([0-9]+)\/[0-9]+\)/.test(uses);
      const match = uses.match(/\(([0-9]+)\/[0-9]+\)/);
      if (match) item.uses = match[1];

      item.isUsable = !classes.includes("item_unusable");
      item.isGroupItem = tooltip.includes("group item");
      item.numberCell = cells[0];
      item.ctrlLocationSelect = locationSelect;
      item.ctrlLocationCheckbox = locationCheckbox;
      item.ctrlSellCheckbox = sellCheckbox;
      // prettier-ignore
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
