import type { HeroSkill } from "@common/parsing/parse-hero-skill";
import type { HeroProfile } from "./hero-profile";
import { parseHeroSkill } from "./hero-skill";
import { heroProfileToBBCode } from "./profile-template";

export function parseSkillRows(skillRows: HTMLTableRowElement[]): HeroSkill[] {
  const skills: HeroSkill[] = [];

  for (let i = 0; i < skillRows.length; i++) {
    const canUndo = Boolean(skillRows[i].querySelector('input[name*="undo"]'));
    const skill = parseHeroSkill(skillRows[i], canUndo);
    if (skill && skill.rank > 0) {
      skills.push(skill);
    }
  }

  return skills;
}

export function generateFullBBCode(hero: HeroProfile): string {
  const stamp = generateTimestamp();
  return `${heroProfileToBBCode(hero).trim()}\n[size=9]\nGenerated: ${stamp} - [url=@downloadURL]Profile Export[/url] @version[/size]`;
}

function generateTimestamp(): string {
  const d = new Date();
  return [d.getDate(), d.getMonth() + 1, d.getFullYear() % 100].map((x) => ("" + x).padStart(2, "0")).join(".");
}
