import { describe, expect, it } from "vitest";
import { applyMPCost, applyTrainingCost, parseSkillInfo, parseSkillRow, type HeroSkill } from "./parse-hero-skill";

function getRow(html: string): HTMLTableRowElement {
  const table = document.createElement("table");
  table.innerHTML = `<tbody>${html}</tbody>`;
  return table.querySelector("tr")! as HTMLTableRowElement;
}

describe("parseSkillRow", () => {
  it("should return null when no link found", () => {
    const row = getRow(`
      <tr class="row0">
        <td>1</td>
        <td>No link here</td>
        <td>0 [0]</td>
      </tr>
    `);
    const result = parseSkillRow(row);
    expect(result).toBeNull();
  });

  it("should parse a primary skill row", () => {
    const row = getRow(`
      <tr class="row0">
        <td>1</td>
        <td><a href="/wod/spiel/hero/skill.php?menukey=hero_skills&name=Fire+Ball" class="skill_primary">Fire Ball</a></td>
        <td><table><tbody><tr><td>Rank</td><td>5 [7]</td></tr></tbody></table></td>
        <td>attack</td>
        <td>100</td>
        <td>80</td>
      </tr>
    `);
    const result = parseSkillRow(row);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Fire Ball");
    expect(result!.rank).toBe(5);
    expect(result!.effectiveRank).toBe(7);
    expect(result!.costCategory).toBe("primary");
  });

  it("should parse a secondary skill row", () => {
    const row = getRow(`
      <tr class="row1">
        <td>2</td>
        <td><a href="/wod/spiel/hero/skill.php?menukey=hero_skills&name=Heal" class="skill_secondary">Heal</a></td>
        <td><table><tbody><tr><td>Rank</td><td>3 [3]</td></tr></tbody></table></td>
        <td>healing</td>
        <td>50</td>
        <td>40</td>
      </tr>
    `);
    const result = parseSkillRow(row);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Heal");
    expect(result!.rank).toBe(3);
    expect(result!.costCategory).toBe("secondary");
    expect(result!.color).toBe("lightslategray");
  });

  it("should parse a talent skill row", () => {
    const row = getRow(`
      <tr class="row0">
        <td>3</td>
        <td><a href="/wod/spiel/hero/skill.php?menukey=hero_skills&name=Talent:+Lucky" class="skill_foreign">Talent: Lucky</a></td>
        <td><table><tbody><tr><td>Rank</td><td>1 [1]</td></tr></tbody></table></td>
        <td>passive</td>
        <td>20</td>
        <td>10</td>
      </tr>
    `);
    const result = parseSkillRow(row);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Talent: Lucky");
    expect(result!.costCategory).toBe("talent");
    expect(result!.rank).toBe(1);
  });

  it("should return data with rank 0 for untrained skills", () => {
    const row = getRow(`
      <tr class="row0">
        <td>4</td>
        <td><a href="/wod/spiel/hero/skill.php?menukey=hero_skills&name=Something" class="skill_primary">Something</a></td>
        <td><table><tbody><tr><td>Rank</td><td>0 [0]</td></tr></tbody></table></td>
        <td>-</td>
        <td>0</td>
        <td>0</td>
      </tr>
    `);
    const result = parseSkillRow(row);
    // rank 0 returns data but with rank=0 (caller filters these out)
    expect(result).not.toBeNull();
    expect(result!.rank).toBe(0);
  });
});

describe("applyTrainingCost", () => {
  it("should apply training cost for rank 2 primary", () => {
    const skill = {
      rank: 2,
      initialRank: 0,
      costCategory: "primary" as const,
      totalTrainingCostEp: 0,
      totalTrainingCostGold: 0,
    } as HeroSkill;
    applyTrainingCost(skill);
    expect(skill.totalTrainingCostEp).toBe(40);
    expect(skill.totalTrainingCostGold).toBe(36);
  });

  it("should skip cost for rank 1 initialRank 1", () => {
    const skill = {
      rank: 1,
      initialRank: 1,
      costCategory: "primary" as const,
      totalTrainingCostEp: 0,
      totalTrainingCostGold: 0,
    } as HeroSkill;
    applyTrainingCost(skill);
    expect(skill.totalTrainingCostEp).toBe(0);
    expect(skill.totalTrainingCostGold).toBe(0);
  });
});

describe("parseSkillInfo", () => {
  function createSkillHtml(properties: Record<string, string>): string {
    const rows = Object.entries(properties)
      .map(([prop, val]) => `<tr><td>${prop}</td><td>${val}</td></tr>`)
      .join("");
    return `
      <form>
        <div class="content_table">
          <table>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </form>`;
  }

  it("should parse attack skill info", () => {
    const html = createSkillHtml({
      type: "attack",
      "may be used": "in round",
      target: "one enemy in one position",
      "Max. opponents affected": "5",
      "Mana points cost": "100 (80)",
      "skill class": "fire",
      "attack type": "ranged",
      attack: "ag,dx",
      damage: "co,pe",
    });
    const skill = {
      type: "",
      usage: "neither" as const,
      target: "",
      isOnePos: false,
      maxAffected: "",
      mpBase: 0,
      mpCost: 0,
      item: "",
      skillClass: "",
      attackType: "",
      attackAttr: "",
      initiativeAttr: "",
      defenceAttr: "",
      effectAttr: "",
    } as HeroSkill;
    parseSkillInfo(skill, html);
    expect(skill.type).toBe("attack");
    expect(skill.usage).toBe("in_round");
    expect(skill.target).toBe("one enemy in one position");
    expect(skill.isOnePos).toBe(true);
    expect(skill.maxAffected).toBe("5");
    expect(skill.mpBase).toBe(80);
    expect(skill.skillClass).toBe("fire");
    expect(skill.attackType).toBe("ranged");
    expect(skill.attackAttr).toBe("ag,dx");
    expect(skill.effectAttr).toBe("co,pe");
  });

  it("should parse healing skill info", () => {
    const html = createSkillHtml({
      type: "healing",
      "may be used": "in round and in pre round",
      target: "one team member in one position",
      "Max. characters affected": "3",
      "Mana points cost": "50 (40)",
      healing: "wi,pe",
    });
    const skill = {
      type: "",
      usage: "neither" as const,
      target: "",
      isOnePos: false,
      maxAffected: "",
      mpBase: 0,
      mpCost: 0,
      item: "",
      skillClass: "",
      attackType: "",
      attackAttr: "",
      initiativeAttr: "",
      defenceAttr: "",
      effectAttr: "",
    } as HeroSkill;
    parseSkillInfo(skill, html);
    expect(skill.type).toBe("healing");
    expect(skill.usage).toBe("both");
    expect(skill.effectAttr).toBe("wi,pe");
  });

  it("should handle mp cost of '-'", () => {
    const html = createSkillHtml({
      type: "passive",
      "Mana points cost": "-",
    });
    const skill = {
      type: "",
      usage: "neither" as const,
      target: "",
      isOnePos: false,
      maxAffected: "",
      mpBase: 0,
      mpCost: 0,
      item: "",
      skillClass: "",
      attackType: "",
      attackAttr: "",
      initiativeAttr: "",
      defenceAttr: "",
      effectAttr: "",
    } as HeroSkill;
    parseSkillInfo(skill, html);
    expect(skill.mpBase).toBe(0);
  });

  it("should return unchanged skill when no form found", () => {
    const skill = { type: "" } as HeroSkill;
    parseSkillInfo(skill, "<div>no form here</div>");
    expect(skill.type).toBe("");
  });

  it("should parse initiative skill with initiative property", () => {
    const html = createSkillHtml({
      type: "initiative",
      initiative: "ag,pe",
    });
    const skill = {
      type: "",
      usage: "neither" as const,
      target: "",
      isOnePos: false,
      maxAffected: "",
      mpBase: 0,
      mpCost: 0,
      item: "",
      skillClass: "",
      attackType: "",
      attackAttr: "",
      initiativeAttr: "",
      defenceAttr: "",
      effectAttr: "",
    } as HeroSkill;
    parseSkillInfo(skill, html);
    expect(skill.type).toBe("initiative");
    expect(skill.initiativeAttr).toBe("ag,pe");
  });

  it("should parse defense property", () => {
    const html = createSkillHtml({
      type: "improvement",
      defense: "ag,dx",
    });
    const skill = {
      type: "",
      usage: "neither" as const,
      target: "",
      isOnePos: false,
      maxAffected: "",
      mpBase: 0,
      mpCost: 0,
      item: "",
      skillClass: "",
      attackType: "",
      attackAttr: "",
      initiativeAttr: "",
      defenceAttr: "",
      effectAttr: "",
    } as HeroSkill;
    parseSkillInfo(skill, html);
    expect(skill.defenceAttr).toBe("ag,dx");
  });

  it("should parse item property", () => {
    const html = createSkillHtml({
      type: "attack",
      item: "Staff of Fire",
    });
    const skill = {
      type: "",
      usage: "neither" as const,
      target: "",
      isOnePos: false,
      maxAffected: "",
      mpBase: 0,
      mpCost: 0,
      item: "",
      skillClass: "",
      attackType: "",
      attackAttr: "",
      initiativeAttr: "",
      defenceAttr: "",
      effectAttr: "",
    } as HeroSkill;
    parseSkillInfo(skill, html);
    expect(skill.item).toBe("Staff of Fire");
  });

  it("should handle 'Max. characters affected' (plural form)", () => {
    const html = createSkillHtml({
      type: "improvement",
      "Max. characters affected": "10",
    });
    const skill = {
      type: "",
      usage: "neither" as const,
      target: "",
      isOnePos: false,
      maxAffected: "",
      mpBase: 0,
      mpCost: 0,
      item: "",
      skillClass: "",
      attackType: "",
      attackAttr: "",
      initiativeAttr: "",
      defenceAttr: "",
      effectAttr: "",
    } as HeroSkill;
    parseSkillInfo(skill, html);
    expect(skill.maxAffected).toBe("10");
  });
});

describe("applyMPCost", () => {
  it("should compute mp_cost from mpBase and effectiveRank", () => {
    const skill = {
      mpBase: 80,
      effectiveRank: 5,
      mpCost: 0,
    } as HeroSkill;
    applyMPCost(skill);
    // Math.floor(80 * (0.8 + 0.1 * 5)) = Math.floor(80 * 1.3) = 104
    expect(skill.mpCost).toBe(104);
  });

  it("should skip when mpBase is 0", () => {
    const skill = {
      mpBase: 0,
      effectiveRank: 5,
      mpCost: 0,
    } as HeroSkill;
    applyMPCost(skill);
    expect(skill.mpCost).toBe(0);
  });
});
