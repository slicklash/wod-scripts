import { add } from "@common/dom/add";
import { attr } from "@common/dom/attr";
import { textContent } from "@common/dom/text-content";
import { textNormalized } from "@common/dom/text-normalized";

export function main(mainContent?: Element) {
  const content = mainContent ?? document.querySelector("#main_content");

  if (!content || !textContent(content.querySelector("h1")).includes("Trade with")) {
    return false;
  }

  const tables = content.querySelectorAll("table");
  if (tables[1]) tidyTrade(tables[1]);
  if (tables[2]) tidyTrade(tables[2]);

  return true;
}

function tidyTrade(table: HTMLTableElement) {
  const [items, sums] = getItemInfo(table);
  if (!items.length) return false;

  const newTable = add<HTMLTableElement>("table");

  items.forEach((item, index) => {
    const row = add<HTMLTableRowElement>("tr", newTable);

    attr(add<HTMLTableCellElement>("td", row), "align", "right").textContent = String(index + 1);

    attr(add<HTMLTableCellElement>("td", row), "valign", "top").appendChild(item.rarity);
    attr(add<HTMLTableCellElement>("td", row), "valign", "top").appendChild(item.condition);

    const cell = attr(add("td", row), {
      valign: "top",
      align: "left",
    });

    if (item.control) add<HTMLTableCellElement>("td", row).appendChild(item.control);

    cell.appendChild(item.link);
    add<HTMLSpanElement>("span", cell).innerHTML = "&nbsp;" + item.size;

    if (sums[item.name] > 1) {
      const total = add<HTMLSpanElement>("span", cell);
      attr(total, "style", "color: #666").innerHTML = `&nbsp;<sup>&sum;=${sums[item.name]}</sup>`;
      sums[item.name] = 0;
    }
  });

  table.parentNode?.replaceChild(newTable, table);
  return true;
}

export function getItemInfo(table: HTMLTableElement): [any[], Record<string, number>] {
  const cloned = table.cloneNode(true) as HTMLTableElement;
  const rows: HTMLTableRowElement[] = Array.from(cloned.querySelectorAll("tr"));

  const sums: Record<string, number> = {};
  const items = rows
    .map((row) => {
      const cells = row.cells;
      const cell2 = cells[2];
      if (!cell2) return null;
      const icons = cell2.querySelectorAll("img");
      const link = cell2.querySelector("a");
      const name = textContent(link);
      const size = textNormalized(cells[2]).replace(name, "");
      const uses = Number(size.match(/\(([0-9]+)\/[0-9]+\)/)?.[1] ?? 1);

      const item = {
        name,
        condition: icons[1],
        rarity: icons[0],
        size,
        uses,
        link,
        control: cells[3]?.querySelector("input") ?? null,
        cells,
      };

      sums[name] = (sums[name] ?? 0) + uses;
      return item;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) || a.uses - b.uses);

  return [items, sums];
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => main(), { once: true });
else main();
