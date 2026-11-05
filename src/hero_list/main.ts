import { add } from "@common/dom/add";
import { attr } from "@common/dom/attr";
import { textContent } from "@common/dom/text-content";
import { parseHeroTable, saveWeights } from "./logic";

async function main(root: ParentNode | null = document.querySelector("#main_content")) {
  const myHeroesTable = root?.querySelector<HTMLTableElement>("form table");
  if (!myHeroesTable) return;

  const rows = Array.from(myHeroesTable.rows);
  if (rows.length < 2) return;
  const headerRow = rows[0];

  const groupNameHeader = add<HTMLTableCellElement>("th");
  textContent(groupNameHeader, "group");
  headerRow.insertBefore(groupNameHeader, headerRow.cells[4]);

  const heroWeightHeader = add<HTMLTableCellElement>("th");
  const label = add<HTMLSpanElement>("span", heroWeightHeader);
  textContent(label, "weight");
  add("br", label);
  attr(add<HTMLInputElement>("input", heroWeightHeader), {
    type: "button",
    value: "Update",
    class: "button clickable",
  }).addEventListener("click", () => saveWeights(rows.slice(1)));
  headerRow.append(heroWeightHeader);

  const newTable = attr(add<HTMLTableElement>("table"), "class", "content_table");
  const tbody = add<HTMLTableSectionElement>("tbody", newTable);
  tbody.append(headerRow);

  const currentTime = document.querySelector("#clock")?.textContent ?? undefined;
  const myHeroes = await parseHeroTable(rows.slice(1), currentTime);

  myHeroes.forEach(({ row, groupName, weight }, index) => {
    const groupNameCell = add<HTMLTableCellElement>("td");
    const link = attr(add<HTMLAnchorElement>("a", groupNameCell), {
      href: `/wod/spiel/dungeon/group.php?name=${encodeURIComponent(groupName)}`,
      target: "_blank",
    });
    textContent(link, groupName);
    row.insertBefore(groupNameCell, row.cells[4]);

    const weightCell = attr(row.insertCell(), "align", "center");
    attr(add<HTMLInputElement>("input", weightCell), {
      type: "text",
      style: "width: 30px",
      value: `${weight}`,
    });

    attr(row, "class", `row${index % 2}`);
    tbody.append(row);
  });

  myHeroesTable.replaceWith(newTable);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => main(), { once: true });
else main();
