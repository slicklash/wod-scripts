// ==UserScript==
// @name           Adventure Assistant
// @description    Script allows to do adventures using keyboard, groups adventures into tabs
// @version        1.2.0
// @author         Never
// @include        http*://*.world-of-dungeons.net/wod/spiel/event/play.php*
// @include        http*://*.world-of-dungeons.net/wod/spiel/event/eventlist.php*
// @run-at         document-start
// @grant          none
// ==/UserScript==

(function() {
'use strict';
var _context;
function getContext() {
    if (!_context) {
        var h1 = document.querySelector('h1'), title = h1 ? h1.textContent : '';
        if (!title || title.indexOf('adventure') !== 0)
            return;
        _context = {
            adventure: title.replace('adventure ', ''),
            texts: Array.from(document.querySelectorAll('form > p, .REP_LVL_DESCRIPTION')),
            place: (document.querySelector('#smarttabs__level_inner h3 > a') || { textContent: '*' }).textContent,
            idHero: document.querySelector('[href*="session_hero_id"]').href.match(/session_hero_id=([\d]+)/)[1],
        };
    }
    return _context;
}
var RescuingFatherWuel = 'Rescuing Father Wuel';
var Passingtime = 'Passingtime';
var IngenuityTest = 'Ingenuity Test';
function initHighlights(context) {
    var adventure = context.adventure, place = context.place, adventures = {};
    adventures[RescuingFatherWuel] = getWuelHighlights;
    adventures[Passingtime] = getPassingtimeHighlights;
    adventures[IngenuityTest] = getIngenuityTestHighlights;
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
        'Grandfather answers': ['stonemasonry', 'carpenters']
    };
}
function getWuelHighlights() {
    return {
        '*': ['juicy fruits', 'food in layers', 'nutty things', 'fish with arms', 'things that zap',
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
    var choices = Array.from(document.querySelectorAll('input[type="radio"]')), choiceMap = {};
    if (choices.length) {
        var HOT_KEYS = '123456789qwertyuiop';
        choices.forEach(function (choice, i) {
            var labelElem = choice.parentNode, hotkey = HOT_KEYS[i], keyCode = hotkey.toUpperCase().charCodeAt(0);
            choiceMap[keyCode] = choice;
            addHotkeyFor(labelElem, hotkey);
        });
    }
    if (choices.length || buttonNext || buttonMore) {
        var normalizeKey = function (key) { return key >= 96 && key <= 105 ? key - 48 : key; };
        document.onkeyup = function (e) {
            var activeElem = document.activeElement;
            if (activeElem && activeElem.tagName.toLowerCase() === 'input' && activeElem.getAttribute('type') === 'text') {
                return;
            }
            var keyCode = normalizeKey(e.which);
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
                return false;
            }
        };
    }
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
        var appList = ['The Adventurers\' Guild', 'Passingtime', 'Rescuing Father Wuel', 'The Fortunes of Madame', 'Ingenuity Test'];
        var isAppointment = function (title) { return appList.some(function (x) { return title.indexOf(x) > -1; }); };
        var invertClass = function (className) { return className === 'row0' ? 'row1' : 'row0'; };
        var titleOf = function (node) { return (node.querySelector('h3') || { innerHTML: '' }).innerHTML; };
        var adventures = Array.from(document.querySelectorAll('.row0, .row1')), craftClass = 'row1', appClass = 'row1';
        var guild = adventures.filter(function (x) { return titleOf(x) === appList[0]; }).pop();
        if (guild) {
            guild.parentNode.insertBefore(guild, guild.parentNode.childNodes[0]);
            adventures.splice(adventures.indexOf(guild), 1);
            adventures.splice(0, 0, guild);
        }
        for (var _i = 0; _i < adventures.length; _i++) {
            var adventure = adventures[_i];
            var className = adventure.className, title = titleOf(adventure);
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
function main() {
    initTabs();
    var context = getContext();
    initHighlights(context);
    initHotKeys();
}
document.addEventListener('DOMContentLoaded', main);

})();
