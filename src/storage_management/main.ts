/// <reference path="../common/prototypes/array.ts" />
//
/// <reference path="../common/functions/dom/add.ts" />
/// <reference path="../common/functions/dom/attr.ts" />
/// <reference path="../common/functions/dom/text-content.ts" />

/// <reference path="./storage-item.ts" />
/// <reference path="./nls.ts" />

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
                if (item.ctrlLocation) option.count = option.count ? option.count + 1 : 1;
                if (item.ctrlSell) option.countSell = option.countSell ? option.countSell + 1 : 1;
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
    { key: 'all', title: 'all', pick: true, predicate: x => true, count: 0, countSell: 0 },
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

    let main_content = document.querySelector('#main_content'),
        buttons_commit = main_content ? main_content.querySelectorAll('input[type="submit"][name="ok"][value*="' + _t('Commit') + '"]') : [];

    if (buttons_commit.length < 2) return;

    let items: StorageItem[] = [];

    let labelSellInfo = add('span'),
        labelSellInfo2 = labelSellInfo.cloneNode(true),
        selectedCount: number = 0,
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

        labelSellInfo.innerHTML = sellInfo;
        labelSellInfo2.innerHTML = sellInfo;
    };

    let isGroupStorage = window.location.href.indexOf('groupcellar_2') > -1,
        isGroupTv = window.location.href.indexOf('groupcellar') > -1 && !isGroupStorage,
        go_tv = isGroupTv ? '-go_group' : 'go_group',
        go_gs = isGroupStorage ? '-go_group_2' : 'go_group_2';

    let onSplit = () => {

        if (!items.length) return;

        let onlySelected = false,
            tmp = [];

        for (let item of items) {
            if (item.ctrlLocation && item.ctrlSelect) {
                if (item.ctrlSelect.checked) {
                    item.ctrlLocation.value = !item.isConsumable ? go_tv : go_gs;
                    onlySelected = true;
                }
                else {
                    tmp.push(item);
                }
            }
        }

        if (!onlySelected) {
            tmp.forEach(x => { x.ctrlLocation.value = !x.isConsumable ? go_tv : go_gs });
        }
    };

    let onEquip = () => {

        if (!items.length) return;

        let onlySelected = false,
            tmp = [];

        for (let item of items) {
            if (item.isUsable && item.ctrlLocation && item.ctrlSelect) {
                if (item.ctrlSelect.checked) {
                    item.ctrlLocation.value = item.ctrlLocation.options[0].value;
                    onlySelected = true;
                }
                else {
                    tmp.push(item);
                }
            }
        }

        if (!onlySelected) {
            tmp.forEach(x => { x.ctrlLocation.value = x.ctrlLocation.options[0].value });
        }
    };

    let labelMove = add('span'),
        labelSell = add('span'),
        buttonSplit = add('input'),
        buttonEquip = add('input'),
        selectForLocation = add('select'),
        selectForSell = add('select'),
        none: ISelectionOption = { key: 'none', title: 'none', pick: false, predicate: x => true };

    addOption(none, selectForLocation);
    addOption(none, selectForSell);

    attr(selectForLocation, { 'style': 'min-width: 140px' });
    attr(selectForSell, { 'style': 'min-width: 120px' });

    selectForLocation.disabled = true;
    selectForSell.disabled = true;

    labelMove.innerHTML = '&nbsp;Select:&nbsp;';
    labelSell.innerHTML = '&nbsp;Sell:&nbsp;';
    attr(buttonSplit, {'type': 'button', 'class': 'button clickable', 'name': 'buttonSplit', 'value': 'Split', 'style': 'margin-left: 5px'});
    attr(buttonEquip, {'type': 'button', 'class': 'button clickable', 'name': 'buttonEquip', 'value': 'Equip', 'style': 'margin-left: 5px'});

    let holder = buttons_commit[0].parentNode,
        buttonSplit2 = buttonSplit.cloneNode(true),
        buttonEquip2 = buttonEquip.cloneNode(true),
        labelSell2   = labelSell.cloneNode(true),
        labelMove2   = labelMove.cloneNode(true),
        selectForSell2  = selectForSell.cloneNode(true),
        selectForLocation2  = selectForLocation.cloneNode(true);

    selectForLocation.addEventListener('change', onSelectChanged, false);
    selectForLocation2.addEventListener('change', onSelectChanged, false);

    selectForSell.addEventListener('change', onSellChanged, false);
    selectForSell2.addEventListener('change', onSellChanged, false);

    buttonSplit.addEventListener('click', onSplit, false);
    buttonSplit2.addEventListener('click', onSplit, false);

    buttonEquip.addEventListener('click', onEquip, false);
    buttonEquip2.addEventListener('click', onEquip, false);

    holder.insertBefore(labelMove, buttons_commit[0].nextSibling);
    holder.insertBefore(selectForLocation, labelMove.nextSibling);
    holder.insertBefore(buttonSplit, selectForLocation.nextSibling);
    holder.insertBefore(buttonEquip, buttonSplit.nextSibling);
    holder.insertBefore(labelSell, buttonEquip.nextSibling);
    holder.insertBefore(selectForSell, labelSell.nextSibling);
    holder.insertBefore(labelSellInfo, selectForSell.nextSibling);

    holder = buttons_commit[1].parentNode;
    holder.insertBefore(labelMove2, buttons_commit[1].nextSibling);
    holder.insertBefore(selectForLocation2, labelMove2.nextSibling);
    holder.insertBefore(buttonSplit2, selectForLocation2.nextSibling);
    holder.insertBefore(buttonEquip2, buttonSplit2.nextSibling);
    holder.insertBefore(labelSell2, buttonEquip2.nextSibling);
    holder.insertBefore(selectForSell2, labelSell2.nextSibling);
    holder.insertBefore(labelSellInfo2, selectForSell2.nextSibling);

    setTimeout(() => {

        items = getItems(getRows(main_content), options);

        addOptions(options, selectForLocation);
        addOptions(options, selectForLocation2);

        let optionsForSell = options.filter(x => !x.notForSell);
        addOptions(optionsForSell, selectForSell, true);
        addOptions(optionsForSell, selectForSell2, true);

        options.splice(0, 0, none);

        selectForLocation.disabled = false;
        selectForLocation2.disabled = false;
        selectForSell.disabled = false;
        selectForSell2.disabled = false;

    }, 0);
}

document.addEventListener('DOMContentLoaded', main);
