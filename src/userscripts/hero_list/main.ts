import { add } from '@common/dom/add';
import { attr } from '@common/dom/attr';
import { textContent } from '@common/dom/text-content';
import { insertAfter } from '@common/dom/insert-after';
import { httpFetch } from '@common/net/http-fetch';

interface IHeroInfo {
   group: string;
   row: HTMLTableRowElement;
   weight: number;
}

export function getInfo(rows: HTMLTableRowElement[], currentTime?: string): IHeroInfo[] {

    const result: IHeroInfo[] = [];

    const minutes = t => t.split(':').reduce((acc, x) => acc > 0 ? acc + Number(x) : Number(x) * 60, 0);
    const v = x => x < 10 ? '0' + x : x.toString();
    const formatTime = x => v(Math.trunc(x / 60)) + ':' + v(x % 60);

    for (let i = 1; i < rows.length; i++) {

        const row     = rows[i];
        const cells   = row.cells;
        const hid     = Number((<any> cells[0].querySelector('input')).value).toString();
        const level   = Number(textContent(cells[2]));
        const next    = cells[4];
        const dungeon = getDungeonName(<any> next);
        const time    = textContent(cells[4]).trim();
        const value   = GM_getValue(hid);
        const info    = value ? JSON.parse(value) : {};
        const weight  = info.weight || (level === 0 ? 100 : level);

        if (dungeon) {
            const localTime = time.split('/')[0];
            const title = currentTime ? `${localTime} (in ${formatTime(minutes(time) - minutes(currentTime))}) - ${dungeon}` : `${localTime} - ${dungeon}`;
            textContent(next, title);
        }

        const timeCell = add('td');
        textContent(timeCell,  time);

        result.push({ weight: Number(weight), row, group: info.group || 'no group'});
    }

    return result.sort((a, b) => a.weight - b.weight);
}

export function getDungeonName(td: HTMLTableCellElement): string {
    let tooltip: string = attr(td, 'onmouseover') || '';
    const n = tooltip.lastIndexOf('left;\'>');
    if (n > -1) tooltip = tooltip.slice(n);
    return tooltip.replace(/.+\(this,'(.+)'\);/, '$1').replace(/.+>(.+)<\/th.+/i, '$1');
}

export function saveWeights(rows: HTMLTableRowElement[]) {

    const promises = [];

    for (let i = 1; i < rows.length; i++) {

        const row    = rows[i];
        const cells  = row.cells;
        const hid    = Number((<any> cells[0].querySelector('input')).value).toString();
        let weight = Number((<any> cells[6].querySelector('input')).value);

        if (isNaN(weight)) weight = 0;

        const p = httpFetch('/wod/spiel/hero/profile.php?id=' + hid);
        p.then(resp => {
            const data = resp.data;
            const n = data.indexOf('group:');
            const group = data.slice(n, n + 200).split('<a')[1].split(/[><]/)[1];
            GM_setValue(hid, JSON.stringify({ weight, group }));
        });

        promises.push(p);
    }

    Promise.all(promises).then(() => {
        const form = (<any> document.forms).the_form;
        if (form) form.submit();
    });
}

export function main(main_content?) {

    const table = (main_content || document.querySelector('#main_content')).querySelector('form table');
    const rows: HTMLTableRowElement[] = table ? <HTMLTableRowElement[]> Array.from(table.querySelectorAll('tr')) : undefined;

    if (rows) {

        const newTable  = add<HTMLElement>('table');
        const newTbody  = add<HTMLElement>('tbody', newTable);

        attr(newTable, 'class', 'content_table');

        const headerWeight = add<Element>('th');
        const label = add<HTMLSpanElement>('span', headerWeight);
        const buttonSave = add<HTMLInputElement>('input', headerWeight);

        label.innerHTML = 'weight<br/>';
        attr(buttonSave, { type: 'button', value: 'Update', class: 'button clickable' });
        buttonSave.addEventListener('click', () => { saveWeights(rows); }, false);
        rows[0].appendChild(headerWeight);
        newTbody.appendChild(rows[0]);

        const groupName = add<HTMLElement>('th');
        textContent(groupName, 'group');
        rows[0].insertBefore(groupName, rows[0].cells[4]);

        const time = document.querySelector('#clock');
        const heroes = getInfo(rows, time ? time.textContent : undefined);
        let group;

        const makeInput = (row, value) => {

            const colWeight = add('td', row);
            const txt = add('input');

            attr(txt, { type: 'text', style: 'width: 30px', value });
            attr(colWeight, 'align', 'center');
            add(txt, colWeight);
        };

        let color = 0;

        heroes.forEach((hero, i) => {

            const row = hero.row;
            makeInput(row, hero.weight);
            attr(row, 'class', 'row' + (color++ % 2));

            const c = add<HTMLElement>('td');
            c.innerHTML = `<a href="/wod/spiel/dungeon/group.php?name=${hero.group}" target="_blank" />${hero.group}</a>`;
            row.insertBefore(c, row.cells[4]);

            if (i > 0 && group !== hero.group) {
                group = hero.group;
            }

            add(hero.row, newTbody);
        });

        insertAfter(table, newTable);
        table.parentNode.removeChild(table);
    }
}

if (!(<any> window).__karma__) document.addEventListener('DOMContentLoaded', () => main());
