
var buttons = document.querySelectorAll('a.button, input[type="submit"]'),
    choices = document.querySelectorAll('input[type="radio"]'),
    choice, button, label,
    choiceMap = {},
    key, i;

for(i = 0; i < buttons.length; i++) {
    button = buttons[i];
    if (button.innerHTML === "Next" || (button.value && button.value.trim() === 'Ok')) {
        button.focus();
        break;
    }
}

for(i = 0; i < choices.length; i++) {
    choice = choices[i];
    label = choice.parentNode;
    key = i + 49;
    choiceMap[key] = i;
    if (label) {
        label.innerHTML += '<span><sup style="color: #55f">' + (i + 1) + '</sup></span>';
    }
}

document.onkeydown = function(e) {
    key = e.which;
    if(choiceMap.hasOwnProperty(key)) {
        choice = document.querySelectorAll('input[type="radio"]')[choiceMap[key]];
        choice.checked = true;
        choice.focus();
        return false;
    }
};
