import { getContext } from "./context";
import { initQuestLog } from "./logic";
import { initHighlights, initHotKeys, initTabs } from "./ui";

export function main(): void {
  initTabs();
  const context = getContext();
  if (!context) return;
  initHighlights(context);
  initHotKeys();
  initQuestLog(context);
}

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", main, { once: true });
else main();
