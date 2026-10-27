import { describe, expect, it } from "@jest/globals";
import { parseItemDetails } from "./parse-item-details";

describe("common / functions / parsing / parseItemDetails", () => {
  it("should parse", () => {
    const item = parseItemDetails(
      "dagger",
      `<body><table><tbody>
<tr class="row1"> <td> stored in </td> <td>treasure vault</td> </tr>

<tr class="row0"> <td valign="top">
<span class="item_unusable">hero classes</span> </td>
<td>

<i>not</i> for<br>

  <ul>
  <li><span class="generic_no">
  Cloudraider</span></li>
  <li><span class="generic_no">
  Conjuror</span></li>
  <li><span class="generic_no">
  Draclin</span></li>
  <li><span class="generic_no">
  Drifter</span></li>
  <li><span class="generic_no">
  Engineer</span></li>
  <li><span class="generic_no">
  Knight</span></li>
  <li><span class="generic_no">
  Lightbringer</span></li>
  <li><span class="generic_no">
  Mage</span></li>
  <li><span class="generic_no">
  Paladin</span></li>
  <li><span class="generic_no">
  Priest</span></li>
  <li><span class="generic_no">
  Scholar</span></li>
  <li><span class="generic_no">
  Shaman</span></li>
  <li><span class="generic_no">
  Warlock</span></li>
  </ul>
  </td>
  </tr>

  <tr class="row1"> <td valign="top"> <span>race</span> </td> <td> <i>every race may use this item</i> </td> </tr>
  <tr class="row0"> <td valign="top"> <span class="item_unusable">requirements</span> </td> <td align="center"> <i>no</i> </td> </tr>
  <tr class="row1"> <td> <span>unique</span> </td> <td align="center"> - </td> </tr>
  <tr class="row0"> <td> uses left </td> <td align="center"> unlimited </td> </tr>
  <tr class="row1"> <td> uses per dungeon </td> <td align="center"> unlimited </td> </tr>
  <tr class="row0"> <td> uses per fight </td> <td align="center"> 1 </td> </tr>
  <tr class="row1"> <td> effect </td> <td align="center" nowrap=""> piercing damage </td> </tr>
  <tr class="row0"> <td> needs </td> <td align="center" nowrap=""> - </td> </tr>
  <tr class="row1"> <td> location </td> <td align="center"> pocket </td> </tr>

  <tr class="row0"> <td valign="top" nowrap="">
  <span>item class</span><br>
  <span class="bonus">including bonuses</span>
  </td>
  <td align="center" valign="top" nowrap="">
  <a href="/item_class_-_throwing_weapons">throwing weapons</a><br>
    </td>
  </tr>

  <tr class="row1">
  <td valign="top">
  skills<br>
  <span class="bonus">including bonuses</span>			</td>
  <td align="center" nowrap="">
  <a href="/wod/spiel/hero/skill.php">Use throwing weapons</a><br>
  <a href="/wod/spiel/hero/skill.php">Precision Throwing</a><br>
  <a href="/wod/spiel/hero/skill.php">Glancing Ricochet</a><span class="bonus"> (+15%/+0)</span><br>
  <a href="/wod/spiel/hero/skill.php">Killing Ricochet</a><span class="bonus"> (+0/+0)</span><br>
  <a href="/wod/spiel/hero/skill.php">Use two throwing weapons</a><span class="bonus"> (+0/+0)</span><br>
  <a href="/wod/spiel/hero/skill.php">Flutterer</a><span class="bonus"> (+0/+0)</span><br>
  <a href="/wod/spiel/hero/skill.php">Into the black</a><span class="bonus"> (+0/+0)</span><br>
  <a href="/wod/spiel/hero/skill.php">Juggling throwing weapons</a><span class="bonus"> (+0/-0.1x hero lvl.)</span><br>
  </td>
  </tr>

  </tbody></table></body>`,
    );
    expect(item).toMatchObject({
      name: "dagger",
      heroClasses: {
        include: undefined,
        exclude: [
          "Cloudraider",
          "Conjuror",
          "Draclin",
          "Drifter",
          "Engineer",
          "Knight",
          "Lightbringer",
          "Mage",
          "Paladin",
          "Priest",
          "Scholar",
          "Shaman",
          "Warlock",
        ],
      },
      races: undefined,
      requirements: undefined,
      unique: "not unique",
      usesLeft: "unlimited",
      usesPerDungeon: "unlimited",
      usesPerFight: "1",
      effect: "piercing damage",
      needs: "-",
      location: "pocket",
      itemClasses: ["throwing weapons"],
      skills: [
        "Use throwing weapons",
        "Precision Throwing",
        "Glancing Ricochet",
        "Killing Ricochet",
        "Use two throwing weapons",
        "Flutterer",
        "Into the black",
        "Juggling throwing weapons",
      ],
      remarks: "",
      set: "",
    });
  });
});
