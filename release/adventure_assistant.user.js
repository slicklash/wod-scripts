// ==UserScript==
// @name           Adventure Assistant
// @description    Script allows to do adventures using keyboard, groups adventures into tabs
// @version        1.1.0
// @author         Never
// @include        http*://*.world-of-dungeons.net/wod/spiel/event/play.php*
// @include        http*://*.world-of-dungeons.net/wod/spiel/event/eventlist.php*
// ==/UserScript==

(function(window, document, undefined) {
'use strict';
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
    function onKeyUp(e) {
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
    }
    document.onkeyup = onKeyUp;
}
function addHotkeyFor(elem, text) {
    if (elem) {
        var span = document.createElement('span');
        span.innerHTML = "<sup style=\"padding: 1px 3px; border: 1px solid #666; font-size: 10px\">" + text + "</sup>";
        elem.appendChild(span);
    }
}
var appList = ['The Adventurers\' Guild', 'Passingtime', 'Rescuing Father Wuel', 'The Fortunes of Madame', 'Ingenuity Test'], crafting = [], appointments = [];
if (document.querySelector('.paginator_row')) {
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

})(window, document);
