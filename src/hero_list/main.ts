import { add } from "@common/dom/add";
import { attr } from "@common/dom/attr";
import { textContent } from "@common/dom/text-content";
import { httpFetch } from "@common/net/http-fetch";
import { Store } from "@common/persistence/store";

type HeroInfo = {
  group?: string;
  row: HTMLTableRowElement;
  weight?: number;
};

// prettier-ignore
const formatTime = (minutes: number) => [Math.trunc(minutes / 60), minutes % 60] .map((x) => String(x).padStart(2, "0")).join(":");
// prettier-ignore
const minutes = (time: string) => time.split(":").reduce((total, part) => (total > 0 ? total + Number(part) : Number(part) * 60), 0);

function formatDungeonTitle(
  dungeon: string,
  time: string,
  currentTime?: string,
) {
  const localTime = time.split("/")[0];
  const wait = time.includes("tomorrow")
    ? minutes(time.replace("tomorrow", "").trim()) + 1440
    : minutes(time);
  return currentTime
    ? `${localTime} (in ${formatTime(wait - minutes(currentTime))}) - ${dungeon}`
    : `${localTime} - ${dungeon}`;
}

export async function parseHeroTable(
  [, ...rows]: HTMLTableRowElement[],
  currentTime?: string,
): Promise<HeroInfo[]> {
  const heroes = await Promise.all(
    rows.map(async (row): Promise<HeroInfo> => {
      const cells = row.cells;
      const hid = Number(
        (cells[0].querySelector("input") as HTMLInputElement).value,
      ).toString();
      const level = Number(textContent(cells[2]));
      const dungeonCell = cells[4];
      const dungeon = getDungeonName(dungeonCell);
      const time = textContent(dungeonCell).trim();

      let info: { weight?: number; group?: string } = {};

      try {
        const value = await Store.get(hid);
        if (value) info = JSON.parse(value);
      } catch {
        info = {};
      }

      if (dungeon) {
        textContent(
          dungeonCell,
          formatDungeonTitle(dungeon, time, currentTime),
        );
      }

      return {
        row,
        weight: Number(info.weight || (level === 0 ? 100 : level)),
        group: info.group || "no group",
      };
    }),
  );

  return heroes.sort((a, b) => (a.weight || 0) - (b.weight || 0));
}

export function getDungeonName(td: HTMLTableCellElement): string {
  let tooltip = attr(td, "onmouseover") || "";
  const index = tooltip.lastIndexOf("left;'>");

  if (index > -1) tooltip = tooltip.slice(index);

  return tooltip
    .replace(/.+\(this,'(.+)'\);/, "$1")
    .replace(/.+>(.+)<\/th.+/i, "$1");
}

export async function saveWeights(rows: HTMLTableRowElement[]) {
  await Promise.all(
    rows.slice(1).map(async (row) => {
      const cells = row.cells;
      const hid = Number(
        (cells[0].querySelector("input") as HTMLInputElement).value,
      ).toString();

      const input = cells[6].querySelector("input") as HTMLInputElement;
      const weight = Number(input.value) || 0;

      const { data } = (await httpFetch(
        `/wod/spiel/hero/profile.php?id=${hid}`,
      )) as { data: string };

      const index = data.indexOf("group:");
      if (index > -1) {
        const group = data
          .slice(index, index + 200)
          .split("<a")[1]
          .split(/[><]/)[1];

        await Store.set(hid, JSON.stringify({ weight, group }));
      }
    }),
  );

  const form = document.forms.namedItem("the_form");
  form?.submit();
}

export function main(mainContent?: ParentNode) {
  const content = mainContent ?? document.querySelector("#main_content");
  const table = content?.querySelector<HTMLTableElement>("form table");
  if (!table) return;

  const rows = Array.from(table.querySelectorAll("tr"));
  if (!rows.length) return;

  if (!textContent(content?.querySelector("h1")).includes("Hero")) return;

  const newTable = add<HTMLTableElement>("table");
  const tbody = add<HTMLTableSectionElement>("tbody", newTable);
  attr(newTable, "class", "content_table");

  const header = rows[0];
  const weightHeader = add<HTMLTableCellElement>("th");
  const label = add<HTMLSpanElement>("span", weightHeader);
  const saveButton = add<HTMLInputElement>("input", weightHeader);

  textContent(label, "weight");
  add("br", label);

  attr(saveButton, {
    type: "button",
    value: "Update",
    class: "button clickable",
  });
  saveButton.addEventListener("click", () => saveWeights(rows));

  header.append(weightHeader);
  tbody.append(header);

  const groupHeader = add<HTMLTableCellElement>("th");
  textContent(groupHeader, "group");
  header.insertBefore(groupHeader, header.cells[4]);

  const clock = document.querySelector("#clock");
  const currentTime = clock?.textContent ?? undefined;

  function addWeightInput(row: HTMLTableRowElement, weight: number) {
    const cell = add<HTMLTableCellElement>("td", row);
    const input = add<HTMLInputElement>("input", cell);

    attr(input, { type: "text", style: "width: 30px", value: `${weight}` });
    attr(cell, "align", "center");
  }

  parseHeroTable(rows, currentTime).then((heroes) => {
    heroes.forEach((hero, index) => {
      const { row, group = "no group", weight = 0 } = hero;

      addWeightInput(row, weight);
      attr(row, "class", `row${index % 2}`);

      const cell = add<HTMLTableCellElement>("td");
      const link = add<HTMLAnchorElement>("a", cell);

      attr(link, {
        href: `/wod/spiel/dungeon/group.php?name=${encodeURIComponent(group)}`,
        target: "_blank",
      });
      textContent(link, group);

      row.insertBefore(cell, row.cells[4]);
      tbody.append(row);
    });

    table.replaceWith(newTable);
  });
}

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", () => main(), { once: true });
else main();
