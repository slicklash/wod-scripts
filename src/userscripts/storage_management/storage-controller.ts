import { add } from '../../common/dom/add'
import { attr } from '../../common/dom/attr'
import { textContent } from '../../common/dom/text-content'
import { insertAfter } from '../../common/dom/insert-after'
import { _t } from './nls'
import { waitFor } from '../../common/dom/wait-for'

import { StorageItem } from './storage-item'
import { ISelectionOption, SELECTION_OPTIONS } from './selection-options'

const CommitButtonSelector = '#main_content input[type="submit"][name="ok"][value*="' + _t('Commit') + '"]';

export class StorageController {

    _options: ISelectionOption[] = SELECTION_OPTIONS;

    _items: StorageItem[] = [];

    _ready: Promise<any>;

    $onInit() {

        this._ready = waitFor(document, 'DOMContentLoaded');

        waitFor('select[name*="hero_race"]').then(this._makeClassAndRaceSelectable);

        waitFor('input[type="hidden"][name="view"]').then(elem => {
            if (elem && elem.value !== 'gear') this._createControls();
        });
    }

    _makeClassAndRaceSelectable() {

        let selectClass: HTMLSelectElement = <any>document.querySelector('select[name*="hero_class"]');
        let selectRace: HTMLSelectElement = <any>document.querySelector('select[name*="hero_race"]');

        if (!selectClass || !selectRace) return;

        let label = selectClass.parentElement.previousElementSibling;

        label.classList.add('button_minor');
        label.setAttribute('style', 'padding: 0');
        label.addEventListener('click', () => {
            let form = (<any>document.forms).the_form;
            selectClass.value = form.klasse_id.value;
            selectRace.value = form.rasse_id.value;
        });
    }

    _createControls() {

        let buttons_commit = <any>Array.from(document.querySelectorAll(CommitButtonSelector));

        if (!buttons_commit.length) return;

        let isGroupStorage = window.location.href.indexOf('groupcellar_2') > -1,
            isGroupTv = window.location.href.indexOf('groupcellar') > -1 && !isGroupStorage,
            go_tv = isGroupTv ? '-go_group' : 'go_group',
            go_gs = isGroupStorage ? '-go_group_2' : 'go_group_2';

        const moveItemToCellar = (x: StorageItem) => { x.ctrlLocationSelect.value = 'go_keller'; };
        const splitItem = (x: StorageItem) => { x.ctrlLocationSelect.value = !x.isConsumable ? go_tv : go_gs; if (!x.ctrlLocationSelect.value) moveItemToCellar(x); };
        const equipItem = (x: StorageItem) => { x.ctrlLocationSelect.value = (<any>x.ctrlLocationSelect.options[0]).value; };

        let actions = {
            split:  { predicate: (x: StorageItem) => x.ctrlLocationSelect && x.ctrlLocationCheckbox, handler: splitItem },
            cellar: { predicate: (x: StorageItem) => x.ctrlLocationSelect && x.ctrlLocationCheckbox, handler: moveItemToCellar },
            equip:  { predicate: (x: StorageItem) => x.isUsable && x.ctrlLocationSelect && x.ctrlLocationCheckbox, handler: equipItem },
        };

        let onSplit = this._performAction.bind(this, actions.split);
        let onCellar = this._performAction.bind(this, actions.cellar);
        let onEquip = this._performAction.bind(this, actions.equip);

        let onSelectChanged = this._onSelectChanged.bind(this);
        let onSellChanged = this._onSellChanged.bind(this);

        let selectsForLocation: HTMLSelectElement[] = [];
        let selectsForSell: HTMLSelectElement[] = [];
        let actionButtons: HTMLInputElement[] = [];

        buttons_commit.forEach(commit => {

            let labelMove = this._makeLabel('Select'),
                labelSell = this._makeLabel('Selll'),
                buttonSplit = this._makeButton('Split', onSplit),
                buttonCellar = this._makeButton('Cellar', onCellar),
                buttonEquip = this._makeButton('Equip', onEquip),
                selectForLocation = this._makeSelect(140, onSelectChanged),
                selectForSell = this._makeSelect(120, onSellChanged),
                labelSellInfo = add<HTMLSpanElement>('span');

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

            let rows = this._getTableRows(document.querySelector('#main_content'));

            this._items = this._parseItems(rows);

            selectsForLocation.forEach(x => { this._addOptions(x, this._options); x.disabled = false; });

            let sellOptions = this._options.filter(x => !x.notForSell);
            selectsForSell.forEach(x => { this._addOptions(x, sellOptions, true); x.disabled = false; });

            actionButtons.forEach(x => { x.disabled = false });

            this._attachEvents();
        });
    }

    labelsSellInfo = [];
    sellCount: number = 0;
    sellSum: number = 0;

    _onSellChanged(e) {

        let option = this._options.find(x => x.key === e.target.value);

        for (let item of this._items) {
            if (item.ctrlSellCheckbox && option.predicate(item)) {
                item.ctrlSellCheckbox.checked = option.pick;
            }
        }

        this._updateSellInfo();
    }

    _updateSellInfo() {

        this.sellSum = 0;
        this.sellCount = 0;

        for (let item of this._items) {
            if (item.ctrlSellCheckbox && item.ctrlSellCheckbox.checked) {
                this.sellCount++;
                this.sellSum += item.price;
            }
        }

        let sellInfo = this.sellCount > 0 ? `&nbsp;${this.sellCount} (${this.sellSum} <img alt="" border="0" src="/wod/css/skins/skin-2/images/icons/lang/en/gold.gif" title="gold">)` : '';
        this.labelsSellInfo.forEach(x => { x.innerHTML = sellInfo });
    }

    _onSelectChanged(e) {

        let option = this._options.find(x => x.key === e.target.value);

        for (let item of this._items) {
            if (item.ctrlLocationCheckbox && option.predicate(item)) {
                item.ctrlLocationCheckbox.checked = option.pick;
            }
        }
    }

    _performAction({predicate, handler}) {

        if (!this._items.length) return;

        let onlySelected = false,
            tmp = [];

        for (let item of this._items) {
            if (predicate(item)) {
                if (item.ctrlLocationCheckbox.checked) {
                    handler(item);
                    onlySelected = true;
                }
                else {
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
                return
            }

            this._makeSelectOption(select, x, sellable, option_group);

        });

        return select;
    }

    _makeLabel(text: string) {
        let label = add<HTMLSpanElement>('span');
        label.innerHTML = `&nbsp;${text}&nbsp;`; return label;
    }

    _makeButton(text: string, onClick: EventListenerOrEventListenerObject) {
        let btn = add<HTMLInputElement>('input');
        attr(btn, {'type': 'button', 'class': 'button clickable', 'name': `button${text}`, 'value': `${text}`, 'style': 'margin-left: 5px', 'disabled': 'disabled'});
        btn.addEventListener('click', onClick, false);
        return btn;
    }

    _makeSelect(width: number, onSelect: EventListenerOrEventListenerObject) {
        let select = add<HTMLSelectElement>('select');
        attr(select, { 'style': `min-width: ${width}px`, 'disabled': 'disabled' });
        select.addEventListener('change', onSelect, false);
        return select;
    }

    _makeSelectOption(select: HTMLSelectElement, option: ISelectionOption, sellable?: boolean, option_group?) {

        let op = add('option');

        attr(op, 'value', option.key).innerHTML = option.key === 'none'? 'none' : sellable ? `${option.title} (${option.countSell})` : `${option.title} (${option.count})`;

        if (option_group) {
            option_group.appendChild(op);
        }
        else {
            select.appendChild(<any>op);
        }
    }

    _parseItems(rows: HTMLTableRowElement[]): StorageItem[] {

        let re_uses  = /\(([0-9]+)\/[0-9]+\)/;

        return rows.reduce((acc, row) => {

            if (!row || !row.cells || row.cells.length < 2) return acc;

            let cells         = row.cells,
                link          = cells[1].querySelector('a'),
                name          = textContent(link).replace(/!$/,''),
                uses          = textContent(cells[1]).replace(name, '').trim(),
                tooltip       = link ? attr(link, 'onmouseover') : false,
                classes       = link ? attr(link, 'class') : '',
                ctrl_location = cells.length > 2 ? cells[2].querySelector('select') : null,
                ctrl_select   = cells.length > 2 ? cells[2].querySelector('input[type="checkbox"][name^="doEquip"]') : null,
                ctrl_sell     = cells.length > 3 ? cells[3].querySelector('input[type="checkbox"][name^="Sell"]') : null,
                price         = cells.length > 3 ? Number(cells[3].textContent.trim()): 0;

            if (!ctrl_sell && cells.length > 4) {
                ctrl_sell = cells[4].querySelector('input[type="checkbox"]');
                price = Number(cells[4].textContent.trim());
            }

            let item = new StorageItem();
            item.name = name;

            let m = uses.match(re_uses);
            if (m) {
                item.isConsumable = true;
                item.uses = m[1];
            }
            item.isUsable = classes.indexOf('item_unusable') === -1;
            item.isGroupItem = tooltip ? tooltip.indexOf('group item') > -1 : false;

            item.ctrlLocationSelect = <any>ctrl_location;
            item.ctrlLocationCheckbox = <any>ctrl_select;
            item.ctrlSellCheckbox = <any>ctrl_sell;

            item.price = price;

            for (let option of this._options) {
                if (option.predicate && option.predicate(item)) {
                    if (item.ctrlLocationSelect) option.count = (option.count || 0) + 1;
                    if (item.ctrlSellCheckbox) option.countSell = (option.countSell || 0) + 1;
                }
            }

            acc.push(item);
            return acc;

        }, []);
    }

    _table: HTMLTableElement;

    _attachEvents() {

        if (!this._table) {
            return;
        }

        this._table.addEventListener('keyup', this._onKeyUp.bind(this));
        this._table.addEventListener('click', this._onClick.bind(this));
    }

    _onKeyUp(e: KeyboardEvent) {

        let input: HTMLInputElement = <any>e.target;
        let up   = e.key === 'ArrowUp' || e.keyCode === 38;
        let down = e.key === 'ArrowDown' || e.keyCode === 40;

        if (input.tagName !== 'INPUT' || input.type !== 'text' || !(up || down)) {
            return;
        }

        let row  = input.parentElement.parentElement;
        let nextRow: HTMLElement = up ? <any>row.previousElementSibling: <any>row.nextElementSibling;
        let name = input.name.includes('preis') ? 'preis' : 'comment';
        let nextInput: HTMLInputElement = nextRow ? <any>nextRow.querySelector(`input[type="text"][name*="${name}"]`) : undefined;

        if (!nextRow || !nextInput) {
            return;
        }

        if (name === 'preis' && e.ctrlKey && input.value) {

            let cb: HTMLInputElement = <any>row.querySelector('input[type="checkbox"][name*="Sell"]');
            let item = cb ? this._items.find(x => x.ctrlSellCheckbox === cb) : undefined;

            cb = <any>nextRow.querySelector('input[type="checkbox"][name*="Sell"]');
            let nextItem = cb ? this._items.find(x => x.ctrlSellCheckbox === cb): undefined;

            if (item && nextItem) {

                let val = Number(input.value);

                val = nextItem.isConsumable ? Math.ceil(val / item.uses * nextItem.uses): val;

                nextInput.value = val.toString();
            }
        }
        else if (e.ctrlKey) {
            nextInput.value = input.value;
        }

        nextInput.focus();
    }

    _onClick(e: MouseEvent) {

        let elem: HTMLInputElement = <any>e.target;

        if (elem.tagName !== 'INPUT' || elem.type !== 'checkbox') {
            return;
        }

        let item: StorageItem;

        if (elem.name.startsWith('Sell')) {
            item = this._items.find(x => x.ctrlSellCheckbox === elem);
            if (item && e.shiftKey) {
                this._items.forEach(y => {
                    if (y.name === item.name) y.ctrlSellCheckbox.checked = elem.checked;
                });
            }

            this._updateSellInfo();
        }
        else if (elem.name.startsWith('doEquip')) {
            item = this._items.find(x => x.ctrlLocationCheckbox === elem);
            if (item && e.shiftKey) {
                this._items.forEach(y => {
                    if (y.name === item.name) y.ctrlLocationCheckbox.checked = elem.checked;
                });
            }
        }
    }

    _getTableRows(main_content): HTMLTableRowElement[] {

        let scope: any = main_content.querySelectorAll('input[type="submit"][name^="ITEMS_LAGER_DO_SORT"][class*="table_h"]');

        if (!scope || !scope.length) scope = main_content.querySelectorAll('input[type="submit"][name^="ITEMS_KELLER_DO_SORT"][class*="table_h"]');
        if (!scope || !scope.length) scope = main_content.querySelectorAll('input[type="submit"][name^="ITEMS_GROUPCELLAR_DO_SORT"][class*="table_h"]');

        try { scope = scope[0].parentNode.parentNode.parentNode.parentNode.querySelector('tbody'); } catch (ex) { scope = null; }

        if (!scope) return [];

        this._table = scope;

        return <any>Array.from(scope.querySelectorAll('tr'));
    }
}
