const table = (props: string, rows: string | string[]): string => `[table ${props}]${Array.isArray(rows) ? rows.join("") : rows}[/table]`;
const row = (props: string, cells: string[]): string => `[tr ${props}]${cells.join("")}[/tr]`;
const th = (props: string = "", content: string = ""): string => `[th ${props}]${content}[/th]`;
const td = (props: string = "", content: string = ""): string => `[td ${props}]${content}[/td]`;
const size12 = (text: string): string => `[size=12]${text}[/size]`;

import { formatNumber } from "@common/text/format-number";
import type { HeroAttribute, HeroProfile } from "./hero-profile";

const title = (hero: HeroProfile): string => `[size=12][hero:${hero.name}]${hero.title && ", [i]" + hero.title + "[/i]"} - [class:${hero.race}] [class:${hero.char_class}] - Level ${hero.level}[/size]`;

const bbcode_attr = (a: HeroAttribute): string => {
  const efval = a.effective_value !== a.value ? " [" + a.effective_value + "]" : "";
  return row("", [td("", size12(a.name)), td("align=center", size12(`${a.value}[url=" "]${efval}[/url]`)), td("align=right", size12(formatNumber(a.training_cost)))]);
};

import { calculateEPUsed } from "./hero-profile";

type AttrKey = "st" | "co" | "in" | "dx" | "ch" | "ag" | "pe" | "wi" | "hp" | "hhp" | "mp" | "rmp" | "ini" | "act";

type ParryDef = {
  name: string;
  attr1: AttrKey;
  attr2: AttrKey;
};

const PARRIES: ParryDef[] = [
  { name: "Melee", attr1: "ag", attr2: "dx" },
  { name: "Ranged", attr1: "ag", attr2: "pe" },
  { name: "Spell", attr1: "wi", attr2: "in" },
  { name: "Social", attr1: "wi", attr2: "ch" },
  { name: "Ambush", attr1: "pe", attr2: "in" },
  { name: "Force of Nature", attr1: "wi", attr2: "ag" },
  { name: "Activate trap", attr1: "pe", attr2: "ag" },
  { name: "Explosion or Blast", attr1: "ag", attr2: "pe" },
  { name: "Disease", attr1: "co", attr2: "ch" },
  { name: "Curse", attr1: "ch", attr2: "wi" },
];

type StatRowDef = {
  label: string;
  color: string;
  key1: AttrKey;
  key2: AttrKey;
};

const STAT_PAIRS: StatRowDef[] = [
  { label: "HP",  color: "mediumseagreen", key1: "hp", key2: "hhp" },
  { label: "MP",  color: "dodgerblue",     key1: "mp", key2: "rmp" },
];

type SimpleRowDef = {
  label: string;
  value: (hero: HeroProfile) => string;
};

const SIMPLE_ROWS: SimpleRowDef[] = [
  { label: "Actions",      value: (h) => `${h.attributes.act.value} [url=" "][${h.attributes.act.effective_value}][/url]` },
  { label: "Initiative",   value: (h) => `${h.attributes.ini.value} [url=" "][${h.attributes.ini.effective_value}][/url]` },
  { label: "Reset points", value: (h) => String(h.reset_points) },
  { label: "Gender",       value: (h) => h.gender },
  { label: "Fame",         value: (h) => `${formatNumber(h.fame)} :fame:` },
  { label: ":ep: used",    value: (h) => `≈ ${formatNumber(calculateEPUsed(h))}` },
];

const characteristics = (hero: HeroProfile): string => {
  const attrRows = Object.values(hero.attributes).slice(0, 8).map(bbcode_attr).join("");

  const statPairRows = STAT_PAIRS.map(({ label, color, key1, key2 }) =>
    row("", [td("", `[color=${color}]${size12(label)}[/color]`), td("", size12(`${hero.attributes[key1].value} [url=" "][${hero.attributes[key1].effective_value}][/url]`)), td("", `[color=${color}]${size12(key2.toUpperCase())}[/color]`), td("", size12(`${hero.attributes[key2].value} [url=" "][${hero.attributes[key2].effective_value}][/url]`))]),
  ).join("");

  // Build single-value rows (Actions, Initiative, etc.)
  const simpleRows = SIMPLE_ROWS.map(({ label, value }) => row("", [td("colspan=2", size12(label)), td("colspan=2", size12(value(hero)))]));

  const sidebarTable = table("border=1", [statPairRows, ...simpleRows].join(""));

  return table("", [row("", [td("", `[h1]Characteristics[/h1]${table("border=1", "[tr][th]Attribute[/th][th]Value[/th][th]Spent :ep:[/th][/tr]" + attrRows)}`), td(), td(), td("valign=top", sidebarTable)])]);
};

const mod = (val: number): string => val === 0 ? "0" : val > 0 ? `[color=mediumseagreen]+${val}[/color]` : `[color=tomato]${val}[/color]`;

const bbcode_arm = (hero: HeroProfile): string =>
  Object.entries(hero.armor)
    .map(([dmg_type, arm]) =>
      Object.entries(arm as Record<string, [number, number, number]>)
        .filter(([, val]) => Math.abs(val[0]) > 0 || Math.abs(val[1]) > 0 || Math.abs(val[2]) > 0)
        .map(([atk_type, val]) => row("", [td("", size12(dmg_type)), td("align=center", size12(atk_type)), td("align=center", size12(`${mod(val[0])} / ${mod(val[1])} / ${mod(val[2])}`))]))
        .join(""),
    )
    .join("");

const armor = (hero: HeroProfile): string => {
  const header = row("", [th("", size12("Damage type")), th("", size12("Attack type")), th("", size12("Armor (r)"))]);
  return table("", [row("", [td("valign=top", `[h1]Armor[/h1]${table("border=1", header + bbcode_arm(hero))}`)])]);
};

const parries = (hero: HeroProfile): string => {
  const hattr = hero.attributes;
  const header = row("", [th("", "Attack type"), th("", "Attributes"), th("", "Defence")]);
  const dataRows = PARRIES.map(({ name, attr1, attr2 }) => {
    const defence = hattr[attr1].effective_value * 2 + hattr[attr2].effective_value;
    return row("", [td("", name), td("align=center", `${attr1},${attr2}`), td("align=center", String(defence))]);
  });
  return `[h1]Standard Parries[/h1]${table("border=1", header + dataRows.join(""))}  [size=10]used when no skill is available or set[/size]`;
};

const initiative = (hero: HeroProfile) => {
  const hattr = hero.attributes;
  const standardDefence = hattr.ag.effective_value * 2 + hattr.pe.effective_value + hattr.ini.effective_value;
  const header = row("", [th("", "Skill"), th("", "Attributes"), th("", "Initiative")]);
  const standardRow = row("", [td("", "Standard (no skill)"), td("align=center", "ag,pe"), td("align=center", String(standardDefence))]);
  const skillRows = hero.skills
    .filter((x) => x.type === "initiative")
    .map((skill) => {
      const m = skill.initiativeAttr.match(/[a-z]{2}/gi)! as AttrKey[];
      const attr1 = hattr[m[0]];
      const attr2 = hattr[m[1]];
      const defence = attr1.effective_value * 2 + attr2.effective_value + skill.effectiveRank * 2 + hattr.ini.effective_value;
      const colorAttr = skill.color ? ` color=${skill.color}` : "";
      return row("", [td("", `[skill:"${skill.name}"${colorAttr} size=12]`), td("align=center", skill.initiativeAttr), td("align=center", String(defence))]);
    })
    .join("");
  return `[h1]Initiative[/h1]${table("border=1", header + standardRow + skillRows)}`;
};

const skills = (hero: HeroProfile) => {
  const header = row("", [th("align=left", "Name"), th("", "Level"), th("", "MP Cost"), th("", "Targets"), th("colspan=2", "Spent :gold: / :ep:")]);
  const skillRows = hero.skills
    .map((skill) => {
      const erank = skill.effectiveRank !== skill.rank ? "[" + skill.effectiveRank + "]" : "";
      const pos_mark = skill.maxAffected && skill.isOnePos ? "&sup1;" : "";
      const mp = skill.mpCost != 0 ? String(skill.mpCost) : "";
      const color_affect = skill.type.match(/attack|degradation/) ? "tomato" : "mediumseagreen";
      const colorAttr = skill.color ? ` color=${skill.color}` : "";
      return row("", [
        td("", `[skill:"${skill.name}"${colorAttr} size=12]`),
        td("align=center", size12(`${skill.rank} [url=" "]${erank}[/url]`)),
        td("align=center", size12(`[color=dodgerblue]${mp}[/color]`)),
        td("align=center", size12(`[color=${color_affect}]${skill.maxAffected}${pos_mark}[/color]`)),
        td("align=right", formatNumber(skill.totalTrainingCostGold)),
        td("align=right", formatNumber(skill.totalTrainingCostEp)),
      ]);
    })
    .join("");
  return `[h1]Skills[/h1]${table("border=1", header + skillRows)}  [size=10]1 - in one position[/size]`;
};

const gear = (hero: HeroProfile) => {
  if (!hero.items.length) return "";
  const counter: Record<string, number> = {};

  const oneItem = (itm: (typeof hero.items)[number]) => {
    let slot = itm.slot[0].toUpperCase() + itm.slot.substring(1);
    if (["medal", "ring", "pocket"].some((x) => itm.slot.includes(x))) {
      const n = (counter[itm.slot] = (counter[itm.slot] || 0) + 1);
      slot = `${slot} #${n}`;
    }
    const enchant = itm.enchanting.length ? " &nbsp;" + itm.enchanting.join("") : "";
    const item = itm.name && itm.isUnique ? `[i][item:"${itm.name}" color=#22CC22][/i]` : itm.name ? "[item:" + itm.name + "]" : "";
    return row("", [td("", slot), td("", item + itm.uses + enchant)]);
  };

  const nonPocketItems = hero.items
    .filter((x) => !x.slot.includes("pocket"))
    .map(oneItem)
    .join("");
  const pocketItems = hero.items
    .filter((x) => x.slot.includes("pocket"))
    .map(oneItem)
    .join("");

  return "[h1]Equipment[/h1]" + table("", [row("", [td("valign=top", table("border=1", row("", [th("align=left", "Slot"), th("", "Item")]) + nonPocketItems)), td("valign=top", table("border=1", row("", [th("align=left", "Pocket items")]) + pocketItems))])]);
};

export function heroProfileToBBCode(hero: HeroProfile): string {
  return [title, characteristics, (h: HeroProfile) => table("", [row("", [td("", armor(h)), td(), td(), td("valign=top", parries(h))])]), initiative, skills, gear].map((f) => f(hero).trim()).join("");
}
