import { SPECIAL_CONSUMABLES } from './special-consumables';

export class StorageItem {

    name = '';
    isUsable = true;
    uses: number = 1;
    isGroupItem = true;
    _isConsumbale = false;

    ctrlLocationSelect: HTMLSelectElement = null;
    ctrlLocationCheckbox: HTMLInputElement = null;
    ctrlSellCheckbox: HTMLInputElement = null;
    ctrlGroupCheckbox: HTMLInputElement = null;

    price: number = 0;

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
