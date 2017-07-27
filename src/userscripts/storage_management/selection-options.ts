import { StorageItem } from  './storage-item'

export interface ISelectionOption {
    key: string;
    title: string;
    pick?: boolean;
    predicate?(item: StorageItem): boolean;
    notForSell?: boolean;
    count?: number;
    countSell?: number;
}

export var SELECTION_OPTIONS: ISelectionOption[] = [
    { key: 'none', title: 'none', pick: false, predicate: () => true },
    { key: '---', title: 'All' },
    { key: 'all', title: 'all', pick: true, predicate: () => true, count: 0, countSell: 0 },
    { key: 'all_use', title: 'usable', pick: true, predicate: x => x.isUsable, count: 0, countSell: 0 },
    { key: 'all_no_use', title: 'unusable', pick: true, predicate: x => !x.isUsable, count: 0, countSell: 0 },
    { key: 'all_group', title: 'group', pick: true, predicate: x => x.isGroupItem, notForSell: true, count: 0, countSell: 0 },
    { key: 'all_non_group', title: 'non-group', pick: true, predicate: x => !x.isGroupItem, notForSell: true, count: 0, countSell: 0 },
    { key: '---', title: 'Consumables' },
    { key: 'con', title: 'all', pick: true, predicate: x => x.isConsumable, count: 0, countSell: 0 },
    { key: 'con_use', title: 'usable', pick: true, predicate: x => x.isUsable && x.isConsumable, count: 0, countSell: 0 },
    { key: 'con_no_use', title: 'unusable', pick: true, predicate: x => !x.isUsable && x.isConsumable, count: 0, countSell: 0 },
    { key: 'con_group', title: 'group', pick: true, predicate: x => x.isGroupItem && x.isConsumable, notForSell: true, count: 0, countSell: 0 },
    { key: 'con_non_group', title: 'non-group', pick: true, predicate: x => !x.isGroupItem && x.isConsumable, notForSell: true, count: 0, countSell: 0 },
    { key: '---', title: 'Items' },
    { key: 'itm', title: 'all', pick: true, predicate: x => !x.isConsumable, count: 0, countSell: 0 },
    { key: 'itm_use', title: 'usable', pick: true, predicate: x => x.isUsable && !x.isConsumable, count: 0, countSell: 0 },
    { key: 'itm_no_use', title: 'unusable', pick: true, predicate: x => !x.isUsable && !x.isConsumable, count: 0, countSell: 0 },
    { key: 'itm_group', title: 'group', pick: true, predicate: x => x.isGroupItem && !x.isConsumable, notForSell: true, count: 0, countSell: 0 },
    { key: 'itm_non_group', title: 'non-group', pick: true, predicate: x => !x.isGroupItem && !x.isConsumable, notForSell: true, count: 0, countSell: 0 },
];
