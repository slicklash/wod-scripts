import { parseHTML } from '../../common/dom/parse-html'
import { getInfo, getDungeonName } from './main'

var GM_getValue = function () {}

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

    all('should parse dungeon name', [
        {
            value: `<td id="___wodToolTip_UniqueId__1" onmouseover="return wodToolTip(this,'Kerrunch\'s orc cave');"> 22:19              <img alt="" src="/wod/css//skins/skin-1/images/icons/inf.gif" border="0">            </td>`,
          expected: `Kerrunch's orc cave`
        },
        {
            value: `<td id="___wodToolTip_UniqueId__1" onmouseover="return wodToolTip(this,'<table class=\'tooltip\' style=\'border-style: none; text-align: left;\'><tr class=\'tooltip\' style=\'border-style: none; text-align: left;\'><td class=\'tooltip\' style=\'border-style: none; text-align: left;\'>Quest:</td><th class=\'tooltip\' style=\'border-style: none; text-align: left;\'>A beginning</th></tr><tr class=\'tooltip\' style=\'border-style: none; text-align: left;\'><td class=\'tooltip\' style=\'border-style: none; text-align: left;\'>dungeon</td><th class=\'tooltip\' style=\'border-style: none; text-align: left;\'>The orc headquarters</th></tr></table>');">
                19:00              <img alt="" src="/wod/css//skins/skin-1/images/icons/inf.gif" border="0">            </td>`,
            expected: `The orc headquarters`
        }
    ], x => {

        let td = (<any>parseHTML(`<table><tr>${x.value}</tr></table>`)).rows[0].cells[0];

        expect(getDungeonName(td)).toEqual(x.expected);
    })
})
