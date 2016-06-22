/// <reference path="_references.ts" />

/// <reference path="hotkeys.ts" />
/// <reference path="tabs.ts" />
/// <reference path="highlights.ts" />
/// <reference path="questlog.ts" />

function main() {
    initTabs();
    let context = getContext();
    initHighlights(context);
    initHotKeys();
    initQuestLog(context);
}

if (!(<any>window).__karma__) document.addEventListener('DOMContentLoaded', () => main());
