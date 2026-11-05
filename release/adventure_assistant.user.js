// ==UserScript==
// @name           Adventure Assistant
// @description    Script allows to do adventures using keyboard, groups adventures into tabs
// @version        2.0.0
// @author         Never
// @downloadURL    https://raw.github.com/slicklash/wod-scripts/master/release/adventure_assistant.user.js
// @updateURL      https://raw.github.com/slicklash/wod-scripts/master/release/adventure_assistant.user.js
// @match          https://*.world-of-dungeons.net/wod/spiel/event/play.php*
// @match          https://*.world-of-dungeons.net/wod/spiel/event/eventlist.php*
// @run-at         document-end
// @grant          GM.getValue
// @grant          GM.setValue
// ==/UserScript==

(function() {
'use strict';
const Quests = {
    IngenuityTest: "Ingenuity Test",
    Passingtime: "Passingtime",
    RescuingFatherWuel: "Rescuing Father Wuel",
};
function assembleContext({ title, idHero, place, texts, world }) {
    if (!title || !title.includes("adventure"))
        throw new Error(`Page title must contain "adventure", got: "${title}"`);
    if (!idHero)
        throw new Error('Could not find hero ID from link matching "session_hero_id"');
    const trimmed = texts.map((x) => x.trim());
    const text = trimmed.join(" ");
    const adventure = title.replace("adventure ", "");
    const isQuest = Object.keys(Quests).some((key) => adventure.indexOf(Quests[key]) > -1);
    return Object.freeze({
        idHero,
        world,
        adventure,
        place: place || "*",
        texts: trimmed,
        text,
        isQuest,
    });
}
function buildAdventureContext() {
    const title = extractTitle();
    const idHero = extractHeroId();
    const place = extractPlace();
    const texts = extractTexts();
    const world = getWorld();
    return assembleContext({ title, idHero, place, texts, world });
}
function getWorld() {
    try {
        return document.location.hostname.split(".")[0];
    }
    catch {
        return "unknown";
    }
}
function extractTitle() {
    const h1 = document.querySelector("h1");
    return h1 ? h1.textContent || "" : "";
}
function extractHeroId() {
    const heroLink = document.querySelector('[href*="session_hero_id"]');
    if (!heroLink)
        return "";
    const match = heroLink.href.match(/session_hero_id=([\d]+)/);
    return match ? match[1] : "";
}
function extractPlace() {
    const el = document.querySelector("#smarttabs__level_inner h3 > a");
    if (!el)
        return "*";
    const textNodes = Array.from(el.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent || "");
    return textNodes.join("").trim() || "*";
}
function extractTexts() {
    const elements = document.querySelectorAll("form > p, .REP_LVL_DESCRIPTION");
    return Array.from(elements).map((el) => {
        let html = el.innerHTML;
        html = html.replace(/&lt;font\s+color\s*=\s*["'](.+)["']&gt;/g, '<font color="$1">');
        html = html.replace(/&lt;\/font&gt;/g, "</font>");
        html = html.replace(/<br>\s+<br>/g, "<br>");
        return html;
    });
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
function initQuestLog(context) {
    if (!context || !context.isQuest) {
        return;
    }
    const questLog = new QuestLog(context);
    let choice;
    if (!questLog.isSupported) {
        return;
    }
    window.addEventListener("adventure.choiceSelected", (e) => {
        const customEvent = e;
        choice = customEvent.detail;
    });
    const form = document.forms.the_form;
    if (form) {
        form.addEventListener("submit", () => {
            if (choice) {
                questLog.onChoice(choice);
            }
        });
    }
}
class QuestLog {
    _context;
    isSupported = true;
    _id;
    _data;
    _info;
    _placeOptions;
    constructor(_context) {
        this._context = _context;
        const { adventure, place } = _context;
        const adventures = {};
        adventures[Quests.IngenuityTest] = this.getIngenuityTestInfo;
        adventures[Quests.RescuingFatherWuel] = this.getRescueFatherWuelInfo;
        adventures[Quests.Passingtime] = this.getPassingtimeInfo;
        if (!(adventure in adventures)) {
            this.isSupported = false;
            return;
        }
        this._info = adventures[adventure]();
        if (!this._info) {
            this.isSupported = false;
            return;
        }
        this._placeOptions = this._info[place];
        this._id = `${_context.world}_${_context.idHero}_${_context.adventure.replace(/ /g, "").toLowerCase()}`;
        this.init();
    }
    async init() {
        await this.load();
        if (this._placeOptions) {
            this.checkPlace();
        }
        this.display();
    }
    onChoice(choice) {
        if (!this._placeOptions) {
            return;
        }
        this.pickItem(choice);
        this.save();
    }
    pickItem(item) {
        const op = this._placeOptions;
        if (!op)
            return;
        if (op.pickSingle) {
            const itm = (op.pickSingleTransform ? op.pickSingleTransform(item) : item).trim();
            if (itm && op.pickSingle.indexOf(itm) > -1) {
                if (!this._data)
                    return;
                this._data.itemsPicked = this._data.itemsPicked.filter((x) => op.pickSingle && op.pickSingle.indexOf(x) < 0);
                this._data.itemsPicked.push(itm);
            }
        }
    }
    checkPlace() {
        const op = this._placeOptions;
        if (!op)
            return;
        let isChanged = false;
        const text = this._context.text;
        if (op.reset && text.indexOf(op.reset) > -1) {
            this.reset();
            return;
        }
        if (op.collect) {
            op.collect.forEach((x) => {
                if (text.indexOf(x.match) > -1) {
                    x.found?.forEach((itm) => {
                        if (this._data?.itemsFound && this._data.itemsFound.indexOf(itm) < 0) {
                            this._data.itemsFound.push(itm);
                            isChanged = true;
                        }
                    });
                }
            });
        }
        if (op.use) {
            op.use.forEach((x) => {
                if (text.indexOf(x.match) > -1) {
                    if (x.found && this._data?.itemsFound)
                        this._data.itemsFound = this._data.itemsFound.filter((itm) => x.found && x.found.indexOf(itm) < 0);
                    if (x.picked && this._data?.itemsPicked)
                        this._data.itemsPicked = this._data.itemsPicked.filter((itm) => x.picked && x.picked.indexOf(itm) < 0);
                    isChanged = true;
                }
            });
        }
        if (op.do) {
            op.do.forEach((x) => {
                if (text.indexOf(x.match) > -1 && x.done) {
                    x.done.forEach((task) => {
                        if (this._data && this._data.tasksDone.indexOf(task) < 0) {
                            this._data.tasksDone.push(task);
                            isChanged = true;
                        }
                    });
                }
            });
        }
        if (isChanged)
            this.save();
    }
    display() {
        const h1 = document.querySelector("h1");
        if (!h1)
            return;
        const toText = (title, items) => {
            if (!items || !items.length)
                return "";
            items.sort();
            return title + "\n" + items.join("\n");
        };
        const data = this._data;
        if (!data)
            return;
        const text = [toText("backpack:", data.itemsPicked.concat(data.itemsFound)), toText("done:", data.tasksDone)].join("\n\n");
        h1.setAttribute("title", text);
    }
    async load() {
        const empty = {
            itemsPicked: [],
            itemsFound: [],
            tasksDone: [],
        };
        if (!this._id) {
            this._data = empty;
            return;
        }
        const loaded = await Store.get(this._id, { itemsPicked: [], itemsFound: [], tasksDone: [] });
        Object.keys(loaded).forEach((key) => {
            const k = key;
            if (!(k in empty))
                delete loaded[k];
        });
        this._data = Object.assign(empty, loaded);
    }
    save() {
        if (!this._id || !this._data)
            return;
        Store.set(this._id, this._data);
    }
    reset() {
        if (!this._id)
            return;
        this._data = { itemsPicked: [], itemsFound: [], tasksDone: [] };
        Store.set(this._id, this._data);
    }
    getPassingtimeInfo() {
        return {};
    }
    getRescueFatherWuelInfo() {
        return {
            "*": {
                collect: [
                    { match: "unusual iridescent one", found: ["iridescent rock"] },
                    { match: "fine electric eel", found: ["electric eel"] },
                    { match: "fine octopus", found: ["octopus"] },
                    { match: "fine lantern", found: ["lantern fish"] },
                    { match: "fine puffer", found: ["puffer fish"] },
                    { match: "fine mackerel", found: ["mackerel"] },
                    { match: "fine piranha", found: ["piranha"] },
                ],
            },
            "Pekkerin Fen: Mel's School for Adventurers": {
                do: [
                    { match: "Welcome to class #1", done: ["Adventure class #1"] },
                    { match: "Welcome to class #2", done: ["Adventure class #2"] },
                    { match: "Welcome to class #3", done: ["Adventure class #3"] },
                    { match: "Welcome to class #4", done: ["Adventure class #4"] },
                ],
            },
            "Town Hall: Mayor's Office": { reset: "Father Wuel, welcome" },
        };
    }
    getIngenuityTestInfo() {
        return {
            "*": {
                collect: [
                    {
                        match: "You find a sparkly bejeweled necklace",
                        found: ["bejeweled necklace"],
                    },
                    { match: "you see a blue key", found: ["blue key"] },
                    { match: "You thank them for the wings", found: ["wings"] },
                ],
                use: [
                    {
                        match: "it doesn't last forever",
                        picked: ["bunch of driftwood", "limburger cheese"],
                    },
                    { match: "You put a shell in", picked: ["bunch of tiny shells"] },
                ],
                do: [{ match: "River mini-game done", done: ["River mini-game"] }],
            },
            "The Fairytale Princess": {
                collect: [
                    {
                        match: "hands you some pink hair ribbons",
                        found: ["pink hair ribbons"],
                    },
                ],
            },
            "Rialb's Ghost": {
                collect: [{ match: "purple key", found: ["purple key"] }],
            },
            Dwarf: {
                use: [
                    {
                        match: "He drinks it all down",
                        found: ["water"],
                        picked: ["bananas"],
                    },
                ],
            },
            "Rickety Shed : Pick ...": {
                pickSingle: ["coil of rope", "grass skirt", "boat oars"],
            },
            "Sheltered Beach : Pick ...": {
                pickSingle: ["iridescent rock", "bunch of driftwood", "large carapace"],
            },
            "Middle of the River : Pick ...": {
                pickSingle: ["leaf lettuce", "pumpkin", "bananas", "deck of playing cards", "carrots", "rainbow trout", "corn", "limburger cheese", "suspenders"],
                pickSingleTransform: (x) => (x.indexOf("Buy ") === 0 ? x.replace("Buy ", "") : ""),
            },
            "Middle of the River : Chatting": {
                collect: [{ match: "red key", found: ["red key"] }],
            },
            "Rocky Shore, at a River": {
                collect: [{ match: "decent rowboat here", found: ["rowboat with oars"] }],
            },
            "Waves Beach : Pick ...": {
                pickSingle: ["bunch of tiny shells", "bulbaroose shell", "conch shell"],
            },
            "Freshwater Spring": {
                collect: [{ match: "the water", found: ["water"] }],
            },
            "The Upside-Down Carnival Machine": {
                do: [
                    {
                        match: "Carnival Machine mini-game done",
                        done: ["Carnival Machine mini-game"],
                    },
                ],
            },
            "Up on a Ledge": {
                do: [{ match: "Thief mini-game done", done: ["Thief mini-game"] }],
            },
            "Copious Cutouts": {
                do: [
                    {
                        match: "Copious Cutouts mini-game done",
                        done: ["Copious Cutouts mini-game"],
                    },
                ],
            },
            "Back at the Guild": { reset: "Across the bridge" },
        };
    }
}
function textNormalized(x, options) {
    const text = typeof x === "string" ? x : (x?.textContent ?? "");
    return (text ?? "")
        .replace(/&nbsp;/g, "\u00A0")
        .replace(/[\s\u00A0]+/g, options?.collapse === false ? "" : " ")
        .trim();
}
const APPOINTMENT_TITLES = ["The pumpkin hero tavern", "The Adventurers' Guild", "The Sunday Grove", "Free warriors arena of Nebulat", "Old Training Grounds", "The Fortunes of Madame", "Haiku medal", "Trading Post", "Z Delete Passingtime in-progress flag", "Z Clear Forced Exit", "Z Set Forced Exit"];
const QUEST_TITLES = Object.values(Quests);
let _quests = [];
let _appointments = [];
let _crafting = [];
const TAB_TITLES = {
    quests: "Quests",
    appointments: "Appointments",
    crafting: "Crafting",
};
function initTabs() {
    if (!document.querySelector(".paginator_row"))
        return;
    const categorize = (title) => {
        if (QUEST_TITLES.some((name) => title.includes(name)))
            return "quests";
        if (APPOINTMENT_TITLES.some((name) => title.includes(name)))
            return "appointments";
        return null;
    };
    const invertClass = (className) => (className === "row0" ? "row1" : "row0");
    const titleOf = (row) => row.querySelector("h3")?.innerHTML ?? "";
    const adventures = Array.from(document.querySelectorAll(".row0, .row1"));
    adventures.sort((a, b) => {
        const titleA = titleOf(a);
        const titleB = titleOf(b);
        const indexA = _sortByOrder(titleA);
        const indexB = _sortByOrder(titleB);
        if (indexA === -1)
            return indexB === -1 ? 0 : 1;
        if (indexB === -1)
            return -1;
        return indexA - indexB;
    });
    adventures.forEach((adventure) => {
        adventure.parentNode?.appendChild(adventure);
    });
    _quests = [];
    _appointments = [];
    _crafting = [];
    let appClass = "row1";
    let craftClass = "row1";
    for (const adventure of adventures) {
        const className = adventure.className;
        const title = titleOf(adventure);
        if (!title)
            continue;
        const category = categorize(title);
        const currentClass = category === "appointments" ? appClass : craftClass;
        const nextClass = currentClass === className ? invertClass(currentClass) : className;
        if (category === "quests") {
            _quests.push(adventure);
        }
        else if (category === "appointments") {
            appClass = nextClass;
            _appointments.push(adventure);
        }
        else {
            craftClass = nextClass;
            _crafting.push(adventure);
            adventure.style.display = "none";
        }
        adventure.className = nextClass;
        _hideDescription(adventure);
    }
    const menu = document.createElement("ul");
    menu.innerHTML = '<li class="label">Adventures</li>';
    menu.append(makeTab("appointments", TAB_TITLES.appointments, true), makeTab("crafting", TAB_TITLES.crafting, false), makeTab("quests", TAB_TITLES.quests, false));
    const bar = document.createElement("div");
    bar.className = "bar";
    const content = document.createElement("div");
    content.className = "content";
    const tab = document.createElement("div");
    tab.className = "tab";
    tab.append(menu, bar, content);
    const h1 = document.querySelector("h1");
    if (h1?.parentNode) {
        h1.parentNode.replaceChild(tab, h1);
    }
    _showTab("appointments", true);
    _showTab("crafting", false);
    _showTab("quests", false);
}
function _sortByOrder(title) {
    const combined = [...QUEST_TITLES, ...APPOINTMENT_TITLES];
    return combined.findIndex((name) => title.includes(name));
}
function _hideDescription(row) {
    const td = row.querySelector("td");
    const header = td.children[0];
    const descriptionNodes = Array.from(td.childNodes).filter((node) => node.nodeName !== "TABLE");
    const description = document.createElement("div");
    description.style.display = "none";
    td.insertBefore(description, header.nextSibling);
    descriptionNodes.forEach((node) => description.appendChild(node));
    header.style.cursor = "pointer";
    const title = header.querySelector("h3");
    title.style.display = "inline";
    const icon = document.createElement("img");
    icon.src = "/wod/css/icons/common/more_text.png";
    icon.style.paddingLeft = "10px";
    title.parentNode.appendChild(icon);
    title.parentElement.style.paddingBottom = "5px";
    td.style.paddingBottom = "5px";
    header.addEventListener("click", () => {
        const isHidden = Boolean(description.style.display);
        description.style.display = isHidden ? "" : "none";
        icon.src = icon.src.replace(isHidden ? "more" : "less", isHidden ? "less" : "more");
    });
}
function makeTab(key, label, selected) {
    const action = document.createElement("a");
    action.href = "#";
    action.textContent = label;
    action.addEventListener("click", _selectTab);
    const tab = document.createElement("li");
    tab.className = selected ? "selected" : "not_selected";
    tab.appendChild(action);
    return tab;
}
function _selectTab(e) {
    e.preventDefault();
    const target = e.currentTarget;
    const selectedTab = target.parentElement;
    if (!selectedTab)
        return;
    const selectedTitle = textNormalized(target);
    _activeTab = Object.entries(TAB_TITLES).find(([, v]) => v === selectedTitle)?.[0] ?? "appointments";
    const menuList = selectedTab.parentElement;
    Array.from(menuList.children).forEach((li) => {
        if (li !== selectedTab && li.className !== "label") {
            li.className = "not_selected";
        }
    });
    selectedTab.className = "selected";
    _showTab("appointments", _activeTab === "appointments");
    _showTab("crafting", _activeTab === "crafting");
    _showTab("quests", _activeTab === "quests");
}
let _activeTab = "appointments";
function _showTab(key, visible) {
    const list = key === "quests" ? _quests : key === "appointments" ? _appointments : _crafting;
    list.forEach((row) => {
        row.style.display = visible ? "" : "none";
    });
}
const HOT_KEY_CHARS = "123456789qwertyuiop";
function initHotKeys() {
    const buttons = Array.from(document.querySelectorAll('a, input[type="submit"]'));
    let buttonNext;
    let buttonMore;
    if (buttons.length) {
        buttons.forEach((button) => {
            const innerHTML = button.innerHTML;
            const value = button instanceof HTMLInputElement ? button.value : undefined;
            if (innerHTML === "Next" || (value && value.trim() === "Ok")) {
                buttonNext = button;
                _addHotkeyFor(button.parentNode, "n");
            }
            else if (innerHTML === "More adventures") {
                buttonMore = button;
                _addHotkeyFor(buttonMore.parentNode, "m");
            }
        });
        if (buttonNext) {
            buttonNext.focus();
        }
        else if (buttonMore) {
            buttonMore.focus();
        }
    }
    const choices = Array.from(document.querySelectorAll('input[type="radio"]'));
    const choiceMap = {};
    if (choices.length) {
        choices.forEach((choice, i) => {
            const labelElem = choice.parentNode;
            const hotkey = HOT_KEY_CHARS[i];
            const keyCode = hotkey.toUpperCase().charCodeAt(0);
            choiceMap[keyCode] = choice;
            if (labelElem)
                _addHotkeyFor(labelElem, hotkey);
        });
    }
    if (choices.length || buttonNext || buttonMore) {
        const normalizeKey = (key) => (key >= 96 && key <= 105 ? key - 48 : key);
        document.addEventListener("keyup", (e) => {
            const activeElem = document.activeElement;
            if (activeElem && activeElem.tagName.toLowerCase() === "input" && activeElem.getAttribute("type") === "text") {
                return;
            }
            const keyCode = normalizeKey(e.which);
            if (buttonMore && keyCode === 77) {
                buttonMore.focus();
            }
            else if (buttonNext && (keyCode === 78 || keyCode === 48)) {
                buttonNext.focus();
            }
            else if (Object.prototype.hasOwnProperty.call(choiceMap, keyCode)) {
                const choice = choiceMap[keyCode];
                choice.checked = true;
                choice.focus();
                _publishChoiceEvent(choice);
            }
        });
    }
}
function _publishChoiceEvent(choice) {
    const event = new CustomEvent("adventure.choiceSelected", {
        detail: textNormalized(choice.nextSibling),
    });
    window.dispatchEvent(event);
}
function _addHotkeyFor(elem, text) {
    if (elem) {
        const span = document.createElement("span");
        span.innerHTML = `<sup style="padding: 1px 3px; border: 1px solid #666; font-size: 10px">${text}</sup>`;
        elem.appendChild(span);
    }
}
function initHighlights(context) {
    if (!context || !context.isQuest) {
        return;
    }
    const { adventure, place } = context;
    const adventures = {};
    adventures[Quests.RescuingFatherWuel] = getWuelHighlights;
    adventures[Quests.Passingtime] = getPassingtimeHighlights;
    adventures[Quests.IngenuityTest] = getIngenuityTestHighlights;
    if (!(adventure in adventures)) {
        return;
    }
    const highlights = adventures[adventure]()[place] || [];
    let texts = [...context.texts];
    highlights.forEach((x) => {
        const start = x.indexOf("_");
        const end = x.indexOf("_", start + 1);
        const search = new RegExp(start > -1 ? x.replace(/_/g, "") : x, "g");
        const highlight = start > -1 ? `${x.substring(0, start)}<span style="color:orchid">${x.substring(start + 1, end)}</span>${x.substring(end + 1)}` : `<span style="color:orchid">${x}</span>`;
        texts = texts.map((y) => y.replace(search, highlight));
    });
    const re_html = /&lt;(font|b|i|u|span)&gt;(.+?)&lt;\/\1&gt;/g;
    const domElements = Array.from(document.querySelectorAll("form > p, .REP_LVL_DESCRIPTION"));
    domElements.forEach((el, i) => {
        if (texts[i] !== undefined) {
            el.innerHTML = texts[i].replace(re_html, '<$1 style="color:mediumseagreen">$2</$1>');
        }
    });
}
function getPassingtimeHighlights() {
    return {
        "*": ["bejeweled necklace"],
        "Grandfather answers": ["stonemasonry", "carpenters", "cobblers", "bakers"],
    };
}
function getWuelHighlights() {
    return {
        "*": [
            "juicy fruits",
            "food in layers",
            "nutty things",
            "fish with arms",
            "things that zap",
            "things that are purple",
            "things that glow in the dark",
            "fishes with sharp teeth",
            "lavendar-colored wand",
            "the _mayor_ here",
            "taken _all the classes_",
            "an unusual _iridescent one_",
            "fine _electric eel_",
            "fine _octopus_",
            "fine _lantern fish_",
            "fine _puffer fish_",
            "fine _mackerel_",
            "fine _piranha_",
            "other _gear for mages_",
            "other _ranged weapons_",
            "other _armors_",
            "other _melee weapons_",
            "herbs, incense and poisons",
            "other enhanced _jewelry_",
            "instruments and parchments",
            "other _exotic items_",
        ],
        "Kotko: church": ["enchanted band"],
        "Kotko: woman with red feather": ["peanuts", "eggplant", "banana", "sandwich", "orange", "fried chicken"],
    };
}
function getIngenuityTestHighlights() {
    return {
        "*": ["bejeweled necklace", "blue key", "Large", "Medium", "Small", "Tiny", "pair of fairy wings"],
        "Freshwater Spring": ["under _the water_"],
        "Middle of the River : Chatting": ["red key", "crescent", "rectangle", "circle", "heart", "diamond", "plus-sign", "oval", "star", "triangle", "square"],
        "Rialb's Ghost": ["purple key"],
        "The Fairytale Princess": ["pink hair ribbons"],
        "The Hut": ["Turquoise", "Yellow", "Green", "Red", "Magenta", "Black", "Blue", "Purple", "Orange", "White"],
    };
}
function main() {
    initTabs();
    try {
        const context = buildAdventureContext();
        initHighlights(context);
        initHotKeys();
        initQuestLog(context);
    }
    catch (e) {
        console.error("Failed to build adventure context", e);
    }
}
if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", main, { once: true });
else
    main();

})();