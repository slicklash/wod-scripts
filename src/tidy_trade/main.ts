import { add } from "@common/dom/add";
import { attr } from "@common/dom/attr";
import { textContent } from "@common/dom/text-content";

export function getItemInfo(table): [any[], Record<string, number>] {
  const rows: HTMLTableRowElement[] = Array.from(
    table.cloneNode(true).querySelectorAll("tr"),
  );

  const sums: Record<string, number> = {};
  const items = rows.map((row) => {
    const cells = row.cells;
    const icons = cells[2].querySelectorAll("img");
    const link = cells[2].querySelector("a");
    const name = textContent(link);
    const size = textContent(cells[2]).replace(name, "").trim();
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
  });

  items.sort(
    (a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) ||
      a.uses - b.uses,
  );

  return [items, sums];
}

function tidyTrade(table) {
  const [items, sums] = getItemInfo(table);
  if (!items.length) return false;

  const newTable = add("table");

  items.forEach((item, index) => {
    const row = add<HTMLTableRowElement>("tr", newTable);

    attr(add<HTMLTableCellElement>("td", row), "align", "right").textContent =
      String(index + 1);

    add(item.rarity, attr(add("td", row), "valign", "top"));
    add(item.condition, attr(add("td", row), "valign", "top"));

    const cell = attr(add("td", row), {
      valign: "top",
      align: "left",
    });

    if (item.control) add(item.control, add("td", row));

    add(item.link, cell);
    add<HTMLSpanElement>("span", cell).innerHTML = "&nbsp;" + item.size;

    if (sums[item.name] > 1) {
      const total = add<HTMLSpanElement>("span", cell);
      attr(total, "style", "color: #666").innerHTML =
        `&nbsp;<sup>&sum;=${sums[item.name]}</sup>`;
      sums[item.name] = 0;
    }
  });

  table.parentNode.replaceChild(newTable, table);
  return true;
}

export function main(mainContent?) {
  const content = mainContent ?? document.querySelector("#main_content");

  if (
    !content ||
    !textContent(content.querySelector("h1")).includes("Trade with")
  ) {
    return false;
  }

  const tables = content.querySelectorAll("table");
  if (tables[1]) tidyTrade(tables[1]);
  if (tables[2]) tidyTrade(tables[2]);

  return true;
}

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", () => main(), { once: true });
else main();
