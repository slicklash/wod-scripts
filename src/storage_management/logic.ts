import { textNormalized } from "@common/dom/text-normalized";
import { type SelectionOption } from "@common/parsing/selection-options";
import { type StorageItem } from "@common/parsing/storage-item";

export const MoveTarget = { Cellar: "go_keller", TreasureVault: "go_group", GroupStorage: "go_group_2", None: "" };

type MoveInstruction = "-go_group" | "go_group" | "-go_group_2" | "go_group_2";

type MoveInstructions = { TreasureVault: MoveInstruction; GroupStorage: MoveInstruction };

type SellInfo = { count: number; total: number; html: string };

export type PriceEntry = { uses: number; input: HTMLInputElement; fpPrice: number };

export function resolveMoveTargets(): MoveInstructions {
  const url = window.location.href;
  const isGroupStorage = url.includes("groupcellar_2");
  const isTreasureVault = url.includes("groupcellar") && !isGroupStorage;
  return {
    TreasureVault: isTreasureVault ? "-go_group" : "go_group",
    GroupStorage: isGroupStorage ? "-go_group_2" : "go_group_2",
  };
}

export function toSplitMatchers(value: string): RegExp[] {
  return value
    .split(/[;,|]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const escaped = part.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
      return new RegExp(`^${escaped}$`, "i");
    });
}

export function computeSellInfo(items: StorageItem[]): SellInfo {
  let count = 0;
  let total = 0;

  for (const item of items) {
    if (item.ctrlSellCheckbox?.checked) {
      count++;
      total += item.price;
    }
  }

  const html = count > 0 ? `&nbsp;${count} (${total} <img alt="" border="0" src="/wod/css/skins/skin-2/images/icons/lang/en/gold.gif" title="gold">)` : "";

  return { count, total, html };
}

export function applySplit(items: StorageItem[], targets: MoveInstructions, filtered: boolean, matchers: RegExp[] = []): void {
  const eligible = items.filter((item) => item.ctrlLocationSelect && item.ctrlLocationCheckbox);

  const hasSelected = eligible.some((item) => item.ctrlLocationCheckbox?.checked);

  for (const item of eligible) {
    if (hasSelected && !item.ctrlLocationCheckbox!.checked) continue;
    if (filtered && !matchers.some((m) => m.test(item.name))) continue;

    item.ctrlLocationSelect!.value = item.isConsumable ? targets.GroupStorage : targets.TreasureVault;
    if (item.numberCell) item.numberCell.style.backgroundColor = "rgba(0,255,0,0.2)";
  }
}

export function applyMoveToCellar(items: StorageItem[]): void {
  const eligible = items.filter((item) => item.ctrlLocationSelect && item.ctrlLocationCheckbox);
  const hasSelected = eligible.some((item) => item.ctrlLocationCheckbox?.checked);

  for (const item of eligible) {
    if (hasSelected && !item.ctrlLocationCheckbox!.checked) continue;
    item.ctrlLocationSelect!.value = MoveTarget.Cellar;
  }
}

export function applyEquip(items: StorageItem[]): void {
  const eligible = items.filter((item) => item.isUsable && item.ctrlLocationSelect && item.ctrlLocationCheckbox);
  const hasSelected = eligible.some((item) => item.ctrlLocationCheckbox?.checked);

  for (const item of eligible) {
    if (hasSelected && !item.ctrlLocationCheckbox!.checked) continue;
    const firstOption = item.ctrlLocationSelect!.options[0];
    if (firstOption) item.ctrlLocationSelect!.value = firstOption.value;
  }
}

export function syncOptionCheckboxes(items: StorageItem[], option: SelectionOption | undefined, prop: "ctrlSellCheckbox" | "ctrlLocationCheckbox"): void {
  if (!option?.predicate) return;
  for (const item of items) {
    const checkbox = item[prop];
    if (checkbox && option.predicate(item)) checkbox.checked = option.pick === true;
  }
}

export function selectOrDeselectSame(items: StorageItem[], source: StorageItem, sourceChecked: boolean, prop: "ctrlSellCheckbox" | "ctrlLocationCheckbox" | "ctrlGroupCheckbox"): void {
  for (const item of items) {
    if (item.name !== source.name) continue;
    const checkbox = item[prop];
    if (checkbox) checkbox.checked = sourceChecked;
  }
}

export function findItemByCheckbox(items: StorageItem[], checkbox: HTMLInputElement, prop: "ctrlSellCheckbox" | "ctrlLocationCheckbox" | "ctrlGroupCheckbox"): StorageItem | undefined {
  return items.find((item) => item[prop] === checkbox);
}

export function attachSyncPriceButtons(prices: HTMLInputElement[], byName: Record<string, PriceEntry[]>, re: RegExp): void {
  for (const input of prices) {
    const row = input.parentElement?.parentElement;
    const textCell = row?.children[1];
    const prevSibling = input.previousElementSibling;

    const text = textCell ? textNormalized(textCell) : "";
    const fpPrice = Number(prevSibling ? textNormalized(prevSibling) : "");
    const match = text.match(re);

    if (!match || !Number.isInteger(fpPrice)) continue;

    const [, name, usesStr] = match;
    const uses = Number(usesStr);
    if (!Number.isFinite(uses) || uses <= 0) continue;

    const group = (byName[name] ||= []);
    group.push({ uses, input, fpPrice });

    const syncButton = document.createElement("input");
    syncButton.type = "button";
    syncButton.className = "button clickable";
    syncButton.value = "sync";
    syncButton.style.marginLeft = "5px";
    syncButton.style.borderWidth = "2px";

    syncButton.addEventListener("click", () => {
      const value = Number(input.value);
      if (!Number.isInteger(value)) return;
      const singlePrice = value / uses;
      for (const entry of group) {
        if (entry.input !== input && entry.fpPrice < entry.uses * singlePrice * 0.9) {
          entry.input.value = Math.round(entry.uses * singlePrice).toString();
        }
      }
    });

    input.parentNode?.appendChild(syncButton);
  }
}

export function copyPriceToNextRow(items: StorageItem[], input: HTMLInputElement, nextRow: Element, nextInput: HTMLInputElement): void {
  const checkbox = input.parentElement?.parentElement?.querySelector<HTMLInputElement>('input[type="checkbox"][name*="Sell"]');
  const nextCheckbox = nextRow.querySelector<HTMLInputElement>('input[type="checkbox"][name*="Sell"]');
  if (!checkbox || !nextCheckbox) return;

  const item = findItemByCheckbox(items, checkbox, "ctrlSellCheckbox");
  const nextItem = findItemByCheckbox(items, nextCheckbox, "ctrlSellCheckbox");
  if (!item || !nextItem) return;

  const price = Number(input.value);
  nextInput.value = String(nextItem.isConsumable ? Math.ceil((price / item.uses) * nextItem.uses) : price);
}
