import { getContext } from './context'
import { initHighlights } from './highlights'
import { initHotKeys } from './hotkeys'
import { initTabs } from './tabs'
import { initQuestLog } from './questlog'

export function main() {
    initTabs();
    let context = getContext();
    initHighlights(context);
    initHotKeys();
    initQuestLog(context);
}

if (!(<any>window).__karma__) document.addEventListener('DOMContentLoaded', () => main());
