/// <reference path="./special_consumables.ts" />

class StorageItem {

    public name = '';

    public isUsable = true;

    public isGroupItem = true;

    private _isConsumbale = false;

    public ctrlSelect = null;
    public ctrlLocation = null;
    public ctrlSell = null;

    get isConsumable(): boolean {
        if (this._isConsumbale) return true;
        if (/^raw /.test(this.name)) return true;
        if (/ seed$/.test(this.name)) return true;
        if (/^reagent:/.test(this.name)) return true;
        if (/^(lesser|greater) emblem of/i.test(this.name)) return true;
        if (SPECIAL_CONSUMABLES.some(x => x === this.name)) return true;
        return false;
    }

    set isConsumable(value) {
        this._isConsumbale = value;
    }
}
