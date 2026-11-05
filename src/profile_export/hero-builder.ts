import { add } from "@common/dom/add";
import { textNormalized } from "@common/dom/text-normalized";
import { httpFetch } from "@common/net/http-fetch";
import { parseAttributePage, type ParsedAttributePage } from "@common/parsing/parse-hero-attributes";
import { createEmptyHeroProfile, type HeroProfile, type Item } from "./hero-profile";

export function buildHeroProfile(parsed: ParsedAttributePage): HeroProfile {
  const hero = createEmptyHeroProfile();

  hero.name = parsed.name;
  hero.race = parsed.race;
  hero.char_class = parsed.char_class;
  hero.level = parsed.level;
  hero.fame = parsed.fame;
  hero.reset_points = parsed.reset_points;
  hero.title = parsed.title;
  hero.gender = parsed.gender;

  for (const [key, attrData] of Object.entries(parsed.attributes)) {
    const attrKey = key as keyof typeof hero.attributes;
    const attr = hero.attributes[attrKey];
    if (attr) {
      attr.value = attrData.rank;
      attr.effective_value = attrData.effectiveRank;
      attr.training_cost = attrData.totalTrainingCost;
    }
  }

  hero.armor = parsed.armor;
  hero.bonus_damage = parsed.damage;
  hero.bonus_attack = parsed.attackBonuses;
  hero.bonus_defence = parsed.defenceBonuses;

  return hero;
}

export function parseHeroProfile(html: string): HeroProfile {
  const parsed = parseAttributePage(html);
  return buildHeroProfile(parsed);
}

export async function fetchHeroItems(currentUrl: string, showNotification?: (msg: string) => void): Promise<{ items: Item[]; hasUpperCoins: boolean }> {
  const eqUrl = currentUrl.replace("skills.php", "items.php").replace("menukey=hero_skills", "menukey=hero_storage");

  const { data = "" } = await httpFetch(eqUrl);
  const gearHtml = data;
  if (/\d+ items were found in the dungeon. You may carry up to/.test(gearHtml)) {
    if (showNotification) {
      showNotification("You have too much items in your backpack, your current gear won't be shown.");
    }
  }

  const gearDiv = add<HTMLDivElement>("div", null, gearHtml);
  const items: Item[] = [];
  const reUpperCoin = /(Six of coins|Seven of coins|Eight of coins|Nine of coins|Ten of coins)/;
  const reUses = /\(([0-9]+)\/[0-9]+\)/;
  let upperCoins = 0;
  const slots = ["head", "ears", "face", "neck", "torso", "belt", "cloak", "shoulders", "arms", "gloves", "both hands", "right hand", "left hand", "legs", "feet", "medal", "ring", "pocket"];
  const used = new Set(slots);

  Array.from(gearDiv.querySelectorAll('input[name*="ITEMS_EQUIPPED_PAGE"], input[name*="ITEMS_TASCHE_PAGE"], input[name*="ITEMS_ORDEN_PAGE"]'))
    .map((x: Element) => x.nextElementSibling)
    .filter((el): el is Element => el !== null)
    .forEach((table) => {
      for (const row of Array.from(table.querySelectorAll("tr"))) {
        const select = row.querySelector('select[name*="EquipItem"]') as HTMLSelectElement;
        if (!select) continue;
        const a = row.querySelector('a[class*="item"]');
        const enchanting: string[] = [];
        let n = a?.nextElementSibling as HTMLImageElement;
        let m;
        while (n?.tagName === "IMG" && (m = n.src.match(/gem_(.+)\./))) {
          enchanting.push((n.src.includes("mgem") ? ":m" : ":g") + m[1] + ":");
          n = n.nextElementSibling as HTMLImageElement;
        }
        let name = textNormalized(a?.parentElement ?? null).replace(/!$/, "") || "";
        const uses = name.match(reUses);
        if (uses) {
          name = name.replace(reUses, "").trim();
        }
        const item: Item = {
          name,
          uses: uses ? " " + uses[0] : "",
          slot: select.options[select.selectedIndex].text,
          enchanting,
          isUnique: a?.className.includes("item_unique") === true,
        };
        items.push(item);
        used.delete(item.slot);
        if (reUpperCoin.test(item.name)) {
          upperCoins += 1;
        }
      }
    });
  used.forEach((slot) => items.push({ name: "", slot, enchanting: [], isUnique: false, uses: "" }));
  const sortedItems = items.sort((a, b) => slots.indexOf(a.slot) - slots.indexOf(b.slot));

  return {
    items: sortedItems,
    hasUpperCoins: upperCoins === 5,
  };
}

export function applyUpperCoinsArmor(hero: HeroProfile): HeroProfile {
  if (!hero.hasUpperCoins) return hero;

  const damageTypes = ["crushing damage", "cutting damage", "piercing damage"];
  const newArmor = { ...hero.armor };

  for (const dmgType of damageTypes) {
    if (!newArmor[dmgType]) newArmor[dmgType] = {};
    if (!newArmor[dmgType].all) newArmor[dmgType].all = [0, 0, 0];
    const value = newArmor[dmgType].all;
    newArmor[dmgType].all = [value[0] + 6, value[1] + 4, value[2] + 2];
  }

  return { ...hero, armor: newArmor };
}

export async function parseHeroProfileWithItems(html: string, currentUrl: string, withItems: boolean): Promise<HeroProfile> {
  const hero = parseHeroProfile(html);

  if (!withItems) return hero;

  const { items, hasUpperCoins } = await fetchHeroItems(currentUrl);
  hero.items = items;
  hero.hasUpperCoins = hasUpperCoins;
  return applyUpperCoinsArmor(hero);
}
