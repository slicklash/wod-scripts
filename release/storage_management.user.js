// ==UserScript==
// @name           Storage Management
// @description    Adds additional functionality for storage management
// @version        2.0.0
// @downloadURL    https://raw.github.com/slicklash/wod-scripts/master/release/storage_management.user.js
// @updateURL      https://raw.github.com/slicklash/wod-scripts/master/release/storage_management.user.js
// @author         Never
// @match          https://*.world-of-dungeons.net/wod/spiel/hero/items.php*
// @match          https://*.world-of-dungeons.net/wod/spiel/trade/trade.php*
// @run-at         document-start
// @grant          GM.getValue
// @grant          GM.setValue
// ==/UserScript==

(function() {
'use strict';
function textNormalized(x, options) {
    const text = typeof x === "string" ? x : (x?.textContent ?? "");
    return (text ?? "")
        .replace(/&nbsp;/g, "\u00A0")
        .replace(/[\s\u00A0]+/g, options?.collapse === false ? "" : " ")
        .trim();
}
const SPECIAL_CONSUMABLES = [
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
function createStorageItem() {
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
function isConsumable(item) {
    if (/^raw /.test(item.name))
        return true;
    if (/ seed$/.test(item.name))
        return true;
    if (/^reagent:/.test(item.name))
        return true;
    if (/^Shard.+of/.test(item.name))
        return true;
    if (/^Charm.+of/.test(item.name))
        return true;
    if (/^Rune.+of/.test(item.name))
        return true;
    if (/^(lesser|greater) emblem of/i.test(item.name))
        return true;
    if (SPECIAL_CONSUMABLES.some((x) => x === item.name))
        return true;
    return false;
}
const SELECTION_OPTIONS = [
    { key: "none", title: "none", pick: false, predicate: () => true },
    { key: "---", title: "All" },
    { key: "all", title: "all", pick: true, predicate: () => true, count: 0, countSell: 0 },
    { key: "all_use", title: "usable", pick: true, predicate: (x) => x.isUsable, count: 0, countSell: 0 },
    { key: "all_no_use", title: "unusable", pick: true, predicate: (x) => !x.isUsable, count: 0, countSell: 0 },
    { key: "all_group", title: "group", pick: true, predicate: (x) => x.isGroupItem, notForSell: true, count: 0, countSell: 0 },
    { key: "all_non_group", title: "non-group", pick: true, predicate: (x) => !x.isGroupItem, notForSell: true, count: 0, countSell: 0 },
    { key: "---", title: "Consumables" },
    { key: "con", title: "all", pick: true, predicate: (x) => x.isConsumable, count: 0, countSell: 0 },
    { key: "con_use", title: "usable", pick: true, predicate: (x) => x.isUsable && x.isConsumable, count: 0, countSell: 0 },
    { key: "con_no_use", title: "unusable", pick: true, predicate: (x) => !x.isUsable && x.isConsumable, count: 0, countSell: 0 },
    { key: "con_group", title: "group", pick: true, predicate: (x) => x.isGroupItem && x.isConsumable, notForSell: true, count: 0, countSell: 0 },
    { key: "con_non_group", title: "non-group", pick: true, predicate: (x) => !x.isGroupItem && x.isConsumable, notForSell: true, count: 0, countSell: 0 },
    { key: "---", title: "Items" },
    { key: "itm", title: "all", pick: true, predicate: (x) => !x.isConsumable, count: 0, countSell: 0 },
    { key: "itm_use", title: "usable", pick: true, predicate: (x) => x.isUsable && !x.isConsumable, count: 0, countSell: 0 },
    { key: "itm_no_use", title: "unusable", pick: true, predicate: (x) => !x.isUsable && !x.isConsumable, count: 0, countSell: 0 },
    { key: "itm_group", title: "group", pick: true, predicate: (x) => x.isGroupItem && !x.isConsumable, notForSell: true, count: 0, countSell: 0 },
    { key: "itm_non_group", title: "non-group", pick: true, predicate: (x) => !x.isGroupItem && !x.isConsumable, notForSell: true, count: 0, countSell: 0 },
];
const MoveTarget = { Cellar: "go_keller", TreasureVault: "go_group", GroupStorage: "go_group_2", None: "" };
function resolveMoveTargets() {
    const url = window.location.href;
    const isGroupStorage = url.includes("groupcellar_2");
    const isTreasureVault = url.includes("groupcellar") && !isGroupStorage;
    return {
        TreasureVault: isTreasureVault ? "-go_group" : "go_group",
        GroupStorage: isGroupStorage ? "-go_group_2" : "go_group_2",
    };
}
function toSplitMatchers(value) {
    return value
        .split(/[;,|]/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
        const escaped = part.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
        return new RegExp(`^${escaped}$`, "i");
    });
}
function computeSellInfo(items) {
    let count = 0;
    let total = 0;
    for (const item of items) {
        if (item.ctrlSellCheckbox?.checked) {
            count++;
            total += item.price;
        }
    }
    const html = count > 0 ? `&nbsp;${count} (${total} <img alt="" border="0" src="/wod/css/skins/skin-2/images/icons/lang/en/gold.gif" title="gold">)` : "";
    return { count, total, html };
}
function applySplit(items, targets, filtered, matchers = []) {
    const eligible = items.filter((item) => item.ctrlLocationSelect && item.ctrlLocationCheckbox);
    const hasSelected = eligible.some((item) => item.ctrlLocationCheckbox?.checked);
    for (const item of eligible) {
        if (hasSelected && !item.ctrlLocationCheckbox.checked)
            continue;
        if (filtered && !matchers.some((m) => m.test(item.name)))
            continue;
        item.ctrlLocationSelect.value = item.isConsumable ? targets.GroupStorage : targets.TreasureVault;
        if (item.numberCell)
            item.numberCell.style.backgroundColor = "rgba(0,255,0,0.2)";
    }
}
function applyMoveToCellar(items) {
    const eligible = items.filter((item) => item.ctrlLocationSelect && item.ctrlLocationCheckbox);
    const hasSelected = eligible.some((item) => item.ctrlLocationCheckbox?.checked);
    for (const item of eligible) {
        if (hasSelected && !item.ctrlLocationCheckbox.checked)
            continue;
        item.ctrlLocationSelect.value = MoveTarget.Cellar;
    }
}
function applyEquip(items) {
    const eligible = items.filter((item) => item.isUsable && item.ctrlLocationSelect && item.ctrlLocationCheckbox);
    const hasSelected = eligible.some((item) => item.ctrlLocationCheckbox?.checked);
    for (const item of eligible) {
        if (hasSelected && !item.ctrlLocationCheckbox.checked)
            continue;
        const firstOption = item.ctrlLocationSelect.options[0];
        if (firstOption)
            item.ctrlLocationSelect.value = firstOption.value;
    }
}
function syncOptionCheckboxes(items, option, prop) {
    if (!option?.predicate)
        return;
    for (const item of items) {
        const checkbox = item[prop];
        if (checkbox && option.predicate(item))
            checkbox.checked = option.pick === true;
    }
}
function selectOrDeselectSame(items, source, sourceChecked, prop) {
    for (const item of items) {
        if (item.name !== source.name)
            continue;
        const checkbox = item[prop];
        if (checkbox)
            checkbox.checked = sourceChecked;
    }
}
function findItemByCheckbox(items, checkbox, prop) {
    return items.find((item) => item[prop] === checkbox);
}
function attachSyncPriceButtons(prices, byName, re) {
    for (const input of prices) {
        const row = input.parentElement?.parentElement;
        const textCell = row?.children[1];
        const prevSibling = input.previousElementSibling;
        const text = textCell ? textNormalized(textCell) : "";
        const fpPrice = Number(prevSibling ? textNormalized(prevSibling) : "");
        const match = text.match(re);
        if (!match || !Number.isInteger(fpPrice))
            continue;
        const [, name, usesStr] = match;
        const uses = Number(usesStr);
        if (!Number.isFinite(uses) || uses <= 0)
            continue;
        const group = (byName[name] ||= []);
        group.push({ uses, input, fpPrice });
        const syncButton = document.createElement("input");
        syncButton.type = "button";
        syncButton.className = "button clickable";
        syncButton.value = "sync";
        syncButton.style.marginLeft = "5px";
        syncButton.style.borderWidth = "2px";
        syncButton.addEventListener("click", () => {
            const value = Number(input.value);
            if (!Number.isInteger(value))
                return;
            const singlePrice = value / uses;
            for (const entry of group) {
                if (entry.input !== input && entry.fpPrice < entry.uses * singlePrice * 0.9) {
                    entry.input.value = Math.round(entry.uses * singlePrice).toString();
                }
            }
        });
        input.parentNode?.appendChild(syncButton);
    }
}
function copyPriceToNextRow(items, input, nextRow, nextInput) {
    const checkbox = input.parentElement?.parentElement?.querySelector('input[type="checkbox"][name*="Sell"]');
    const nextCheckbox = nextRow.querySelector('input[type="checkbox"][name*="Sell"]');
    if (!checkbox || !nextCheckbox)
        return;
    const item = findItemByCheckbox(items, checkbox, "ctrlSellCheckbox");
    const nextItem = findItemByCheckbox(items, nextCheckbox, "ctrlSellCheckbox");
    if (!item || !nextItem)
        return;
    const price = Number(input.value);
    nextInput.value = String(nextItem.isConsumable ? Math.ceil((price / item.uses) * nextItem.uses) : price);
}
function waitFor(selector) {
    return new Promise((resolve) => {
        const start = Date.now();
        const check = () => {
            const elem = document.querySelector(selector);
            if (elem || document.readyState === "complete" || Date.now() - start > 30_000)
                resolve(elem);
            else
                setTimeout(check, 250);
        };
        check();
    });
}
function attr(elem, nameOrMap, value) {
    if (typeof nameOrMap === "string") {
        if (value === undefined)
            return elem.getAttribute(nameOrMap);
        if (value === null)
            elem.removeAttribute(nameOrMap);
        else
            elem.setAttribute(nameOrMap, value);
    }
    else {
        Object.entries(nameOrMap).forEach(([k, v]) => (v === null ? elem.removeAttribute(k) : elem.setAttribute(k, v)));
    }
    return elem;
}
function textContent(elem, value) {
    if (!elem)
        return "";
    return typeof value === "undefined" ? elem.textContent : (elem.textContent = value);
}
const SORT_BUTTONS = ['input[type="submit"][name^="ITEMS_LAGER_DO_SORT"][class*="table_h"]', 'input[type="submit"][name^="ITEMS_KELLER_DO_SORT"][class*="table_h"]', 'input[type="submit"][name^="ITEMS_GROUPCELLAR_DO_SORT"][class*="table_h"]'];
function parseItems(mainContent) {
    for (const selector of SORT_BUTTONS) {
        const button = mainContent.querySelector(selector);
        const table = button?.parentElement?.parentElement?.parentElement?.parentElement?.querySelector("tbody");
        if (!table)
            continue;
        const items = [];
        for (const row of table.rows) {
            const cells = row.cells;
            if (cells.length < 2)
                continue;
            const link = cells[1].querySelector("a");
            const name = textContent(link).replace(/!$/, "");
            const uses = textNormalized(cells[1]).replace(name, "");
            const tooltip = link ? attr(link, "onmouseover") ?? "" : "";
            const classes = link ? attr(link, "class") ?? "" : "";
            const locationCell = cells[2];
            const sellCell = cells[3];
            const fallbackSellCell = cells[4];
            const locationSelect = locationCell?.querySelector("select") ?? undefined;
            const locationCheckbox = locationCell?.querySelector('input[type="checkbox"][name^="doEquip"]') ?? undefined;
            let sellCheckbox = sellCell?.querySelector('input[type="checkbox"][name^="Sell"]') ?? undefined;
            let price = sellCell ? Number(textNormalized(sellCell)) : 0;
            if (!sellCheckbox && fallbackSellCell) {
                sellCheckbox = fallbackSellCell.querySelector('input[type="checkbox"]') ?? undefined;
                price = Number(textNormalized(fallbackSellCell));
            }
            const item = createStorageItem();
            item.name = name;
            item.isConsumable = isConsumable(item) || /\(([0-9]+)\/[0-9]+\)/.test(uses);
            const match = uses.match(/\(([0-9]+)\/[0-9]+\)/);
            if (match)
                item.uses = Number(match[1]);
            item.isUsable = !classes.includes("item_unusable");
            item.isGroupItem = tooltip.includes("group item");
            item.numberCell = cells[0];
            item.ctrlLocationSelect = locationSelect;
            item.ctrlLocationCheckbox = locationCheckbox;
            item.ctrlSellCheckbox = sellCheckbox;
            item.ctrlGroupCheckbox = cells[6]?.querySelector('input[type="checkbox"][name^="SetGrpItem"]') ?? undefined;
            item.price = price;
            for (const option of SELECTION_OPTIONS) {
                if (!option.predicate?.(item))
                    continue;
                if (locationSelect)
                    option.count = (option.count || 0) + 1;
                if (sellCheckbox)
                    option.countSell = (option.countSell || 0) + 1;
            }
            items.push(item);
        }
        return { items, table };
    }
    return { items: [], table: null };
}
const Store = {
    get(key, defaultValue) {
        return GM.getValue(key, "").then((raw) => {
            if (!raw)
                return defaultValue;
            try {
                return JSON.parse(raw);
            }
            catch {
                return defaultValue;
            }
        });
    },
    set(key, value) {
        return GM.setValue(key, JSON.stringify(value));
    },
};
function debounce(fn, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}
function add(tagName, parent, innerHTML) {
    const elem = document.createElement(tagName);
    if (parent)
        parent.appendChild(elem);
    if (innerHTML)
        elem.innerHTML = innerHTML;
    return elem;
}
function insertAfter(node, ...elems) {
    const p = node.parentNode;
    elems.forEach((el) => el && p?.insertBefore((node = el), node.nextSibling));
}
function createControls(commitButtons, callbacks, splitFilter) {
    return commitButtons.map((commit, i) => {
        const buttonSplitAll = createButton("Split All", callbacks.handleSplitAll);
        const buttonSplitFilter = createButton("Split Filter", callbacks.handleSplitFilter);
        const buttonMoveToCellar = createButton("Cellar", callbacks.handleMoveToCellar);
        const buttonEquip = createButton("Equip", callbacks.handleEquip);
        const selectLocation = createSelect(140, callbacks.handleLocationChanged);
        const selectSell = createSelect(120, callbacks.handleSellChanged);
        const labelSellInfo = add("span");
        const inputFilter = i === 0 ? attr(add("input"), { type: "text", style: "margin-top: 5px; width: 100%", size: "20", value: splitFilter }) : undefined;
        insertAfter(commit, createLabel("Select"), selectLocation, buttonSplitAll, buttonSplitFilter, buttonMoveToCellar, buttonEquip, createLabel("Sell"), selectSell, labelSellInfo, add("br"), inputFilter);
        return { buttonSplitAll, buttonSplitFilter, buttonMoveToCellar, buttonEquip, selectLocation, selectSell, labelSellInfo, inputFilter };
    });
}
function populateSelect(select, options, sellable) {
    let group;
    for (const option of options) {
        if (option.key === "---") {
            group = add("optgroup");
            attr(group, "label", option.title);
            select.appendChild(group);
            continue;
        }
        const el = attr(add("option"), "value", option.key);
        el.innerHTML = option.key === "none" ? "none" : sellable ? `${option.title} (${option.countSell})` : `${option.title} (${option.count})`;
        (group || select).appendChild(el);
    }
}
function toggleControlsEnabled(controlSets, enabled) {
    for (const set of controlSets) {
        set.buttonSplitAll.disabled = !enabled;
        set.buttonSplitFilter.disabled = !enabled;
        set.buttonMoveToCellar.disabled = !enabled;
        set.buttonEquip.disabled = !enabled;
        set.selectLocation.disabled = !enabled;
        set.selectSell.disabled = !enabled;
    }
}
function updateSellInfo(controlSets, html) {
    for (const set of controlSets)
        set.labelSellInfo.innerHTML = html;
}
function createLabel(text) {
    const label = add("span");
    label.innerHTML = `&nbsp;${text}&nbsp;`;
    return label;
}
function createButton(text, onClick) {
    const button = attr(add("input"), {
        type: "button",
        class: "button clickable",
        name: `button${text}`,
        value: text,
        style: "margin-left: 5px",
        disabled: "disabled",
    });
    button.addEventListener("click", onClick, false);
    return button;
}
function createSelect(width, onSelect) {
    const select = attr(add("select"), {
        style: `min-width: ${width}px`,
        disabled: "disabled",
    });
    select.addEventListener("change", onSelect, false);
    return select;
}
const COMMIT_SELECTOR = `#main_content input[type="submit"][name="ok"][value*="${_t("Commit")}"]`;
const SPLIT_FILTER_KEY = "split-filter";
const DEFAULT_SPLIT_FILTER = "*leather*of*, Ancient seals*";
const PRICE_MATCHER = /(.+) \((\d+)\/\d+\)/;
async function main(view) {
    if (!view || view.value === "gear")
        return;
    let items = [];
    let table = null;
    let uiControlSets = [];
    const splitFilter = await Store.get(SPLIT_FILTER_KEY, DEFAULT_SPLIT_FILTER);
    let splitFilterMatchers = toSplitMatchers(splitFilter);
    function onSelectChanged(event) {
        const option = SELECTION_OPTIONS.find(({ key }) => key === event.target.value);
        syncOptionCheckboxes(items, option, "ctrlLocationCheckbox");
    }
    function onSellChanged(event) {
        const option = SELECTION_OPTIONS.find(({ key }) => key === event.target.value);
        syncOptionCheckboxes(items, option, "ctrlSellCheckbox");
        updateSellInfo(uiControlSets, computeSellInfo(items).html);
    }
    function onTableKeyUp(event) {
        const input = event.target;
        if (input.type !== "text" || !["ArrowUp", "ArrowDown"].includes(event.key))
            return;
        const row = input.parentElement?.parentElement;
        if (!row)
            return;
        const nextRow = event.key === "ArrowUp" ? row.previousElementSibling : row.nextElementSibling;
        if (!nextRow)
            return;
        const isPrice = input.name.includes("preis");
        const nextInput = nextRow.querySelector(`input[type="text"][name*="${isPrice ? "preis" : "comment"}"]`);
        if (!nextInput)
            return;
        if (event.ctrlKey && isPrice && input.value) {
            copyPriceToNextRow(items, input, nextRow, nextInput);
        }
        else if (event.ctrlKey) {
            nextInput.value = input.value;
        }
        nextInput.focus();
    }
    function onTableClick(event) {
        const input = event.target;
        if (!(input instanceof HTMLInputElement) || input.type !== "checkbox" || !event.shiftKey)
            return;
        const prop = input.name.startsWith("Sell") ? "ctrlSellCheckbox" : input.name.startsWith("doEquip") ? "ctrlLocationCheckbox" : input.name.startsWith("SetGrpItem") ? "ctrlGroupCheckbox" : null;
        if (!prop)
            return;
        const item = findItemByCheckbox(items, input, prop);
        if (item)
            selectOrDeselectSame(items, item, input.checked, prop);
    }
    function createUi() {
        const buttons = document.querySelectorAll(COMMIT_SELECTOR);
        if (!buttons.length)
            return;
        const targets = resolveMoveTargets();
        const callbacks = {
            handleSplitAll: () => applySplit(items, targets, false),
            handleSplitFilter: () => applySplit(items, targets, true, splitFilterMatchers),
            handleMoveToCellar: () => applyMoveToCellar(items),
            handleEquip: () => applyEquip(items),
            handleLocationChanged: onSelectChanged,
            handleSellChanged: onSellChanged,
        };
        uiControlSets = createControls([...buttons], callbacks, splitFilter);
        const filterInput = uiControlSets[0]?.inputFilter;
        if (filterInput) {
            filterInput.addEventListener("keyup", debounce((event) => {
                splitFilterMatchers = toSplitMatchers(event.target.value);
                void Store.set(SPLIT_FILTER_KEY, event.target.value);
            }, 1000));
        }
    }
    function parseAndSetup() {
        const content = document.querySelector("#main_content");
        if (!content)
            return;
        ({ table, items } = parseItems(content));
        toggleControlsEnabled(uiControlSets, true);
        for (const controls of uiControlSets) {
            populateSelect(controls.selectLocation, SELECTION_OPTIONS);
            populateSelect(controls.selectSell, SELECTION_OPTIONS.filter(({ notForSell }) => !notForSell), true);
        }
        table?.addEventListener("keyup", onTableKeyUp);
        table?.addEventListener("click", onTableClick);
        const prices = document.querySelectorAll('input[name*="preis_andere"]');
        attachSyncPriceButtons([...prices], {}, PRICE_MATCHER);
    }
    createUi();
    parseAndSetup();
}
function _t(text) {
    return location.href.includes(".net") ? text : text === "Commit" ? "nderungen" : text;
}
waitFor('input[type="hidden"][name="view"]').then((view) => main(view));

})();