/// <reference path="_references.ts" />

/// <reference path="hotkeys.ts" />
/// <reference path="tabs.ts" />
/// <reference path="highlights.ts" />

function main() {
    initTabs();
    let context = getContext();
    initHighlights(context);
    initHotKeys();
}

document.addEventListener('DOMContentLoaded', main);
