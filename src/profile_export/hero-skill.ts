import { evalAffected } from "@common/math/eval";
import { applyMPCost, applyTrainingCost, parseSkillInfo, parseSkillRow, type HeroSkill } from "@common/parsing/parse-hero-skill";
import { match } from "@common/util/match";

export type { HeroSkill };

export function parseHeroSkill(row_html: HTMLTableRowElement, can_undo: boolean): HeroSkill | null {
  const parsed = parseSkillRow(row_html);
  if (!parsed) return null;

  if (!can_undo && parsed.rank === 1) {
    parsed.initialRank = 1;
  }

  applyTrainingCost(parsed);
  return parsed;
}

export function applySkillInfo(skill: HeroSkill, data: string): boolean {
  try {
    parseSkillInfo(skill, data);
    applyMPCost(skill);

    // Use safe arithmetic evaluation instead of eval()
    if (skill.hero && (skill.maxAffected.includes("% of your hero`s level") || skill.maxAffected.includes("% of your skill rank"))) {
      skill.maxAffected = evalAffected(skill.maxAffected, skill.hero.level, skill.effectiveRank);
    }

    match<{ type: string; target: string }>({
      type: skill.type,
      target: skill.target,
    })
      .with(
        (v) => v.type === "attack" || v.type === "degradation",
        () => {
          if (skill.target.indexOf("one enemy") > -1) skill.maxAffected = "1";
        },
      )
      .with(
        (v) => v.type === "improvement" || v.type === "healing",
        () => {
          if (skill.target.indexOf("one team") > -1) skill.maxAffected = "1";
        },
      )
      .otherwise(() => {});

    return true;
  } catch (ex) {
    console.error(`HeroSkill.applySkillInfo error for "${skill.name || "unknown"}":`, ex);
    return false;
  }
}
