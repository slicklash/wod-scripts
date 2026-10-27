import { formatNumber } from "@common/text/format-number";
import type { Hero } from "./hero";

// prettier-ignore
const table = (props: string, rows: string[]): string => `[table ${props}]${rows.join("")}[/table]`;
// prettier-ignore
const row = (props: string, cells: string[]): string => `[tr ${props}]${cells.join("")}[/tr]`;
// prettier-ignore
// const th = (props: string, content: string): string => `[th ${props}]${content}[/th]`;
// prettier-ignore
const td = (props: string = "", content: string = ""): string => `[td ${props}]${content}[/td]`;

const title = (hero: Hero): string =>
  `[size=12][hero:${hero.name}]${hero.title && ", [i]" + hero.title + "[/i]"} - [class:${hero.race}] [class:${hero.char_class}] - Level ${hero.level}[/size]`;

const bbcode_attr = (a): string => {
  const efval =
    a.effective_value !== a.value ? " [" + a.effective_value + "]" : "";
  return `[tr][td][size=12]${a.name}[/size][/td][td align=center][size=12]${a.value}[url=" "]${efval}[/url][/size][/td][td align=right][size=12]${formatNumber(a.training_cost)}[/size][/td][/tr]`;
};

const characteristics = (hero: Hero): string =>
  `[h1]Characteristics[/h1][table][tr][td][table border=1]
[tr][th]Attribute[/th][th]Value[/th][th]Spent :ep:[/th][/tr]
${Object.values(hero.attributes).slice(0, 8).map(bbcode_attr).join("")}
[/table][/td]
[td][/td][td][/td]
[td valign=top][table border=1][tr][td][color=mediumseagreen][size=12]HP[/color][/td][td][size=12]${hero.attributes.hp.value} [url=" "][${hero.attributes.hp.effective_value}][/url][/size][/td]
[td][color=mediumseagreen][size=12]HHP[/color][/td][td][size=12]${hero.attributes.hhp.value} [url=" "][${hero.attributes.hhp.effective_value}][/url][/size][/td]
[/tr]
[tr][td][color=dodgerblue][size=12]MP[/color][/td][td][size=12]${hero.attributes.mp.value} [url=" "][${hero.attributes.mp.effective_value}][/url][/size][/td]
[td][color=dodgerblue][size=12]RMP[/color][/td][td][size=12]${hero.attributes.rmp.value} [url=" "][${hero.attributes.rmp.effective_value}][/url][/size][/td]
[/tr]
[tr][td colspan=2][size=12]Actions[/size][/td][td colspan=2][size=12]${hero.attributes.act.value} [url=" "][${hero.attributes.act.effective_value}][/url][/size][/td][/tr]
[tr][td colspan=2][size=12]Initiative[/size][/td][td colspan=2][size=12]${hero.attributes.ini.value} [url=" "][${hero.attributes.ini.effective_value}][/url][/size][/td][/tr]
[tr][td colspan=2][size=12]Reset points[/size][/td][td colspan=2][size=12]${hero.reset_points}[/size][/td][/tr]
[tr][td colspan=2][size=12]Gender[/size][/td][td colspan=2][size=12]${hero.gender}[/size][/td][/tr]
[tr][td colspan=2][size=12]Fame[/size][/td][td colspan=2][size=12]${formatNumber(hero.fame)} :fame:[/size][/td][/tr]
[tr][td colspan=2][size=12]:ep: used[/size][/td][td colspan=2][size=12]≈ ${formatNumber(hero.ep_used)}[/size][/td][/tr]
[/table][/td][/tr][/table]`;

// prettier-ignore
const mod = (val) => val === 0 ? "0" : val > 0 ? `[color=mediumseagreen]+${val}[/color]` : `[color=tomato]${val}[/color]`;
const bbcode_arm = (hero: Hero): string =>
  Object.entries(hero.armor)
    .map(([dmg_type, arm]) =>
      Object.entries(arm as Record<string, [number, number, number]>)
        .filter(
          ([, val]) =>
            Math.abs(val[0]) > 0 ||
            Math.abs(val[1]) > 0 ||
            Math.abs(val[2]) > 0,
        )
        .map(
          ([atk_type, val]) =>
            `[tr][td][size=12]${dmg_type}[/size][/td][td align=center][size=12]${atk_type}[/size][/td]
[td align=center][size=12]${mod(val[0])} / ${mod(val[1])} / ${mod(val[2])} [/size][/td][/tr]`,
        )
        .join(""),
    )
    .join("");

const armor = (hero: Hero): string =>
  `[table][tr][td valign=top][h1]Armor[/h1][table border=1]
[tr][th][size=12]Damage type[/size][/th][th][size=12]Attack type[/size][/th][th][size=12]Armor (r)[/size][/th][/tr]${bbcode_arm(hero)}[/table]`;

const parries = (hero: Hero): string => {
  const hattr = hero.attributes;
  return `[h1]Standard Parries[/h1][table border=1][tr][th]Attack type[/th][th]Attributes[/th][th]Defence[/th][/tr]
[tr][td]Melee[/td][td align=center]ag,dx[/td][td align=center]${hattr.ag.effective_value * 2 + hattr.dx.effective_value}[/td][/tr]
[tr][td]Ranged[/td][td align=center]ag,pe[/td][td align=center]${hattr.ag.effective_value * 2 + hattr.pe.effective_value}[/td][/tr]
[tr][td]Spell[/td][td align=center]wi,in[/td][td align=center]${hattr.wi.effective_value * 2 + hattr["in"].effective_value}[/td][/tr]
[tr][td]Social[/td][td align=center]wi,ch[/td][td align=center]${hattr.wi.effective_value * 2 + hattr.ch.effective_value}[/td][/tr]
[tr][td]Ambush[/td][td align=center]pe,in[/td][td align=center]${hattr.pe.effective_value * 2 + hattr["in"].effective_value}[/td][/tr]
[tr][td]Force of Nature[/td][td align=center]wi,ag[/td][td align=center]${hattr.wi.effective_value * 2 + hattr.ag.effective_value}[/td][/tr]
[tr][td]Activate trap[/td][td align=center]pe,ag[/td][td align=center]${hattr.pe.effective_value * 2 + hattr.ag.effective_value}[/td][/tr]
[tr][td]Explosion or Blast[/td][td align=center]ag,pe[/td][td align=center]${hattr.ag.effective_value * 2 + hattr.pe.effective_value}[/td][/tr]
[tr][td]Disease[/td][td align=center]co,ch[/td][td align=center]${hattr.co.effective_value * 2 + hattr.ch.effective_value}[/td][/tr]
[tr][td]Curse[/td][td align=center]ch,wi[/td][td align=center]${hattr.ch.effective_value * 2 + hattr.wi.effective_value}[/td][/tr]
[/table]  [size=10]used when no skill is available or set[/size][/td][/tr][/table]`;
};

const initiative = (hero: Hero) =>
  `[h1]Initiative[/h1][table border=1]
[tr][th]Skill[/th][th]Attributes[/th][th]Initiative[/th][/tr]
[tr][td]Standard (no skill)[/td][td align=center]ag,pe[/td][td align=center]${hero.attributes.ag.effective_value * 2 + hero.attributes.pe.effective_value + hero.attributes.ini.effective_value}[/td][/tr]
${hero.skills
  .filter((x) => x.type === "initiative")
  .map((skill) => {
    const m = skill.initiative_attr.match(/[a-z]{2}/gi)!;
    const attr1 = hero.attributes[m[0]];
    const attr2 = hero.attributes[m[1]];
    return (
      // prettier-ignore
      '[tr][td][skill:"' + skill.name + '"' + (skill.color ? " color=" + skill.color : "") + " size=12][/td][td align=center]" +
      skill.initiative_attr +
      "[/td][td align=center]" + (attr1.effective_value * 2 + attr2.effective_value + skill.effective_rank * 2 + hero.attributes.ini.effective_value) + "[/td][/tr]"
    );
  })
  .join("")}[/table]`;

const skills = (hero: Hero) => {
  return (
    "[h1]Skills[/h1][table border=1][tr][th align=left]Name[/th][th]Level[/th][th]MP Cost[/th][th]Targets[/th][th colspan=2]Spent :gold: / :ep:[/th][/tr]" +
    hero.skills
      .map((skill) => {
        // prettier-ignore
        const erank = skill.effective_rank !== skill.rank ? "[" + skill.effective_rank + "]" : "";
        const pos_mark = skill.max_affected && skill.one_pos ? "&sup1;" : "";
        const mp = skill.mp_cost != 0 ? skill.mp_cost : "";
        // prettier-ignore
        const color_affect = skill.type.match(/attack|degradation/) ? "tomato" : "mediumseagreen";
        return `[tr][td][skill:"${skill.name}" ${skill.color ? "color=" + skill.color : ""} size=12][/td]
[td align=center][size=12]${skill.rank} [url=" "]${erank}[/url][/size][/td]
[td align=center][size=12][color=dodgerblue]${mp}[/color][/size][/td]
[td align=center][size=12][color=${color_affect}]${skill.max_affected}${pos_mark}[/color][/size][/td]
[td align=right]${formatNumber(skill.training_cost_gold)}[/td]
[td align=right]${formatNumber(skill.training_cost_ep)}[/td][/tr]`;
      })
      .join("") +
    "[/table]  [size=10]1 - in one position[/size]"
  );
};

const gear = (hero: Hero) => {
  if (!hero.items.length) return "";
  const counter = {};
  const oneItem = (itm) => {
    let slot = itm.slot[0].toUpperCase() + itm.slot.substring(1);
    if (["medal", "ring", "pocket"].some((x) => itm.slot.includes(x))) {
      const n = (counter[itm.slot] = (counter[itm.slot] || 0) + 1);
      slot = `${slot} #${n}`;
    }
    // prettier-ignore
    const enchant = itm.enchanting.length ? " &nbsp;" + itm.enchanting.join("") : "";
    const item =
      itm.name && itm.isUnique
        ? `[i][item:"${itm.name}" color=#22CC22][/i]`
        : itm.name
          ? "[item:" + itm.name + "]"
          : "";
    return `[tr][td]${slot}[/td][td]${item + itm.uses + enchant}[/td][/tr]`;
  };
  return (
    "[h1]Equipment[/h1][table][tr][td valign=top][table border=1][tr][th align=left]Slot[/th][th]Item[/th][/tr]" +
    hero.items
      .filter((x) => !x.slot.includes("pocket"))
      .map(oneItem)
      .join("") +
    "[/table][/td][td valign=top][table border=1][tr][th align=left]Pocket items[/th][/tr]" +
    hero.items
      .filter((x) => x.slot.includes("pocket"))
      .map(oneItem)
      .join("") +
    "[/table][/table]"
  );
};

export function toBBCode(hero: Hero): string {
  return [
    title,
    characteristics,
    // prettier-ignore
    (h: Hero) => table("", [row("", [td("", armor(h)), td(), td(), td("valign=top", parries(h))])]),
    initiative,
    skills,
    gear,
  ]
    .map((f) => f(hero).trim())
    .join("");
}
