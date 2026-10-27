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

export function createControls(
  commitButtons: HTMLInputElement[],
  callbacks: Callbacks,
  splitFilter: string,
): UiControlSet[] {
  const controlSets: UiControlSet[] = [];

  commitButtons.forEach((commit, i) => {
    const labelMove = createLabel("Select");
    const labelSell = createLabel("Sell");

    const buttonSplitAll = createButton("Split All", callbacks.handleSplitAll);
    // prettier-ignore
    const buttonSplitFilter = createButton("Split Filter", callbacks.handleSplitFilter);

    // prettier-ignore
    const buttonMoveToCellar = createButton("Cellar", callbacks.handleMoveToCellar);
    const buttonEquip = createButton("Equip", callbacks.handleEquip);

    const selectLocation = createSelect(140, callbacks.handleLocationChanged);
    const selectSell = createSelect(120, callbacks.handleSellChanged);

    const labelSellInfo = add<HTMLSpanElement>("span");

    // prettier-ignore
    const filterInput = i === 0 ? attr(add<HTMLInputElement>("input"), { type: "text", style: "margin-top: 5px; width: 100%", size: "20", value: splitFilter }) : undefined;

    const set: UiControlSet = {
      buttonSplitAll,
      buttonSplitFilter,
      buttonMoveToCellar,
      buttonEquip,
      selectLocation,
      selectSell,
      labelSellInfo,
      inputFilter: filterInput,
    };

    controlSets.push(set);

    insertAfter(
      commit,
      labelMove,
      selectLocation,
      buttonSplitAll,
      buttonSplitFilter,
      buttonMoveToCellar,
      buttonEquip,
      labelSell,
      selectSell,
      labelSellInfo,
      add<HTMLBRElement>("br"),
      filterInput,
    );
  });

  return controlSets;
}

export function populateSelect(
  select: HTMLSelectElement,
  options: SelectionOption[],
  sellable?: boolean,
): void {
  let optionGroup: HTMLOptGroupElement | undefined;

  for (const option of options) {
    if (option.key === "---") {
      optionGroup = add<HTMLOptGroupElement>("optgroup");
      attr(optionGroup, "label", option.title);
      select.appendChild(optionGroup);
      continue;
    }

    addOptionToSelect(select, option, sellable, optionGroup);
  }
}

export function toggleControlsEnabled(
  controlSets: UiControlSet[],
  enabled: boolean,
): void {
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
  for (const set of controlSets) {
    set.labelSellInfo.innerHTML = html;
  }
}

function createLabel(text: string): HTMLSpanElement {
  const label = add<HTMLSpanElement>("span");
  label.innerHTML = `&nbsp;${text}&nbsp;`;
  return label;
}

function createButton(
  text: string,
  onClick: EventListenerOrEventListenerObject,
): HTMLInputElement {
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

function createSelect(
  width: number,
  onSelect: EventListenerOrEventListenerObject,
): HTMLSelectElement {
  const select = attr(add<HTMLSelectElement>("select"), {
    style: `min-width: ${width}px`,
    disabled: "disabled",
  });
  select.addEventListener("change", onSelect, false);
  return select;
}

function addOptionToSelect(
  select: HTMLSelectElement,
  option: SelectionOption,
  sellable?: boolean,
  optionGroup?: HTMLOptGroupElement,
): void {
  const element = attr(add<HTMLOptionElement>("option"), "value", option.key);
  element.innerHTML =
    option.key === "none"
      ? "none"
      : sellable
        ? `${option.title} (${option.countSell})`
        : `${option.title} (${option.count})`;
  if (optionGroup) optionGroup.appendChild(element);
  else select.appendChild(element);
}
