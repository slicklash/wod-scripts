import { parseHtml } from "@common/dom/parse-html";
import { textNormalized } from "@common/dom/text-normalized";
import { httpFetch } from "@common/net/http-fetch";
import { Store } from "@common/persistence/store";
import { batchMap } from "@common/util/batch-map";
import { hash } from "@common/util/hash";

type Hero = { name: string; profileUrl: string };

export type HeroProfileInfo = {
  name: string;
  medals?: string[];
  fame?: number;
  exp?: number;
  isMentor: boolean;
};

type CacheData = { key: string; groupId: string; heroes: HeroProfileInfo[] };

const CACHE_KEY = "numismatist";
const html = (data: string) => parseHtml<HTMLElement>(data, true);
const number = (value: string) => Number(value.replace(/\s/g, ""));

export const normalizeDungeonName = (text: string) => text.replace("swamp dragons", "swamp dragon").replace(" revival", "").replace("an awesome", "").replace(/the /g, "").trim();

async function getLastReportKey(): Promise<string> {
  const { data = "" } = await httpFetch("/wod/spiel/dungeon/report.php?menukey=reports");
  const last = html(data).querySelector("#main_content .row0");
  return last ? hash(textNormalized(last)) : "none";
}

async function getGroupHeroes(id: string): Promise<Hero[]> {
  const { data = "" } = await httpFetch(`/wod/spiel/dungeon/group.php?id=${id}`);
  if (!data) throw new Error("Failed to load group heroes");
  return Array.from(html(data).querySelectorAll<HTMLAnchorElement>(".main_content tbody .content_table_mainline a")).map((a) => ({
    name: textNormalized(a),
    profileUrl: a.getAttribute("href") || "",
  }));
}

async function parseProfile(hero: Hero): Promise<HeroProfileInfo> {
  const { data = "" } = await httpFetch(hero.profileUrl);
  if (!data) throw new Error(`Failed to load profile: ${hero.name}`);

  const doc = html(data);
  const profile: HeroProfileInfo = { name: hero.name, isMentor: true };

  doc.querySelectorAll(".content_table tr").forEach((row) => {
    const [keyCell, valueCell] = row.querySelectorAll("td");
    const key = textNormalized(keyCell);
    const value = textNormalized(valueCell);
    if (key === "class") profile.isMentor = value.includes("Mentor");
    if (key === "fame") profile.fame = number(value);
    if (key.includes("gained")) profile.exp = number(value);
  });

  if (profile.isMentor) return profile;

  const medalsUrl = Array.from(doc.querySelectorAll<HTMLAnchorElement>("#smarttabs__details_inner a"))
    .map((a) => a.getAttribute("href"))
    .find((url) => url?.includes("goallist"));

  if (!medalsUrl) {
    profile.medals = [];
    return profile;
  }

  try {
    const { data = "" } = await httpFetch(medalsUrl);
    profile.medals = data ? Array.from(html(data).querySelectorAll(".details.earned .label")).map((el) => hash(normalizeDungeonName(textNormalized(el).toLowerCase()))) : [];
  } catch {
    profile.medals = [];
  }

  return profile;
}

async function buildCache(groupId: string): Promise<CacheData> {
  const profiles = await batchMap(await getGroupHeroes(groupId), parseProfile);
  const cache: CacheData = { key: await getLastReportKey(), groupId, heroes: profiles.filter((hero) => !hero.isMentor) };
  await Store.set(CACHE_KEY, cache);
  return cache;
}

export async function getCachedHeroes(groupId: string): Promise<HeroProfileInfo[]> {
  const key = await getLastReportKey();
  const cache = await Store.get<CacheData>(CACHE_KEY, { key: "", groupId: "", heroes: [] });
  if (cache.key !== key || cache.groupId !== groupId) {
    return (await buildCache(groupId)).heroes;
  }
  return cache.heroes;
}
