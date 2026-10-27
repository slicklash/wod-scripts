import { add } from "@common/dom/add";
import { textContent } from "@common/dom/text-content";
import { httpFetch } from "@common/net/http-fetch";
import { parseEffectiveValue } from "@common/parsing/parse-effective-value";
import { HeroSkill } from "./hero-skill";
import { toBBCode } from "./profile-template";

// prettier-ignore
const RE_ATTR = /^(Strength|Constitution|Intelligence|Dexterity|Charisma|Agility|Perception|Willpower)/;
// prettier-ignore
const RE_RACE = /(Borderlander|Dinturan|Gnome|Halfling|Kargashian|Kerasi|Mag Mor|Targeshian|Partan|Tirem Ag|Woodlander) \(/;
// prettier-ignore
const RE_CLASS = /(Adventurer|Alchemist|Apprentice|Archer|Barbarian|Bard|Cloud Raider|Cloudraider|Conjuror|Draclin|Drifter|Engineer|Fighter|Gladiator|Hunter|Juggler|Knight|Lightbringer|Mage|Muse|Nieri|Paladin|Priest|Scholar|Shadow Seeker|Shaman|Star Kinder|Warlock|Warlord|Zealot) \(/;
// prettier-ignore
const ATTR_COSTS = [0, 0, 100, 500, 1300, 2800, 5100, 8500, 13200, 19400, 27400, 37400, 49700, 64500, 82100, 102800, 126800, 154400, 185900, 221600, 261800, 306800, 356800, 412200, 473300, 540400, 613800, 693800, 780800, 875000, 976800];

type Item = {
  name: string;
  uses: string;
  slot: string;
  enchanting: string[];
  isUnique: boolean;
};

class HeroAttribute {
  value = 0;
  effective_value = 0;
  training_cost = 0;
  constructor(public name) {}
}

export class Hero {
  name = "";
  level = 1;
  race = "";
  char_class = "";
  subclass = "";
  actions = 1;
  initiative = "";
  reset_points = 0;
  fame = 0;
  gender = "M";
  title = "";
  skills: HeroSkill[] = [];
  hasUpperCoins = false;
  attributes = {
    st: new HeroAttribute("Strength"),
    co: new HeroAttribute("Constitution"),
    in: new HeroAttribute("Intelligence"),
    dx: new HeroAttribute("Dexterity"),
    ch: new HeroAttribute("Charisma"),
    ag: new HeroAttribute("Agility"),
    pe: new HeroAttribute("Perception"),
    wi: new HeroAttribute("Willpower"),
    hp: new HeroAttribute("HP"),
    hhp: new HeroAttribute("HHP"),
    mp: new HeroAttribute("MP"),
    rmp: new HeroAttribute("RMP"),
    ini: new HeroAttribute("Initiative"),
    act: new HeroAttribute("Actions"),
  };
  armor = {};
  items: Item[] = [];
  modifiers = {};
  bonus_damage = {};
  bonus_attack = {};
  bonus_defence = {};

  get ep_used() {
    // prettier-ignore
    const skill_cost = this.skills.reduce( (acc, s) => acc + s.training_cost_ep, 0);
    // prettier-ignore
    const attr_cost = Object.values(this.attributes).reduce( (acc, a) => acc + a.training_cost, 0);
    return skill_cost + attr_cost;
  }
  generateBBCode() {
    this.skills.sort((a, b) => {
      let cmp = b.effective_rank - a.effective_rank;
      if (cmp === 0) cmp = b.training_cost_ep - a.training_cost_ep;
      if (cmp === 0) cmp = a.name.localeCompare(b.name);
      return cmp;
    });
    return toBBCode(this);
  }

  parse(attrPageHtml, withItems = false): Promise<void> {
    try {
      const page = add<HTMLDivElement>("div", null, attrPageHtml);
      const form = page.querySelector('form[name="the_form"]')!;
      const tables = [...page.querySelectorAll('[name="the_form"] > table')];

      const title = form.querySelector("h1");
      // prettier-ignore
      const content_rows = [...form.querySelectorAll(".row0, .row1")];
      // prettier-ignore
      this.name = textContent(title).replace("- Attributes and Characteristics", "").trim();

      for (let i = 0, cnt = content_rows.length; i < cnt; i++) {
        const row = content_rows[i] as HTMLTableRowElement,
          cell1 = row.cells[0],
          property = textContent(cell1).trim();
        if (property.match(RE_ATTR)) {
          const race = cell1.innerHTML.match(RE_RACE),
            ch_class = cell1.innerHTML.match(RE_CLASS);
          if (race) this.race = race[1];
          if (ch_class) this.char_class = ch_class[1];
          const val = row.cells[1].querySelector("tr");
          if (val && val.cells) {
            // prettier-ignore
            const attr_name = property.toLowerCase().substring(0, 2).replace("de", "dx");
            const attr = this.attributes[attr_name];
            const efval = parseEffectiveValue(textContent(val.cells[1]));
            attr.value = efval[0];
            attr.effective_value = efval[1];
            attr.training_cost = ATTR_COSTS[attr.value] || 0;
          }
        } else {
          switch (property.toLowerCase()) {
            case "hero's level": {
              this.level = Number(textContent(row.cells[1]));
              break;
            }
            case "fame": {
              this.fame = Number(textContent(row.cells[1]));
              break;
            }
            case "hit points": {
              const hp = parseEffectiveValue(textContent(row.cells[1])),
                hhp = parseEffectiveValue(textContent(row.cells[2])),
                hpa = this.attributes["hp"],
                hhpa = this.attributes["hhp"];
              hpa.value = hp[0];
              hpa.effective_value = hp[1];
              hhpa.value = hhp[0];
              hhpa.effective_value = hhp[1];
              break;
            }
            case "mana points": {
              const mp = parseEffectiveValue(textContent(row.cells[1])),
                rmp = parseEffectiveValue(textContent(row.cells[2])),
                mpa = this.attributes["mp"],
                rmpa = this.attributes["rmp"];
              mpa.value = mp[0];
              mpa.effective_value = mp[1];
              rmpa.value = rmp[0];
              rmpa.effective_value = rmp[1];
              break;
            }
            case "actions per round": {
              const act = parseEffectiveValue(textContent(row.cells[1])),
                acta = this.attributes["act"];
              acta.value = act[0];
              acta.effective_value = act[1];
              break;
            }
            case "reset points": {
              this.reset_points = Number(textContent(row.cells[1]));
              break;
            }
            case "title": {
              this.title = textContent(row.cells[1])
                .replace("Choose title", "")
                .trim();
              break;
            }
            case "initiative": {
              const ini = parseEffectiveValue(textContent(row.cells[1])),
                inia = this.attributes["ini"];
              inia.value = ini[0];
              inia.effective_value = ini[1];
              break;
            }
            case "gender": {
              this.gender = textContent(row.cells[1]).trim().toUpperCase()[0];
              break;
            }
            default:
              break;
          }
        }
      }

      this.parseTables(tables);

      if (withItems) {
        return this.fetchItems();
      }
      return Promise.resolve();
    } catch (ex) {
      console.error(ex);
      return Promise.reject(ex);
    }
  }

  parseTables(tables) {
    const names = ["armor", "damage", "attack bonuses", "defence bonuses"];
    const tbl = tables.reduce((acc, t) => {
      for (const cell of [0, 2, 4]) {
        const name = t.rows[0].cells[cell]?.textContent;
        if (names.includes(name)) {
          acc[name] = [
            ...t.rows[1].cells[cell].querySelectorAll(".row0, .row1"),
          ].map((x) =>
            [...x.cells].map((x) => x.textContent.replace("(z)", "").trim()),
          );
        }
      }
      return acc;
    }, {});
    this.parseArmor(tbl.armor);
    this.parseDamageBonus(tbl.damage);
    this.parseAttackBonus(tbl["attack bonuses"]);
    this.parseDefenceBonus(tbl["defence bonuses"]);
  }

  parseArmor(rows?: string[][]) {
    if (!rows) return;
    for (const row of rows) {
      let [property, attack_type, value] = row;
      attack_type = attack_type.replace("(z)", "").trim();
      // prettier-ignore
      const values = value.replace(/(\s|&nbsp;)/g, "").trim().split("/").map(Number);
      if (!this.armor[property]) this.armor[property] = {};
      this.armor[property][attack_type] = values;
    }
  }

  parseDamageBonus(rows?: string[][]) {
    if (!rows) return;
    for (const row of rows) {
      let [property, attack_type, value] = row;
      attack_type = attack_type.replace("(z)", "").trim();
      value = value.replace(/(\s|&nbsp;)/g, "").trim();
      if (!this.bonus_damage[property]) this.bonus_damage[property] = {};
      this.bonus_damage[property][attack_type] = value;
    }
  }

  parseAttackBonus(rows?: string[][]) {
    if (!rows) return;
    for (const row of rows) {
      let [attack_type, value] = row;
      attack_type = attack_type.replace("(z)", "").trim();
      value = value.replace(/(\s|&nbsp;)/g, "").trim();
      this.bonus_attack[attack_type] = value;
    }
  }

  parseDefenceBonus(rows?: string[][]) {
    if (!rows) return;
    for (const row of rows) {
      const attack_type = row[0].replace("(z)", "").trim();
      const value = row[1];
      this.bonus_defence[attack_type] = value.trim();
    }
  }

  fetchItems(): Promise<any> {
    const eq_url = location.href
      .replace("skills.php", "items.php")
      .replace("menukey=hero_skills", "menukey=hero_storage");

    return httpFetch(eq_url).then((resp) => {
      const gearHtml = (resp && resp.data) || "";
      if (
        /\d+ items were found in the dungeon. You may carry up to/.test(
          gearHtml,
        )
      ) {
        alert(
          "You have too much items in your backpack, your current gear won't be shown.",
        );
      }

      const gear_html = add<HTMLDivElement>("div", null, gearHtml);

      const items: Item[] = [];
      const re_upper_coin =
        /(Six of coins|Seven of coins|Eight of coins|Nine of coins|Ten of coins)/;
      const re_uses = /\(([0-9]+)\/[0-9]+\)/;
      let upperCoins = 0;
      // prettier-ignore
      const slots = ["head", "ears", "face", "neck", "torso", "belt", "cloak", "shoulders", "arms", "gloves", "both hands", "right hand", "left hand", "legs", "feet", "medal", "ring", "pocket"];
      const used = new Set(slots);

      Array.from(
        gear_html.querySelectorAll(
          'input[name*="ITEMS_EQUIPPED_PAGE"], input[name*="ITEMS_TASCHE_PAGE"], input[name*="ITEMS_ORDEN_PAGE"]',
        ),
      )
        .map((x) => x.nextElementSibling)
        .forEach((table) => {
          for (const row of Array.from(table!.querySelectorAll("tr"))) {
            const select = row.querySelector(
              'select[name*="EquipItem"]',
            ) as HTMLSelectElement;
            if (!select) continue;
            const a = row.querySelector('a[class*="item"]');
            const enchanting: string[] = [];
            let n = a?.nextElementSibling as HTMLImageElement;
            let m;
            while (n?.tagName === "IMG" && (m = n.src.match(/gem_(.+)\./))) {
              enchanting.push(
                (n.src.includes("mgem") ? ":m" : ":g") + m[1] + ":",
              );
              n = n.nextElementSibling as HTMLImageElement;
            }
            let name =
              a?.parentElement?.textContent.trim().replace(/!$/, "") || "";
            const uses = name.match(re_uses);
            if (uses) {
              name = name.replace(re_uses, "").trim();
            }
            const item = {
              name,
              uses: uses ? " " + uses[0] : "",
              slot: select.options[select.selectedIndex].text,
              enchanting,
              isUnique: a?.className.includes("item_unique") === true,
            };
            items.push(item);
            used.delete(item.slot);
            if (re_upper_coin.test(item.name)) {
              upperCoins += 1;
            }
          }
        });
      // prettier-ignore
      used.forEach((slot) => items.push({ name: "", slot, enchanting: [], isUnique: false, uses: "" }));
      // prettier-ignore
      this.items = items.sort((a, b) => slots.indexOf(a.slot) - slots.indexOf(b.slot));
      if (upperCoins === 5) {
        this.hasUpperCoins = true;
      }
    });
  }

  addUpperCoinsArmor() {
    if (!this.hasUpperCoins) return;
    // prettier-ignore
    const damage_types = ["crushing damage", "cutting damage", "piercing damage"];
    for (let i = 0; i < damage_types.length; i++) {
      const dmg_type = damage_types[i];
      if (!this.armor[dmg_type]) this.armor[dmg_type] = {};
      if (!this.armor[dmg_type].all) this.armor[dmg_type].all = [0, 0, 0];
      const value = this.armor[dmg_type].all;
      this.armor[dmg_type].all = [value[0] + 6, value[1] + 4, value[2] + 2];
    }
  }
}
