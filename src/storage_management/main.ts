/// <reference path="../../lib/typings/browser.d.ts" />

import { add } from '../common/functions/dom/add'
import { attr } from '../common/functions/dom/attr'
import { textContent } from '../common/functions/dom/text-content'
import { insertAfter } from '../common/functions/dom/insert-after'

import { StorageItem } from './storage-item'
import { _t } from './nls'

function getRows(main_content): any[] {

    let scope: any = main_content.querySelectorAll('input[type="submit"][name^="ITEMS_LAGER_DO_SORT"][class*="table_h"]');

    if (!scope || !scope.length) scope = main_content.querySelectorAll('input[type="submit"][name^="ITEMS_KELLER_DO_SORT"][class*="table_h"]');
    if (!scope || !scope.length) scope = main_content.querySelectorAll('input[type="submit"][name^="ITEMS_GROUPCELLAR_DO_SORT"][class*="table_h"]');

    try { scope = scope[0].parentNode.parentNode.parentNode.parentNode; } catch (ex) { scope = null; }

    if (!scope) return [];

    let rows: any[] = scope.querySelectorAll('tbody tr[class="row0"]');

    return rows ? Array.from(rows).concat(Array.from(scope.querySelectorAll('tbody tr[class="row1"]'))) : [];
}

interface ISelectionOption {
    key: string;
    title: string;
    pick?: boolean;
    predicate?(item: StorageItem): boolean;
    notForSell?: boolean;
    count?: number;
    countSell?: number;
}

function getItems(rows: any[], options: ISelectionOption[]): StorageItem[] {

    let items: StorageItem[] = [],
        re_uses  = /\(([0-9]+)\/[0-9]+\)/;

    rows.forEach(row => {

        if (!row || !row.cells || row.cells.length < 2) return;

        let cells         = row.cells,
            link          = cells[1].querySelector('a'),
            name          = textContent(link).replace(/!$/,''),
            size          = textContent(cells[1]).replace(name, '').trim(),
            tooltip       = link ? attr(link, 'onmouseover') : false,
            classes       = link ? attr(link, 'class') : '',
            ctrl_select   = cells.length > 2 ? cells[2].querySelector('input[type="checkbox"][name^="doEquip"]') : null,
            ctrl_location = cells.length > 2 ? cells[2].querySelector('select') : null,
            ctrl_sell     = cells.length > 3 ? cells[3].querySelector('input[type="checkbox"][name^="Sell"]') : null,
            value         = cells.length > 3 ? Number(cells[3].textContent.trim()): 0,
            item          = new StorageItem();

        if (!ctrl_sell && cells.length > 4) {
            ctrl_sell = cells[4].querySelector('input[type="checkbox"]');
            value = Number(cells[4].textContent.trim());
        }

        item.name = name;

        item.isConsumable = re_uses.test(size);
        item.isUsable = classes.indexOf('item_unusable') === -1;
        item.isGroupItem = tooltip ? tooltip.indexOf('group item') > -1 : false;

        item.ctrlSelect = ctrl_select;
        item.ctrlLocation = ctrl_location;
        item.ctrlSell = ctrl_sell;

        item.value = value;

        items.push(item);

        for (let option of options) {
            if (option.predicate && option.predicate(item)) {
                if (item.ctrlLocation) option.count = (option.count || 0) + 1;
                if (item.ctrlSell) option.countSell = (option.countSell || 0) + 1;
            }
        }

    });

    return items;
}

function addOption(option: ISelectionOption, select, sellable?: boolean, option_group?) {

    let op = add('option');

    attr(op, 'value', option.key).innerHTML = option.key === 'none'? 'none' : sellable ? `${option.title} (${option.countSell})` : `${option.title} (${option.count})`;

    if (option_group) {
        option_group.appendChild(op);
    }
    else {
        select.appendChild(op);
    }
}

function addOptions(options, select, sellable?: boolean) {

    let option_group;

    options.forEach(x => {

        if (x.key === '---') {
            option_group = add('optgroup');
            attr(option_group, 'label', x.title);
            select.appendChild(option_group);
            return
        }

        addOption(x, select, sellable, option_group);

    });

    return select;
}

let options: ISelectionOption[] = [
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

function main() {

    if (document.querySelector('[name^="LocationEquip"]'))
        return;

    let main_content = document.querySelector('#main_content'),
        buttons_commit = main_content ? main_content.querySelectorAll('input[type="submit"][name="ok"][value*="' + _t('Commit') + '"]') : [];

    let items: StorageItem[] = [];

    let labelsSellInfo = [],
        sellCount: number = 0,
        sellSum: number = 0;

    let onSelectChanged = (e) => {
        let option = options.find(x => x.key === e.target.value);

        for (let item of items) {
            if (item.ctrlSelect && option.predicate(item)) {
                item.ctrlSelect.checked = option.pick;
            }
        }
    };

    let onSellChanged = (e) => {
        let option = options.find(x => x.key === e.target.value);

        if (option.key === 'none') {
            sellSum = 0;
            sellCount = 0;
        }

        for (let item of items) {
            if (item.ctrlSell && option.predicate(item)) {
                item.ctrlSell.checked = option.pick;
                if (option.pick) {
                    sellCount++;
                    sellSum += item.value;
                }
            }
        }

        let sellInfo = sellCount > 0 ? `&nbsp;${sellCount} (${sellSum} <img alt="" border="0" src="/wod/css//skins/skin-2/images/icons/lang/en/gold.gif" title="gold">)` : '';

        labelsSellInfo.forEach(x => { x.innerHTML = sellInfo });
    };

    let isGroupStorage = window.location.href.indexOf('groupcellar_2') > -1,
        isGroupTv = window.location.href.indexOf('groupcellar') > -1 && !isGroupStorage,
        go_tv = isGroupTv ? '-go_group' : 'go_group',
        go_gs = isGroupStorage ? '-go_group_2' : 'go_group_2';

    const moveItemToCellar = (x: StorageItem) => { x.ctrlLocation.value = 'go_keller'; };
    const splitItem = (x: StorageItem) => { x.ctrlLocation.value = !x.isConsumable ? go_tv : go_gs; if (!x.ctrlLocation.value) moveItemToCellar(x); };
    const equipItem = (x: StorageItem) => { x.ctrlLocation.value = x.ctrlLocation.options[0].value; };

    let actions = {
       split:  { predicate: (x: StorageItem) => x.ctrlLocation && x.ctrlSelect, handler: splitItem },
       cellar: { predicate: (x: StorageItem) => x.ctrlLocation && x.ctrlSelect, handler: moveItemToCellar },
       equip:  { predicate: (x: StorageItem) => x.isUsable && x.ctrlLocation && x.ctrlSelect, handler: equipItem },
    };

    let onAction = function ({predicate, handler}) {

        if (!items.length) return;

        let onlySelected = false,
            tmp = [];

        for (let item of items) {
            if (predicate(item)) {
                if (item.ctrlSelect.checked) {
                    handler(item);
                    onlySelected = true;
                }
                else {
                    tmp.push(item);
                }
            }
        }

        if (!onlySelected) {
            tmp.forEach(handler);
        }
    }

    let onSplit = onAction.bind(this, actions.split);
    let onCellar = onAction.bind(this, actions.cellar);
    let onEquip = onAction.bind(this, actions.equip);

    let selectsForLocation = [];
    let selectsForSell = [];
    let none: ISelectionOption = { key: 'none', title: 'none', pick: false, predicate: () => true };

    const makeLabel = (text: string) => { let label = add('span'); label.innerHTML = `&nbsp;${text}&nbsp;`; return label; }

    const makeButton = (text: string, onClick: Function) => {
        let btn = add('input');
        attr(btn, {'type': 'button', 'class': 'button clickable', 'name': `button${text}`, 'value': `${text}`, 'style': 'margin-left: 5px'});
        btn.addEventListener('click', onClick, false);
        return btn;
    }

    const makeSelect = (width: number, onSelect: Function) => {
        let select = add('select');
        addOption(none, select);
        attr(select, { 'style': `min-width: ${width}px` });
        select.disabled = true;
        select.addEventListener('change', onSelect, false);
        return select;
    }

    for (let i = 0; i < 2; i++) {

        let labelMove = makeLabel('Select'),
            labelSell = makeLabel('Selll'),
            buttonSplit = makeButton('Split', onSplit),
            buttonCellar = makeButton('Cellar', onCellar),
            buttonEquip = makeButton('Equip', onEquip),
            selectForLocation = makeSelect(140, onSelectChanged),
            selectForSell = makeSelect(120, onSellChanged),
            labelSellInfo = add('span');

        selectsForLocation.push(selectForLocation);
        selectsForSell.push(selectForSell);
        labelsSellInfo.push(labelSellInfo);

        insertAfter(buttons_commit[i],
                    labelMove,
                    selectForLocation,
                    buttonSplit,
                    buttonCellar,
                    buttonEquip,
                    labelSell,
                    selectForSell,
                    labelSellInfo);
    }

    setTimeout(() => {

        items = getItems(getRows(main_content), options);

        selectsForLocation.forEach(x => { addOptions(options, x) });

        let optionsForSell = options.filter(x => !x.notForSell);
        selectsForSell.forEach(x => { addOptions(optionsForSell, x, true) });

        options.splice(0, 0, none);

        selectsForLocation.concat(selectsForSell).forEach(x => { x.disabled = false });

    }, 0);
}

if (!(<any>window).__karma__) document.addEventListener('DOMContentLoaded', () => main());
