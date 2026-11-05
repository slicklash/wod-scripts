import { buildAdventureContext } from "./context-builder";
import { initQuestLog } from "./logic";
import { initHighlights, initHotKeys, initTabs } from "./ui";

export function main(): void {
  initTabs();

  try {
    const context = buildAdventureContext();

    initHighlights(context);
    initHotKeys();
    initQuestLog(context);
  } catch (e) {
    console.error("Failed to build adventure context", e);
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", main, { once: true });
else main();
