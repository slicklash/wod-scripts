// ==UserScript==
// @name           Storage Management
// @description    Adds additional functionality for storage management
// @version        1.2.3
// @author         Never
// @include        http*://*.world-of-dungeons.*/wod/spiel/hero/items.php*
// @run-at         document-start
// @grant          none
// ==/UserScript==

(function() {
'use strict';
var add = function (tag, parentNode) {
    var elem = typeof tag === 'string' ? document.createElement(tag) : tag;
    if (parentNode && parentNode.nodeType) {
        parentNode.appendChild(elem);
    }
    return elem;
};
var attr = function (elem, nameOrMap, value, remove) {
    if (remove) {
        elem.removeAttribute(nameOrMap);
    }
    else if (typeof nameOrMap === 'object') {
        Object.keys(nameOrMap).forEach(function (key) { elem.setAttribute(key, nameOrMap[key]); });
    }
    else if (value) {
        elem.setAttribute(nameOrMap, value);
    }
    else {
        return elem.getAttribute(nameOrMap);
    }
    return elem;
};
var insertAfter = function (node) {
    var elems = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        elems[_i - 1] = arguments[_i];
    }
    var parent = node.parentNode;
    elems.forEach(function (elem) {
        parent.insertBefore(elem, node.nextSibling);
        node = elem;
    });
};
var textContent = function (elem, value) {
    if (!elem)
        return '';
    if (typeof value === 'undefined') {
        return elem.textContent;
    }
    elem.textContent = value;
};
var SPECIAL_CONSUMABLES = [
    'aloe plant',
    'bat toy',
    'carded cotton',
    'certified acorn',
    'fireweed plant',
    'glass ring',
    'glass wand',
    'goose feather',
    'gum tragacanth',
    'iron ingot',
    'lump of coal',
    'oak gall',
    'oak tree',
    'origami elf',
    'origami flying crane',
    'origami harpsichord',
    'origami mongoose',
    'origami standing crane',
    'pouch of sand',
    'rice paper',
    'ruby shard',
    'set of glass vials',
    'small carnelian',
    'small citrine fragment',
    'small emerald fragment',
    'small lapis lazuli fragment',
    'small malachite fragment',
    'small turquoise',
    'steel bar',
    'steel hilt',
    'stingweed plant',
    'supple leather',
    'tragacanth plant',
    'trollbeard plant',
    'wooden handle',
    'wooden log',
    'wooden pole'
];
var StorageItem = (function () {
    function StorageItem() {
        this.name = '';
        this.isUsable = true;
        this.isGroupItem = true;
        this._isConsumbale = false;
        this.ctrlSelect = null;
        this.ctrlLocation = null;
        this.ctrlSell = null;
        this.value = 0;
    }
    Object.defineProperty(StorageItem.prototype, "isConsumable", {
        get: function () {
            var _this = this;
            if (this._isConsumbale)
                return true;
            if (/^raw /.test(this.name))
                return true;
            if (/ seed$/.test(this.name))
                return true;
            if (/^reagent:/.test(this.name))
                return true;
            if (/^(lesser|greater) emblem of/i.test(this.name))
                return true;
            if (SPECIAL_CONSUMABLES.some(function (x) { return x === _this.name; }))
                return true;
            return false;
        },
        set: function (value) {
            this._isConsumbale = value;
        },
        enumerable: true,
        configurable: true
    });
    return StorageItem;
}());
var _t;
if (location.href.indexOf('.net') > 0) {
    _t = function (text) { return text; };
}
else {
    _t = function (text) { return text === 'Commit' ? 'nderungen' : text; };
}
function getRows(main_content) {
    var scope = main_content.querySelectorAll('input[type="submit"][name^="ITEMS_LAGER_DO_SORT"][class*="table_h"]');
    if (!scope || !scope.length)
        scope = main_content.querySelectorAll('input[type="submit"][name^="ITEMS_KELLER_DO_SORT"][class*="table_h"]');
    if (!scope || !scope.length)
        scope = main_content.querySelectorAll('input[type="submit"][name^="ITEMS_GROUPCELLAR_DO_SORT"][class*="table_h"]');
    try {
        scope = scope[0].parentNode.parentNode.parentNode.parentNode;
    }
    catch (ex) {
        scope = null;
    }
    if (!scope)
        return [];
    var rows = scope.querySelectorAll('tbody tr[class="row0"]');
    return rows ? Array.from(rows).concat(Array.from(scope.querySelectorAll('tbody tr[class="row1"]'))) : [];
}
function getItems(rows, options) {
    var items = [], re_uses = /\(([0-9]+)\/[0-9]+\)/;
    rows.forEach(function (row) {
        if (!row || !row.cells || row.cells.length < 2)
            return;
        var cells = row.cells, link = cells[1].querySelector('a'), name = textContent(link).replace(/!$/, ''), size = textContent(cells[1]).replace(name, '').trim(), tooltip = link ? attr(link, 'onmouseover') : false, classes = link ? attr(link, 'class') : '', ctrl_select = cells.length > 2 ? cells[2].querySelector('input[type="checkbox"][name^="doEquip"]') : null, ctrl_location = cells.length > 2 ? cells[2].querySelector('select') : null, ctrl_sell = cells.length > 3 ? cells[3].querySelector('input[type="checkbox"][name^="Sell"]') : null, value = cells.length > 3 ? Number(cells[3].textContent.trim()) : 0, item = new StorageItem();
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
        for (var _i = 0, options_1 = options; _i < options_1.length; _i++) {
            var option = options_1[_i];
            if (option.predicate && option.predicate(item)) {
                if (item.ctrlLocation)
                    option.count = (option.count || 0) + 1;
                if (item.ctrlSell)
                    option.countSell = (option.countSell || 0) + 1;
            }
        }
    });
    return items;
}
function addOption(option, select, sellable, option_group) {
    var op = add('option');
    attr(op, 'value', option.key).innerHTML = option.key === 'none' ? 'none' : sellable ? option.title + " (" + option.countSell + ")" : option.title + " (" + option.count + ")";
    if (option_group) {
        option_group.appendChild(op);
    }
    else {
        select.appendChild(op);
    }
}
function addOptions(options, select, sellable) {
    var option_group;
    options.forEach(function (x) {
        if (x.key === '---') {
            option_group = add('optgroup');
            attr(option_group, 'label', x.title);
            select.appendChild(option_group);
            return;
        }
        addOption(x, select, sellable, option_group);
    });
    return select;
}
var options = [
    { key: '---', title: 'All' },
    { key: 'all', title: 'all', pick: true, predicate: function (x) { return true; }, count: 0, countSell: 0 },
    { key: 'all_use', title: 'usable', pick: true, predicate: function (x) { return x.isUsable; }, count: 0, countSell: 0 },
    { key: 'all_no_use', title: 'unusable', pick: true, predicate: function (x) { return !x.isUsable; }, count: 0, countSell: 0 },
    { key: 'all_group', title: 'group', pick: true, predicate: function (x) { return x.isGroupItem; }, notForSell: true, count: 0, countSell: 0 },
    { key: 'all_non_group', title: 'non-group', pick: true, predicate: function (x) { return !x.isGroupItem; }, notForSell: true, count: 0, countSell: 0 },
    { key: '---', title: 'Consumables' },
    { key: 'con', title: 'all', pick: true, predicate: function (x) { return x.isConsumable; }, count: 0, countSell: 0 },
    { key: 'con_use', title: 'usable', pick: true, predicate: function (x) { return x.isUsable && x.isConsumable; }, count: 0, countSell: 0 },
    { key: 'con_no_use', title: 'unusable', pick: true, predicate: function (x) { return !x.isUsable && x.isConsumable; }, count: 0, countSell: 0 },
    { key: 'con_group', title: 'group', pick: true, predicate: function (x) { return x.isGroupItem && x.isConsumable; }, notForSell: true, count: 0, countSell: 0 },
    { key: 'con_non_group', title: 'non-group', pick: true, predicate: function (x) { return !x.isGroupItem && x.isConsumable; }, notForSell: true, count: 0, countSell: 0 },
    { key: '---', title: 'Items' },
    { key: 'itm', title: 'all', pick: true, predicate: function (x) { return !x.isConsumable; }, count: 0, countSell: 0 },
    { key: 'itm_use', title: 'usable', pick: true, predicate: function (x) { return x.isUsable && !x.isConsumable; }, count: 0, countSell: 0 },
    { key: 'itm_no_use', title: 'unusable', pick: true, predicate: function (x) { return !x.isUsable && !x.isConsumable; }, count: 0, countSell: 0 },
    { key: 'itm_group', title: 'group', pick: true, predicate: function (x) { return x.isGroupItem && !x.isConsumable; }, notForSell: true, count: 0, countSell: 0 },
    { key: 'itm_non_group', title: 'non-group', pick: true, predicate: function (x) { return !x.isGroupItem && !x.isConsumable; }, notForSell: true, count: 0, countSell: 0 },
];
function main() {
    if (document.querySelector('[name^="LocationEquip"]'))
        return;
    var main_content = document.querySelector('#main_content'), buttons_commit = main_content ? main_content.querySelectorAll('input[type="submit"][name="ok"][value*="' + _t('Commit') + '"]') : [];
    var items = [];
    var labelsSellInfo = [], selectedCount = 0, sellCount = 0, sellSum = 0;
    var onSelectChanged = function (e) {
        var option = options.find(function (x) { return x.key === e.target.value; });
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            if (item.ctrlSelect && option.predicate(item)) {
                item.ctrlSelect.checked = option.pick;
            }
        }
    };
    var onSellChanged = function (e) {
        var option = options.find(function (x) { return x.key === e.target.value; });
        if (option.key === 'none') {
            sellSum = 0;
            sellCount = 0;
        }
        for (var _i = 0, items_2 = items; _i < items_2.length; _i++) {
            var item = items_2[_i];
            if (item.ctrlSell && option.predicate(item)) {
                item.ctrlSell.checked = option.pick;
                if (option.pick) {
                    sellCount++;
                    sellSum += item.value;
                }
            }
        }
        var sellInfo = sellCount > 0 ? "&nbsp;" + sellCount + " (" + sellSum + " <img alt=\"\" border=\"0\" src=\"/wod/css//skins/skin-2/images/icons/lang/en/gold.gif\" title=\"gold\">)" : '';
        labelsSellInfo.forEach(function (x) { x.innerHTML = sellInfo; });
    };
    var isGroupStorage = window.location.href.indexOf('groupcellar_2') > -1, isGroupTv = window.location.href.indexOf('groupcellar') > -1 && !isGroupStorage, go_tv = isGroupTv ? '-go_group' : 'go_group', go_gs = isGroupStorage ? '-go_group_2' : 'go_group_2';
    var moveItemToCellar = function (x) { x.ctrlLocation.value = 'go_keller'; };
    var splitItem = function (x) { x.ctrlLocation.value = !x.isConsumable ? go_tv : go_gs; if (!x.ctrlLocation.value)
        moveItemToCellar(x); };
    var equipItem = function (x) { x.ctrlLocation.value = x.ctrlLocation.options[0].value; };
    var actions = {
        split: { predicate: function (x) { return x.ctrlLocation && x.ctrlSelect; }, handler: splitItem },
        cellar: { predicate: function (x) { return x.ctrlLocation && x.ctrlSelect; }, handler: moveItemToCellar },
        equip: { predicate: function (x) { return x.isUsable && x.ctrlLocation && x.ctrlSelect; }, handler: equipItem },
    };
    var onAction = function (_a) {
        var predicate = _a.predicate, handler = _a.handler;
        if (!items.length)
            return;
        var onlySelected = false, tmp = [];
        for (var _i = 0, items_3 = items; _i < items_3.length; _i++) {
            var item = items_3[_i];
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
    };
    var onSplit = onAction.bind(this, actions.split);
    var onCellar = onAction.bind(this, actions.cellar);
    var onEquip = onAction.bind(this, actions.equip);
    var selectsForLocation = [];
    var selectsForSell = [];
    var none = { key: 'none', title: 'none', pick: false, predicate: function (x) { return true; } };
    var makeLabel = function (text) { var label = add('span'); label.innerHTML = "&nbsp;" + text + "&nbsp;"; return label; };
    var makeButton = function (text, onClick) {
        var btn = add('input');
        attr(btn, { 'type': 'button', 'class': 'button clickable', 'name': "button" + text, 'value': "" + text, 'style': 'margin-left: 5px' });
        btn.addEventListener('click', onClick, false);
        return btn;
    };
    var makeSelect = function (width, onSelect) {
        var select = add('select');
        addOption(none, select);
        attr(select, { 'style': "min-width: " + width + "px" });
        select.disabled = true;
        select.addEventListener('change', onSelect, false);
        return select;
    };
    for (var i = 0; i < 2; i++) {
        var labelMove = makeLabel('Select'), labelSell = makeLabel('Selll'), buttonSplit = makeButton('Split', onSplit), buttonCellar = makeButton('Cellar', onCellar), buttonEquip = makeButton('Equip', onEquip), selectForLocation = makeSelect(140, onSelectChanged), selectForSell = makeSelect(120, onSellChanged), labelSellInfo = add('span');
        selectsForLocation.push(selectForLocation);
        selectsForSell.push(selectForSell);
        labelsSellInfo.push(labelSellInfo);
        insertAfter(buttons_commit[i], labelMove, selectForLocation, buttonSplit, buttonCellar, buttonEquip, labelSell, selectForSell, labelSellInfo);
    }
    setTimeout(function () {
        items = getItems(getRows(main_content), options);
        selectsForLocation.forEach(function (x) { addOptions(options, x); });
        var optionsForSell = options.filter(function (x) { return !x.notForSell; });
        selectsForSell.forEach(function (x) { addOptions(optionsForSell, x, true); });
        options.splice(0, 0, none);
        selectsForLocation.concat(selectsForSell).forEach(function (x) { x.disabled = false; });
    }, 0);
}
if (!window.__karma__)
    document.addEventListener('DOMContentLoaded', function () { return main(); });

})();
