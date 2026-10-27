import { waitFor } from "@common/dom/wait-for";
import { parseItems } from "@common/parsing/parse-items";
import { SELECTION_OPTIONS } from "@common/parsing/selection-options";
import { StorageItem } from "@common/parsing/storage-item";
import { Store } from "@common/persistence/store";
import { debounce } from "@common/util/debounce";
import {
  applyEquip,
  applyMoveToCellar,
  applySplit,
  attachSyncPriceButtons,
  computeSellInfo,
  copyPriceToNextRow,
  findItemByCheckbox,
  resolveMoveTargets,
  selectOrDeselectSame,
  syncOptionCheckboxes,
  toSplitMatchers,
  type PriceEntry,
} from "./logic";
import {
  createControls,
  populateSelect,
  toggleControlsEnabled,
  updateSellInfo,
  type Callbacks,
  type UiControlSet,
} from "./ui";

const COMMIT_SELECTOR = `#main_content input[type="submit"][name="ok"][value*="${_t("Commit")}"]`;
const SPLIT_FILTER_KEY = "split-filter";
const DEFAULT_SPLIT_FILTER = "*leather*of*, Ancient seals*";
const PRICE_MATCHER = /(.+) \((\d+)\/\d+\)/;

export async function main(): Promise<void> {
  const view = await waitFor('input[type="hidden"][name="view"]');

  if (!view || (view as HTMLInputElement).value === "gear") return;

  let items: StorageItem[] = [];
  let table: HTMLTableSectionElement | null = null;
  let uiControlSets: UiControlSet[] = [];

  const splitFilter =
    (await Store.get(SPLIT_FILTER_KEY)) || DEFAULT_SPLIT_FILTER;
  let splitFilterMatchers = toSplitMatchers(splitFilter);

  const sellOptions = SELECTION_OPTIONS.filter(({ notForSell }) => !notForSell);

  function onSelectChanged(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const option = SELECTION_OPTIONS.find(({ key }) => key === select.value);

    syncOptionCheckboxes(items, option, "ctrlLocationCheckbox");
  }

  function onSellChanged(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const option = SELECTION_OPTIONS.find(({ key }) => key === select.value);

    syncOptionCheckboxes(items, option, "ctrlSellCheckbox");
    updateSellInfo(uiControlSets, computeSellInfo(items).html);
  }

  function handleTableKeyUp(event: KeyboardEvent): void {
    const input = event.target;

    if (
      !(input instanceof HTMLInputElement) ||
      input.type !== "text" ||
      !["ArrowUp", "ArrowDown"].includes(event.key)
    ) {
      return;
    }

    const row = input.parentElement?.parentElement;
    if (!row) return;

    const nextRow =
      event.key === "ArrowUp"
        ? row.previousElementSibling
        : row.nextElementSibling;

    if (!nextRow) return;

    const isPrice = input.name.includes("preis");
    const field = isPrice ? "preis" : "comment";
    const nextInput = nextRow.querySelector<HTMLInputElement>(
      `input[type="text"][name*="${field}"]`,
    );

    if (!nextInput) return;

    if (event.ctrlKey) {
      if (isPrice && input.value) {
        copyPriceToNextRow(items, input, nextRow, nextInput);
      } else {
        nextInput.value = input.value;
      }
    }

    nextInput.focus();
  }

  function handleTableClick(event: MouseEvent): void {
    const input = event.target;

    if (!(input instanceof HTMLInputElement) || input.type !== "checkbox") {
      return;
    }

    if (!event.shiftKey) return;

    const prop = input.name.startsWith("Sell")
      ? "ctrlSellCheckbox"
      : input.name.startsWith("doEquip")
        ? "ctrlLocationCheckbox"
        : input.name.startsWith("SetGrpItem")
          ? "ctrlGroupCheckbox"
          : null;

    if (!prop) return;

    const item = findItemByCheckbox(items, input, prop);

    if (item) selectOrDeselectSame(items, item, input.checked, prop);
  }

  function createUiControls(): void {
    const buttons =
      document.querySelectorAll<HTMLInputElement>(COMMIT_SELECTOR);

    if (!buttons.length) return;

    const targets = resolveMoveTargets();

    const callbacks: Callbacks = {
      handleSplitAll: () => applySplit(items, targets, false),
      // prettier-ignore
      handleSplitFilter: () => applySplit(items, targets, true, splitFilterMatchers),
      handleMoveToCellar: () => applyMoveToCellar(items),
      handleEquip: () => applyEquip(items),
      handleLocationChanged: onSelectChanged,
      handleSellChanged: onSellChanged,
    };

    uiControlSets = createControls([...buttons], callbacks, splitFilter);

    const filterInput = uiControlSets[0]?.inputFilter;
    if (!filterInput) return;

    filterInput.addEventListener(
      "keyup",
      debounce((event: Event) => {
        const value = (event.target as HTMLInputElement).value;

        splitFilterMatchers = toSplitMatchers(value);
        void Store.set(SPLIT_FILTER_KEY, value);
      }, 500),
    );
  }

  function parseItemsAndAttachEvents(): void {
    const content = document.querySelector("#main_content");
    if (!content) return;

    ({ table, items } = parseItems(content));

    toggleControlsEnabled(uiControlSets, true);

    for (const controls of uiControlSets) {
      populateSelect(controls.selectLocation, SELECTION_OPTIONS);
      populateSelect(controls.selectSell, sellOptions, true);
    }

    if (!table) return;

    table.addEventListener("keyup", handleTableKeyUp);
    table.addEventListener("click", handleTableClick);

    const prices = document.querySelectorAll<HTMLInputElement>(
      'input[name*="preis_andere"]',
    );

    attachSyncPriceButtons(
      [...prices],
      {} as Record<string, PriceEntry[]>,
      PRICE_MATCHER,
    );
  }

  createUiControls();
  parseItemsAndAttachEvents();
}

function _t(text: string): string {
  if (location.href.includes(".net")) return text;
  return text === "Commit" ? "nderungen" : text;
}

void main();
