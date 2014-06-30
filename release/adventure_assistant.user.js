// ==UserScript==
// @name           Adventure Assistant
// @description    Script allows to do adventures using keyboard
// @version        1.0
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

var letters = 'qwertyui';

for (i = 0; i < choices.length; i++) {
    choice = choices[i];
    label = choice.parentNode;
    key = i + 49;
    choiceMap[key] = choice;
    clue = i < 9 ? i + 1 : letters[i - 9];
    addClue(label, clue);
}

document.onkeydown = function (e) {
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
        span.innerHTML = '<sup style="color: #55f">' + clue + '</sup>';
        node.appendChild(span);
    }
}

function getButton(text) {
    for (i = 0; i < buttons.length; i++) {
        button = buttons[i];
        if (button.innerHTML === text || (button.value && button.value.trim() === text)) {
            return button;
        }
    }
    return null;
}
})();