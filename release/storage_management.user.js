// ==UserScript==
// @name           Storage Management
// @description    Adds additional functionality for storage management
// @version        1.3.0
// @author         Never
// @include        http*://*.world-of-dungeons.*/wod/spiel/hero/items.php*
// @include        http*://*.world-of-dungeons.*/wod/spiel/trade/trade.php*
// @run-at         document-start
// @grant          none
// ==/UserScript==

(function() {
'use strict';
function add(tag, parentNode) {
    var elem = typeof tag === 'string' ? document.createElement(tag) : tag;
    if (parentNode && parentNode.nodeType) {
        parentNode.appendChild(elem);
    }
    return elem;
}
function attr(elem, nameOrMap, value, remove) {
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
}
function textContent(elem, value) {
    if (!elem)
        return '';
    if (typeof value === 'undefined') {
        return elem.textContent;
    }
    elem.textContent = value;
}
function insertAfter(node) {
    var elems = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        elems[_i - 1] = arguments[_i];
    }
    var parent = node.parentNode;
    elems.forEach(function (elem) {
        parent.insertBefore(elem, node.nextSibling);
        node = elem;
    });
}
function _t(text) {
    if (location.href.indexOf('.net') > 0)
        return text;
    return text === 'Commit' ? 'nderungen' : text;
}
function waitFor(selectorOrElement, eventName) {
    return new Promise(function (resolve) {
        if (typeof selectorOrElement === 'string') {
            var fn_1 = function () {
                var elem = document.querySelector(selectorOrElement);
                if (elem || document.readyState === 'complete')
                    resolve(elem);
                setTimeout(fn_1, 25);
            };
            fn_1();
        }
        else {
            selectorOrElement.addEventListener(eventName, resolve);
        }
    });
}
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
        this.uses = 1;
        this.isGroupItem = true;
        this._isConsumbale = false;
        this.ctrlLocationSelect = null;
        this.ctrlLocationCheckbox = null;
        this.ctrlSellCheckbox = null;
        this.price = 0;
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
var SELECTION_OPTIONS = [
    { key: 'none', title: 'none', pick: false, predicate: function () { return true; } },
    { key: '---', title: 'All' },
    { key: 'all', title: 'all', pick: true, predicate: function () { return true; }, count: 0, countSell: 0 },
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
var CommitButtonSelector = '#main_content input[type="submit"][name="ok"][value*="' + _t('Commit') + '"]';
var StorageController = (function () {
    function StorageController() {
        this._options = SELECTION_OPTIONS;
        this._items = [];
        this.labelsSellInfo = [];
        this.sellCount = 0;
        this.sellSum = 0;
    }
    StorageController.prototype.$onInit = function () {
        var _this = this;
        this._ready = waitFor(document, 'DOMContentLoaded');
        waitFor('select[name*="hero_race"]').then(this._makeClassAndRaceSelectable);
        waitFor('input[type="hidden"][name="view"]').then(function (elem) {
            if (elem && elem.value !== 'gear')
                _this._createControls();
        });
    };
    StorageController.prototype._makeClassAndRaceSelectable = function () {
        var selectClass = document.querySelector('select[name*="hero_class"]');
        var selectRace = document.querySelector('select[name*="hero_race"]');
        if (!selectClass || !selectRace)
            return;
        var label = selectClass.parentElement.previousElementSibling;
        label.classList.add('button_minor');
        label.setAttribute('style', 'padding: 0');
        label.addEventListener('click', function () {
            var form = document.forms.the_form;
            selectClass.value = form.klasse_id.value;
            selectRace.value = form.rasse_id.value;
        });
    };
    StorageController.prototype._createControls = function () {
        var _this = this;
        var buttons_commit = Array.from(document.querySelectorAll(CommitButtonSelector));
        if (!buttons_commit.length)
            return;
        var isGroupStorage = window.location.href.indexOf('groupcellar_2') > -1, isGroupTv = window.location.href.indexOf('groupcellar') > -1 && !isGroupStorage, go_tv = isGroupTv ? '-go_group' : 'go_group', go_gs = isGroupStorage ? '-go_group_2' : 'go_group_2';
        var moveItemToCellar = function (x) { x.ctrlLocationSelect.value = 'go_keller'; };
        var splitItem = function (x) { x.ctrlLocationSelect.value = !x.isConsumable ? go_tv : go_gs; if (!x.ctrlLocationSelect.value)
            moveItemToCellar(x); };
        var equipItem = function (x) { x.ctrlLocationSelect.value = x.ctrlLocationSelect.options[0].value; };
        var actions = {
            split: { predicate: function (x) { return x.ctrlLocationSelect && x.ctrlLocationCheckbox; }, handler: splitItem },
            cellar: { predicate: function (x) { return x.ctrlLocationSelect && x.ctrlLocationCheckbox; }, handler: moveItemToCellar },
            equip: { predicate: function (x) { return x.isUsable && x.ctrlLocationSelect && x.ctrlLocationCheckbox; }, handler: equipItem },
        };
        var onSplit = this._performAction.bind(this, actions.split);
        var onCellar = this._performAction.bind(this, actions.cellar);
        var onEquip = this._performAction.bind(this, actions.equip);
        var onSelectChanged = this._onSelectChanged.bind(this);
        var onSellChanged = this._onSellChanged.bind(this);
        var selectsForLocation = [];
        var selectsForSell = [];
        var actionButtons = [];
        buttons_commit.forEach(function (commit) {
            var labelMove = _this._makeLabel('Select'), labelSell = _this._makeLabel('Selll'), buttonSplit = _this._makeButton('Split', onSplit), buttonCellar = _this._makeButton('Cellar', onCellar), buttonEquip = _this._makeButton('Equip', onEquip), selectForLocation = _this._makeSelect(140, onSelectChanged), selectForSell = _this._makeSelect(120, onSellChanged), labelSellInfo = add('span');
            actionButtons.push(buttonSplit, buttonCellar, buttonEquip);
            _this.labelsSellInfo.push(labelSellInfo);
            selectsForLocation.push(selectForLocation);
            selectsForSell.push(selectForSell);
            insertAfter(commit, labelMove, selectForLocation, buttonSplit, buttonCellar, buttonEquip, labelSell, selectForSell, labelSellInfo);
        });
        this._ready.then(function () {
            var rows = _this._getTableRows(document.querySelector('#main_content'));
            _this._items = _this._parseItems(rows);
            selectsForLocation.forEach(function (x) { _this._addOptions(x, _this._options); x.disabled = false; });
            var sellOptions = _this._options.filter(function (x) { return !x.notForSell; });
            selectsForSell.forEach(function (x) { _this._addOptions(x, sellOptions, true); x.disabled = false; });
            actionButtons.forEach(function (x) { x.disabled = false; });
            _this._attachEvents();
        });
    };
    StorageController.prototype._onSellChanged = function (e) {
        var option = this._options.find(function (x) { return x.key === e.target.value; });
        for (var _i = 0, _a = this._items; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item.ctrlSellCheckbox && option.predicate(item)) {
                item.ctrlSellCheckbox.checked = option.pick;
            }
        }
        this._updateSellInfo();
    };
    StorageController.prototype._updateSellInfo = function () {
        this.sellSum = 0;
        this.sellCount = 0;
        for (var _i = 0, _a = this._items; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item.ctrlSellCheckbox && item.ctrlSellCheckbox.checked) {
                this.sellCount++;
                this.sellSum += item.price;
            }
        }
        var sellInfo = this.sellCount > 0 ? "&nbsp;" + this.sellCount + " (" + this.sellSum + " <img alt=\"\" border=\"0\" src=\"/wod/css/skins/skin-2/images/icons/lang/en/gold.gif\" title=\"gold\">)" : '';
        this.labelsSellInfo.forEach(function (x) { x.innerHTML = sellInfo; });
    };
    StorageController.prototype._onSelectChanged = function (e) {
        var option = this._options.find(function (x) { return x.key === e.target.value; });
        for (var _i = 0, _a = this._items; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item.ctrlLocationCheckbox && option.predicate(item)) {
                item.ctrlLocationCheckbox.checked = option.pick;
            }
        }
    };
    StorageController.prototype._performAction = function (_a) {
        var predicate = _a.predicate, handler = _a.handler;
        if (!this._items.length)
            return;
        var onlySelected = false, tmp = [];
        for (var _i = 0, _b = this._items; _i < _b.length; _i++) {
            var item = _b[_i];
            if (predicate(item)) {
                if (item.ctrlLocationCheckbox.checked) {
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
    StorageController.prototype._addOptions = function (select, options, sellable) {
        var _this = this;
        var option_group;
        options.forEach(function (x) {
            if (x.key === '---') {
                option_group = add('optgroup');
                attr(option_group, 'label', x.title);
                select.appendChild(option_group);
                return;
            }
            _this._makeSelectOption(select, x, sellable, option_group);
        });
        return select;
    };
    StorageController.prototype._makeLabel = function (text) {
        var label = add('span');
        label.innerHTML = "&nbsp;" + text + "&nbsp;";
        return label;
    };
    StorageController.prototype._makeButton = function (text, onClick) {
        var btn = add('input');
        attr(btn, { 'type': 'button', 'class': 'button clickable', 'name': "button" + text, 'value': "" + text, 'style': 'margin-left: 5px', 'disabled': 'disabled' });
        btn.addEventListener('click', onClick, false);
        return btn;
    };
    StorageController.prototype._makeSelect = function (width, onSelect) {
        var select = add('select');
        attr(select, { 'style': "min-width: " + width + "px", 'disabled': 'disabled' });
        select.addEventListener('change', onSelect, false);
        return select;
    };
    StorageController.prototype._makeSelectOption = function (select, option, sellable, option_group) {
        var op = add('option');
        attr(op, 'value', option.key).innerHTML = option.key === 'none' ? 'none' : sellable ? option.title + " (" + option.countSell + ")" : option.title + " (" + option.count + ")";
        if (option_group) {
            option_group.appendChild(op);
        }
        else {
            select.appendChild(op);
        }
    };
    StorageController.prototype._parseItems = function (rows) {
        var _this = this;
        var re_uses = /\(([0-9]+)\/[0-9]+\)/;
        return rows.reduce(function (acc, row) {
            if (!row || !row.cells || row.cells.length < 2)
                return acc;
            var cells = row.cells, link = cells[1].querySelector('a'), name = textContent(link).replace(/!$/, ''), uses = textContent(cells[1]).replace(name, '').trim(), tooltip = link ? attr(link, 'onmouseover') : false, classes = link ? attr(link, 'class') : '', ctrl_location = cells.length > 2 ? cells[2].querySelector('select') : null, ctrl_select = cells.length > 2 ? cells[2].querySelector('input[type="checkbox"][name^="doEquip"]') : null, ctrl_sell = cells.length > 3 ? cells[3].querySelector('input[type="checkbox"][name^="Sell"]') : null, price = cells.length > 3 ? Number(cells[3].textContent.trim()) : 0;
            if (!ctrl_sell && cells.length > 4) {
                ctrl_sell = cells[4].querySelector('input[type="checkbox"]');
                price = Number(cells[4].textContent.trim());
            }
            var item = new StorageItem();
            item.name = name;
            var m = uses.match(re_uses);
            if (m) {
                item.isConsumable = true;
                item.uses = m[1];
            }
            item.isUsable = classes.indexOf('item_unusable') === -1;
            item.isGroupItem = tooltip ? tooltip.indexOf('group item') > -1 : false;
            item.ctrlLocationSelect = ctrl_location;
            item.ctrlLocationCheckbox = ctrl_select;
            item.ctrlSellCheckbox = ctrl_sell;
            item.price = price;
            for (var _i = 0, _a = _this._options; _i < _a.length; _i++) {
                var option = _a[_i];
                if (option.predicate && option.predicate(item)) {
                    if (item.ctrlLocationSelect)
                        option.count = (option.count || 0) + 1;
                    if (item.ctrlSellCheckbox)
                        option.countSell = (option.countSell || 0) + 1;
                }
            }
            acc.push(item);
            return acc;
        }, []);
    };
    StorageController.prototype._attachEvents = function () {
        if (!this._table) {
            return;
        }
        this._table.addEventListener('keyup', this._onKeyUp.bind(this));
        this._table.addEventListener('click', this._onClick.bind(this));
    };
    StorageController.prototype._onKeyUp = function (e) {
        var input = e.target;
        var up = e.key === 'ArrowUp' || e.keyCode === 38;
        var down = e.key === 'ArrowDown' || e.keyCode === 40;
        if (input.tagName !== 'INPUT' || input.type !== 'text' || !(up || down)) {
            return;
        }
        var row = input.parentElement.parentElement;
        var nextRow = up ? row.previousElementSibling : row.nextElementSibling;
        var name = input.name.includes('preis') ? 'preis' : 'comment';
        var nextInput = nextRow ? nextRow.querySelector("input[type=\"text\"][name*=\"" + name + "\"]") : undefined;
        if (!nextRow || !nextInput) {
            return;
        }
        if (name === 'preis' && e.ctrlKey && input.value) {
            var cb_1 = row.querySelector('input[type="checkbox"][name*="Sell"]');
            var item = cb_1 ? this._items.find(function (x) { return x.ctrlSellCheckbox === cb_1; }) : undefined;
            cb_1 = nextRow.querySelector('input[type="checkbox"][name*="Sell"]');
            var nextItem = cb_1 ? this._items.find(function (x) { return x.ctrlSellCheckbox === cb_1; }) : undefined;
            if (item && nextItem) {
                var val = Number(input.value);
                val = nextItem.isConsumable ? Math.ceil(val / item.uses * nextItem.uses) : val;
                nextInput.value = val.toString();
            }
        }
        else if (e.ctrlKey) {
            nextInput.value = input.value;
        }
        nextInput.focus();
    };
    StorageController.prototype._onClick = function (e) {
        var elem = e.target;
        if (elem.tagName !== 'INPUT' || elem.type !== 'checkbox') {
            return;
        }
        var item;
        if (elem.name.startsWith('Sell')) {
            item = this._items.find(function (x) { return x.ctrlSellCheckbox === elem; });
            if (item && e.shiftKey) {
                this._items.forEach(function (y) {
                    if (y.name === item.name)
                        y.ctrlSellCheckbox.checked = elem.checked;
                });
            }
            this._updateSellInfo();
        }
        else if (elem.name.startsWith('doEquip')) {
            item = this._items.find(function (x) { return x.ctrlLocationCheckbox === elem; });
            if (item && e.shiftKey) {
                this._items.forEach(function (y) {
                    if (y.name === item.name)
                        y.ctrlLocationCheckbox.checked = elem.checked;
                });
            }
        }
    };
    StorageController.prototype._getTableRows = function (main_content) {
        var scope = main_content.querySelectorAll('input[type="submit"][name^="ITEMS_LAGER_DO_SORT"][class*="table_h"]');
        if (!scope || !scope.length)
            scope = main_content.querySelectorAll('input[type="submit"][name^="ITEMS_KELLER_DO_SORT"][class*="table_h"]');
        if (!scope || !scope.length)
            scope = main_content.querySelectorAll('input[type="submit"][name^="ITEMS_GROUPCELLAR_DO_SORT"][class*="table_h"]');
        try {
            scope = scope[0].parentNode.parentNode.parentNode.parentNode.querySelector('tbody');
        }
        catch (ex) {
            scope = null;
        }
        if (!scope)
            return [];
        this._table = scope;
        return Array.from(scope.querySelectorAll('tr'));
    };
    return StorageController;
}());
new StorageController().$onInit();

})();
