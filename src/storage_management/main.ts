/// <reference path="../common/prototypes/array.ts" />
//
/// <reference path="../common/functions/dom/add.ts" />
/// <reference path="../common/functions/dom/attr.ts" />
/// <reference path="../common/functions/dom/textContent.ts" />

/// <reference path="./storage_item.ts" />
/// <reference path="./nls.ts" />

//TODO: mass sell feature

function getRows(main_content): any[] {

    let scope: any = main_content.querySelectorAll('input[type="submit"][name^="ITEMS_LAGER_DO_SORT"][class*="table_h"]');

    if (!scope || !scope.length) scope = main_content.querySelectorAll('input[type="submit"][name^="ITEMS_KELLER_DO_SORT"][class*="table_h"]');
    if (!scope || !scope.length) scope = main_content.querySelectorAll('input[type="submit"][name^="ITEMS_GROUPCELLAR_DO_SORT"][class*="table_h"]');

    try { scope = scope[0].parentNode.parentNode.parentNode.parentNode; } catch (ex) { scope = null; }

    if (!scope) return [];

    let rows: any[] = scope.querySelectorAll('tbody tr[class="row0"]');

    return rows ? Array.from(rows).concat(Array.from(scope.querySelectorAll('tbody tr[class="row1"]'))) : [];
}

function getItems(rows: any[]): StorageItem[] {

    let items: StorageItem[] = [],
        re_uses  = /\(([0-9]+)\/[0-9]+\)/;

    rows.forEach(row => {

        if (!row || !row.cells || row.cells.length < 2) return;

        // debugger

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
    });

    return items;
}

function buildSelect(options) {

    let select = add('select'),
        option_group;

    options.forEach(x => {

        if (x.key === '---') {
            option_group = add('optgroup');
            attr(option_group, 'label', x.title);
            select.appendChild(option_group);
            return
        }

        let option = add('option');

        attr(option, 'value', x.key).innerHTML = x.title;

        if (option_group) {
            option_group.appendChild(option);
        }
        else {
            select.appendChild(option);
        }

    });

    return select;
}

interface ISelectionOption {
    key: string;
    title: string;
    pick?: boolean;
    predicate?(item: StorageItem): boolean;
    count?: number;
}

function main() {

    let main_content = document.querySelector('#main_content'),
        buttons_commit = main_content ? main_content.querySelectorAll('input[type="submit"][name="ok"][value*="' + _t('Commit') + '"]') : [];

    if (!buttons_commit.length) return;

    let selectOptions: ISelectionOption[] = [
        { key: 'none', title: 'none', pick: false, predicate: x => true },
        { key: '---', title: 'All' },
        { key: 'all', title: 'all', pick: true, predicate: x => true },
        { key: 'all_use', title: 'usable', pick: true, predicate: x => x.isUsable },
        { key: 'all_no_use', title: 'unusable', pick: true, predicate: x => !x.isUsable },
        { key: 'all_group', title: 'group', pick: true, predicate: x => x.isGroupItem },
        { key: 'all_non_group', title: 'non-group', pick: true, predicate: x => !x.isGroupItem },
        { key: '---', title: 'Consumables' },
        { key: 'con', title: 'all', pick: true, predicate: x => x.isConsumable },
        { key: 'con_use', title: 'usable', pick: true, predicate: x => x.isUsable && x.isConsumable },
        { key: 'con_no_use', title: 'unusable', pick: true, predicate: x => !x.isUsable && x.isConsumable },
        { key: 'con_group', title: 'group', pick: true, predicate: x => x.isGroupItem && x.isConsumable },
        { key: 'con_non_group', title: 'non-group', pick: true, predicate: x => !x.isGroupItem && x.isConsumable },
        { key: '---', title: 'Items' },
        { key: 'itm', title: 'all', pick: true, predicate: x => !x.isConsumable },
        { key: 'itm_use', title: 'usable', pick: true, predicate: x => x.isUsable && !x.isConsumable },
        { key: 'itm_no_use', title: 'unusable', pick: true, predicate: x => !x.isUsable && !x.isConsumable },
        { key: 'itm_group', title: 'group', pick: true, predicate: x => x.isGroupItem && !x.isConsumable },
        { key: 'itm_non_group', title: 'non-group', pick: true, predicate: x => !x.isGroupItem && !x.isConsumable },
    ];

    let sellOptions: ISelectionOption[] = [
        { key: 'none', title: 'none', pick: false, predicate: x => true },
        { key: '---', title: 'All' },
        { key: 'all', title: 'all', pick: true, predicate: x => true },
        { key: 'all_use', title: 'usable', pick: true, predicate: x => x.isUsable },
        { key: 'all_no_use', title: 'unusable', pick: true, predicate: x => !x.isUsable },
        { key: '---', title: 'Consumables' },
        { key: 'con', title: 'all', pick: true, predicate: x => x.isConsumable },
        { key: 'con_use', title: 'usable', pick: true, predicate: x => x.isUsable && x.isConsumable },
        { key: 'con_no_use', title: 'unusable', pick: true, predicate: x => !x.isUsable && x.isConsumable },
        { key: '---', title: 'Items' },
        { key: 'itm', title: 'all', pick: true, predicate: x => !x.isConsumable },
        { key: 'itm_use', title: 'usable', pick: true, predicate: x => x.isUsable && x.isConsumable },
        { key: 'itm_no_use', title: 'unusable', pick: true, predicate: x => !x.isUsable && !x.isConsumable },
    ];

    // TODO: include count info in options

    let items: StorageItem[] = getItems(getRows(main_content));

    if (!items.length) return;

    let labelSellInfo = add('span'),
        labelSellInfo2 = labelSellInfo.cloneNode(true),
        selectedCount: number = 0,
        sellCount: number = 0,
        sellSum: number = 0;

    let onSelectChanged = function(e) {
        let option = selectOptions.find(x => x.key === e.target.value);

        for (let item of items) {
            if (item.ctrlSelect && option.predicate(item)) {
                item.ctrlSelect.checked = option.pick;
            }
        }

    };

    let onSellChanged = function(e) {
        let option = sellOptions.find(x => x.key === e.target.value);

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

        let sellInfo = sellCount > 1 ? `&nbsp;${sellCount} (${sellSum} <img alt="" border="0" src="/wod/css//skins/skin-2/images/icons/lang/en/gold.gif" title="gold">)` : '';

        labelSellInfo.innerHTML = sellInfo;
        labelSellInfo2.innerHTML = sellInfo;
    };

    let go_gs = 'go_group_2',
        go_tv = 'go_group';

    if (items.length > 0 && items[0].ctrlLocation) {
        let ops = items[0].ctrlLocation.options;
        for (let i = 0, cnt = ops.length; i < cnt; i++) {
            let op = ops[i].value;
            if (op === '-go_group_2') { go_gs = '-go_group_2'; break; }
            if (op === '-go_group')   { go_tv = '-go_group'; break; }
        }
    }

    let onSplit = function() {
        let ok = false,
            tmp = [], i, cnt, obj;
        for (i = 0, cnt = items.length; i < cnt; i++) {
            obj = items[i];
            if (obj.ctrlLocation && obj.ctrlSelect) {
                if (obj.ctrlSelect.checked) {
                    obj.ctrlLocation.value = !obj.isConsumable ? go_tv : go_gs;
                    ok = true;
                }
                else {
                    tmp.push(obj);
                }
            }
        }
        if (!ok) {
            for (i = 0, cnt = tmp.length; i < cnt; i++) {
                obj = tmp[i];
                obj.ctrlLocation.value = !obj.isConsumable ? go_tv : go_gs;
            }
        }
    };

    let onEquip = function() {
        let ok = false,
            tmp = [], i, cnt, obj;
        for (i = 0, cnt = items.length; i < cnt; i++) {
            obj = items[i];
            if (obj.usable && obj.ctrlLocation && obj.ctrlSelect) {
                if (obj.ctrlSelect.checked) {
                    obj.ctrlLocation.value = obj.ctrlLocation.options[0].value;
                    ok = true;
                }
                else {
                    tmp.push(obj);
                }
            }
        }
        if (!ok) {
            for (i = 0, cnt = tmp.length; i < cnt; i++) {
                obj = tmp[i];
                obj.ctrlLocation.value = obj.ctrlLocation.options[0].value;
            }
        }
    };

    let labelMove = add('span'),
        labelSell = add('span'),
        buttonSplit = add('input'),
        buttonEquip = add('input'),
        selectForLocation = buildSelect(selectOptions),
        selectForSell = buildSelect(sellOptions);

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
}

main();
