import { add } from "@common/dom/add";
import { attr } from "@common/dom/attr";
import { textContent } from "@common/dom/text-content";
import { textNormalized } from "@common/dom/text-normalized";
import { formatNumber } from "@common/text/format-number";
import { hash } from "@common/util/hash";
import { getCachedHeroes, normalizeDungeonName, type HeroProfileInfo } from "./logic";

function addMedal(achieved: boolean, parent: Element, position: string = "right") {
  attr(add<HTMLImageElement>("img", parent), {
    src: `/wod/css/icons/common/medal_big${achieved ? "" : "_gray"}.png`,
    style: `width: 24px; float: ${position}`,
  });
}

function setMissingTitle(row: Element, type: string, names: string[]) {
  row.setAttribute("title", `${type} (${names.length}):\n\n${names.join("\n")}`);
}

function showLevelUpMedals(profiles: HeroProfileInfo[]) {
  document.querySelectorAll<HTMLTableRowElement>(".content_table tr").forEach((tr, i) => {
    const td = tr.cells[0];
    td.setAttribute("style", "min-width: 50px");
    if (i <= 2) return;

    const required = parseInt(textNormalized(tr.cells[2].textContent ?? "", { collapse: false }), 10);
    const missing = profiles
      .filter((hero) => hero.exp && hero.exp < required)
      .map((hero) => ({ name: `${hero.name} (${formatNumber(required - hero.exp!)})`, deficit: required - hero.exp! }))
      .sort((a, b) => a.deficit - b.deficit)
      .map((h) => h.name);

    addMedal(!missing.length, td, "left");
    if (missing.length) setMissingTitle(tr, "Exp deficit", missing);
  });
}

function showFameMedals(profiles: HeroProfileInfo[]) {
  const medals = ["pin", "oak leaf", "shamrock", "laurel"];

  document.querySelectorAll<HTMLTableRowElement>(".content_table tr").forEach((tr, i) => {
    const td = add<HTMLTableCellElement>("td");
    attr(td, "style", "min-width: 210px");

    if (i === 0) {
      textContent(td, "medal");
      td.innerHTML = "<strong>medal</strong>";
    } else {
      const name = `${i > 4 ? "large " : ""}${medals[(i - 1) % 4]}${i > 12 ? " of honor" : i > 8 ? " and ribbon" : ""}`;
      const a = add<HTMLAnchorElement>("a", td);
      attr(a, { href: `/wod/spiel/hero/item.php?name=${name.replace(/ /g, "+")}&is_popup=1`, target: "_blank" });
      textContent(a, name);

      const required = parseInt(textNormalized(tr.cells[0]).replace(/\d+\. title/, ""), 10);
      const missing = profiles
        .filter((hero) => hero.fame && hero.fame < required)
        .map((h) => `${h.name} (${formatNumber(required - h.fame!)})`)
        .sort();

      addMedal(!missing.length, td);
      if (missing.length) setMissingTitle(tr, "Fame deficit", missing);
    }

    tr.insertBefore(td, tr.cells[1]);
  });
}

function showDungeonMedals(profiles: HeroProfileInfo[], dungeonPage = false) {
  const medals: Record<string, string[]> = {};
  profiles.forEach((hero) => (hero.medals || []).forEach((medal) => (medals[medal.toLowerCase()] ||= []).push(hero.name)));

  document.querySelectorAll<HTMLTableCellElement>(`#main_content .content_table > tbody > tr > td:nth-child(${dungeonPage ? 1 : 2})`).forEach((td) => {
    const key = hash(normalizeDungeonName(textNormalized(td).toLowerCase()));
    const heroes = medals[key] || [];
    const achieved = profiles.length > 0 && heroes.length === profiles.length;

    if (!achieved) {
      setMissingTitle(
        td.closest("tr")!,
        "Missing medal",
        profiles
          .filter((h) => !heroes.includes(h.name))
          .map((h) => h.name)
          .sort(),
      );
    }
    addMedal(achieved, td);
  });
}

async function main() {
  const groupId = (document.forms as any)?.the_form?.gruppe_id?.value;
  if (!groupId) return;

  const heroes = await getCachedHeroes(groupId);
  const path = location.pathname;

  if (path.includes("dungeonlist")) showDungeonMedals(heroes);
  else if (path.includes("title_list")) showFameMedals(heroes);
  else if (path.includes("dungeon/dungeon.php")) showDungeonMedals(heroes, true);
  else showLevelUpMedals(heroes);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", main, { once: true });
else main();
