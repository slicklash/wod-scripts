// ==UserScript==
// @name           Adventure Assistant
// @description    Script allows to do adventures using keyboard, groups adventures into tabs
// @version        1.1.0
// @author         Never
// @include        http*://*.world-of-dungeons.net/wod/spiel/event/play.php*
// @include        http*://*.world-of-dungeons.net/wod/spiel/event/eventlist.php*
// ==/UserScript==

(function(window, undefined) {

var buttons = document.querySelectorAll('a, input[type="submit"]'), choices = document.querySelectorAll('input[type="radio"]'), buttonNext, buttonMore, choice, button, label, focusDone = false, choiceMap = {}, key, i, clue;

for (i = 0; i < buttons.length; i++) {
    button = buttons[i];
    if (button.innerHTML === "Next" || (button.value && button.value.trim() === 'Ok')) {
        buttonNext = button;
    } else if (button.innerHTML === "More adventures") {
        buttonMore = button;
    }
}

if (buttonMore) {
    addClue(buttonMore.parentNode, 'm');
    buttonMore.focus();
}

if (buttonNext) {
    addClue(buttonNext.parentNode, 'n');
    buttonNext.focus();
}

var letters = 'qwertyuiop', upper = 9;

for (i = 0; i < choices.length; i++) {
    choice = choices[i];
    label = choice.parentNode;
    if (i <= upper) {
        clue = i + 1;
        key = clue + 48;
    } else {
        clue = letters[i - upper - 1];
        key = clue.toUpperCase().charCodeAt(0);
    }
    choiceMap[key] = choice;
    addClue(label, clue);
}

document.onkeyup = function (e) {
    var active = document.activeElement;
    if (active && active.tagName.toLowerCase() === 'input' && active.getAttribute('type') === 'text') {
        return;
    }

    key = e.which;
    if (key >= 96 && key <= 105) {
        key -= 48;
    }

    if (key === 77) {
        buttonMore.focus();
    } else if ((key === 78 || key === 79 || key === 48) && buttonNext) {
        buttonNext.focus();
    } else if (choiceMap.hasOwnProperty(key)) {
        choice = choiceMap[key];
        choice.checked = true;
        choice.focus();
        return false;
    }
};

function addClue(node, clue) {
    if (node) {
        var span = document.createElement('span');
        span.innerHTML = '<sup style="padding: 1px 3px; border: 1px solid #666; font-size: 10px">' + clue + '</sup>';
        node.appendChild(span);
    }
}

if (document.querySelector('.paginator_row')) {
    var adventures = document.querySelectorAll('.row0, .row1'), crafting = [], appointments = [], crafClass, appClass;

    for (i = 0; i < adventures.length; i++) {
        var adventure = adventures[i];
        var className = adventure.className;
        var title = adventure.querySelector('h3');
        if (!title)
            continue;
        if (isAppointment(title.innerHTML)) {
            if (appClass === className) {
                appClass = invertClass(appClass);
                adventure.className = appClass;
            } else {
                appClass = className;
            }
            appointments.push(adventure);
            adventure.style.display = 'none';
        } else {
            if (crafClass === className) {
                crafClass = invertClass(crafClass);
                adventure.className = crafClass;
            } else {
                crafClass = className;
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

function isAppointment(title) {
    return (title.indexOf('Passingtime') > -1 || title.indexOf('Rescuing Father Wuel') > -1 || title.indexOf('The Adventurers\' Guild') > -1 || title.indexOf('The Fortunes of Madame Du Coeur Brise') > -1);
}

function invertClass(className) {
    return className === 'row0' ? 'row1' : 'row0';
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
    var max = Math.max(crafting.length, appointments.length);
    e.target.parentNode.className = 'selected';
    if (e.target.innerHTML === 'Appointments') {
        e.target.parentNode.previousSibling.className = 'not_selected';
        for (i = 0; i < max; i++) {
            if (i < crafting.length)
                crafting[i].style.display = 'none';
            if (i < appointments.length)
                appointments[i].style.display = '';
        }
    } else {
        e.target.parentNode.nextSibling.className = 'not_selected';
        for (i = 0; i < max; i++) {
            if (i < crafting.length)
                crafting[i].style.display = '';
            if (i < appointments.length)
                appointments[i].style.display = 'none';
        }
    }
}
})();