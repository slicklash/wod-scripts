/// <reference path="../../../../lib/typings/browser.d.ts" />

/// <reference path="../title-case.ts" />
/// <reference path="../dom/attr.ts" />
/// <reference path="../dom/text-content.ts" />
/// <reference path="../dom/css-class.ts" />
/// <reference path="./parse-html.ts" />

interface ItemDetails {
    heroClasses: Constraints | string;
    races: Constraints | string;
    requirements: string[] | string;
    unique: string;
    usesLeft: string;
    usesPerDungeon: string | number;
    usesPerFight: string | number;
    effect: string;
    needs: string;
    location: string;
    itemClasses: string[];
    skills: string[];
    remarks: string;
    set: string;
}

interface Constraints {
    include: string[];
    exclude: string[];
}

const parseItemDetails = (elem: Element) : ItemDetails => { return new ItemDetailsParser().parse(elem); };

class ItemDetailsParser {

    heroClasses: Constraints | string;
    races: Constraints | string;
    requirements: string[] | string;
    unique: string;
    usesLeft: string;
    usesPerDungeon: string | number;
    usesPerFight: string | number;
    effect: string;
    needs: string;
    location: string;
    itemClasses: string[];
    skills: string[];
    remarks: string;
    set: string;

    parse (elem): ItemDetails {

        let rows: HTMLTableRowElement[] = elem ? <any>Array.from(elem.querySelectorAll('.row0, .row1')) : [];

        for (let row of rows) {
            let values = row.cells[1],
                key = textNormalized(row.cells[0].childNodes[0]) || textNormalized(row.cells[0]);
            this.tryParse(key, values);
        }

        return {
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

    tryParse (key, values) {
        let parserName = key ? 'parse' + key.split(' ').map(titleCase).join('') : undefined,
            fn = this[parserName];
        if (typeof fn === 'function') fn.bind(this)(values);
    }

    parseHeroClasses (values) { this.heroClasses = this.getConstraints(values); }

    parseRace (values) { this.races = this.getConstraints(values); }

    parseUnique (value) { this.unique = textNormalized(value).replace('-', 'not unique'); }

    parseUsesLeft (value) { this.usesLeft = textNormalized(value); }

    parseUsesPerDungeon (value) { this.usesPerDungeon = textNormalized(value); }

    parseUsesPerFight (value) { this.usesPerFight = textNormalized(value); }

    parseEffect (value) { this.effect = textNormalized(value); }

    parseNeeds (value) { this.needs = textNormalized(value); }

    parseLocation (value) { this.location = textNormalized(value); }

    parseItemClass (values) { this.itemClasses = Array.from(values.querySelectorAll('a'), textNormalized); }

    parseSkills (values) { this.skills = Array.from(values.querySelectorAll('a'), textNormalized); }

    parseRemarks (value) { this.remarks = textNormalized(value); }

    parseSet (value) { this.set = textNormalized(value); }

    parseRequirements (values) {
        this.requirements = Array.from(values.childNodes, textNormalized).reduce((acc,x) => {
            if (x) {
                if (x.indexOf('is') === 0) acc[acc.length - 1] += ' ' + x;
                else acc.push(x);
            }
            return acc;
        }, []);
        if (this.requirements.length === 1 && this.requirements[0] === 'no') this.requirements = '-';
    }

    getConstraints (values): Constraints | string {
        let list = Array.from(values.querySelectorAll('li span'));
        let constraints = {
            include: list.filter(x => cssClass(x, 'generic_yes')).map(textNormalized),
            exclude: list.filter(x => cssClass(x, 'generic_no')).map(textNormalized),
        };
        if (!constraints.include.length) delete constraints.include;
        if (!constraints.exclude.length) delete constraints.exclude;
        if (!Object.keys(constraints).length) return 'any';
        return constraints;
    }
}
