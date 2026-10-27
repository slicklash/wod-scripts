import { parseHtml } from "../dom/parse-html";
import { textContent } from "../dom/text-content";
import { textNormalized } from "../dom/text-normalized";
import { camelCase } from "../text/camel-case";

export type Modifiers = {
  owner?: Modifier[];
  affected?: Modifier[];
};

type Modifier = {
  group?: string;
  attribute?: string;
  damageType?: string;
  attackType?: string;
  armor?: string;
  duration?: string;
  comment?: string;
  bonus?: string;
  damageBonus?: string;
  modifier?: string;
  skill?: string;
}

export const parseModifiers = (elem: Element | string): Modifiers | undefined =>
  new ModifiersParser().parse(
    typeof elem === "string" ? parseHtml(elem) : elem,
  );

class ModifiersParser {
  modifiers: Modifiers = { owner: [], affected: [] };
  current?: Modifier[];
  currentGroup?: string;

  parse(elem: Element): Modifiers | undefined {
    if (!elem) return undefined;

    for (const child of Array.from(elem.childNodes)) {
      if (child.nodeName === "H2") {
        const text = textContent(child);
        if (text.indexOf("on the owner") > -1) {
          this.current = this.modifiers.owner;
        } else if (text.indexOf("on those affected")) {
          this.current = this.modifiers.affected;
        }
      } else if (child.nodeName === "H3") {
        this.currentGroup = camelCase(textNormalized(child));
      }

      if (this.current && this.currentGroup && child.nodeName === "TABLE") {
        this.tryParse(<HTMLTableElement>child);
      }
    }
    const owner = this.modifiers.owner;
    const affected = this.modifiers.affected;
    const modifiers = { owner, affected };
    if (!this.modifiers.owner!.length) modifiers.owner = undefined;
    if (!this.modifiers.affected!.length) modifiers.affected = undefined;
    if (!modifiers.owner && !modifiers.affected) return undefined;
    return modifiers;
  }

  tryParse(table: HTMLTableElement) {
    const fieldName = (x) => camelCase(textNormalized(x).replace("(r)", ""));

    const fields = Array.from(table.querySelectorAll(".header th"), fieldName);

    const rows: HTMLTableRowElement[] = <HTMLTableRowElement[]>(
      Array.from(table.querySelectorAll(".row0, .row1"))
    );

    for (const row of rows) {
      const modifier = { group: this.currentGroup };

      fields.forEach((x, i) => {
        const value = textNormalized(row.cells[i]);
        if (value) modifier[x] = value;
      });

      this.current!.push(modifier);
    }
  }
}
