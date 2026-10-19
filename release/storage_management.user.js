// ==UserScript==
// @name           Storage Management
// @description    Adds additional functionality for storage management
// @version        1.6.2
// @downloadURL    https://raw.github.com/slicklash/wod-scripts/master/release/storage_management.user.js
// @author         Never
// @include        http*://*.world-of-dungeons.*/wod/spiel/hero/items.php*
// @include        http*://*.world-of-dungeons.*/wod/spiel/trade/trade.php*
// @run-at         document-end
// @grant          GM.getValue
// @grant          GM.setValue
// @grant          GM_getValue
// @grant          GM_setValue
// ==/UserScript==

(function() {
'use strict';
function add(tag, parent, innerHTML) {
    const elem = typeof tag === "string" ? document.createElement(tag) : tag;
    if (parent && parent.nodeType)
        parent.appendChild(elem);
    if (innerHTML)
        elem.innerHTML = innerHTML;
    return elem;
}
function attr(elem, nameOrMap, value, remove) {
    if (remove) {
        elem.removeAttribute(nameOrMap);
    }
    else if (typeof nameOrMap === "object") {
        Object.keys(nameOrMap).forEach((key) => { elem.setAttribute(key, nameOrMap[key]); });
    }
    else if (value) {
        elem.setAttribute(nameOrMap, value);
    }
    else {
        return elem.getAttribute(nameOrMap);
    }
    return elem;
}
function insertAfter(node, ...elems) {
    const parent = node.parentNode;
    elems.forEach((elem) => {
        if (elem) {
            parent.insertBefore(elem, node.nextSibling);
            node = elem;
        }
    });
}
function waitFor(selectorOrElement, eventName) {
    return new Promise((resolve) => {
        if (typeof selectorOrElement === "string") {
            const fn = () => {
                const elem = document.querySelector(selectorOrElement);
                if (elem || document.readyState === "complete") {
                    resolve(elem);
                    return;
                }
                setTimeout(fn, 250);
            };
            fn();
        }
        else {
            if (eventName)
                selectorOrElement.addEventListener(eventName, resolve);
        }
    });
}
function GX_getValue(key, defaultValue) {
    if (typeof GM === "object")
        return GM.getValue(key, defaultValue);
    return Promise.resolve(GM_getValue(key));
}
function GX_setValue(key, value) {
    if (typeof GM === "object")
        return GM.setValue(key, value);
    return Promise.resolve(GM_setValue(key, value));
}
var Store = {
    get: GX_getValue,
    set: GX_setValue,
};
function debounce(fn, delay) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(function () {
            fn.apply(context, args);
        }, delay);
    };
}
function textContent(elem, value) {
    if (!elem)
        return "";
    return typeof value === "undefined" ? elem.textContent : (elem.textContent = value);
}
var SPECIAL_CONSUMABLES = [
    "aloe plant",
    "bat toy",
    "carded cotton",
    "certified acorn",
    "fireweed plant",
    "glass ring",
    "glass wand",
    "goose feather",
    "gum tragacanth",
    "iron ingot",
    "lump of coal",
    "oak gall",
    "oak tree",
    "origami elf",
    "origami flying crane",
    "origami harpsichord",
    "origami mongoose",
    "origami standing crane",
    "pouch of sand",
    "rice paper",
    "ruby shard",
    "set of glass vials",
    "small carnelian",
    "small citrine fragment",
    "small emerald fragment",
    "small lapis lazuli fragment",
    "small malachite fragment",
    "small turquoise",
    "steel bar",
    "steel hilt",
    "stingweed plant",
    "supple leather",
    "tragacanth plant",
    "trollbeard plant",
    "wooden handle",
    "wooden log",
    "wooden pole",
];
class StorageItem {
    name = "";
    isUsable = true;
    uses = 1;
    isGroupItem = true;
    _isConsumbale = false;
    numberCell;
    ctrlLocationSelect;
    ctrlLocationCheckbox;
    ctrlSellCheckbox;
    ctrlGroupCheckbox;
    price = 0;
    get isConsumable() {
        if (this._isConsumbale)
            return true;
        if (/^raw /.test(this.name))
            return true;
        if (/ seed$/.test(this.name))
            return true;
        if (/^reagent:/.test(this.name))
            return true;
        if (/^Shard.+of/.test(this.name))
            return true;
        if (/^Charm.+of/.test(this.name))
            return true;
        if (/^Rune.+of/.test(this.name))
            return true;
        if (/^(lesser|greater) emblem of/i.test(this.name))
            return true;
        if (SPECIAL_CONSUMABLES.some((x) => x === this.name))
            return true;
        return false;
    }
    set isConsumable(value) {
        this._isConsumbale = value;
    }
}
var SELECTION_OPTIONS = [
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
function getItems(elem) {
    const table = getTable(elem);
    const rows = table ? Array.from(table.querySelectorAll("tr")) : [];
    const items = parseItems(rows);
    return { items, table };
}
function getTable(main_content) {
    let scope = main_content.querySelectorAll('input[type="submit"][name^="ITEMS_LAGER_DO_SORT"][class*="table_h"]');
    if (!scope || !scope.length)
        scope = main_content.querySelectorAll('input[type="submit"][name^="ITEMS_KELLER_DO_SORT"][class*="table_h"]');
    if (!scope || !scope.length)
        scope = main_content.querySelectorAll('input[type="submit"][name^="ITEMS_GROUPCELLAR_DO_SORT"][class*="table_h"]');
    try {
        scope =
            scope[0].parentNode.parentNode.parentNode.parentNode.querySelector("tbody");
    }
    catch {
        scope = null;
    }
    return scope;
}
function parseItems(rows) {
    const re_uses = /\(([0-9]+)\/[0-9]+\)/;
    return rows.reduce((acc, row) => {
        if (!row || !row.cells || row.cells.length < 2)
            return acc;
        const cells = row.cells;
        const link = cells[1].querySelector("a");
        const name = textContent(link).replace(/!$/, "");
        const uses = textContent(cells[1]).replace(name, "").trim();
        const tooltip = link ? attr(link, "onmouseover") : false;
        const classes = link ? attr(link, "class") : "";
        const ctrl_location = cells.length > 2 ? cells[2].querySelector("select") : null;
        const ctrl_select = cells.length > 2
            ? cells[2].querySelector('input[type="checkbox"][name^="doEquip"]')
            : null;
        let ctrl_sell = cells.length > 3
            ? cells[3].querySelector('input[type="checkbox"][name^="Sell"]')
            : null;
        let price = cells.length > 3 ? Number(cells[3].textContent.trim()) : 0;
        const ctrl_group = cells.length > 6
            ? cells[6].querySelector('input[type="checkbox"][name^="SetGrpItem"]')
            : null;
        if (!ctrl_sell && cells.length > 4) {
            ctrl_sell = cells[4].querySelector('input[type="checkbox"]');
            price = Number(cells[4].textContent.trim());
        }
        const item = new StorageItem();
        item.name = name;
        const m = uses.match(re_uses);
        if (m) {
            item.isConsumable = true;
            item.uses = m[1];
        }
        item.isUsable = classes.indexOf("item_unusable") === -1;
        item.isGroupItem = tooltip ? tooltip.indexOf("group item") > -1 : false;
        item.numberCell = cells[0];
        item.ctrlLocationSelect = ctrl_location;
        item.ctrlLocationCheckbox = ctrl_select;
        item.ctrlSellCheckbox = ctrl_sell;
        item.ctrlGroupCheckbox = ctrl_group;
        item.price = price;
        for (const option of SELECTION_OPTIONS) {
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
}
const CommitButtonSelector = '#main_content input[type="submit"][name="ok"][value*="' +
    _t("Commit") +
    '"]';
function _t(text) {
    if (location.href.indexOf(".net") > 0)
        return text;
    return text === "Commit" ? "nderungen" : text;
}
const KEY_SPLIT_FILTER = "split-filter";
class StorageController {
    labelsSellInfo = [];
    sellCount = 0;
    sellSum = 0;
    selectsForLocation = [];
    selectsForSell = [];
    actionButtons = [];
    _options = SELECTION_OPTIONS;
    _table;
    _items = [];
    async init() {
        const elem = await waitFor('input[type="hidden"][name="view"]');
        if (elem && elem.value !== "gear") {
            const auto = await Store.get(KEY_SPLIT_FILTER);
            this._createControls(auto || "*leather*of*, Ancient seals*");
            this._enableControls();
        }
    }
    _createControls(splitFilter) {
        const buttons_commit = (Array.from(document.querySelectorAll(CommitButtonSelector)));
        if (!buttons_commit.length)
            return;
        const isGroupStorage = window.location.href.indexOf("groupcellar_2") > -1;
        const isGroupTv = window.location.href.indexOf("groupcellar") > -1 && !isGroupStorage;
        const go_tv = isGroupTv ? "-go_group" : "go_group";
        const go_gs = isGroupStorage ? "-go_group_2" : "go_group_2";
        const moveItemToCellar = (x) => {
            if (x.ctrlLocationSelect)
                x.ctrlLocationSelect.value = "go_keller";
        };
        const splitItem = (x) => {
            if (!x.ctrlLocationSelect)
                return;
            x.ctrlLocationSelect.value = !x.isConsumable ? go_tv : go_gs;
            if (!x.ctrlLocationSelect.value)
                moveItemToCellar(x);
        };
        const equipItem = (x) => {
            if (!x.ctrlLocationSelect)
                return;
            x.ctrlLocationSelect.value = x.ctrlLocationSelect.options[0].value;
        };
        const createSplitMatchers = (value) => value
            .split(/[,;|]/)
            .filter((x) => Boolean(x.trim()))
            .map((x) => {
            x = x.trim().replace(/\*/g, ".*");
            return new RegExp(`^${x}$`, "i");
        });
        let splitMatchers = createSplitMatchers(splitFilter);
        const actions = {
            splitAll: {
                predicate: (x) => x.ctrlLocationSelect && x.ctrlLocationCheckbox,
                handler: splitItem,
            },
            splitFilter: {
                predicate: (x) => {
                    return (x.ctrlLocationSelect &&
                        x.ctrlLocationCheckbox &&
                        splitMatchers.some((m) => m.test(x.name)));
                },
                handler: splitItem,
            },
            cellar: {
                predicate: (x) => x.ctrlLocationSelect && x.ctrlLocationCheckbox,
                handler: moveItemToCellar,
            },
            equip: {
                predicate: (x) => x.isUsable && x.ctrlLocationSelect && x.ctrlLocationCheckbox,
                handler: equipItem,
            },
        };
        const onSplitAll = this._performAction.bind(this, actions.splitAll);
        const onSplitFilter = this._performAction.bind(this, actions.splitFilter);
        const onCellar = this._performAction.bind(this, actions.cellar);
        const onEquip = this._performAction.bind(this, actions.equip);
        const onSelectChanged = this._onSelectChanged.bind(this);
        const onSellChanged = this._onSellChanged.bind(this);
        buttons_commit.forEach((commit, i) => {
            const labelMove = this._makeLabel("Select");
            const labelSell = this._makeLabel("Selll");
            const buttonSplit = this._makeButton("Split All", onSplitAll);
            const buttonSplitAuto = this._makeButton("Split Filter", onSplitFilter);
            const buttonCellar = this._makeButton("Cellar", onCellar);
            const buttonEquip = this._makeButton("Equip", onEquip);
            const selectForLocation = this._makeSelect(140, onSelectChanged);
            const selectForSell = this._makeSelect(120, onSellChanged);
            const labelSellInfo = add("span");
            const inputAuto = attr(add("input"), {
                style: "margin-top: 5px; width: 100%",
                value: splitFilter,
            });
            inputAuto.addEventListener("keyup", debounce((e) => {
                splitFilter = e.target.value;
                splitMatchers = createSplitMatchers(splitFilter);
                Store.set(KEY_SPLIT_FILTER, splitFilter);
            }, 500), false);
            this.actionButtons.push(buttonSplit, buttonSplitAuto, buttonCellar, buttonEquip);
            this.labelsSellInfo.push(labelSellInfo);
            this.selectsForLocation.push(selectForLocation);
            this.selectsForSell.push(selectForSell);
            insertAfter(commit, labelMove, selectForLocation, buttonSplit, buttonSplitAuto, buttonCellar, buttonEquip, labelSell, selectForSell, labelSellInfo, add("br"), i === 0 && inputAuto);
        });
    }
    _enableControls = () => {
        const { table, items } = getItems(document.querySelector("#main_content"));
        this._table = table;
        this._items = items;
        this.selectsForLocation.forEach((x) => {
            this._addOptions(x, this._options);
            x.disabled = false;
        });
        const sellOptions = this._options.filter((x) => !x.notForSell);
        this.selectsForSell.forEach((x) => {
            this._addOptions(x, sellOptions, true);
            x.disabled = false;
        });
        this.actionButtons.forEach((x) => {
            x.disabled = false;
        });
        this._attachEvents();
    };
    _attachEvents() {
        if (!this._table) {
            return;
        }
        this._table.addEventListener("keyup", this._onKeyUp.bind(this));
        this._table.addEventListener("click", this._onClick.bind(this));
        this._syncSell();
    }
    _onSellChanged(e) {
        const option = this._options.find((x) => x.key === e.target.value);
        for (const item of this._items) {
            if (item.ctrlSellCheckbox && option && option.predicate?.(item)) {
                item.ctrlSellCheckbox.checked = option.pick === true;
            }
        }
        this._updateSellInfo();
    }
    _updateSellInfo() {
        this.sellSum = 0;
        this.sellCount = 0;
        for (const item of this._items) {
            if (item.ctrlSellCheckbox && item.ctrlSellCheckbox.checked) {
                this.sellCount++;
                this.sellSum += item.price;
            }
        }
        const sellInfo = this.sellCount > 0
            ? `&nbsp;${this.sellCount} (${this.sellSum} <img alt="" border="0" src="/wod/css/skins/skin-2/images/icons/lang/en/gold.gif" title="gold">)`
            : "";
        this.labelsSellInfo.forEach((x) => {
            x.innerHTML = sellInfo;
        });
    }
    _onSelectChanged(e) {
        const option = this._options.find((x) => x.key === e.target.value);
        for (const item of this._items) {
            if (item.ctrlLocationCheckbox && option?.predicate?.(item)) {
                item.ctrlLocationCheckbox.checked = option.pick === true;
            }
        }
    }
    _performAction({ predicate, handler }) {
        if (!this._items.length)
            return;
        let onlySelected = false;
        const tmp = [];
        for (const item of this._items) {
            if (predicate(item)) {
                if (item.ctrlLocationCheckbox?.checked) {
                    handler(item);
                    onlySelected = true;
                }
                else {
                    tmp.push(item);
                }
            }
        }
        if (!onlySelected) {
            tmp.forEach((item) => {
                handler(item);
                if (item.numberCell)
                    item.numberCell.style.backgroundColor = "rgba(0,255,0,0.2)";
            });
        }
    }
    _addOptions(select, options, sellable) {
        let option_group;
        options.forEach((x) => {
            if (x.key === "---") {
                option_group = add("optgroup");
                attr(option_group, "label", x.title);
                select.appendChild(option_group);
                return;
            }
            this._makeSelectOption(select, x, sellable, option_group);
        });
        return select;
    }
    _makeLabel(text) {
        const label = add("span");
        label.innerHTML = `&nbsp;${text}&nbsp;`;
        return label;
    }
    _makeButton(text, onClick) {
        const btn = add("input");
        attr(btn, {
            type: "button",
            class: "button clickable",
            name: `button${text}`,
            value: `${text}`,
            style: "margin-left: 5px",
            disabled: "disabled",
        });
        btn.addEventListener("click", onClick, false);
        return btn;
    }
    _makeSelect(width, onSelect) {
        const select = add("select");
        attr(select, { style: `min-width: ${width}px`, disabled: "disabled" });
        select.addEventListener("change", onSelect, false);
        return select;
    }
    _makeInputt() {
        const input = add("input");
        attr(input, { size: 20 });
        return input;
    }
    _makeSelectOption(select, option, sellable, option_group) {
        const op = add("option");
        attr(op, "value", option.key).innerHTML =
            option.key === "none"
                ? "none"
                : sellable
                    ? `${option.title} (${option.countSell})`
                    : `${option.title} (${option.count})`;
        if (option_group) {
            option_group.appendChild(op);
        }
        else {
            select.appendChild(op);
        }
    }
    _onKeyUp(e) {
        const input = e.target;
        const up = e.key === "ArrowUp" || e.keyCode === 38;
        const down = e.key === "ArrowDown" || e.keyCode === 40;
        if (input.tagName !== "INPUT" || input.type !== "text" || !(up || down)) {
            return;
        }
        const row = input.parentElement.parentElement;
        const nextRow = up
            ? row.previousElementSibling
            : row.nextElementSibling;
        const name = input.name.includes("preis") ? "preis" : "comment";
        const nextInput = nextRow
            ? nextRow.querySelector(`input[type="text"][name*="${name}"]`)
            : undefined;
        if (!nextRow || !nextInput) {
            return;
        }
        if (name === "preis" && e.ctrlKey && input.value) {
            let cb = (row.querySelector('input[type="checkbox"][name*="Sell"]'));
            const item = cb
                ? this._items.find((x) => x.ctrlSellCheckbox === cb)
                : undefined;
            cb = nextRow.querySelector('input[type="checkbox"][name*="Sell"]');
            const nextItem = cb
                ? this._items.find((x) => x.ctrlSellCheckbox === cb)
                : undefined;
            if (item && nextItem) {
                let val = Number(input.value);
                val = nextItem.isConsumable
                    ? Math.ceil((val / item.uses) * nextItem.uses)
                    : val;
                nextInput.value = val.toString();
            }
        }
        else if (e.ctrlKey) {
            nextInput.value = input.value;
        }
        nextInput.focus();
    }
    _onClick(e) {
        const elem = e.target;
        if (elem.tagName !== "INPUT" || elem.type !== "checkbox") {
            return;
        }
        let prop;
        if (elem.name.startsWith("Sell")) {
            prop = "ctrlSellCheckbox";
        }
        else if (elem.name.startsWith("doEquip")) {
            prop = "ctrlLocationCheckbox";
        }
        else if (elem.name.startsWith("SetGrpItem")) {
            prop = "ctrlGroupCheckbox";
        }
        const item = this._items.find((x) => x[prop] === elem);
        if (item && e.shiftKey) {
            this._items.forEach((y) => {
                if (y.name === item.name)
                    y[prop].checked = elem.checked;
            });
        }
    }
    _syncSell() {
        const prices = Array.from(document.querySelectorAll('input[name*="preis_andere"]'));
        const byName = {};
        const re = /(.+) \((\d+)\/\d+\)/;
        for (const input of prices) {
            const text = input.parentElement.parentElement.children[1].textContent.trim();
            const fp_price = Number(input.parentElement.previousElementSibling.textContent.trim());
            const m = text.match(re);
            if (!m || !Number.isInteger(fp_price))
                continue;
            const name = m[1];
            const uses = Number(m[2]);
            const group = byName[name] || (byName[name] = []);
            group.push({ uses, input, fp_price });
            attr(add("input", input.parentNode), {
                type: "button",
                class: "button clickable",
                value: "sync",
                style: "margin-left: 5px; border-width: 2px",
            }).addEventListener("click", () => {
                const val = Number(input.value);
                if (Number.isInteger(val)) {
                    const single = val / uses;
                    group.forEach((x) => {
                        if (x.input !== input && x.fp_price < x.uses * single * 0.9) {
                            x.input.value = Math.round(x.uses * single);
                        }
                    });
                }
            }, false);
        }
    }
}
new StorageController().init();

})();