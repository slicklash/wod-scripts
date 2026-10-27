import { SPECIAL_CONSUMABLES } from "./special-consumables";

export class StorageItem {
  name = "";
  isUsable = true;
  uses: number = 1;
  isGroupItem = true;
  _isConsumable = false;

  numberCell?: HTMLTableCellElement;

  ctrlLocationSelect?: HTMLSelectElement;
  ctrlLocationCheckbox?: HTMLInputElement;
  ctrlSellCheckbox?: HTMLInputElement;
  ctrlGroupCheckbox?: HTMLInputElement;

  price: number = 0;

  get isConsumable(): boolean {
    if (this._isConsumable) return true;
    if (/^raw /.test(this.name)) return true;
    if (/ seed$/.test(this.name)) return true;
    if (/^reagent:/.test(this.name)) return true;
    if (/^Shard.+of/.test(this.name)) return true;
    if (/^Charm.+of/.test(this.name)) return true;
    if (/^Rune.+of/.test(this.name)) return true;
    if (/^(lesser|greater) emblem of/i.test(this.name)) return true;
    if (SPECIAL_CONSUMABLES.some((x) => x === this.name)) return true;
    return false;
  }

  set isConsumable(value) {
    this._isConsumable = value;
  }
}
