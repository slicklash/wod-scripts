'use strict';

var buttons: NodeList = document.querySelectorAll('a, input[type="submit"]'),
    choices: NodeList = document.querySelectorAll('input[type="radio"]'),
    buttonNext: HTMLInputElement,
    buttonMore: HTMLInputElement,
    choice: HTMLInputElement,
    button: HTMLInputElement,
    label: HTMLLabelElement,
    choiceMap: { [key: number] : HTMLInputElement } = {},
    key: number,
    i: number,
    clue: string;

for (i = 0; i < buttons.length; i++) {
    button = <HTMLInputElement>buttons[i];
    if (button.innerHTML === 'Next' || (button.value && button.value.trim() === 'Ok')) {
        buttonNext = button;
    }
    else if (button.innerHTML === 'More adventures') {
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

var letters: string = 'qwertyuiop',
    upper: number = 8;

for (i = 0; i < choices.length; i++) {
    choice = <HTMLInputElement>choices[i];
    label = <HTMLLabelElement>choice.parentNode;
    if (i <= upper) {
        clue = i + 1 + '';
        key = i + 1 + 48;
    }
    else {
        clue = letters[i - upper - 1];
        key = clue.toUpperCase().charCodeAt(0);
    }
    choiceMap[key] = choice;
    addClue(label, clue);
}

document.onkeyup = function(e: KeyboardEvent): boolean {
    var active: HTMLInputElement = <HTMLInputElement>document.activeElement;

    if (active && active.tagName.toLowerCase() === 'input' && active.getAttribute('type') === 'text') {
        return;
    }

    key = e.which;

    if (key >= 96 && key <= 105) {
        key -= 48;
    }

    if (key === 77) {
        buttonMore.focus();
    }
    else if ((key === 78 || key === 79 || key === 48) && buttonNext) {
        buttonNext.focus();
    }
    else {
        choice = choiceMap[key];
        if (choice) {
            choice.checked = true;
            choice.focus();
            return false;
        }
    }
};

function addClue(node: Node, clue: string): void {
    if (node) {
        var span: HTMLSpanElement = document.createElement('span');
        span.innerHTML = '<sup style="padding: 1px 3px; border: 1px solid #666; font-size: 10px">' + clue + '</sup>';
        node.appendChild(span);
    }
}

if (document.querySelector('.paginator_row')) {
    var adventures: NodeList = document.querySelectorAll('.row0, .row1'),
        crafting: Array<HTMLTableRowElement> = [],
        appointments: Array<HTMLTableRowElement> = [],
        crafClass: string,
        appClass: string;

    for (i = 0; i < adventures.length; i++) {
        var adventure: HTMLTableRowElement = <HTMLTableRowElement>adventures[i],
            className: string = (<HTMLElement>adventure).className,
            title: HTMLElement = <HTMLElement>adventure.querySelector('h3');

        if (!title) {
            continue;
        }

        if (isAppointment(title.innerHTML)) {
            if (appClass === className) {
                appClass = invertClass(appClass);
                (<HTMLElement>adventure).className = appClass;
            }
            else {
                appClass = className;
            }
            appointments.push(adventure);
            (<HTMLElement>adventure).style.display = 'none';
        }
        else {
            if (crafClass === className) {
                crafClass = invertClass(crafClass);
                (<HTMLElement>adventure).className = crafClass;
            }
            else {
                crafClass = className;
            }
            crafting.push(adventure);
        }
    }

    var tabCrafting: HTMLElement = makeTab('Crafting', true),
        tabAppointments: HTMLElement = makeTab('Appointments', false);

    var menu: HTMLUListElement = document.createElement('ul');
    menu.innerHTML = '<li class="label">Adventures</li>';

    menu.appendChild(tabCrafting);
    menu.appendChild(tabAppointments);

    var bar: HTMLDivElement = document.createElement('div');
    bar.className = 'bar';

    var content: HTMLDivElement = document.createElement('div');
    content.className = 'content';

    var div: HTMLDivElement = document.createElement('div');
    div.className += 'tab';
    div.appendChild(menu);
    div.appendChild(bar);
    div.appendChild(content);

    var h1: HTMLHeadingElement = document.getElementsByTagName('h1')[0];
    var p: Node = h1.parentNode;
    p.replaceChild(div, h1);
}

function isAppointment(title: string): boolean {
    return (title.indexOf('Passingtime') > -1 ||
           title.indexOf('Rescuing Father Wuel') > -1 ||
           title.indexOf('The Adventurers\' Guild') > -1 ||
           title.indexOf('The Fortunes of Madame Du Coeur Brise') > -1);
}

function invertClass(className: string): string {
    return className === 'row0' ? 'row1' : 'row0';
}

function makeTab(title: string, selected: boolean): HTMLElement {
    var action: HTMLAnchorElement = document.createElement('a');
    action.setAttribute('href', '#');
    action.innerHTML = title;
    action.addEventListener('click', selectTab);
    var tab: HTMLElement = document.createElement('li');
    tab.className = selected ? 'selected' : 'not_selected';
    tab.appendChild(action);
    return tab;
}

function selectTab(e: MouseEvent): void {
    var max: number = Math.max(crafting.length, appointments.length),
        parentNode: HTMLElement = <HTMLElement>(<HTMLElement>e.target).parentNode;

    parentNode.className = 'selected';
    if ((<HTMLElement>e.target).innerHTML === 'Appointments') {
        (<HTMLElement>parentNode.previousSibling).className = 'not_selected';
        for (i = 0; i < max; i++) {
            if (i < crafting.length) {
                crafting[i].style.display = 'none';
            }
            if (i < appointments.length) {
                appointments[i].style.display = '';
            }
        }
    }
    else {
        (<HTMLElement>parentNode.nextSibling).className = 'not_selected';
        for (i = 0; i < max; i++) {
            if (i < crafting.length) {
                crafting[i].style.display = '';
            }
            if (i < appointments.length) {
                appointments[i].style.display = 'none';
            }
        }
    }
}
