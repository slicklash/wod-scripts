import { cssClass } from "../dom/css-class";
import { parseHtml } from "../dom/parse-html";
import { textNormalized } from "../dom/text-normalized";
import { titleCase } from "../text/title-case";
import { type Modifiers } from "./parse-modifiers";

export type ItemDetails = {
  name: string;
  heroClasses?: Constraints;
  races?: Constraints;
  requirements?: string[];
  unique: string;
  usesLeft: string;
  usesPerDungeon: string;
  usesPerFight: string;
  effect: string;
  needs: string;
  location: string;
  itemClasses: string[];
  skills: string[];
  remarks: string;
  set: string;
  modifiers?: Modifiers;
};

export type Constraints = {
  include?: string[];
  exclude?: string[];
};

export const parseItemDetails = (name: string, elem: Element | string): ItemDetails => new ItemDetailsParser().parse(name, typeof elem === "string" ? parseHtml(elem) : elem);

class ItemDetailsParser {
  heroClasses?: Constraints;
  races?: Constraints;
  requirements?: string[];
  unique: string = "";
  usesLeft: string = "";
  usesPerDungeon: string = "unlimited";
  usesPerFight: string = "unlimited";
  effect: string = "-";
  needs: string = "-";
  location: string = "";
  itemClasses: string[] = [];
  skills: string[] = [];
  remarks: string = "";
  set: string = "";

  parse(name: string, elem: Element): ItemDetails {
    const rows: HTMLTableRowElement[] = elem ? <any>Array.from(elem.querySelectorAll(".row0, .row1")) : [];

    for (const row of rows) {
      const values = row.cells[1];
      let key = textNormalized(row.cells[0].childNodes[0] as Element) || textNormalized(row.cells[0]);
      if (key) key = key.replace(" including bonuses", "");
      this.tryParse(key, values);
    }

    return {
      name,
      heroClasses: this.heroClasses,
      races: this.races,
      requirements: this.requirements,
      unique: this.unique,
      usesLeft: this.usesLeft,
      usesPerDungeon: this.usesPerDungeon,
      usesPerFight: this.usesPerFight,
      effect: this.effect,
      needs: this.needs,
      location: this.location,
      itemClasses: this.itemClasses,
      skills: this.skills,
      remarks: this.remarks,
      set: this.set,
    };
  }

  tryParse(key: string, values: Element) {
    let parserName = key ? "parse" + key.split(" ").map(titleCase).join("") : undefined;
    if (!parserName) return;
    parserName = parserName.replace("storedIn", "location");
    const fn = (this as any)[parserName];
    if (typeof fn === "function") fn.bind(this)(values);
  }

  parseHeroClasses(values: Element) {
    this.heroClasses = this.getConstraints(values);
  }

  parseRace(values: Element) {
    this.races = this.getConstraints(values);
  }

  parseUnique(value: Element) {
    this.unique = textNormalized(value).replace("-", "not unique");
  }

  parseUsesLeft(value: Element) {
    this.usesLeft = textNormalized(value);
  }

  parseUsesPerDungeon(value: Element) {
    this.usesPerDungeon = textNormalized(value);
  }

  parseUsesPerFight(value: Element) {
    this.usesPerFight = textNormalized(value);
  }

  parseEffect(value: Element) {
    this.effect = textNormalized(value);
  }

  parseNeeds(value: Element) {
    this.needs = textNormalized(value);
  }

  parseLocation(value: Element) {
    this.location = textNormalized(value);
  }

  parseItemClass(values: Element) {
    this.itemClasses = Array.from(values.querySelectorAll("a"), textNormalized);
  }

  parseSkills(values: Element) {
    this.skills = Array.from(values.querySelectorAll("a"), textNormalized);
  }

  parseRemarks(value: Element) {
    this.remarks = textNormalized(value);
  }

  parseSet(value: Element) {
    this.set = textNormalized(value);
  }

  parseRequirements(values: Element) {
    const requirements = Array.from(values.childNodes)
      .filter((node): node is Element => node instanceof window.Element)
      .map(textNormalized)
      .reduce((acc: string[], x: string) => {
        if (x) {
          if (x.indexOf("is") === 0) acc[acc.length - 1] += " " + x;
          else acc.push(x);
        }
        return acc;
      }, []);
    this.requirements = requirements.length === 1 && requirements[0] === "no" ? undefined : requirements;
  }

  getConstraints(values: Element): Constraints | undefined {
    const list: HTMLSpanElement[] = Array.from(values.querySelectorAll("li span"));
    const include = list.filter((x) => cssClass(x, "generic_yes")).map(textNormalized);
    const exclude = list.filter((x) => cssClass(x, "generic_no")).map(textNormalized);
    const constraints: Constraints = { include, exclude };

    if (!include.length) constraints.include = undefined;
    if (!exclude.length) constraints.exclude = undefined;

    if (!constraints.include && !constraints.exclude) return undefined;

    return constraints;
  }
}
