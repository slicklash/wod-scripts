import { add } from "@common/dom/add";
import { attr } from "@common/dom/attr";
import { insertAfter } from "@common/dom/insert-after";
import { type SelectionOption } from "@common/parsing/selection-options";

export type UiControlSet = {
  buttonSplitAll: HTMLInputElement;
  buttonSplitFilter: HTMLInputElement;
  buttonMoveToCellar: HTMLInputElement;
  buttonEquip: HTMLInputElement;
  selectLocation: HTMLSelectElement;
  selectSell: HTMLSelectElement;
  labelSellInfo: HTMLSpanElement;
  inputFilter?: HTMLInputElement;
};

export type Callbacks = {
  handleSplitAll: EventListener;
  handleSplitFilter: EventListener;
  handleMoveToCellar: EventListener;
  handleEquip: EventListener;
  handleLocationChanged: EventListener;
  handleSellChanged: EventListener;
};

export function createControls(commitButtons: HTMLInputElement[], callbacks: Callbacks, splitFilter: string): UiControlSet[] {
  return commitButtons.map((commit, i) => {
    const buttonSplitAll = createButton("Split All", callbacks.handleSplitAll);
    const buttonSplitFilter = createButton("Split Filter", callbacks.handleSplitFilter);
    const buttonMoveToCellar = createButton("Cellar", callbacks.handleMoveToCellar);
    const buttonEquip = createButton("Equip", callbacks.handleEquip);
    const selectLocation = createSelect(140, callbacks.handleLocationChanged);
    const selectSell = createSelect(120, callbacks.handleSellChanged);
    const labelSellInfo = add<HTMLSpanElement>("span");
    const inputFilter = i === 0 ? attr(add<HTMLInputElement>("input"), { type: "text", style: "margin-top: 5px; width: 100%", size: "20", value: splitFilter }) : undefined;

    insertAfter(commit, createLabel("Select"), selectLocation, buttonSplitAll, buttonSplitFilter, buttonMoveToCellar, buttonEquip, createLabel("Sell"), selectSell, labelSellInfo, add<HTMLBRElement>("br"), inputFilter);

    return { buttonSplitAll, buttonSplitFilter, buttonMoveToCellar, buttonEquip, selectLocation, selectSell, labelSellInfo, inputFilter };
  });
}

export function populateSelect(select: HTMLSelectElement, options: SelectionOption[], sellable?: boolean): void {
  let group: HTMLOptGroupElement | undefined;
  for (const option of options) {
    if (option.key === "---") {
      group = add<HTMLOptGroupElement>("optgroup");
      attr(group, "label", option.title);
      select.appendChild(group);
      continue;
    }

    const el = attr(add<HTMLOptionElement>("option"), "value", option.key);
    el.innerHTML = option.key === "none" ? "none" : sellable ? `${option.title} (${option.countSell})` : `${option.title} (${option.count})`;
    (group || select).appendChild(el);
  }
}

export function toggleControlsEnabled(controlSets: UiControlSet[], enabled: boolean): void {
  for (const set of controlSets) {
    set.buttonSplitAll.disabled = !enabled;
    set.buttonSplitFilter.disabled = !enabled;
    set.buttonMoveToCellar.disabled = !enabled;
    set.buttonEquip.disabled = !enabled;
    set.selectLocation.disabled = !enabled;
    set.selectSell.disabled = !enabled;
  }
}

export function updateSellInfo(controlSets: UiControlSet[], html: string): void {
  for (const set of controlSets) set.labelSellInfo.innerHTML = html;
}

function createLabel(text: string): HTMLSpanElement {
  const label = add<HTMLSpanElement>("span");
  label.innerHTML = `&nbsp;${text}&nbsp;`;
  return label;
}

function createButton(text: string, onClick: EventListenerOrEventListenerObject): HTMLInputElement {
  const button = attr(add<HTMLInputElement>("input"), {
    type: "button",
    class: "button clickable",
    name: `button${text}`,
    value: text,
    style: "margin-left: 5px",
    disabled: "disabled",
  });
  button.addEventListener("click", onClick, false);
  return button;
}

function createSelect(width: number, onSelect: EventListenerOrEventListenerObject): HTMLSelectElement {
  const select = attr(add<HTMLSelectElement>("select"), {
    style: `min-width: ${width}px`,
    disabled: "disabled",
  });
  select.addEventListener("change", onSelect, false);
  return select;
}
