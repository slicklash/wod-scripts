import { add } from '../../common/dom/add'
import { attr } from '../../common/dom/attr'
import { textContent } from '../../common/dom/text-content'
import { insertAfter } from '../../common/dom/insert-after'
import { httpFetch } from '../../common/net/http-fetch'

interface HeroInfo {
   group: string;
   row: HTMLTableRowElement;
   weight: number;
}

export function getInfo (rows: HTMLTableRowElement[]): HeroInfo[] {

    let result: HeroInfo[] = [];

    for (let i = 1; i < rows.length; i++) {

        let row     = rows[i],
            cells   = row.cells,
            hid     = Number((<any>cells[0].querySelector('input')).value).toString(),
            level   = Number(textContent(cells[2])),
            next    = cells[4],
            dungeon = getDungeonName(<any>next),
            time    = textContent(cells[4]).trim(),
            value   = GM_getValue(hid),
            info    = value ? JSON.parse(value) : {},
            weight  = info.weight || (level === 0 ? 100 : level);

        if (dungeon) {
            let localTime = time.split('/')[0];
            textContent(next, `${localTime} - ${dungeon}`);
        }

        let timeCell = add('td');
        textContent(timeCell,  time);

        result.push({ 'weight': Number(weight), row, group: info.group || 'no group'});
    }

    return result.sort((a, b) => a.weight - b.weight);
}

export function getDungeonName (td: HTMLTableCellElement) : string {
    let tooltip: string = attr(td, 'onmouseover') || '';
    let n = tooltip.lastIndexOf('left;\'>');
    if (n > -1) tooltip = tooltip.slice(n);
    return tooltip.replace(/.+\(this,'(.+)'\);/, '$1').replace(/.+>(.+)<\/th.+/i, '$1');
}

export function saveWeights (rows: HTMLTableRowElement[]) {

    let promises = [];

    for (let i = 1; i < rows.length; i++) {

        let row    = rows[i],
            cells  = row.cells,
            hid    = Number((<any>cells[0].querySelector('input')).value).toString(),
            weight = Number((<any>cells[6].querySelector('input')).value);

        if (isNaN(weight)) weight = 0;

        let p = httpFetch('/wod/spiel/hero/profile.php?id=' + hid);
        p.then(resp => {
            let data = resp.data,
                n = data.indexOf('group:'),
                group = data.slice(n, n + 200).split('<a')[1].split(/[><]/)[1];
            GM_setValue(hid, JSON.stringify({ weight, group }));
        });

        promises.push(p);
    }

    Promise.all(promises).then(() => {
        let form = (<any>document.forms).the_form;
        if (form) form.submit();
    });
}

export function main (main_content?) {

    let table = (main_content || document.querySelector('#main_content')).querySelector('form table'),
        rows: HTMLTableRowElement[] = table ? <HTMLTableRowElement[]>Array.from(table.querySelectorAll('tr')) : undefined;

    if (rows) {

        let newTable  = add('table'),
            newTbody  = add('tbody', newTable);

        attr(newTable, 'class', 'content_table');

        let headerWeight = add('th'),
            label = add('span', headerWeight),
            buttonSave = add('input', headerWeight);

        label.innerHTML = 'weight<br/>';
        attr(buttonSave, { 'type': 'button', 'value': 'Update', 'class': 'button clickable' });
        buttonSave.addEventListener('click', () => { saveWeights(rows) }, false);
        rows[0].appendChild(headerWeight);
        newTbody.appendChild(rows[0]);

        let groupName = add('th');
        textContent(groupName, 'group');
        rows[0].insertBefore(groupName, rows[0].cells[4]);

        let heroes = getInfo(rows);
        let group;

        let makeInput = (row, value) => {

            let colWeight = add('td', row),
                txt = add('input');

            attr(txt, { 'type': 'text', 'style': 'width: 30px', 'value': value });
            attr(colWeight, 'align', 'center');
            add(txt, colWeight);
        };

        let color = 0;

        heroes.forEach((hero,i) => {

            let row = hero.row;
            makeInput(row, hero.weight);
            attr(row, 'class', 'row' + (color++ % 2));

            let c = add('td');
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

if (!(<any>window).__karma__) document.addEventListener('DOMContentLoaded', () => main());
