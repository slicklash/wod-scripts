import { add } from "@common/dom/add";
import { textContent } from "@common/dom/text-content";
import { textNormalized } from "@common/dom/text-normalized";
import { calculateAttributeCost } from "@common/math/cost";
import { parseEffectiveValue } from "@common/parsing/parse-effective-value";
import { match } from "@common/util/match";

const REGEX_ATTR = /^(Strength|Constitution|Intelligence|Dexterity|Charisma|Agility|Perception|Willpower)/;
const REGEX_RACE = /(Borderlander|Dinturan|Gnome|Halfling|Kargashian|Kerasi|Mag Mor|Targeshian|Partan|Tirem Ag|Woodlander) \(/;
const REGEX_CLASS = /(Adventurer|Alchemist|Apprentice|Archer|Barbarian|Bard|Cloud Raider|Cloudraider|Conjuror|Draclin|Drifter|Engineer|Fighter|Gladiator|Hunter|Juggler|Knight|Lightbringer|Mage|Muse|Nieri|Paladin|Priest|Scholar|Shadow Seeker|Shaman|Star Kinder|Warlock|Warlord|Zealot) \(/;

export type ParsedAttribute = {
  rank: number;
  effectiveRank: number;
  totalTrainingCost: number;
};

export type ParsedBonusTables = {
  armor: Record<string, Record<string, [number, number, number]>>;
  damage: Record<string, Record<string, string>>;
  attackBonuses: Record<string, string>;
  defenceBonuses: Record<string, string>;
};

export type ParsedAttributePage = ParsedBonusTables & {
  name: string;
  race: string;
  char_class: string;
  level: number;
  fame: number;
  reset_points: number;
  title: string;
  gender: string;
  attributes: Record<string, ParsedAttribute>;
};

/**
 * Pure function: parses the attributes page HTML and returns structured data.
 * No side effects, no HTTP calls.
 */
export function parseAttributePage(html: string): ParsedAttributePage {
  const page = add<HTMLDivElement>("div", null, html);
  const form = page.querySelector('form[name="the_form"]')!;
  const titleEl = form.querySelector("h1");
  const contentRows = [...form.querySelectorAll<HTMLTableRowElement>(".row0, .row1")];

  const result: ParsedAttributePage = {
    name: "",
    race: "",
    char_class: "",
    level: 1,
    fame: 0,
    reset_points: 0,
    title: "",
    gender: "M",
    attributes: {} as Record<string, ParsedAttribute>,
    armor: {},
    damage: {},
    attackBonuses: {},
    defenceBonuses: {},
  };

  for (const row of contentRows) {
    const cell1 = row.cells[0];
    const property = textNormalized(cell1);

    if (property.match(REGEX_ATTR)) {
      const raceMatch = cell1.innerHTML.match(REGEX_RACE);
      const classMatch = cell1.innerHTML.match(REGEX_CLASS);
      if (raceMatch) result.race = raceMatch[1];
      if (classMatch) result.char_class = classMatch[1];

      const val = row.cells[1].querySelector("tr");
      if (val && val.cells) {
        const attrName = property.toLowerCase().substring(0, 2).replace("de", "dx");
        const efval = parseEffectiveValue(textContent(val.cells[1]));
        result.attributes[attrName] = {
          rank: efval[0],
          effectiveRank: efval[1],
          totalTrainingCost: calculateAttributeCost(efval[0]),
        };
      }
    } else {
      const key = property.toLowerCase();
      const cellText = textContent(row.cells[1]);
      const cell2Text = textContent(row.cells[2]);

      match<{ key: string; cellText: string; cell2Text: string }>({
        key,
        cellText,
        cell2Text,
      })
        .with({ key: "hit points" }, () => {
          const val1 = parseEffectiveValue(cellText);
          const val2 = parseEffectiveValue(cell2Text);
          result.attributes.hp = {
            rank: val1[0],
            effectiveRank: val1[1],
            totalTrainingCost: 0,
          };
          result.attributes.hhp = {
            rank: val2[0],
            effectiveRank: val2[1],
            totalTrainingCost: 0,
          };
        })
        .with({ key: "mana points" }, () => {
          const val1 = parseEffectiveValue(cellText);
          const val2 = parseEffectiveValue(cell2Text);
          result.attributes.mp = {
            rank: val1[0],
            effectiveRank: val1[1],
            totalTrainingCost: 0,
          };
          result.attributes.rmp = {
            rank: val2[0],
            effectiveRank: val2[1],
            totalTrainingCost: 0,
          };
        })
        .with({ key: "actions per round" }, () => {
          const val = parseEffectiveValue(cellText);
          result.attributes.act = {
            rank: val[0],
            effectiveRank: val[1],
            totalTrainingCost: 0,
          };
        })
        .with({ key: "initiative" }, () => {
          const val = parseEffectiveValue(cellText);
          result.attributes.ini = {
            rank: val[0],
            effectiveRank: val[1],
            totalTrainingCost: 0,
          };
        })
        .with(
          (v) => ["hero's level", "fame", "reset points"].includes(v.key),
          (v) => {
            const n = Number(v.cellText);
            if (v.key === "hero's level") result.level = n;
            else if (v.key === "fame") result.fame = n;
            else result.reset_points = n;
          },
        )
        .with({ key: "title" }, (v) => {
          result.title = v.cellText.replace("Choose title", "").trim();
        })
        .with({ key: "gender" }, (v) => {
          result.gender = v.cellText.trim().toUpperCase()[0];
        })
        .otherwise(() => {});
    }
  }

  result.name = textContent(titleEl!).replace("- Attributes and Characteristics", "").trim();

  // Parse bonus tables from the same page
  const tables = form.querySelectorAll('[name="the_form"] > table');
  const bonusTables = parseBonusTables(tables);
  result.armor = bonusTables.armor;
  result.damage = bonusTables.damage;
  result.attackBonuses = bonusTables.attackBonuses;
  result.defenceBonuses = bonusTables.defenceBonuses;

  return result;
}

/**
 * Parse bonus tables from the attributes page.
 * Pure function: takes raw table elements, returns structured data.
 */
export function parseBonusTables(tables: NodeListOf<Element>): ParsedBonusTables {
  const names = ["armor", "damage", "attack bonuses", "defence bonuses"];

  const tbl = Array.from(tables).reduce(
    (acc, t) => {
      for (const cell of [0, 2, 4]) {
        const name = (t as HTMLTableElement).rows[0].cells[cell]?.textContent;
        if (names.includes(name)) {
          acc[name] = [...(t as HTMLTableElement).rows[1].cells[cell].querySelectorAll(".row0, .row1")].map((x) => [...(x as HTMLTableRowElement).cells].map((x) => textNormalized(x).replace("(z)", "")));
        }
      }
      return acc;
    },
    {} as Record<string, string[][]>,
  );

  return {
    armor: parseArmorTable(tbl.armor),
    damage: parseDamageBonusTable(tbl.damage),
    attackBonuses: parseAttackBonusTable(tbl["attack bonuses"]),
    defenceBonuses: parseDefenceBonusTable(tbl["defence bonuses"]),
  };
}

function parseArmorTable(rows?: string[][]): Record<string, Record<string, [number, number, number]>> {
  if (!rows) return {};
  const result: Record<string, Record<string, [number, number, number]>> = {};
  for (const row of rows) {
    let [property, attack_type, value] = row;
    attack_type = attack_type.replace("(z)", "").trim();
    const values = textNormalized(value, { collapse: false }).split("/").map(Number);
    if (!result[property]) result[property] = {};
    result[property][attack_type] = values as [number, number, number];
  }
  return result;
}

function parseDamageBonusTable(rows?: string[][]): Record<string, Record<string, string>> {
  if (!rows) return {};
  const result: Record<string, Record<string, string>> = {};
  for (const row of rows) {
    let [property, attack_type, value] = row;
    attack_type = attack_type.replace("(z)", "").trim();
    value = textNormalized(value, { collapse: false });
    if (!result[property]) result[property] = {};
    result[property][attack_type] = value;
  }
  return result;
}

function parseAttackBonusTable(rows?: string[][]): Record<string, string> {
  if (!rows) return {};
  const result: Record<string, string> = {};
  for (const row of rows) {
    let [attack_type, value] = row;
    attack_type = attack_type.replace("(z)", "").trim();
    value = textNormalized(value, { collapse: false });
    result[attack_type] = value;
  }
  return result;
}

function parseDefenceBonusTable(rows?: string[][]): Record<string, string> {
  if (!rows) return {};
  const result: Record<string, string> = {};
  for (const row of rows) {
    const attack_type = row[0].replace("(z)", "").trim();
    const value = row[1];
    result[attack_type] = value.trim();
  }
  return result;
}
