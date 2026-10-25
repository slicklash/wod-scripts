// ==UserScript==
// @name           Adventure Assistant
// @description    Script allows to do adventures using keyboard, groups adventures into tabs
// @version        1.3.0
// @author         Never
// @include        http*://*.world-of-dungeons.net/wod/spiel/event/play.php*
// @include        http*://*.world-of-dungeons.net/wod/spiel/event/eventlist.php*
// @run-at         document-start
// @grant          GM.getValue
// @grant          GM.setValue
// ==/UserScript==

(function() {
'use strict';
var Quests = {
    IngenuityTest: "Ingenuity Test",
    Passingtime: "Passingtime",
    RescuingFatherWuel: "Rescuing Father Wuel",
};
let _context;
function getContext() {
    if (!_context) {
        const h1 = document.querySelector("h1");
        const title = h1 ? h1.textContent : "";
        if (!title || title.indexOf("adventure") !== 0) {
            return;
        }
        const texts = (Array.from(document.querySelectorAll("form > p, .REP_LVL_DESCRIPTION")));
        texts.forEach((x) => {
            x.innerHTML = x.innerHTML
                .replace(/&lt;font\s+color\s*=\s*["'](.+)["']&gt;/g, '<font color="$1">')
                .replace(/&lt;\/font&gt;/g, "</font>")
                .replace(/<br>\s+<br>/g, "<br>");
        });
        _context = {
            adventure: title.replace("adventure ", ""),
            idHero: (document.querySelector('[href*="session_hero_id"]')).href.match(/session_hero_id=([\d]+)/)[1],
            place: (document.querySelector("#smarttabs__level_inner h3 > a") || {
                textContent: "*",
            }).textContent.trim(),
            text: texts.map((x) => x.innerHTML.trim()).join(" "),
            texts,
            world: document.location.hostname.split(".")[0],
        };
        _context.isQuest = Object.keys(Quests).some((x) => _context.adventure.indexOf(Quests[x]) > -1);
    }
    return _context;
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
    const texts = context.texts.map((x) => x.innerHTML);
    highlights.forEach((x) => {
        const start = x.indexOf("_");
        const end = x.indexOf("_", start + 1);
        const search = new RegExp(start > -1 ? x.replace(/_/g, "") : x, "g");
        const highlight = start > -1
            ? `${x.substring(0, start)}<span style="color:orchid">${x.substring(start + 1, end)}</span>${x.substring(end + 1)}`
            : `<span style="color:orchid">${x}</span>`;
        texts.forEach((y, i) => {
            texts[i] = y.replace(search, highlight);
        });
    });
    const re_html = /&lt;(.+)&gt;(.+)&lt;\/\1&gt;/g;
    context.texts.forEach((x, i) => {
        x.innerHTML = texts[i].replace(re_html, '<$1 style="color:mediumseagreen">$2</$1>');
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
        "Kotko: woman with red feather": [
            "peanuts",
            "eggplant",
            "banana",
            "sandwich",
            "orange",
            "fried chicken",
        ],
    };
}
function getIngenuityTestHighlights() {
    return {
        "*": ["bejeweled necklace", "blue key", "Large", "Medium", "Small", "Tiny", "pair of fairy wings"],
        "Freshwater Spring": ["under _the water_"],
        "Middle of the River : Chatting": [
            "red key",
            "crescent",
            "rectangle",
            "circle",
            "heart",
            "diamond",
            "plus-sign",
            "oval",
            "star",
            "triangle",
            "square",
        ],
        "Rialb's Ghost": ["purple key"],
        "The Fairytale Princess": ["pink hair ribbons"],
        "The Hut": [
            "Turquoise",
            "Yellow",
            "Green",
            "Red",
            "Magenta",
            "Black",
            "Blue",
            "Purple",
            "Orange",
            "White",
        ],
    };
}
function initHotKeys() {
    const buttons = Array.from(document.querySelectorAll('a, input[type="submit"]'));
    let buttonNext;
    let buttonMore;
    if (buttons.length) {
        buttons.forEach((button) => {
            if (button.innerHTML === "Next" ||
                (button.value && button.value.trim() === "Ok")) {
                buttonNext = button;
                addHotkeyFor(buttonNext.parentNode, "n");
            }
            else if (button.innerHTML === "More adventures") {
                buttonMore = button;
                addHotkeyFor(buttonMore.parentNode, "m");
            }
        });
        if (buttonNext) {
            buttonNext.focus();
        }
        else if (buttonMore) {
            buttonMore.focus();
        }
    }
    const choices = (Array.from(document.querySelectorAll('input[type="radio"]')));
    const choiceMap = {};
    if (choices.length) {
        const HOT_KEYS = "123456789qwertyuiop";
        choices.forEach((choice, i) => {
            const labelElem = choice.parentNode;
            const hotkey = HOT_KEYS[i];
            const keyCode = hotkey.toUpperCase().charCodeAt(0);
            choiceMap[keyCode] = choice;
            if (labelElem)
                addHotkeyFor(labelElem, hotkey);
        });
    }
    if (choices.length || buttonNext || buttonMore) {
        const normalizeKey = (key) => (key >= 96 && key <= 105 ? key - 48 : key);
        document.onkeyup = (e) => {
            const activeElem = document.activeElement;
            if (activeElem &&
                activeElem.tagName.toLowerCase() === "input" &&
                activeElem.getAttribute("type") === "text") {
                return;
            }
            const keyCode = normalizeKey(e.which);
            if (buttonMore && keyCode === 77) {
                buttonMore.focus();
            }
            else if (buttonNext &&
                (keyCode === 78 || keyCode === 48)) {
                buttonNext.focus();
            }
            else if (Object.prototype.hasOwnProperty.call(choiceMap, keyCode)) {
                const choice = choiceMap[keyCode];
                choice.checked = true;
                choice.focus();
                publishChoiceEvent(choice);
                return false;
            }
        };
    }
}
function publishChoiceEvent(choice) {
    const event = new CustomEvent("adventure.choiceSelected", {
        detail: choice.nextSibling.textContent.trim(),
    });
    window.dispatchEvent(event);
}
function addHotkeyFor(elem, text) {
    if (elem) {
        const span = document.createElement("span");
        span.innerHTML = `<sup style="padding: 1px 3px; border: 1px solid #666; font-size: 10px">${text}</sup>`;
        elem.appendChild(span);
    }
}
var Store = {
    get(key, defaultValue) {
        return GM.getValue(key, defaultValue);
    },
    set(key, value) {
        return GM.setValue(key, value);
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
        adventures[Quests.Passingtime] = this.getPassingTimeInfo;
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
        this.load().then(() => {
            if (this._placeOptions) {
                this.checkPlace();
            }
            console.log("questlog:", this._data);
            console.log("context:", _context.place, _context.texts);
            this.display();
        });
    }
    onChoice(choice) {
        if (!this._placeOptions) {
            return;
        }
        this.pickItem(choice);
        this.save();
        console.log("on submit", choice, this._data);
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
                        if (this._data?.itemsFound &&
                            this._data.itemsFound.indexOf(itm) < 0) {
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
        const text = [
            toText("backpack:", data.itemsPicked.concat(data.itemsFound)),
            toText("done:", data.tasksDone),
        ].join("\n\n");
        h1.setAttribute("title", text);
    }
    load() {
        const empty = {
            itemsPicked: [],
            itemsFound: [],
            tasksDone: [],
        };
        return new Promise((resolve) => {
            if (!this._id) {
                this._data = empty;
                resolve();
                return;
            }
            Store.get(this._id).then((value) => {
                const loaded = value ? JSON.parse(value) : {};
                Object.keys(loaded).forEach((x) => {
                    if (!empty[x])
                        delete loaded[x];
                });
                this._data = Object.assign(empty, loaded);
                resolve();
            });
        });
    }
    save() {
        if (!this._id || !this._data)
            return;
        Store.set(this._id, JSON.stringify(this._data));
    }
    reset() {
        if (!this._id)
            return;
        this._data = { itemsPicked: [], itemsFound: [], tasksDone: [] };
        Store.set(this._id, "{}");
    }
    getPassingTimeInfo() {
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
                pickSingle: [
                    "leaf lettuce",
                    "pumpkin",
                    "bananas",
                    "deck of playing cards",
                    "carrots",
                    "rainbow trout",
                    "corn",
                    "limburger cheese",
                    "suspenders",
                ],
                pickSingleTransform: (x) => x.indexOf("Buy ") === 0 ? x.replace("Buy ", "") : "",
            },
            "Middle of the River : Chatting": {
                collect: [{ match: "red key", found: ["red key"] }],
            },
            "Rocky Shore, at a River": {
                collect: [
                    { match: "decent rowboat here", found: ["rowboat with oars"] },
                ],
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
const crafting = [];
const appointments = [];
const appList = [
    "The pumpkin hero tavern",
    "The Adventurers' Guild",
    "The Sunday Grove",
    "Free warriors arena of Nebulat",
    "Old Training Grounds",
    "The Fortunes of Madame",
    "Passingtime",
    "Rescuing Father Wuel",
    "Ingenuity Test",
    "Haiku medal",
    "Trading Post",
    "Z Delete Passingtime in-progress flag",
    "Z Clear Forced Exit",
    "Z Set Forced Exit",
];
function initTabs() {
    if (!document.querySelector(".paginator_row"))
        return;
    const isAppointment = (title) => appList.some((name) => title.includes(name));
    const invertClass = (className) => className === "row0" ? "row1" : "row0";
    const titleOf = (row) => row.querySelector("h3")?.innerHTML ?? "";
    const adventures = Array.from(document.querySelectorAll(".row0, .row1"));
    let craftClass = "row1";
    let appClass = "row1";
    adventures.sort((a, b) => {
        const titleA = titleOf(a);
        const titleB = titleOf(b);
        const indexA = appList.findIndex((name) => titleA.includes(name));
        const indexB = appList.findIndex((name) => titleB.includes(name));
        if (indexA === -1)
            return indexB === -1 ? 0 : 1;
        if (indexB === -1)
            return -1;
        return indexA - indexB;
    });
    adventures.forEach((adventure) => {
        adventure.parentNode?.appendChild(adventure);
    });
    for (const adventure of adventures) {
        const className = adventure.className;
        const title = titleOf(adventure);
        if (!title)
            continue;
        const isApp = isAppointment(title);
        const currentClass = isApp ? appClass : craftClass;
        const nextClass = currentClass === className ? invertClass(currentClass) : className;
        if (isApp) {
            appClass = nextClass;
            appointments.push(adventure);
        }
        else {
            craftClass = nextClass;
            crafting.push(adventure);
            adventure.style.display = "none";
        }
        adventure.className = nextClass;
        hideDescription(adventure);
    }
    const menu = document.createElement("ul");
    menu.innerHTML = '<li class="label">Adventures</li>';
    menu.append(makeTab("Appointments", true), makeTab("Crafting", false));
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
}
function hideDescription(row) {
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
function makeTab(title, selected) {
    const action = document.createElement("a");
    action.href = "#";
    action.textContent = title;
    action.addEventListener("click", selectTab);
    const tab = document.createElement("li");
    tab.className = selected ? "selected" : "not_selected";
    tab.appendChild(action);
    return tab;
}
function selectTab(e) {
    e.preventDefault();
    const target = e.currentTarget;
    const selectedTab = target.parentElement;
    if (!selectedTab)
        return;
    const isApp = target.textContent?.trim() === "Appointments";
    const otherTab = isApp
        ? selectedTab.nextElementSibling
        : selectedTab.previousElementSibling;
    selectedTab.className = "selected";
    if (otherTab)
        otherTab.className = "not_selected";
    appointments.forEach((row) => {
        row.style.display = isApp ? "" : "none";
    });
    crafting.forEach((row) => {
        row.style.display = isApp ? "none" : "";
    });
}
function main() {
    initTabs();
    const context = getContext();
    if (!context)
        return;
    initHighlights(context);
    initHotKeys();
    initQuestLog(context);
}
document.addEventListener("DOMContentLoaded", () => main());

})();