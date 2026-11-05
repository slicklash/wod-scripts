import { SPECIAL_CONSUMABLES } from "./special-consumables";

export type StorageItem = {
  name: string;
  isUsable: boolean;
  isGroupItem: boolean;
  isConsumable: boolean;
  uses: number;

  numberCell?: HTMLTableCellElement;

  ctrlLocationSelect?: HTMLSelectElement;
  ctrlLocationCheckbox?: HTMLInputElement;
  ctrlSellCheckbox?: HTMLInputElement;
  ctrlGroupCheckbox?: HTMLInputElement;

  price: number;
};

/**
 * Create a StorageItem with default values.
 */
export function createStorageItem(): StorageItem {
  return {
    name: "",
    isUsable: true,
    isGroupItem: true,
    isConsumable: false,
    uses: 1,

    numberCell: undefined,

    ctrlLocationSelect: undefined,
    ctrlLocationCheckbox: undefined,
    ctrlSellCheckbox: undefined,
    ctrlGroupCheckbox: undefined,

    price: 0,
  };
}

/**
 * Check if an item is consumable based on its name.
 */
export function isConsumable(item: StorageItem): boolean {
  if (/^raw /.test(item.name)) return true;
  if (/ seed$/.test(item.name)) return true;
  if (/^reagent:/.test(item.name)) return true;
  if (/^Shard.+of/.test(item.name)) return true;
  if (/^Charm.+of/.test(item.name)) return true;
  if (/^Rune.+of/.test(item.name)) return true;
  if (/^(lesser|greater) emblem of/i.test(item.name)) return true;
  if (SPECIAL_CONSUMABLES.some((x) => x === item.name)) return true;
  return false;
}
