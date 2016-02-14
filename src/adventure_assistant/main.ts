/// <reference path="../common/prototypes/array.ts" />

'use strict';

let crafting = [],
    appointments = [];

function main() {

    // --- Action buttons

    let buttons = Array.from(document.querySelectorAll('a, input[type="submit"]')),
        buttonNext,
        buttonMore;

    if (buttons.length) {

        buttons.forEach(button => {

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

    // --- Choices

    let choices: HTMLInputElement[] = Array.from(document.querySelectorAll('input[type="radio"]')),
        choiceMap = {};

    if (choices.length) {

        let HOT_KEYS = '123456789qwertyuiop';

        choices.forEach((choice, i) => {

            let labelElem = choice.parentNode,
                hotkey: string = HOT_KEYS[i],
                keyCode: number = hotkey.toUpperCase().charCodeAt(0);

            choiceMap[keyCode] = choice;
            addHotkeyFor(labelElem, hotkey);

        });

    }

    if (choices.length || buttonNext || buttonMore) {

        const normalizeKey = key => key >= 96 && key <= 105 ? key - 48 : key;

        document.onkeyup = (e: KeyboardEvent) => {

            let activeElem = document.activeElement;

            if (activeElem && activeElem.tagName.toLowerCase() === 'input' && activeElem.getAttribute('type') === 'text') {
                return;
            }

            let keyCode = normalizeKey(e.which);

            if (buttonMore && keyCode === 77 /* m */) {
                buttonMore.focus();
            }
            else if (buttonNext && (keyCode === 78 /* n */ || keyCode === 48 /* 0 */)) {
                buttonNext.focus();
            }
            else if (choiceMap.hasOwnProperty(keyCode)) {
                let choice = choiceMap[keyCode];
                choice.checked = true;
                choice.focus();
                return false;
            }
        }
    }

    // --- Adventures

    let appList = ['The Adventurers\' Guild', 'Passingtime', 'Rescuing Father Wuel', 'The Fortunes of Madame', 'Ingenuity Test'];

    if (document.querySelector('.paginator_row')) {

        const isAppointment = title => appList.some(x => title.indexOf(x) > -1);
        const invertClass = className => className === 'row0' ? 'row1' : 'row0';
        const titleOf = node => (node.querySelector('h3') || { innerHTML: '' }).innerHTML;

        let adventures = Array.from(document.querySelectorAll('.row0, .row1')),
            craftClass = 'row1', appClass = 'row1';

        let guild = adventures.filter(x => titleOf(x) === appList[0]).pop();
        if (guild) {
            guild.parentNode.insertBefore(guild, guild.parentNode.childNodes[0]);
            adventures.splice(adventures.indexOf(guild), 1);
            adventures.splice(0, 0, guild);
        }

        for (let adventure of adventures) {

            let className = adventure.className,
                title = titleOf(adventure);

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

        let tabCrafting = makeTab('Crafting', true);
        let tabAppointments = makeTab('Appointments', false);

        let menu = document.createElement('ul');
        menu.innerHTML = '<li class="label">Adventures</li>';

        menu.appendChild(tabCrafting);
        menu.appendChild(tabAppointments);

        let bar = document.createElement('div');
        bar.className = 'bar';

        let content = document.createElement('div');
        content.className = 'content';

        let div = document.createElement('div');
        div.className += 'tab';
        div.appendChild(menu);
        div.appendChild(bar);
        div.appendChild(content);

        let h1 = document.getElementsByTagName('h1')[0];
        let p = h1.parentNode;
        p.replaceChild(div, h1);
    }
}

function hideDescription(row) {

    let td = row.querySelector('td'),
        descriptionNodes = Array.from(td.childNodes).filter(x => x.nodeName !== 'TABLE'),
        div = document.createElement('div'),
        header = td.children[0];

    div.style.display = 'none';
    td.insertBefore(div, header.nextSibling);
    descriptionNodes.forEach(x => div.appendChild(x));

    header.style.cursor = 'pointer';

    let title = header.querySelector('h3');
    title.style.display = 'inline';

    let im = document.createElement('img');
    im.src = '/wod/css/icons/common/more_text.png';
    im.style.paddingLeft = '10px';

    title.parentNode.appendChild(im);
    title.parentElement.style.paddingBottom = '5px';
    td.style.paddingBottom = '5px';

    header.addEventListener('click', () => {
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

function addHotkeyFor(elem: Node, text: string) {
    if (elem) {
        let span = document.createElement('span');
        span.innerHTML = `<sup style="padding: 1px 3px; border: 1px solid #666; font-size: 10px">${text}</sup>`;
        elem.appendChild(span);
    }
}

function makeTab(title, selected) {
    let action = document.createElement('a');
    action.setAttribute('href', '#');
    action.innerHTML = title;
    action.addEventListener('click', selectTab);

    let tab = document.createElement('li');
    tab.className = selected ? 'selected' : 'not_selected';
    tab.appendChild(action);
    return tab;
}

function selectTab(e) {

    let max = Math.max(crafting.length, appointments.length),
        isApp = e.target.innerHTML === 'Appointments',
        selectedTab = e.target.parentNode,
        options = isApp ? { otherTab: selectedTab.previousSibling, displayApp: '', displayCraft: 'none' }: { otherTab: selectedTab.nextSibling, displayApp: 'none', displayCraft: '' };

    selectedTab.className = 'selected';
    options.otherTab.className = 'not_selected';

    for (let i = 0; i < max; i++) {
        if (i < crafting.length)
            crafting[i].style.display = options.displayCraft;
        if (i < appointments.length)
            appointments[i].style.display = options.displayApp;
    }
}

document.addEventListener('DOMContentLoaded', main);
