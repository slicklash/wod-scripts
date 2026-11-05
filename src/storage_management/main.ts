import { waitFor } from "@common/dom/wait-for";
import { parseItems } from "@common/parsing/parse-items";
import { SELECTION_OPTIONS } from "@common/parsing/selection-options";
import type { StorageItem } from "@common/parsing/storage-item";
import { Store } from "@common/persistence/store";
import { debounce } from "@common/util/debounce";
import { applyEquip, applyMoveToCellar, applySplit, attachSyncPriceButtons, computeSellInfo, copyPriceToNextRow, findItemByCheckbox, resolveMoveTargets, selectOrDeselectSame, syncOptionCheckboxes, toSplitMatchers, type PriceEntry } from "./logic";
import { createControls, populateSelect, toggleControlsEnabled, updateSellInfo, type Callbacks, type UiControlSet } from "./ui";

const COMMIT_SELECTOR = `#main_content input[type="submit"][name="ok"][value*="${_t("Commit")}"]`;
const SPLIT_FILTER_KEY = "split-filter";
const DEFAULT_SPLIT_FILTER = "*leather*of*, Ancient seals*";
const PRICE_MATCHER = /(.+) \((\d+)\/\d+\)/;

export async function main(view: Element | null): Promise<void> {
  if (!view || (view as HTMLInputElement).value === "gear") return;

  let items: StorageItem[] = [];
  let table: HTMLTableSectionElement | null = null;
  let uiControlSets: UiControlSet[] = [];

  const splitFilter = await Store.get(SPLIT_FILTER_KEY, DEFAULT_SPLIT_FILTER);
  let splitFilterMatchers = toSplitMatchers(splitFilter);

  function onSelectChanged(event: Event): void {
    const option = SELECTION_OPTIONS.find(({ key }) => key === (event.target as HTMLSelectElement).value);
    syncOptionCheckboxes(items, option, "ctrlLocationCheckbox");
  }

  function onSellChanged(event: Event): void {
    const option = SELECTION_OPTIONS.find(({ key }) => key === (event.target as HTMLSelectElement).value);
    syncOptionCheckboxes(items, option, "ctrlSellCheckbox");
    updateSellInfo(uiControlSets, computeSellInfo(items).html);
  }

  function onTableKeyUp(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    if (input.type !== "text" || !["ArrowUp", "ArrowDown"].includes(event.key)) return;

    const row = input.parentElement?.parentElement;
    if (!row) return;

    const nextRow = event.key === "ArrowUp" ? row.previousElementSibling : row.nextElementSibling;
    if (!nextRow) return;

    const isPrice = input.name.includes("preis");
    const nextInput = nextRow.querySelector<HTMLInputElement>(`input[type="text"][name*="${isPrice ? "preis" : "comment"}"]`);
    if (!nextInput) return;

    if (event.ctrlKey && isPrice && input.value) {
      copyPriceToNextRow(items, input, nextRow, nextInput);
    } else if (event.ctrlKey) {
      nextInput.value = input.value;
    }

    nextInput.focus();
  }

  function onTableClick(event: MouseEvent): void {
    const input = event.target as HTMLInputElement;
    if (!(input instanceof HTMLInputElement) || input.type !== "checkbox" || !event.shiftKey) return;

    const prop = input.name.startsWith("Sell") ? "ctrlSellCheckbox" : input.name.startsWith("doEquip") ? "ctrlLocationCheckbox" : input.name.startsWith("SetGrpItem") ? "ctrlGroupCheckbox" : null;
    if (!prop) return;

    const item = findItemByCheckbox(items, input, prop);
    if (item) selectOrDeselectSame(items, item, input.checked, prop);
  }

  function createUi(): void {
    const buttons = document.querySelectorAll<HTMLInputElement>(COMMIT_SELECTOR);
    if (!buttons.length) return;

    const targets = resolveMoveTargets();
    const callbacks: Callbacks = {
      handleSplitAll: () => applySplit(items, targets, false),
      handleSplitFilter: () => applySplit(items, targets, true, splitFilterMatchers),
      handleMoveToCellar: () => applyMoveToCellar(items),
      handleEquip: () => applyEquip(items),
      handleLocationChanged: onSelectChanged,
      handleSellChanged: onSellChanged,
    };

    uiControlSets = createControls([...buttons], callbacks, splitFilter);

    const filterInput = uiControlSets[0]?.inputFilter;
    if (filterInput) {
      filterInput.addEventListener(
        "keyup",
        debounce((event: Event) => {
          splitFilterMatchers = toSplitMatchers((event.target as HTMLInputElement).value);
          void Store.set(SPLIT_FILTER_KEY, (event.target as HTMLInputElement).value);
        }, 1000),
      );
    }
  }

  function parseAndSetup(): void {
    const content = document.querySelector("#main_content");
    if (!content) return;

    ({ table, items } = parseItems(content));
    toggleControlsEnabled(uiControlSets, true);

    for (const controls of uiControlSets) {
      populateSelect(controls.selectLocation, SELECTION_OPTIONS);
      populateSelect(
        controls.selectSell,
        SELECTION_OPTIONS.filter(({ notForSell }) => !notForSell),
        true,
      );
    }

    table?.addEventListener("keyup", onTableKeyUp);
    table?.addEventListener("click", onTableClick);

    const prices = document.querySelectorAll<HTMLInputElement>('input[name*="preis_andere"]');
    attachSyncPriceButtons([...prices], {} as Record<string, PriceEntry[]>, PRICE_MATCHER);
  }

  createUi();
  parseAndSetup();
}

function _t(text: string): string {
  return location.href.includes(".net") ? text : text === "Commit" ? "nderungen" : text;
}

waitFor('input[type="hidden"][name="view"]').then((view) => main(view));
