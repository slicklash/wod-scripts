// ==UserScript==
// @name           Adventure Assistant
// @description    Script allows to do adventures using keyboard, groups adventures into tabs
// @version        1.2.0
// @author         Never
// @include        http*://*.world-of-dungeons.net/wod/spiel/event/play.php*
// @include        http*://*.world-of-dungeons.net/wod/spiel/event/eventlist.php*
// @run-at         document-start
// @grant          GM_getValue
// @grant          GM_setValue
// ==/UserScript==

(function() {
'use strict';
var Quests = {
    RescuingFatherWuel: 'Rescuing Father Wuel',
    Passingtime: 'Passingtime',
    IngenuityTest: 'Ingenuity Test'
};
var _context;
function getContext() {
    if (!_context) {
        var h1 = document.querySelector('h1'), title = h1 ? h1.textContent : '';
        if (!title || title.indexOf('adventure') !== 0)
            return;
        var texts = Array.from(document.querySelectorAll('form > p, .REP_LVL_DESCRIPTION'));
        texts.forEach(function (x) {
            x.innerHTML = x.innerHTML.replace(/&lt;font\s+color\s*=\s*["'](.+)["']&gt;/g, '<font color="$1">')
                .replace(/&lt;\/font&gt;/g, '</font>')
                .replace(/<br>\s+<br>/g, '<br>');
        });
        _context = {
            adventure: title.replace('adventure ', ''),
            texts: texts,
            text: texts.map(function (x) { return x.innerHTML.trim(); }).join(' '),
            place: (document.querySelector('#smarttabs__level_inner h3 > a') || { textContent: '*' }).textContent.trim(),
            idHero: document.querySelector('[href*="session_hero_id"]').href.match(/session_hero_id=([\d]+)/)[1],
            world: document.location.hostname.split('.')[0]
        };
        _context.isQuest = Object.keys(Quests).some(function (x) { return _context.adventure.indexOf(Quests[x]) > -1; });
    }
    return _context;
}
function initHighlights(context) {
    if (!context || !context.isQuest)
        return;
    var adventure = context.adventure, place = context.place, adventures = {};
    adventures[Quests.RescuingFatherWuel] = getWuelHighlights;
    adventures[Quests.Passingtime] = getPassingtimeHighlights;
    adventures[Quests.IngenuityTest] = getIngenuityTestHighlights;
    if (!(adventure in adventures))
        return;
    var highlights = adventures[adventure]()[place];
    if (!highlights)
        return;
    var texts = context.texts.map(function (x) { return x.innerHTML; });
    highlights.forEach(function (x) {
        var start = x.indexOf('_'), end = x.indexOf('_', start + 1), search = new RegExp(start > -1 ? x.replace(/_/g, '') : x, 'g'), highlight = start > -1 ? x.substring(0, start) + "<span style=\"color:orchid\">" + x.substring(start + 1, end) + "</span>" + x.substring(end + 1) : "<span style=\"color:orchid\">" + x + "</span>";
        texts.forEach(function (x, i) { texts[i] = x.replace(search, highlight); });
    });
    context.texts.forEach(function (x, i) { x.innerHTML = texts[i]; });
}
function getPassingtimeHighlights() {
    return {
        '*': ['bejeweled necklace'],
        'Grandfather answers': ['stonemasonry', 'carpenters', 'cobblers', 'bakers']
    };
}
function getWuelHighlights() {
    return {
        '*': ['juicy fruits', 'food in layers', 'nutty things', 'fish with arms', 'things that zap', 'things that are purple', 'things that glow in the dark', 'fishes with sharp teeth',
            'lavendar-colored wand', 'the _mayor_ here', 'taken _all the classes_', 'an unusual _iridescent one_',
            'fine _electric eel_', 'fine _octopus_', 'fine _lantern fish_', 'fine _puffer fish_', 'fine _mackerel_', 'fine _piranha_',
            'other _gear for mages_', 'other _ranged weapons_', 'other _armors_', 'other _melee weapons_', 'herbs, incense and poisons', 'other enhanced _jewelry_', 'instruments and parchments', 'other _exotic items_'],
        'Kotko: church': ['enchanted band'],
        'Kotko: woman with red feather': ['peanuts', 'eggplant', 'banana', 'sandwich', 'orange', 'fried chicken']
    };
}
function getIngenuityTestHighlights() {
    return {
        '*': ['bejeweled necklace', 'blue key', 'Large', 'Medium', 'Small', 'Tiny'],
        'Middle of the River : Chatting': ['red key', 'crescent', 'rectangle', 'circle', 'heart', 'diamond', 'plus-sign', 'oval', 'star', 'triangle', 'square'],
        'Freshwater Spring': ['under _the water_'],
        'The Fairytale Princess': ['pink hair ribbons'],
        "Rialb's Ghost": ['purple key'],
        'The Hut': ['Turquoise', 'Yellow', 'Green', 'Red', 'Magenta', 'Black', 'Blue', 'Purple', 'Orange', 'White']
    };
}
function initHotKeys() {
    var buttons = Array.from(document.querySelectorAll('a, input[type="submit"]')), buttonNext, buttonMore;
    if (buttons.length) {
        buttons.forEach(function (button) {
            if (button.innerHTML === 'Next' || (button.value && button.value.trim() === 'Ok')) {
                buttonNext = button;
                addHotkeyFor(buttonNext.parentNode, 'n');
            }
            else if (button.innerHTML === 'More adventures') {
                buttonMore = button;
                addHotkeyFor(buttonMore.parentNode, 'm');
            }
        });
        if (buttonNext) {
            buttonNext.focus();
        }
        else if (buttonMore) {
            buttonMore.focus();
        }
    }
    var choices = (Array.from(document.querySelectorAll('input[type="radio"]'))), choiceMap = {};
    if (choices.length) {
        var HOT_KEYS_1 = '123456789qwertyuiop';
        choices.forEach(function (choice, i) {
            var labelElem = choice.parentNode, hotkey = HOT_KEYS_1[i], keyCode = hotkey.toUpperCase().charCodeAt(0);
            choiceMap[keyCode] = choice;
            addHotkeyFor(labelElem, hotkey);
        });
    }
    if (choices.length || buttonNext || buttonMore) {
        var normalizeKey_1 = function (key) { return key >= 96 && key <= 105 ? key - 48 : key; };
        document.onkeyup = function (e) {
            var activeElem = document.activeElement;
            if (activeElem && activeElem.tagName.toLowerCase() === 'input' && activeElem.getAttribute('type') === 'text') {
                return;
            }
            var keyCode = normalizeKey_1(e.which);
            if (buttonMore && keyCode === 77) {
                buttonMore.focus();
            }
            else if (buttonNext && (keyCode === 78 || keyCode === 48)) {
                buttonNext.focus();
            }
            else if (choiceMap.hasOwnProperty(keyCode)) {
                var choice = choiceMap[keyCode];
                choice.checked = true;
                choice.focus();
                publishChoiceEvent(choice);
                return false;
            }
        };
    }
}
function publishChoiceEvent(choice) {
    var event = new CustomEvent('adventure.choiceSelected', {
        'detail': choice.nextSibling.textContent.trim()
    });
    window.dispatchEvent(event);
}
function addHotkeyFor(elem, text) {
    if (elem) {
        var span = document.createElement('span');
        span.innerHTML = "<sup style=\"padding: 1px 3px; border: 1px solid #666; font-size: 10px\">" + text + "</sup>";
        elem.appendChild(span);
    }
}
var crafting = [], appointments = [];
function initTabs() {
    if (document.querySelector('.paginator_row')) {
        var appList_1 = ['The Adventurers\' Guild', 'Passingtime', 'Rescuing Father Wuel', 'The Fortunes of Madame', 'Ingenuity Test'];
        var isAppointment = function (title) { return appList_1.some(function (x) { return title.indexOf(x) > -1; }); };
        var invertClass = function (className) { return className === 'row0' ? 'row1' : 'row0'; };
        var titleOf_1 = function (node) { return (node.querySelector('h3') || { innerHTML: '' }).innerHTML; };
        var adventures = Array.from(document.querySelectorAll('.row0, .row1')), craftClass = 'row1', appClass = 'row1';
        var guild = adventures.filter(function (x) { return titleOf_1(x) === appList_1[0]; }).pop();
        if (guild) {
            guild.parentNode.insertBefore(guild, guild.parentNode.childNodes[0]);
            adventures.splice(adventures.indexOf(guild), 1);
            adventures.splice(0, 0, guild);
        }
        for (var _i = 0, adventures_1 = adventures; _i < adventures_1.length; _i++) {
            var adventure = adventures_1[_i];
            var className = adventure.className, title = titleOf_1(adventure);
            if (!title)
                continue;
            if (isAppointment(title)) {
                if (appClass === className) {
                    appClass = invertClass(appClass);
                    adventure.className = appClass;
                }
                else {
                    appClass = className;
                }
                appointments.push(adventure);
                adventure.style.display = 'none';
            }
            else {
                if (craftClass === className) {
                    craftClass = invertClass(craftClass);
                    adventure.className = craftClass;
                }
                else {
                    craftClass = className;
                }
                crafting.push(adventure);
            }
            hideDescription(adventure);
        }
        var tabCrafting = makeTab('Crafting', true);
        var tabAppointments = makeTab('Appointments', false);
        var menu = document.createElement('ul');
        menu.innerHTML = '<li class="label">Adventures</li>';
        menu.appendChild(tabCrafting);
        menu.appendChild(tabAppointments);
        var bar = document.createElement('div');
        bar.className = 'bar';
        var content = document.createElement('div');
        content.className = 'content';
        var div = document.createElement('div');
        div.className += 'tab';
        div.appendChild(menu);
        div.appendChild(bar);
        div.appendChild(content);
        var h1 = document.getElementsByTagName('h1')[0];
        var p = h1.parentNode;
        p.replaceChild(div, h1);
    }
}
function hideDescription(row) {
    var td = row.querySelector('td'), descriptionNodes = Array.from(td.childNodes).filter(function (x) { return x.nodeName !== 'TABLE'; }), div = document.createElement('div'), header = td.children[0];
    div.style.display = 'none';
    td.insertBefore(div, header.nextSibling);
    descriptionNodes.forEach(function (x) { return div.appendChild(x); });
    header.style.cursor = 'pointer';
    var title = header.querySelector('h3');
    title.style.display = 'inline';
    var im = document.createElement('img');
    im.src = '/wod/css/icons/common/more_text.png';
    im.style.paddingLeft = '10px';
    title.parentNode.appendChild(im);
    title.parentElement.style.paddingBottom = '5px';
    td.style.paddingBottom = '5px';
    header.addEventListener('click', function () {
        if (div.style.display) {
            div.style.display = '';
            im.src = im.src.replace('more', 'less');
        }
        else {
            div.style.display = 'none';
            im.src = im.src.replace('less', 'more');
        }
    });
}
function makeTab(title, selected) {
    var action = document.createElement('a');
    action.setAttribute('href', '#');
    action.innerHTML = title;
    action.addEventListener('click', selectTab);
    var tab = document.createElement('li');
    tab.className = selected ? 'selected' : 'not_selected';
    tab.appendChild(action);
    return tab;
}
function selectTab(e) {
    var max = Math.max(crafting.length, appointments.length), isApp = e.target.innerHTML === 'Appointments', selectedTab = e.target.parentNode, options = isApp ? { otherTab: selectedTab.previousSibling, displayApp: '', displayCraft: 'none' } : { otherTab: selectedTab.nextSibling, displayApp: 'none', displayCraft: '' };
    selectedTab.className = 'selected';
    options.otherTab.className = 'not_selected';
    for (var i = 0; i < max; i++) {
        if (i < crafting.length)
            crafting[i].style.display = options.displayCraft;
        if (i < appointments.length)
            appointments[i].style.display = options.displayApp;
    }
}
function initQuestLog(context) {
    if (!context || !context.isQuest)
        return;
    var questLog = new QuestLog(context), choice;
    if (!questLog.isSupported)
        return;
    window.addEventListener('adventure.choiceSelected', function (e) {
        choice = e.detail;
    });
    var form = document.forms.the_form;
    if (form) {
        form.addEventListener('submit', function () {
            if (choice)
                questLog.onChoice(choice);
        });
    }
}
var QuestLog = (function () {
    function QuestLog(_context) {
        this._context = _context;
        this.isSupported = true;
        var adventure = _context.adventure, place = _context.place, adventures = {};
        adventures[Quests.IngenuityTest] = this.getIngenuityTestInfo;
        adventures[Quests.RescuingFatherWuel] = this.getRescueFatherWuelInfo;
        adventures[Quests.Passingtime] = this.getPassingTimeInfo;
        if (!(adventure in adventures)) {
            this.isSupported = false;
            return;
        }
        this._info = adventures[adventure]();
        this._placeOptions = this._info[place];
        this._id = _context.world + "_" + _context.idHero + "_" + _context.adventure.replace(/ /g, '').toLowerCase();
        this.load();
        if (this._placeOptions)
            this.checkPlace();
        console.log('questlog:', this._data);
        console.log('context:', _context.place, _context.texts);
        this.display();
    }
    QuestLog.prototype.onChoice = function (choice) {
        if (!this._placeOptions)
            return;
        this.pickItem(choice);
        this.save();
        console.log('on submit', choice, this._data);
    };
    QuestLog.prototype.pickItem = function (item) {
        var op = this._placeOptions;
        if (op.pickSingle) {
            var itm = (op.pickSingleTransform ? op.pickSingleTransform(item) : item).trim();
            if (itm && op.pickSingle.indexOf(itm) > -1) {
                this._data.itemsPicked = this._data.itemsPicked.filter(function (x) { return op.pickSingle.indexOf(x) < 0; });
                this._data.itemsPicked.push(itm);
            }
        }
    };
    QuestLog.prototype.checkPlace = function () {
        var _this = this;
        var op = this._placeOptions, isChanged = false, text = this._context.text;
        if (op.reset && text.indexOf(op.reset) > -1) {
            this.reset();
            return;
        }
        if (op.collect) {
            op.collect.forEach(function (x) {
                if (text.indexOf(x.match) > -1) {
                    x.found.forEach(function (itm) {
                        if (_this._data.itemsFound.indexOf(itm) < 0) {
                            _this._data.itemsFound.push(itm);
                            isChanged = true;
                        }
                    });
                }
            });
        }
        if (op.use) {
            op.use.forEach(function (x) {
                if (text.indexOf(x.match) > -1) {
                    if (x.found)
                        _this._data.itemsFound = _this._data.itemsFound.filter(function (itm) { return x.found.indexOf(itm) < 0; });
                    if (x.picked)
                        _this._data.itemsPicked = _this._data.itemsPicked.filter(function (itm) { return x.picked.indexOf(itm) < 0; });
                    isChanged = true;
                }
            });
        }
        if (op.do) {
            op.do.forEach(function (x) {
                if (text.indexOf(x.match) > -1) {
                    x.done.forEach(function (task) {
                        if (_this._data.tasksDone.indexOf(task) < 0) {
                            _this._data.tasksDone.push(task);
                            isChanged = true;
                        }
                    });
                }
            });
        }
        if (isChanged)
            this.save();
    };
    QuestLog.prototype.display = function () {
        var h1 = document.querySelector('h1');
        if (!h1)
            return;
        var toText = function (title, items) {
            if (!items || !items.length)
                return '';
            items.sort();
            return title + '\n' + items.join('\n');
        };
        var data = this._data, text = [toText('backpack:', data.itemsPicked.concat(data.itemsFound)), toText('done:', data.tasksDone)].join('\n\n');
        h1.setAttribute('title', text);
    };
    QuestLog.prototype.load = function () {
        var empty = { itemsPicked: [], itemsFound: [], tasksDone: [] }, value = GM_getValue(this._id), loaded = value ? JSON.parse(value) : {};
        Object.keys(loaded).forEach(function (x) { if (!empty[x])
            delete loaded[x]; });
        this._data = Object.assign(empty, loaded);
    };
    QuestLog.prototype.save = function () {
        GM_setValue(this._id, JSON.stringify(this._data));
    };
    QuestLog.prototype.reset = function () {
        this._data = { itemsPicked: [], itemsFound: [], tasksDone: [] };
        GM_setValue(this._id, undefined);
    };
    QuestLog.prototype.getPassingTimeInfo = function () {
        return {};
    };
    QuestLog.prototype.getRescueFatherWuelInfo = function () {
        return {
            '*': {
                collect: [
                    { match: 'unusual iridescent one', found: ['iridescent rock'] },
                    { match: 'fine electric eel', found: ['electric eel'] },
                    { match: 'fine octopus', found: ['octopus'] },
                    { match: 'fine lantern', found: ['lantern fish'] },
                    { match: 'fine puffer', found: ['puffer fish'] },
                    { match: 'fine mackerel', found: ['mackerel'] },
                    { match: 'fine piranha', found: ['piranha'] },
                ]
            },
            "Pekkerin Fen: Mel's School for Adventurers": {
                do: [
                    { match: 'Welcome to class #1', done: ['Adventure class #1'] },
                    { match: 'Welcome to class #2', done: ['Adventure class #2'] },
                    { match: 'Welcome to class #3', done: ['Adventure class #3'] },
                    { match: 'Welcome to class #4', done: ['Adventure class #4'] }
                ]
            },
            "Town Hall: Mayor's Office": { reset: 'Father Wuel, welcome' }
        };
    };
    QuestLog.prototype.getIngenuityTestInfo = function () {
        return {
            '*': {
                collect: [
                    { match: 'You find a sparkly bejeweled necklace', found: ['bejeweled necklace'] },
                    { match: 'you see a blue key', found: ['blue key'] },
                    { match: 'You thank them for the wings', found: ['wings'] }
                ],
                use: [
                    { match: "it doesn't last forever", picked: ['bunch of driftwood', 'limburger cheese'] },
                    { match: 'You put a shell in', picked: ['bunch of tiny shells'] }
                ],
                do: [
                    { match: 'River mini-game done', done: ['River mini-game'] }
                ]
            },
            'The Fairytale Princess': { collect: [{ match: 'hands you some pink hair ribbons', found: ['pink hair ribbons'] }] },
            "Rialb's Ghost": { collect: [{ match: 'purple key', found: ['purple key'] }] },
            'Dwarf': { use: [{ match: 'He drinks it all down', found: ['water'], picked: ['bananas'] }] },
            'Rickety Shed : Pick ...': { pickSingle: ['coil of rope', 'grass skirt', 'boat oars'] },
            'Sheltered Beach : Pick ...': { pickSingle: ['iridescent rock', 'bunch of driftwood', 'large carapace'] },
            'Middle of the River : Pick ...': {
                pickSingle: ['leaf lettuce', 'pumpkin', 'bananas', 'deck of playing cards', 'carrots', 'rainbow trout', 'corn', 'limburger cheese', 'suspenders'],
                pickSingleTransform: function (x) { return x.indexOf('Buy ') === 0 ? x.replace('Buy ', '') : ''; }
            },
            'Middle of the River : Chatting': { collect: [{ match: 'red key', found: ['red key'] }] },
            'Rocky Shore, at a River': { collect: [{ match: 'decent rowboat here', found: ['rowboat with oars'] }] },
            'Waves Beach : Pick ...': { pickSingle: ['bunch of tiny shells', 'bulbaroose shell', 'conch shell'] },
            'Freshwater Spring': { collect: [{ match: 'the water', found: ['water'] }] },
            'The Upside-Down Carnival Machine': { do: [{ match: 'Carnival Machine mini-game done', done: ['Carnival Machine mini-game'] }] },
            'Up on a Ledge': { do: [{ match: 'Thief mini-game done', done: ['Thief mini-game'] }] },
            'Copious Cutouts': { do: [{ match: 'Copious Cutouts mini-game done', done: ['Copious Cutouts mini-game'] }] },
            'Back at the Guild': { reset: 'Across the bridge' }
        };
    };
    return QuestLog;
}());
function main() {
    initTabs();
    var context = getContext();
    initHighlights(context);
    initHotKeys();
    initQuestLog(context);
}
if (!window.__karma__)
    document.addEventListener('DOMContentLoaded', function () { return main(); });

})();
