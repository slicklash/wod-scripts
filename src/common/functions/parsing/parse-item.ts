/// <reference path="../../../../lib/typings/browser.d.ts" />

/// <reference path="../dom/attr.ts" />
/// <reference path="../dom/text-content.ts" />
/// <reference path="../dom/css-class.ts" />
/// <reference path="./parse-html.ts" />

interface ItemInfo {
    heroClasses: Constraints;
    races: Constraints;
    requirements: string[];
    unique: string;
    usesPerDungeon: string | number;
    usesPerFight: string | number;
    effect: string;
    needs: string;
    location: string;
    itemClasses: string[];
    skills: string[];
}

interface Constraints {
    include: string[];
    exclude: string[];
}

const parseItem = (str: string) : ItemInfo => {
    debugger;
    return new ItemParser().parse(str);
};

class ItemParser {

    heroClasses: Constraints;
    races: Constraints;
    requirements: string[];
    unique: string;
    usesPerDungeon: string | number;
    usesPerFight: string | number;
    effect: string;
    needs: string;
    location: string;
    itemClasses: string[];
    skills: string[];

    parse (str): ItemInfo {

        let html = parseHTML(str, true),
            details: HTMLTableRowElement[] = <any>Array.from(html.querySelector('#details').querySelectorAll('.row0, .row1')),
            link = html.querySelector('#link');

        for (let row of details) {

            let values = row.cells[1],
                key = textContent(row.cells[0].childNodes[0]).trim() || textContent(row.cells[0]).trim(),
                parserName = key ? 'parse' + key.split(' ').map(x => x[0].toUpperCase() + x.slice(1)).join('') : undefined,
                fn = this[parserName];

            if (typeof fn === 'function') fn.bind(this)(values);
        }

        return {
            heroClasses: this.heroClasses,
            races: this.races,
            requirements: this.requirements,
            unique: this.unique,
            usesPerDungeon: this.usesPerDungeon,
            usesPerFight: this.usesPerFight,
            effect: this.effect,
            needs: this.needs,
            location: this.location,
            itemClasses: this.itemClasses,
            skills: this.skills,
        };
    }

    parseHeroClasses (values) {
        this.heroClasses = { include: [], exclude: [] };
        Array.from(values.querySelectorAll('li span')).forEach(x => {
            let name = textContent(x).trim();
            if (cssClass(x, 'generic_yes')) {
                this.heroClasses.include.push(name);
            }
            else if (cssClass(x, 'generic_no')) {
                this.heroClasses.exclude.push(name);
            }
        });
    }

    parseRace (values) {
        this.races = { include: [], exclude: [] };
        Array.from(values.querySelectorAll('li span')).forEach(x => {
            let name = textContent(x).trim();
            if (cssClass(x, 'generic_yes')) {
                this.races.include.push(name);
            }
            else if (cssClass(x, 'generic_no')) {
                this.races.exclude.push(name);
            }
        });
    }

    parseUnique (value) {
        this.unique = textContent(value).trim().replace('-', 'not unique');
    }

    parseUsesPerDungeon (value) {
        this.usesPerDungeon = textContent(value).trim();
    }

    parseUsesPerFight (value) {
        this.usesPerFight = textContent(value).trim();
    }

    parseEffect (value) {
        this.effect = textContent(value).trim().split(/\s+/).join(' ');
    }

    parseNeeds (value) {
        this.needs = textContent(value).trim().split(/\s+/).join(' ');
    }

    parseLocation (value) {
        this.location = textContent(value).trim();
    }

    parseItemClass (values) {
        this.itemClasses = Array.from(values.querySelectorAll('a'), x => textContent(x).trim());
    }

    parseSkills (values) {
        this.skills = Array.from(values.querySelectorAll('a'), x => textContent(x).trim());
    }

    parseRequirements (values) {
        this.requirements = Array.from(values.childNodes, x=>textContent(x).trim()).reduce((acc,x) => {
            if (x) {
                if (x.indexOf('is') === 0) acc[acc.length - 1] += ' ' + x;
                else acc.push(x);
            }
            return acc;
        }, [])
    }
}
