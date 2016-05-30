/// <reference path="../../lib/typings/browser.d.ts" />

/// <reference path="../common/functions/dom/add.ts" />
/// <reference path="../common/functions/dom/attr.ts" />
/// <reference path="../common/functions/dom/text-content.ts" />
/// <reference path="../common/functions/dom/insert-after.ts" />
/// <reference path="../common/functions/ajax/http-fetch.ts" />

function main() {

    let table_heroes = document.querySelector('#main_content form table'),
        rows: any[] = table_heroes ? Array.from(table_heroes.querySelectorAll('tr')) : null;

    if (rows) {

        const saveWeights = () => {

            let promises = [];

            for (let i = 1; i < rows.length; i++) {

                let row    = rows[i],
                    cells  = row.cells,
                    hid    = Number(cells[0].querySelector('input').value).toString(),
                    weight = Number(cells[6].querySelector('input').value),
                    group  = 'no group';

                if (isNaN(weight)) weight = 0;

                let p = httpFetch('/wod/spiel/hero/profile.php?id=' + hid);
                p.then((data: string) => {
                    let n = data.indexOf('group:'),
                        group = data.slice(n, n + 200).split('<a')[1].split(/[><]/)[1];
                    console.log(group);
                    GM_setValue(hid, JSON.stringify({ weight, group }));
                });

                promises.push(p);
            }

            Promise.all(promises).then(() => {
                let form = (<any>document.forms).the_form;
                if (form) form.submit();
            });
        }

        let newTable  = add('table'),
            newTbody  = add('tbody', newTable);

        attr(newTable, 'class', 'content_table');

        let headerWeight = add('th'),
            label = add('span', headerWeight),
            buttonSave = add('input', headerWeight);

        label.innerHTML = 'weight<br/>';
        attr(buttonSave, { 'type': 'button', 'value': 'Update', 'class': 'button clickable' });
        buttonSave.addEventListener('click', saveWeights, false);
        rows[0].appendChild(headerWeight);
        newTbody.appendChild(rows[0]);

        let groupName = add('th')
        textContent(groupName, 'group')
        rows[0].insertBefore(groupName, rows[0].cells[4]);

        let heroes = [];

        for (let i = 1; i < rows.length; i++) {

            let row     = rows[i],
                cells   = row.cells,
                hid     = Number(cells[0].querySelector('input').value).toString(),
                level   = Number(textContent(cells[2])),
                next    = cells[4],
                tooltip = attr(next, 'onmouseover'),
                time    = textContent(cells[4]).trim(),
                value   = GM_getValue(hid),
                info    = value ? JSON.parse(value) : {},
                weight  = info.weight || (level === 0 ? 100 : level);

            if (tooltip) {
                let dungeon = tooltip.split("'")[1];
                let localTime = time.split('/')[0];
                textContent(next, `${localTime} - ${dungeon}`);
                next.setAttribute('onmouseover', `return wodToolTip(this,"${dungeon} <br/> ${time}");`);
            }

            let timeCell = add('td');
            textContent(timeCell,  time);

            heroes.push({ 'weight': Number(weight), row, group: info.group || 'no group'});
        }

        heroes.sort((a, b) => a.weight - b.weight);

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

            let c = add('td')
            textContent(c, hero.group)
            row.insertBefore(c, row.cells[4])

            if (i > 0 && group !== hero.group) {
                group = hero.group;
                // let rowGroup = add('tr');
                // attr(rowGroup, 'class', 'row' + (color++ % 2));
                // let cellGroup = add('td', rowGroup);
                // attr(cellGroup, {'colspan': 6, 'style': 'text-align: center'});
                // textContent(cellGroup, group);
                // makeInput(rowGroup, hero.groupWeight);
                // add(rowGroup, newTbody);
                // attr(row, {'style': 'border-top: 2px solid #fff'});
            }

            add(hero.row, newTbody);
        });

        insertAfter(table_heroes, newTable);
        table_heroes.parentNode.removeChild(table_heroes);
    }
}

if (!(<any>window).__karma__) document.addEventListener('DOMContentLoaded', () => main());
