import { Hero } from "./hero";
import { parseHtml } from "@common/dom/parse-html";

describe("hero", () => {
  it("should parse armor", () => {
    const table = parseHtml(`
<table>
  <tbody>
    <tr><td><h3>armor</h3></td></tr>
     <tr>
       <td>
         <table>
           <tbody>
             <tr>
               <th>damage type</th>
               <th>attack type</th>
               <th>armor</th>
             </tr>
             <tr class="row0">
               <td>lightning damage</td>
               <td>all</td>
               <td><span class="gem_bonus">+5</span> / <span class="gem_bonus">+4</span>                                    / <span class="gem_bonus">+1</span></td>
             </tr>
              <tr class="row1">
                <td>lightning damage</td>
                <td nowrap="">spell
                  <font size="-1"> <sup>(z)</sup></font>
                </td>
                <td><span class="gem_bonus">+2</span> / 0 / 0</td>
              </tr>
              <tr class="row0">
                <td>ice damage</td>
                <td nowrap="">all</td>
                <td><span class="gem_bonus">+8</span> / <span class="gem_bonus">+7</span>                                    / <span class="gem_bonus">+4</span></td>
              </tr>
              <tr class="row1">
                <td>ice damage</td>
                <td nowrap="">spell
                  <font size="-1"> <sup>(z)</sup></font>
                </td>
                <td><span class="gem_bonus">+2</span> / 0 / 0</td>
              </tr>
              <tr class="row0">
                <td>fire damage</td>
                <td nowrap="">all</td>
                <td><span class="gem_bonus">+5</span> / <span class="gem_bonus">+4</span>                                    / <span class="gem_bonus">+1</span></td>
              </tr>
              <tr class="row1">
                <td>fire damage</td>
                <td nowrap="">spell
                  <font size="-1"> <sup>(z)</sup></font>
                </td>
                <td><span class="gem_bonus">+2</span> / 0 / 0</td>
              </tr>
              <tr class="row0">
                <td>crushing damage</td>
                <td nowrap="">all</td>
                <td><span class="gem_bonus">+20</span> / <span class="gem_bonus">+11</span>                                    / <span class="gem_bonus">+6</span></td>
              </tr>
              <tr class="row1">
                <td>cutting damage</td>
                <td nowrap="">all</td>
                <td><span class="gem_bonus">+22</span> / <span class="gem_bonus">+12</span>                                    / <span class="gem_bonus">+7</span></td>
              </tr>
              <tr class="row0">
                <td>piercing damage</td>
                <td nowrap="">all</td>
                <td><span class="gem_bonus">+19</span> / <span class="gem_bonus">+12</span>                                    / <span class="gem_bonus">+7</span></td>
              </tr>
           </tbody>
         </table>
       </td>
      </tr>
  </tbody>
</table>
        `);
    const hero = new Hero();
    hero.parseTables([table]);

    expect(hero.armor).toEqual({
      "crushing damage": { all: [20, 11, 6] },
      "cutting damage": { all: [22, 12, 7] },
      "fire damage": { all: [5, 4, 1], spell: [2, 0, 0] },
      "ice damage": { all: [8, 7, 4], spell: [2, 0, 0] },
      "lightning damage": { all: [5, 4, 1], spell: [2, 0, 0] },
      "piercing damage": { all: [19, 12, 7] },
    });
  });

  it("should parse damage", () => {
    const table = parseHtml(`
<table>
<tbody><tr>
        <td><h3>damage</h3></td>
    <td width="20"></td>
            <td><h3>attack bonuses</h3></td>
    <td width="20"></td>
            <td><h3>defence bonuses</h3></td>
    </tr>
<tr>
            <td valign="top">
        <table class="content_table">
        <tbody><tr class="header">
            <th align="center">damage type</th>
            <th align="center">attack type</th>
            <th align="center" valign="top" nowrap="">
                <table height="100%">
                <tbody><tr>
                    <td> damage</td>
                    <td valign="top" nowrap=""><font size="-1"><sup>(r)</sup>&nbsp;</font></td>
                </tr>
                </tbody></table>
            </th>
        </tr>
                  <tr class="row0">
             <td>crushing damage</td>
             <td align="center" nowrap="">melee <font size="-1"> <sup>(z)</sup></font></td>
             <td align="center"><span class="gem_bonus">+2</span> / <span class="gem_bonus">+7</span> / <span class="gem_bonus">+8</span></td>
         </tr>
                  <tr class="row1">
             <td>psychological damage</td>
             <td align="center" nowrap="">all</td>
             <td align="center">0 / 0 / <span class="gem_bonus">+2</span></td>
         </tr>
                  <tr class="row0">
             <td>acid damage</td>
             <td align="center" nowrap="">all</td>
             <td align="center"><span class="gem_bonus">+1</span> / <span class="gem_bonus">+2</span> / <span class="gem_bonus">+3</span></td>
         </tr>
                  <tr class="row1">
             <td>cutting damage</td>
             <td align="center" nowrap="">melee <font size="-1"> <sup>(z)</sup></font></td>
             <td align="center"><span class="gem_bonus">+2</span> / <span class="gem_bonus">+7</span> / <span class="gem_bonus">+8</span></td>
         </tr>
                  <tr class="row0">
             <td>piercing damage</td>
             <td align="center" nowrap="">melee <font size="-1"> <sup>(z)</sup></font></td>
             <td align="center"><span class="gem_bonus">+2</span> / <span class="gem_bonus">+7</span> / <span class="gem_bonus">+8</span></td>
         </tr>
                 </tbody></table>

        <font size="-1"><sup>(r)</sup> for normal / good / critical hits</font><br>
                <font size="-1"><sup>(z)</sup> bonus in addition to armor</font><br>
                </td>
        <td></td>
        
        <td valign="top">
        <table class="content_table">
        <tbody><tr class="header">
            <th>Bonus</th>
            <th align="center" valign="top" nowrap="">Modifier</th>
        </tr>
                  <tr class="row0">
             <td>ranged</td>
             <td align="center"><span class="gem_bonus">+10</span></td>
         </tr>
                  <tr class="row1">
             <td>melee</td>
             <td align="center"><span class="gem_bonus">+85</span></td>
         </tr>
                  <tr class="row0">
             <td>social</td>
             <td align="center"><span class="gem_bonus">+20</span></td>
         </tr>
                  <tr class="row1">
             <td>spell</td>
             <td align="center"><span class="gem_bonus">+10</span></td>
         </tr>
                 </tbody></table>
    </td><td></td>
        <td valign="top">
        <table class="content_table">
        <tbody><tr class="header">
            <th align="center">Bonus</th>
            <th align="center" valign="top" nowrap="">Modifier</th>
        </tr>
                  <tr class="row0">
             <td>ranged</td>
             <td align="center"><span class="gem_bonus">+5</span></td>
         </tr>
                  <tr class="row1">
             <td>disease</td>
             <td align="center"><span class="gem_bonus">+14</span></td>
         </tr>
                  <tr class="row0">
             <td>melee</td>
             <td align="center"><span class="gem_bonus">+7</span></td>
         </tr>
                  <tr class="row1">
             <td>nature</td>
             <td align="center"><span class="gem_bonus">+10</span></td>
         </tr>
                  <tr class="row0">
             <td>social</td>
             <td align="center"><span class="gem_bonus">+1</span></td>
         </tr>
                  <tr class="row1">
             <td>spell</td>
             <td align="center"><span class="gem_bonus">+20</span> <span class="gem_malus">-25%</span></td>
         </tr>
                  <tr class="row0">
             <td>spring trap</td>
             <td align="center"><span class="gem_malus">-5</span></td>
         </tr>
                  <tr class="row1">
             <td>ambush</td>
             <td align="center"><span class="gem_malus">-5</span></td>
         </tr>
                 </tbody></table>
    </td></tr>
</tbody></table>`);

    const hero = new Hero();
    hero.parseTables([table]);

    expect(hero.bonus_damage).toEqual({
      "acid damage": { all: "+1/+2/+3" },
      "crushing damage": { melee: "+2/+7/+8" },
      "cutting damage": { melee: "+2/+7/+8" },
      "piercing damage": { melee: "+2/+7/+8" },
      "psychological damage": { all: "0/0/+2" },
    });

    expect(hero.bonus_attack).toEqual({
      melee: "+85",
      ranged: "+10",
      social: "+20",
      spell: "+10",
    });

    expect(hero.bonus_defence).toEqual({
      disease: "+14",
      melee: "+7",
      nature: "+10",
      ranged: "+5",
      social: "+1",
      spell: "+20 -25%",
      "spring trap": "-5",
      ambush: "-5",
    });
  });
});
