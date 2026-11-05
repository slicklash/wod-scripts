import { add } from "@common/dom/add";
import { attr } from "@common/dom/attr";
import { textContent } from "@common/dom/text-content";
import { textNormalized } from "@common/dom/text-normalized";
import type { SkillCostCategory } from "@common/math/cost";
import { calculateSkillCost } from "@common/math/cost";
import { parseEffectiveValue } from "@common/parsing/parse-effective-value";
import { match } from "@common/util/match";

export type SkillUsage = "in_round" | "pre_round" | "both" | "neither";

export type HeroSkill = {
  name: string;
  type: string;

  rank: number;
  initialRank: number;
  effectiveRank: number;

  costCategory: SkillCostCategory;
  usage: SkillUsage;
  target: string;
  maxAffected: string;
  isOnePos: boolean;

  mpBase: number;
  mpCost: number;

  item: string;
  skillClass: string;

  initiativeAttr: string;
  attackType: string;
  attackAttr: string;
  defenceAttr: string;
  effectAttr: string;

  totalTrainingCostEp: number;
  totalTrainingCostGold: number;

  url: string;
  color: string;

  hero?: { level: number };
  onDone?: () => void;
};

/**
 * Parse a skill row HTML element and return a HeroSkill.
 */
export function parseSkillRow(row_html: HTMLTableRowElement): HeroSkill | null {
  const link = row_html.cells[1]?.querySelector("a");
  if (!link) {
    return null;
  }

  const rank_row = row_html.cells[2].querySelector("tr"),
    rank = rank_row ? parseEffectiveValue(textContent(rank_row.cells[1])) : [0, 0],
    title = decodeURIComponent(link.href).match(/name=([a-z\- :()'!+]+)/i);

  let level: SkillCostCategory = "secondary";
  let color = "";

  if (title && rank[0] !== 0) {
    const name = title[1].replace(/\+/g, " ");
    level = name.includes("Talent:") ? "talent" : "secondary";

    if (level !== "talent") {
      switch (attr(link, "class")) {
        case "skill_primary":
          level = "primary";
          break;
        case "skill_secondary":
          color = "lightslategray";
          break;
        case "skill_foreign":
          level = "exceptional";
          color = "#858585";
          break;
      }
    }

    const [initial, effective] = rank;
    return {
      name,
      type: "",
      rank: initial,
      initialRank: 0,
      effectiveRank: effective,
      costCategory: level,
      usage: "neither",
      target: "",
      maxAffected: "",
      isOnePos: false,
      mpBase: 0,
      mpCost: 0,
      item: "",
      skillClass: "",
      initiativeAttr: "",
      attackType: "",
      attackAttr: "",
      defenceAttr: "",
      effectAttr: "",
      totalTrainingCostEp: 0,
      totalTrainingCostGold: 0,
      url: link.href,
      color,
    };
  }

  return {
    name: "",
    type: "",
    rank: 0,
    initialRank: 0,
    effectiveRank: 0,
    costCategory: level,
    usage: "neither",
    target: "",
    maxAffected: "",
    isOnePos: false,
    mpBase: 0,
    mpCost: 0,
    item: "",
    skillClass: "",
    initiativeAttr: "",
    attackType: "",
    attackAttr: "",
    defenceAttr: "",
    effectAttr: "",
    totalTrainingCostEp: 0,
    totalTrainingCostGold: 0,
    url: "",
    color,
  };
}

/**
 * Parse skill info page HTML and populate HeroSkill detail fields.
 */
export function parseSkillInfo(skill: HeroSkill, html: string): HeroSkill {
  const skill_info = add<HTMLDivElement>("div");
  skill_info.innerHTML = html;
  const form = skill_info.querySelector("form");
  if (!form) return skill;

  const table_rows = Array.from(form.querySelectorAll(".content_table table tr")) as HTMLTableRowElement[];

  for (let i = 0, cnt = table_rows.length; i < cnt; i++) {
    const property = textNormalized(textContent(table_rows[i].cells[0]));
    const value = textNormalized(textContent(table_rows[i].cells[1]));

    match<{ property: string; value: string }>({ property, value })
      .with({ property: "type" }, (v) => {
        skill.type = v.value;
      })
      .with({ property: "may be used" }, (v) => {
        const hasInRound = v.value.indexOf("in round") > -1;
        const hasPreRound = v.value.indexOf("in pre round") > -1;
        if (hasInRound && hasPreRound) {
          skill.usage = "both";
        } else if (hasInRound) {
          skill.usage = "in_round";
        } else if (hasPreRound) {
          skill.usage = "pre_round";
        } else {
          skill.usage = "neither";
        }
      })
      .with({ property: "target" }, (v) => {
        skill.target = v.value;
        skill.isOnePos = v.value.indexOf("one position") > -1;
      })
      .with(
        (v) => v.property === "Max. characters affected" || v.property === "Max. opponents affected",
        (v) => {
          skill.maxAffected = v.value;
        },
      )
      .with({ property: "Mana points cost" }, (v) => {
        if (v.value !== "-") {
          const mp = v.value.match(/([0-9]+) \(([0-9]+)\)/);
          if (mp) {
            skill.mpBase = Number(mp[2]);
          }
        }
      })
      .with({ property: "item" }, (v) => {
        skill.item = v.value;
      })
      .with({ property: "skill class" }, (v) => {
        skill.skillClass = v.value;
      })
      .with({ property: "attack type" }, (v) => {
        skill.attackType = v.value;
      })
      .with({ property: "attack" }, (v) => {
        skill.attackAttr = v.value;
      })
      .with({ property: "damage" }, (v) => {
        skill.effectAttr = v.value;
      })
      .with({ property: "initiative" }, (v) => {
        skill.initiativeAttr = v.value;
      })
      .with({ property: "defense" }, (v) => {
        skill.defenceAttr = v.value;
      })
      .with({ property: "healing" }, (v) => {
        skill.effectAttr = v.value;
      })
      .otherwise(() => {});
  }

  return skill;
}

/**
 * Compute and apply mp_cost to a HeroSkill based on effectiveRank.
 */
export function applyMPCost(skill: HeroSkill): void {
  if (skill.mpBase > 0) {
    skill.mpCost = Math.floor(skill.mpBase * (0.8 + 0.1 * skill.effectiveRank));
  }
}

/**
 * Compute and apply training cost to a HeroSkill.
 */
export function applyTrainingCost(skill: HeroSkill): void {
  if (!(skill.rank === 1 && skill.initialRank === 1)) {
    const cost = calculateSkillCost(skill);
    skill.totalTrainingCostEp = cost.ep;
    skill.totalTrainingCostGold = cost.gold;
  }
}
