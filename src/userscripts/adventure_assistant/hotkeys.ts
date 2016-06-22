/// <reference path="_references.ts" />

function initHotKeys() {

    // --- Action buttons

    let buttons: any[] = Array.from(document.querySelectorAll('a, input[type="submit"]')),
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

    let choices: HTMLInputElement[] = <any>(Array.from(document.querySelectorAll('input[type="radio"]'))),
        choiceMap = {};

    if (choices.length) {

        const HOT_KEYS = '123456789qwertyuiop';

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
                publishChoiceEvent(choice);
                return false;
            }
        }
    }

}

function publishChoiceEvent(choice) {

    let event = new CustomEvent('adventure.choiceSelected', {
        'detail': choice.nextSibling.textContent.trim()
    });

    window.dispatchEvent(event);
}

function addHotkeyFor(elem: Node, text: string) {
    if (elem) {
        let span = document.createElement('span');
        span.innerHTML = `<sup style="padding: 1px 3px; border: 1px solid #666; font-size: 10px">${text}</sup>`;
        elem.appendChild(span);
    }
}
