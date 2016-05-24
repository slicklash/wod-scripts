/// <reference path="../../lib/typings/browser.d.ts" />

/// <reference path="../common/functions/dom/add.ts" />
/// <reference path="../common/functions/dom/attr.ts" />
/// <reference path="../common/functions/dom/text-content.ts" />

function main() {

    let table_heroes = document.querySelector('#main_content form table'),
        rows: any[] = table_heroes ? Array.from(table_heroes.querySelectorAll('tr')) : null;

    if (rows) {

        const saveWeights = () => {

            for (let i = 1; i < rows.length; i++) {

                let row    = rows[i],
                    cells  = row.cells,
                    hid    = Number(cells[0].querySelector('input').value).toString(),
                    weight = Number(cells[5].querySelector('input').value),
                    group  = 'no group';

                if (isNaN(weight)) weight = 0;

                GM_setValue(hid, JSON.stringify({ weight, group }));
            }

            var form = (<any>document.forms).the_form;

            if (form) form.submit();
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

        let heroes = [];

        for (let i = 1; i < rows.length; i++) {

            let row     = rows[i],
                cells   = row.cells,
                hid     = Number(cells[0].querySelector('input').value).toString(),
                level   = Number(textContent(cells[2])),
                next    = cells[4],
                tooltip = next.getAttribute('onmouseover'),
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

            heroes.push({ 'weight': Number(weight), 'row': row });
        }

        heroes.sort((a, b) => a.weight - b.weight);

        heroes.forEach((hero, i) => {

            let row = hero.row,
                colWeight = add('td', row),
                txt = add('input');

            attr(row, 'class', 'row' + i % 2);
            attr(colWeight, 'align', 'center');
            attr(txt, { 'type': 'text', 'style': 'width: 30px', 'value': hero.weight });

            add(txt, colWeight);
            add(hero.row, newTbody);
        });

        let parentNode = table_heroes.parentNode,
            position   = table_heroes.nextSibling;

        parentNode.insertBefore(newTable, position);
        parentNode.removeChild(table_heroes);
    }
}

if (!(<any>window).__karma__) document.addEventListener('DOMContentLoaded', () => main());
