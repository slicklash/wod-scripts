import { add } from "@common/dom/add";
import { attr } from "@common/dom/attr";
import { parseHtml } from "@common/dom/parse-html";
import { httpFetch } from "@common/net/http-fetch";
import { Store } from "@common/persistence/store";

type Hero = {
  name: string;
  profileUrl: string;
};

type HeroProfileInfo = {
  name: string;
  medals?: string[];
  fame?: number;
  exp?: number;
  isMentor: boolean;
};

const CACHE_KEY = "numismatist";
const FORM = () => (document.forms as any)?.the_form?.gruppe_id?.value;

const normalize = (text: string) =>
  text
    .replace("swamp dragons", "swamp dragon")
    .replace(" revival", "")
    .replace("an awesome", "")
    .replace(/the /g, "")
    .trim();

// prettier-ignore
const hash = (text: string) => Math.abs(text.padEnd(11, "0").split("").map((x) => x.charCodeAt(0)).reduce((a, x) => (a + ((a << 7) + (a << 3))) ^ x)).toString(16);
const html = (data: string) => parseHtml<HTMLElement>(data, true);
const text = (el?: Element) => el?.textContent?.trim() || "";
const number = (value: string) => Number(value.replace(/\s/g, ""));
// prettier-ignore
const rows = () => Array.from(document.querySelectorAll<HTMLTableRowElement>(".content_table tr"));
const getLastReportKey = async () => {
  const resp = await httpFetch("/wod/spiel/dungeon/report.php?menukey=reports");
  const last = resp && html(resp.data).querySelector("#main_content .row0");
  return last ? hash(text(last)) : "none";
};

async function getGroupHeroes(id: string): Promise<Hero[]> {
  const resp = await httpFetch(`/wod/spiel/dungeon/group.php?id=${id}`);
  if (!resp) throw new Error("Failed to load group heroes");
  return Array.from(
    html(resp.data).querySelectorAll<HTMLAnchorElement>(
      ".main_content tbody .content_table_mainline a",
    ),
  ).map((a) => ({ name: text(a), profileUrl: a.getAttribute("href") || "" }));
}

async function batchMap<T, U>(
  items: T[],
  fn: (item: T) => Promise<U>,
  concurrency: number = 3,
): Promise<U[]> {
  const results: U[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    results.push(
      ...(await Promise.all(items.slice(i, i + concurrency).map(fn))),
    );
  }
  return results;
}

async function parseProfile(hero: Hero): Promise<HeroProfileInfo> {
  const resp = await httpFetch(hero.profileUrl);
  if (!resp) throw new Error(`Failed to load profile: ${hero.name}`);

  const doc = html(resp.data);
  const profile: HeroProfileInfo = { name: hero.name, isMentor: true };

  doc.querySelectorAll(".content_table tr").forEach((row) => {
    const cells = row.querySelectorAll("td");
    const key = text(cells[0]);
    const value = text(cells[1]);
    if (key === "class") profile.isMentor = value.includes("Mentor");
    if (key === "fame") profile.fame = number(value);
    if (key.includes("gained")) profile.exp = number(value);
  });

  if (profile.isMentor) return profile;

  const medalsUrl = Array.from(
    doc.querySelectorAll<HTMLAnchorElement>("#smarttabs__details_inner a"),
  )
    .map((a) => a.getAttribute("href"))
    .find((url) => url?.includes("goallist"));

  if (!medalsUrl) {
    profile.medals = [];
    return profile;
  }

  try {
    const resp = await httpFetch(medalsUrl);
    profile.medals = resp
      ? Array.from(
          html(resp.data).querySelectorAll(".details.earned .label"),
        ).map((el) => hash(normalize(text(el).toLowerCase())))
      : [];
  } catch {
    profile.medals = [];
  }

  return profile;
}

async function buildCache(groupId: string) {
  const profiles = await batchMap(await getGroupHeroes(groupId), parseProfile);
  const cache = {
    key: await getLastReportKey(),
    groupId,
    heroes: profiles.filter((hero) => !hero.isMentor),
  };

  await Store.set(CACHE_KEY, JSON.stringify(cache));
  return cache;
}

export async function main() {
  const groupId = FORM();
  if (!groupId) return;

  const key = await getLastReportKey();
  let cache = JSON.parse(await Store.get(CACHE_KEY, "{}"));

  if (cache.key !== key || cache.groupId !== groupId) {
    cache = await buildCache(groupId);
  }

  const heroes: HeroProfileInfo[] = cache.heroes || [];
  const path = location.pathname;

  if (path.includes("dungeonlist")) showDungeonMedalInfo(heroes);
  else if (path.includes("title_list")) showFameMedalInfo(heroes);
  else if (path.includes("dungeon/dungeon.php"))
    showDungeonMedalInfo(heroes, true);
  else showLevelUpMedalInfo(heroes);
}

const formatNumber = (n: number) =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const setMissingTitle = (row: Element, type: string, names: string[]) => {
  row.setAttribute(
    "title",
    `${type} (${names.length}):\n\n${names.join("\n")}`,
  );
};

function showLevelUpMedalInfo(profiles: HeroProfileInfo[]) {
  rows().forEach((tr, i) => {
    const td = tr.cells[0];
    td.setAttribute("style", "min-width: 50px");
    if (i <= 2) return;

    const required = parseInt(tr.cells[2].textContent.replace(/\s/g, ""), 10);
    const missing = profiles
      .filter((hero) => hero.exp && hero.exp < required)
      .map((hero) => ({
        name: `${hero.name} (${formatNumber(required - hero.exp!)})`,
        deficit: required - hero.exp!,
      }))
      .sort((a, b) => a.deficit - b.deficit)
      .map((hero) => hero.name);

    addMedalIcon(!missing.length, td, "left");
    if (missing.length) setMissingTitle(tr, "Exp deficit", missing);
  });
}

function showFameMedalInfo(profiles: HeroProfileInfo[]) {
  const medals = ["pin", "oak leaf", "shamrock", "laurel"];

  rows().forEach((tr, i) => {
    const td = add<HTMLTableCellElement>("td");
    td.setAttribute("style", "min-width: 210px");

    if (i === 0) {
      td.innerHTML = "<strong>medal</strong>";
    } else {
      const name = `${i > 4 ? "large " : ""}${medals[(i - 1) % 4]}${i > 12 ? " of honor" : i > 8 ? " and ribbon" : ""}`;
      const a = add<HTMLAnchorElement>("a", td);
      a.href = `/wod/spiel/hero/item.php?name=${name.replace(/ /g, "+")}&is_popup=1`;
      a.target = "_blank";
      a.textContent = name;

      const required = parseInt(
        tr.cells[0].textContent.replace(/\d+. title/, ""),
        10,
      );
      const missing = profiles
        .filter((hero) => hero.fame && hero.fame < required)
        .map((hero) => `${hero.name} (${formatNumber(required - hero.fame!)})`)
        .sort();

      addMedalIcon(!missing.length, td);
      if (missing.length) setMissingTitle(tr, "Fame deficit", missing);
    }

    tr.insertBefore(td, tr.cells[1]);
  });
}

function showDungeonMedalInfo(
  profiles: HeroProfileInfo[],
  dungeonPage = false,
) {
  const medals: Record<string, string[]> = {};

  profiles.forEach((hero) =>
    (hero.medals || []).forEach((medal) => {
      (medals[medal.toLowerCase()] ||= []).push(hero.name);
    }),
  );

  document
    .querySelectorAll(
      `#main_content .content_table > tbody > tr > td:nth-child(${dungeonPage ? 1 : 2})`,
    )
    .forEach((td) => {
      const key = hash(normalize(text(td).toLowerCase()));
      const heroes = medals[key] || [];
      const achieved = profiles.length > 0 && heroes.length === profiles.length;

      if (!achieved) {
        const missing = profiles
          .filter((hero) => !heroes.includes(hero.name))
          .map((hero) => hero.name)
          .sort();
        setMissingTitle(td, "Missing medal", missing);
      }

      addMedalIcon(achieved, td);
    });
}

function addMedalIcon(achieved: boolean, elem: Element, position = "right") {
  const img = add<HTMLImageElement>("img", elem);
  img.src = `/wod/css/icons/common/medal_big${achieved ? "" : "_gray"}.png`;
  attr(img, "style", `width: 24px; float: ${position}`);
}

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", main, { once: true });
else main();
