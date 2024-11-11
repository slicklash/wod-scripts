import { add } from "@common/dom/add";
import { attr } from "@common/dom/attr";
import { textContent } from "@common/dom/text-content";
import { parseEffectiveValue } from "@common/parsing/parse-effective-value";

// prettier-ignore
const SEC_COSTS = [0, 40, 120, 400, 960, 1880, 3320, 5360, 8120, 11720, 16240, 21840, 28600, 36680, 46160, 57160, 69840, 84280, 100640, 119000, 139520, 162280, 187440, 215120, 245480, 278600, 314600, 353640, 395840, 441320, 490200, 542640, 598760, 658680, 722520, 79440, 862560, 939000, 1019920, 1105440, 195680];
// prettier-ignore
const EXC_COSTS = [0, 50, 150, 500, 1300, 2700, 4850, 7950, 12200, 17800, 24950, 33850, 44700, 57750, 73200, 91250, 112150, 136100, 163350, 194150, 228750, 267350, 320200, 357550, 409650, 466750, 529100, 596950, 670550, 750150, 836050, 928450, 1027650, 1133900, 1247450, 1368600, 1497600, 1634700, 1780200, 1934400, 2097500];
// prettier-ignore
const TAL_COSTS = [0, 1440, 3240, 5440, 8080, 11200, 14840, 19040, 23840, 29280, 35400, 42240, 49840, 58240, 67480, 77600, 88640, 100640, 113640, 127680, 142800, 159040, 176440, 195040, 214880, 236000, 258440, 282240, 307440, 334080, 362200, 391840, 423040, 455840, 490280, 526400, 564240, 603840, 645240, 688480, 733600];

export class HeroSkill {
  name = "";
  type = "";
  rank = 0;
  can_undo = false;
  initial_rank = 0;
  effective_rank = 0;
  primary = false;
  secondary = false;
  exceptional = false;
  talent = false;
  in_round = true;
  pre_round = false;
  target = "";
  max_affected = "";
  one_pos = false;
  mp_base = 0;
  mp_cost = 0;
  item = "";
  skill_class = "";
  initiative_attr = "";
  attack_type = "";
  attack_attr = "";
  defence_attr = "";
  effect_attr = "";
  training_cost_ep = 0;
  training_cost_gold = 0;
  url = "";
  color = "";
  hero = null;
  onDone = null;

  roll() {
    const res = {
      attack: "",
      defence: "",
      effect: "",
    };
    // re_tmp = /([a-z]{2}){1},([a-z]{2}){1}(\s*\(([+-][0-9]+)%?\))?/i;

    return res;
    /*
    if (this.attack_attr) {
        var m = this.attack_attr.match(re_tmp),
            attr1 = m[1],
            attr2 = m[2],
            mod = m[4] ? 1 + Number(m[4]) / 100 : 1;
        // @ts-ignore
        res.attack = Math.floor(mod * (this.hero.attributes[attr1].effective_value * 2 + this.hero.attributes[attr2].effective_value + this.effective_rank * 2));
    }

    if (this.defence_attr) {
        var m = this.defence_attr.match(re_tmp),
            attr1 = m[1],
            attr2 = m[2],
            mod = m[4] ? 1 + Number(m[4]) / 100 : 1;
        // @ts-ignore
        res.defence = Math.floor(mod * (this.hero.attributes[attr1].effective_value * 2 + this.hero.attributes[attr2].effective_value + this.effective_rank * 2));
    }

    if (this.effect_attr) {
        var m = this.effect_attr.match(re_tmp),
            attr1 = m[1],
            attr2 = m[2],
            mod = m[4] ? 1 + Number(m[4]) / 100 : 1;
        // @ts-ignore
        res.effect = Math.floor(mod * (this.hero.attributes[attr1].effective_value / 2 + this.hero.attributes[attr2].effective_value / 3 + this.effective_rank / 2));
    }

    return res;
    */
  }

  fetchInfo(data) {
    try {
      const skill_info = add<HTMLElement>("div");
      skill_info.innerHTML = data;
      const table_rows = Array.from(
        skill_info
          .querySelector("form")
          .querySelectorAll(".content_table table tr"),
      );

      for (let i = 0, cnt = table_rows.length; i < cnt; i++) {
        const property = textContent(
            (table_rows[i] as HTMLTableRowElement).cells[0],
          ).trim(),
          value = textContent((table_rows[i] as HTMLTableRowElement).cells[1])
            .replace(/(\s|&nbsp;)/g, " ")
            .trim();

        switch (property) {
          case "type":
            this.type = value;
            break;
          case "may be used":
            this.in_round = value.indexOf("in round") > -1;
            this.pre_round = value.indexOf("in pre round") > -1;
            break;
          case "target":
            this.target = value;
            this.one_pos = value.indexOf("one position") > -1;
            break;
          case "Max. characters affected":
          case "Max. opponents affected":
            this.max_affected = value;
            break;
          case "Mana points cost":
            if (value !== "-") {
              const mp = value.match(/([0-9])+ \(([0-9]+)\)/);
              this.mp_base = Number(mp[2]);
              this.mp_cost = Math.floor(
                this.mp_base * (0.8 + 0.1 * this.effective_rank),
              );
            }
            break;
          case "item":
            this.item = value;
            break;
          case "skill class":
            this.skill_class = value;
            break;
          case "attack type":
            this.attack_type = value;
            break;
          case "attack":
            this.attack_attr = value;
            break;
          case "damage":
            this.effect_attr = value;
            break;
          case "initiative":
            this.initiative_attr = value;
            break;
          case "defense":
            this.defence_attr = value;
            break;
          case "healing":
            this.effect_attr = value;
            break;
          default:
            break;
        }
      }

      if (this.max_affected.includes("% of your hero`s level")) {
        const tmp = this.max_affected
          .replace("% of your hero`s level", "*" + this.hero.level + "/100")
          .replace(" ", "");
        this.max_affected = Math.floor(eval(tmp)).toString();
      } else if (this.max_affected.includes("% of your skill rank")) {
        const tmp = this.max_affected
          .replace("% of your skill rank", "*" + this.effective_rank + "/100")
          .replace(" ", "");
        this.max_affected = Math.floor(eval(tmp)).toString();
      }

      switch (this.type) {
        case "attack":
        case "degradation":
          if (this.target.indexOf("one enemy") > -1) this.max_affected = "1";
          break;
        case "improvement":
        case "healing":
          if (this.target.indexOf("one team") > -1) this.max_affected = "1";
          break;
        default:
          break;
      }
    } catch (ex) {
      console.error(ex);
    }

    if (typeof this.onDone === "function") this.onDone(this);
  }

  parse(row_html) {
    try {
      const link = row_html.cells[1].querySelector("a"),
        rank_row = row_html.cells[2].querySelector("tr"),
        rank = rank_row
          ? parseEffectiveValue(textContent(rank_row.cells[1]))
          : [0, 0],
        title = unescape(link.href).match(/name=([a-z\- :()'!+]+)/i);

      if (title !== null && rank[0] !== 0) {
        this.name = title[1].replace(/\+/g, " ");
        this.talent = this.name.indexOf("Talent:") > -1;
        this.rank = rank[0];
        this.effective_rank = rank[1];
        this.url = link.href;
        if (!this.can_undo && this.rank === 1) {
          this.initial_rank = 1;
        }

        if (!this.talent) {
          switch (attr(link, "class")) {
            case "skill_primary":
              this.primary = true;
              break;
            case "skill_secondary":
              this.secondary = true;
              this.color = "lightslategray";
              break;
            case "skill_foreign":
              this.exceptional = true;
              this.color = "#858585";
              break;
            default:
              break;
          }
        }
        if (!(this.rank === 1 && this.initial_rank === 1)) this.calculateCost();
      }
    } catch (error) {
      console.error(error);
    }

    return this;
  }

  calculateCost() {
    /*
      if (this.talent) {
        new_rang += 8
      }

      const base_cost = (new_rang>1 ? (new_rang-1)*new_rang : 1)

        switch (type)
        {
            case 'skill_primary':
                result =  20 * base_cost
                break

            case 'skill_secondary':
                result =  40 * Math.round(Math.pow( Math.max(1,new_rang), 0.1)*base_cost,0)
                break

            case 'skill_foreign':
                result =  50 * Math.round(Math.pow( Math.max(1,new_rang), 0.2)*base_cost,0)
                break

            default: // Attribut
                result = 100 * Math.round(base_cost * Math.sqrt(Math.sqrt(Math.max(1,new_rang)))/2,0)
        }
        */
    let cost = 0;
    if (this.primary) {
      for (let i = this.rank; i > 1; i--) cost += (Math.pow(i, 2) - i) * 20;
      if (cost === 0) cost = 40;
    } else if (this.secondary) {
      cost = SEC_COSTS[this.rank] || 0;
    } else if (this.exceptional) {
      cost = EXC_COSTS[this.rank] || 0;
    } else if (this.talent) {
      cost = TAL_COSTS[this.rank] || 0;
    }
    this.training_cost_ep = cost;
    this.training_cost_gold = cost * 0.9;
    return this;
  }
}
