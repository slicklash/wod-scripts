/// <reference path="../_references.ts" />

// --- HeroAttribute

var _attrCosts = [
    0, 0, 100, 500, 1300, 2800, 5100, 8500, 13200, 19400, 27400, 37400, 49700,
    64500, 82100, 102800, 126800, 154400, 185900, 221600, 261800, 306800, 356800,
    412200, 473300, 540400, 613800, 693800, 780800, 875000, 976800
];

interface IHeroAttribute {
    name: string;
    value: number;
    effectiveValue: number;
    trainingCost: string;
}

class HeroAttribute implements IHeroAttribute {

    public name: string;
    public effectiveValue: number = 0;
    private _value: number = 0;
    private _trainingCost: string;

    constructor(name: string) {
        this.name = name;
    }

    get value() {
        return this._value;
    }

    set value(val: number) {
        this._value = val;
        this._trainingCost = HeroAttribute.getTrainingCost(val);
    }

    get trainingCost() {
        return this._trainingCost;
    }

    static getTrainingCost(value: number) {
        return _attrCosts[value] ? ('' + _attrCosts[value]).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ") : '0';
    }
}
