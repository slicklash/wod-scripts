
export function initHotKeys() {

    // --- Action buttons

    const buttons: any[] = Array.from(document.querySelectorAll('a, input[type="submit"]'));
    let buttonNext;
    let buttonMore;

    if (buttons.length) {

        buttons.forEach(button => {

            if (button.innerHTML === 'Next' || (button.value && button.value.trim() === 'Ok')) {
                buttonNext = button;
                addHotkeyFor(buttonNext.parentNode, 'n');
            } else if (button.innerHTML === 'More adventures') {
                buttonMore = button;
                addHotkeyFor(buttonMore.parentNode, 'm');
            }

        });

        if (buttonNext) {
            buttonNext.focus();
        } else if (buttonMore) {
            buttonMore.focus();
        }
    }

    // --- Choices

    const choices: HTMLInputElement[] = <any> (Array.from(document.querySelectorAll('input[type="radio"]')));
    const choiceMap = {};

    if (choices.length) {

        const HOT_KEYS = '123456789qwertyuiop';

        choices.forEach((choice, i) => {

            const labelElem = choice.parentNode;
            const hotkey: string = HOT_KEYS[i];
            const keyCode: number = hotkey.toUpperCase().charCodeAt(0);

            choiceMap[keyCode] = choice;
            addHotkeyFor(labelElem, hotkey);

        });

    }

    if (choices.length || buttonNext || buttonMore) {

        const normalizeKey = key => key >= 96 && key <= 105 ? key - 48 : key;

        document.onkeyup = (e: KeyboardEvent) => {

            const activeElem = document.activeElement;

            if (activeElem && activeElem.tagName.toLowerCase() === 'input' && activeElem.getAttribute('type') === 'text') {
                return;
            }

            const keyCode = normalizeKey(e.which);

            if (buttonMore && keyCode === 77 /* m */) {
                buttonMore.focus();
            } else if (buttonNext && (keyCode === 78 /* n */ || keyCode === 48 /* 0 */)) {
                buttonNext.focus();
            } else if (choiceMap.hasOwnProperty(keyCode)) {
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

    const event = new CustomEvent('adventure.choiceSelected', {
        detail: choice.nextSibling.textContent.trim(),
    });

    window.dispatchEvent(event);
}

function addHotkeyFor(elem: Node, text: string) {
    if (elem) {
        const span = document.createElement('span');
        span.innerHTML = `<sup style="padding: 1px 3px; border: 1px solid #666; font-size: 10px">${text}</sup>`;
        elem.appendChild(span);
    }
}
