import { getContext } from "./context";
import { initHighlights } from "./highlights";
import { initHotKeys } from "./hotkeys";
import { initQuestLog } from "./questlog";
import { initTabs } from "./tabs";

export function main() {
  initTabs();
  const context = getContext();
  initHighlights(context);
  initHotKeys();
  initQuestLog(context);
}

document.addEventListener("DOMContentLoaded", () => main());
