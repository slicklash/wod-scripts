import { SPECIAL_CONSUMABLES } from './special-consumables'

export class StorageItem {

    public name = '';

    public isUsable = true;

    public uses: number = 1;

    public isGroupItem = true;

    private _isConsumbale = false;

    public ctrlLocationSelect: HTMLSelectElement = null;
    public ctrlLocationCheckbox: HTMLInputElement = null;
    public ctrlSellCheckbox: HTMLInputElement = null;

    public price: number = 0;

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
