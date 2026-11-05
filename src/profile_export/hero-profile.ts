import type { ParsedBonusTables } from "@common/parsing/parse-hero-attributes";
import type { HeroSkill } from "@common/parsing/parse-hero-skill";

export type Item = {
  name: string;
  uses: string;
  slot: string;
  enchanting: string[];
  isUnique: boolean;
};

export type HeroAttribute = {
  name: string;
  value: number;
  effective_value: number;
  training_cost: number;
};

const createHeroAttribute = (name: string): HeroAttribute => ({
  name,
  value: 0,
  effective_value: 0,
  training_cost: 0,
});

export type HeroProfile = {
  name: string;
  level: number;
  race: string;
  char_class: string;
  subclass: string;
  actions: number;
  initiative: string;
  reset_points: number;
  fame: number;
  gender: string;
  title: string;
  skills: HeroSkill[];
  hasUpperCoins: boolean;
  attributes: {
    st: HeroAttribute;
    co: HeroAttribute;
    in: HeroAttribute;
    dx: HeroAttribute;
    ch: HeroAttribute;
    ag: HeroAttribute;
    pe: HeroAttribute;
    wi: HeroAttribute;
    hp: HeroAttribute;
    hhp: HeroAttribute;
    mp: HeroAttribute;
    rmp: HeroAttribute;
    ini: HeroAttribute;
    act: HeroAttribute;
  };
  armor: ParsedBonusTables["armor"];
  items: Item[];
  modifiers: Record<string, unknown>;
  bonus_damage: ParsedBonusTables["damage"];
  bonus_attack: ParsedBonusTables["attackBonuses"];
  bonus_defence: ParsedBonusTables["defenceBonuses"];
};

export function calculateEPUsed(hero: HeroProfile): number {
  const skillCost = hero.skills.reduce((acc, s) => acc + s.totalTrainingCostEp, 0);
  const attrCost = Object.values(hero.attributes).reduce((acc, a) => acc + a.training_cost, 0);
  return skillCost + attrCost;
}

export function createEmptyHeroProfile(): HeroProfile {
  return {
    name: "",
    level: 1,
    race: "",
    char_class: "",
    subclass: "",
    actions: 1,
    initiative: "",
    reset_points: 0,
    fame: 0,
    gender: "M",
    title: "",
    skills: [],
    hasUpperCoins: false,
    attributes: {
      st: createHeroAttribute("Strength"),
      co: createHeroAttribute("Constitution"),
      in: createHeroAttribute("Intelligence"),
      dx: createHeroAttribute("Dexterity"),
      ch: createHeroAttribute("Charisma"),
      ag: createHeroAttribute("Agility"),
      pe: createHeroAttribute("Perception"),
      wi: createHeroAttribute("Willpower"),
      hp: createHeroAttribute("HP"),
      hhp: createHeroAttribute("HHP"),
      mp: createHeroAttribute("MP"),
      rmp: createHeroAttribute("RMP"),
      ini: createHeroAttribute("Initiative"),
      act: createHeroAttribute("Actions"),
    },
    armor: {},
    items: [],
    modifiers: {},
    bonus_damage: {},
    bonus_attack: {},
    bonus_defence: {},
  };
}

export function sortSkills(skills: HeroSkill[]): HeroSkill[] {
  return [...skills].sort((a, b) => {
    let cmp = b.effectiveRank - a.effectiveRank;
    if (cmp === 0) cmp = b.totalTrainingCostEp - a.totalTrainingCostEp;
    if (cmp === 0) cmp = a.name.localeCompare(b.name);
    return cmp;
  });
}
