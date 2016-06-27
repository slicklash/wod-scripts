import { attr } from '../dom/attr'
import { textContent } from '../dom/text-content'
import { textNormalized } from '../dom/text-normalized'
import { cssClass } from '../dom/css-class'
import { titleCase } from  '../text/title-case'
import { camelCase } from  '../text/camel-case'

export interface Modifiers {
    owner: Modifier[];
    affected: Modifier[];
}

interface Modifier {
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

export const parseModifiers = (elem: Element) : Modifiers => { return new ModifiersParser().parse(elem); };

class ModifiersParser {

    modifiers: Modifiers;
    current: Modifier[];
    currentGroup: string;

    parse (elem: Element): Modifiers {

        if (!elem) return undefined;

        this.modifiers = { owner: [], affected: [] };

        for (let child of Array.from(elem.childNodes)) {

            if (child.nodeName === 'H2') {
                let text = textContent(child);
                if (text.indexOf('on the owner') >  -1) {
                    this.current = this.modifiers.owner;
                }
                else if (text.indexOf('on those affected')) {
                    this.current = this.modifiers.affected;
                }
            }
            else if (child.nodeName === 'H3') {
                this.currentGroup = camelCase(textNormalized(child));
            }

            if (this.current && this.currentGroup && child.nodeName === 'TABLE') {
                this.tryParse(<HTMLTableElement>child);
            }
        }

        if (!this.modifiers.owner.length) delete this.modifiers.owner;
        if (!this.modifiers.affected.length) delete this.modifiers.affected;
        return Object.keys(this.modifiers).length ? this.modifiers : undefined;
    }

    tryParse (table: HTMLTableElement) {

        const fieldName = x => camelCase(textNormalized(x).replace('(r)', ''));

        let fields = Array.from(table.querySelectorAll('.header th'), fieldName);

        let rows: HTMLTableRowElement[] = <HTMLTableRowElement[]>Array.from(table.querySelectorAll('.row0, .row1'));

        for(let row of rows) {

            let modifier = { group: this.currentGroup };

            fields.forEach((x, i) => {
                let value = textNormalized(row.cells[i]);
                if (value) modifier[x] = value;
            });

            this.current.push(modifier);
        }
    }
}
