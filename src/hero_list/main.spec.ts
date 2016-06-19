
/// <reference path="../_references.spec.ts" />

/// <reference path="../common/functions/parsing/parse-html.ts" />

/// <reference path="main.ts" />

describe('hero_list', () => {

    let makeHero = (hid: number, name: string, className: string, level: number, isActive: boolean, time: string, dungeon: string) => {

        return `<tr>
                    <td class="content_table" nowrap=""> <input name="FIGUR" value="${hid}" type="radio"> <a href="/wod/spiel/hero/profile.php?id=${hid}" class="hero_active hero_active">${name}</a> </td>
                    <td><span><a href="">${className}</a></span></td>
                    <td><span>${level}</span></td>
                    <td><span> <input name="aktiv[${hid}]" ${isActive ? '"value"=1 checked' : '"value"=0' } type="checkbox"> </span></td>
                    <td onmouseover="return wodToolTip(this,'${dungeon}');"> ${time} </td>
                </tr>`
    };

    it('', () => {

        let heroes = [
            makeHero(1, 'H1', 'Mage', 1, true, '07:14', 'Duel in the grass')
        ]

        let table = <HTMLTableElement>parseHTML(`
            <table>
                <tr class="header">
                    <th>name</th> <th>class</th> <th>level</th> <th>active</th> <th><a href="/wod/spiel/dungeon/dungeon.php">Next<br>dungeon</a></th>
                </tr>
                ${heroes.join('')}
            </table>
        `);

        let info = getInfo(<any>table.querySelectorAll('tr'))
    })
})
