import { attr } from "@common/dom/attr";
import { textContent } from "@common/dom/text-content";
import { textNormalized } from "@common/dom/text-normalized";
import { httpFetch } from "@common/net/http-fetch";
import { Store } from "@common/persistence/store";
import { batchMap } from "@common/util/batch-map";

export type Hero = {
  row: HTMLTableRowElement;
  groupName: string;
  weight: number;
};

const formatTime = (m: number) => `${String(Math.trunc(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const minutes = (time: string) => time.split(":").reduce((h, m) => h * 60 + Number(m), 0);

function formatDungeonTitle(dungeon: string, time: string, currentTime?: string) {
  const localTime = time.split("/")[0];
  const tomorrow = time.includes("tomorrow");
  const wait = minutes(time.replace("tomorrow", "").trim()) + (tomorrow ? 1440 : 0);

  return `${localTime}${currentTime ? ` (in ${formatTime(wait - minutes(currentTime))})` : ""} - ${dungeon}`;
}

function getDungeonName(td: HTMLTableCellElement): string {
  return (attr(td, "onmouseover") || "")
    .replace(/^.*left;'>/, "")
    .replace(/.+\(this,'(.+)'\);/, "$1")
    .replace(/.+>(.+)<\/th.+/i, "$1");
}

export async function parseHeroTable(rows: HTMLTableRowElement[], currentTime?: string): Promise<Hero[]> {
  const heroes = await Promise.all(
    rows.map(async (row): Promise<Hero> => {
      const cells = row.cells;
      const heroId = (cells[0].querySelector("input") as HTMLInputElement).value;
      const level = Number(textContent(cells[2]));
      const dungeon = getDungeonName(cells[4]);
      const time = textNormalized(cells[4]);

      const info = await Store.get<{ weight?: number; group?: string }>(heroId, {});
      if (dungeon) textContent(cells[4], formatDungeonTitle(dungeon, time, currentTime));

      return { row, weight: info.weight ?? (level || 100), groupName: info.group || "no group" };
    }),
  );
  return heroes.sort((a, b) => a.weight - b.weight);
}

export async function saveWeights(rows: HTMLTableRowElement[]) {
  await batchMap(
    rows,
    async (row) => {
      const cells = row.cells;
      const heroId = (cells[0].querySelector("input") as HTMLInputElement).value;
      const weight = Number((cells[6].querySelector("input") as HTMLInputElement).value) || 0;
      const { data } = (await httpFetch(`/wod/spiel/hero/profile.php?id=${heroId}`)) as { data: string };
      const index = data.indexOf("group:");
      const group =
        index > -1
          ? data
              .slice(index, index + 200)
              .split("<a")[1]
              ?.split(/[><]/)[1]
          : undefined;

      if (group) await Store.set(heroId, { weight, group });
    },
    { limit: 4 },
  );
  document.forms.namedItem("the_form")?.submit();
}
