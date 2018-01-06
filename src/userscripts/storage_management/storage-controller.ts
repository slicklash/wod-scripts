import { add } from '@common/dom/add';
import { attr } from '@common/dom/attr';
import { textContent } from '@common/dom/text-content';
import { insertAfter } from '@common/dom/insert-after';
import { _t } from './nls';
import { waitFor } from '@common/dom/wait-for';
import { getItems } from './parse-items';

import { StorageItem } from './storage-item';
import { ISelectionOption, SELECTION_OPTIONS } from './selection-options';

const CommitButtonSelector = '#main_content input[type="submit"][name="ok"][value*="' + _t('Commit') + '"]';

export class StorageController {

  labelsSellInfo = [];
  sellCount: number = 0;
  sellSum: number = 0;

  _options: ISelectionOption[] = SELECTION_OPTIONS;
  _table: HTMLTableElement;
  _items: StorageItem[] = [];
  _ready: Promise<any>;

  $onInit() {
    this._ready = waitFor(document, 'DOMContentLoaded');
    waitFor('input[type="hidden"][name="view"]').then(elem => {
      if (elem && elem.value !== 'gear') this._createControls();
    });
  }

  _createControls() {
    const buttons_commit = <any> Array.from(document.querySelectorAll(CommitButtonSelector));

    if (!buttons_commit.length) return;

    const isGroupStorage = window.location.href.indexOf('groupcellar_2') > -1;
    const isGroupTv = window.location.href.indexOf('groupcellar') > -1 && !isGroupStorage;
    const go_tv = isGroupTv ? '-go_group' : 'go_group';
    const go_gs = isGroupStorage ? '-go_group_2' : 'go_group_2';

    const moveItemToCellar = (x: StorageItem) => { x.ctrlLocationSelect.value = 'go_keller'; };
    const splitItem = (x: StorageItem) => { x.ctrlLocationSelect.value = !x.isConsumable ? go_tv : go_gs; if (!x.ctrlLocationSelect.value) moveItemToCellar(x); };
    const equipItem = (x: StorageItem) => { x.ctrlLocationSelect.value = (<any> x.ctrlLocationSelect.options[0]).value; };

    const actions = {
      split:  { predicate: (x: StorageItem) => x.ctrlLocationSelect && x.ctrlLocationCheckbox, handler: splitItem },
      cellar: { predicate: (x: StorageItem) => x.ctrlLocationSelect && x.ctrlLocationCheckbox, handler: moveItemToCellar },
      equip:  { predicate: (x: StorageItem) => x.isUsable && x.ctrlLocationSelect && x.ctrlLocationCheckbox, handler: equipItem },
    };

    const onSplit = this._performAction.bind(this, actions.split);
    const onCellar = this._performAction.bind(this, actions.cellar);
    const onEquip = this._performAction.bind(this, actions.equip);

    const onSelectChanged = this._onSelectChanged.bind(this);
    const onSellChanged = this._onSellChanged.bind(this);

    const selectsForLocation: HTMLSelectElement[] = [];
    const selectsForSell: HTMLSelectElement[] = [];
    const actionButtons: HTMLInputElement[] = [];

    buttons_commit.forEach(commit => {

      const labelMove = this._makeLabel('Select');
      const labelSell = this._makeLabel('Selll');
      const buttonSplit = this._makeButton('Split', onSplit);
      const buttonCellar = this._makeButton('Cellar', onCellar);
      const buttonEquip = this._makeButton('Equip', onEquip);
      const selectForLocation = this._makeSelect(140, onSelectChanged);
      const selectForSell = this._makeSelect(120, onSellChanged);
      const labelSellInfo = add<HTMLSpanElement>('span');

      actionButtons.push(buttonSplit, buttonCellar, buttonEquip);

      this.labelsSellInfo.push(labelSellInfo);

      selectsForLocation.push(selectForLocation);
      selectsForSell.push(selectForSell);

      insertAfter(commit,
        labelMove, selectForLocation,
        buttonSplit, buttonCellar, buttonEquip,
        labelSell, selectForSell, labelSellInfo);
    });

    this._ready.then(() => {

      const { table, items } = getItems(document.querySelector('#main_content'));

      this._table = table;
      this._items = items;

      selectsForLocation.forEach(x => { this._addOptions(x, this._options); x.disabled = false; });

      const sellOptions = this._options.filter(x => !x.notForSell);
      selectsForSell.forEach(x => { this._addOptions(x, sellOptions, true); x.disabled = false; });

      actionButtons.forEach(x => { x.disabled = false; });

      this._attachEvents();
    });
  }

  _attachEvents() {

    if (!this._table) {
      return;
    }

    this._table.addEventListener('keyup', this._onKeyUp.bind(this));
    this._table.addEventListener('click', this._onClick.bind(this));
  }

  _onSellChanged(e) {

    const option = this._options.find(x => x.key === e.target.value);

    for (const item of this._items) {
      if (item.ctrlSellCheckbox && option.predicate(item)) {
        item.ctrlSellCheckbox.checked = option.pick;
      }
    }

    this._updateSellInfo();
  }

  _updateSellInfo() {

    this.sellSum = 0;
    this.sellCount = 0;

    for (const item of this._items) {
      if (item.ctrlSellCheckbox && item.ctrlSellCheckbox.checked) {
        this.sellCount++;
        this.sellSum += item.price;
      }
    }

    const sellInfo = this.sellCount > 0 ? `&nbsp;${this.sellCount} (${this.sellSum} <img alt="" border="0" src="/wod/css/skins/skin-2/images/icons/lang/en/gold.gif" title="gold">)` : '';
    this.labelsSellInfo.forEach(x => { x.innerHTML = sellInfo; });
  }

  _onSelectChanged(e) {

    const option = this._options.find(x => x.key === e.target.value);

    for (const item of this._items) {
      if (item.ctrlLocationCheckbox && option.predicate(item)) {
        item.ctrlLocationCheckbox.checked = option.pick;
      }
    }
  }

  _performAction({predicate, handler}) {

    if (!this._items.length) return;

    let onlySelected = false;
    const tmp = [];

    for (const item of this._items) {
      if (predicate(item)) {
        if (item.ctrlLocationCheckbox.checked) {
          handler(item);
          onlySelected = true;
        } else {
          tmp.push(item);
        }
      }
    }

    if (!onlySelected) {
      tmp.forEach(handler);
    }
  }

  _addOptions(select, options, sellable?: boolean) {

    let option_group;

    options.forEach(x => {

      if (x.key === '---') {
        option_group = add('optgroup');
        attr(option_group, 'label', x.title);
        select.appendChild(option_group);
        return;
      }

      this._makeSelectOption(select, x, sellable, option_group);
    });

    return select;
  }

  _makeLabel(text: string) {
    const label = add<HTMLSpanElement>('span');
    label.innerHTML = `&nbsp;${text}&nbsp;`; return label;
  }

  _makeButton(text: string, onClick: EventListenerOrEventListenerObject) {
    const btn = add<HTMLInputElement>('input');
    attr(btn, {type: 'button', class: 'button clickable', name: `button${text}`, value: `${text}`, style: 'margin-left: 5px', disabled: 'disabled'});
    btn.addEventListener('click', onClick, false);
    return btn;
  }

  _makeSelect(width: number, onSelect: EventListenerOrEventListenerObject) {
    const select = add<HTMLSelectElement>('select');
    attr(select, { style: `min-width: ${width}px`, disabled: 'disabled' });
    select.addEventListener('change', onSelect, false);
    return select;
  }

  _makeSelectOption(select: HTMLSelectElement, option: ISelectionOption, sellable?: boolean, option_group?) {

    const op = add('option');

    attr(op, 'value', option.key).innerHTML = option.key === 'none' ? 'none' : sellable ? `${option.title} (${option.countSell})` : `${option.title} (${option.count})`;

    if (option_group) {
      option_group.appendChild(op);
    } else {
      select.appendChild(<any> op);
    }
  }

  _onKeyUp(e: KeyboardEvent) {

    const input: HTMLInputElement = <any> e.target;
    const up   = e.key === 'ArrowUp' || e.keyCode === 38;
    const down = e.key === 'ArrowDown' || e.keyCode === 40;

    if (input.tagName !== 'INPUT' || input.type !== 'text' || !(up || down)) {
      return;
    }

    const row  = input.parentElement.parentElement;
    const nextRow: HTMLElement = up ? <any> row.previousElementSibling : <any> row.nextElementSibling;
    const name = input.name.includes('preis') ? 'preis' : 'comment';
    const nextInput: HTMLInputElement = nextRow ? <any> nextRow.querySelector(`input[type="text"][name*="${name}"]`) : undefined;

    if (!nextRow || !nextInput) {
      return;
    }

    if (name === 'preis' && e.ctrlKey && input.value) {

      let cb: HTMLInputElement = <any> row.querySelector('input[type="checkbox"][name*="Sell"]');
      const item = cb ? this._items.find(x => x.ctrlSellCheckbox === cb) : undefined;

      cb = <any> nextRow.querySelector('input[type="checkbox"][name*="Sell"]');
      const nextItem = cb ? this._items.find(x => x.ctrlSellCheckbox === cb) : undefined;

      if (item && nextItem) {
        let val = Number(input.value);
        val = nextItem.isConsumable ? Math.ceil(val / item.uses * nextItem.uses) : val;
        nextInput.value = val.toString();
      }
    } else if (e.ctrlKey) {
      nextInput.value = input.value;
    }

    nextInput.focus();
  }

  _onClick(e: MouseEvent) {

    const elem: HTMLInputElement = <any> e.target;

    if (elem.tagName !== 'INPUT' || elem.type !== 'checkbox') {
      return;
    }

    let prop: keyof StorageItem;

    if (elem.name.startsWith('Sell')) {
      prop = 'ctrlSellCheckbox';
    } else if (elem.name.startsWith('doEquip')) {
      prop = 'ctrlLocationCheckbox';
    } else if (elem.name.startsWith('SetGrpItem')) {
      prop = 'ctrlGroupCheckbox';
    }

    if (!prop) return;

    const item = this._items.find(x => x[prop] === elem);
    if (item && e.shiftKey) {
      this._items.forEach(y => {
        if (y.name === item.name) (<HTMLInputElement> y[prop]).checked = elem.checked;
      });
    }
  }
}
