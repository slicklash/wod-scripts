import { AdventureContext, Quests } from "./types";

export function assembleContext({ title, idHero, place, texts, world }: { title: string; idHero: string; place: string; texts: string[]; world: string }): AdventureContext {
  if (!title || !title.includes("adventure")) throw new Error(`Page title must contain "adventure", got: "${title}"`);
  if (!idHero) throw new Error('Could not find hero ID from link matching "session_hero_id"');

  const trimmed = texts.map((x) => x.trim());
  const text = trimmed.join(" ");
  const adventure = title.replace("adventure ", "");
  const isQuest = Object.keys(Quests).some((key) => adventure.indexOf((Quests as any)[key]) > -1);

  return Object.freeze({
    idHero,
    world,
    adventure,
    place: place || "*",
    texts: trimmed,
    text,
    isQuest,
  });
}

export function buildAdventureContext(): AdventureContext {
  const title = extractTitle();
  const idHero = extractHeroId();
  const place = extractPlace();
  const texts = extractTexts();
  const world = getWorld();

  return assembleContext({ title, idHero, place, texts, world });
}

function getWorld(): string {
  try {
    return document.location.hostname.split(".")[0];
  } catch {
    return "unknown";
  }
}

function extractTitle(): string {
  const h1 = document.querySelector("h1");
  return h1 ? h1.textContent || "" : "";
}

function extractHeroId(): string {
  const heroLink = document.querySelector('[href*="session_hero_id"]') as HTMLAnchorElement | null;
  if (!heroLink) return "";
  const match = heroLink.href.match(/session_hero_id=([\d]+)/);
  return match ? match[1] : "";
}

function extractPlace(): string {
  const el = document.querySelector("#smarttabs__level_inner h3 > a");
  if (!el) return "*";
  const textNodes = Array.from(el.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => (node as Text).textContent || "");
  return textNodes.join("").trim() || "*";
}

function extractTexts(): string[] {
  const elements = document.querySelectorAll("form > p, .REP_LVL_DESCRIPTION");
  return Array.from(elements).map((el) => {
    let html = el.innerHTML;
    html = html.replace(/&lt;font\s+color\s*=\s*["'](.+)["']&gt;/g, '<font color="$1">');
    html = html.replace(/&lt;\/font&gt;/g, "</font>");
    html = html.replace(/<br>\s+<br>/g, "<br>");
    return html;
  });
}
