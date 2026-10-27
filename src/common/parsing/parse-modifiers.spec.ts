import { describe, it } from "@jest/globals";
import { parseModifiers } from "./parse-modifiers";

describe("common / functions / parsing / parseItemDetails", () => {
  it("parse", () => {
    const modifiers = parseModifiers(`<body>
<div id="link">
<table>
<tbody><tr><td>Link for forums and mails:</td><td><input type="text" size="40" readonly="" value="[item: battle axe of Ulmenhain]"></td></tr>
  </tbody></table>


<p><input type="submit" name="back" value="Close" class="button clickable" onclick="window.close();;return false;"></p>





<h2>Effect on the <u>owner</u> of this item</h2>
<p>These bonuses and malus are effective when the item is carried (unless otherwise specified).</p>








<h3>Damage bonus</h3>
<table class="content_table">
<tbody><tr class="header">
<th>Damage Type</th>
<th>Attack Type</th>
<th align="center" nowrap="">Damage Bonus <font size="-1"><sup>(r)</sup></font></th>
</tr>
<tr class="row0">
<td class="content_table">psychological damage</td>
<td class="content_table" align="center">melee                 <font size="-1"><sup>(a)</sup></font>                </td>
<td class="content_table" align="center">0 / <span class="gem_bonus">+2</span> / <span class="gem_bonus">+4</span></td>
</tr>
</tbody></table>
<font size="-1"><sup>(r)</sup> is added upon normal / good / critical hits as an additional <i>effect</i> to the weapon used.</font><br>
<font size="-1"><sup>(a)</sup> the penalty or bonus are active when the item is used with one of the above mentioned skills.</font><br>

<h3>Attribute bonus</h3>
<table class="content_table">
<tbody><tr class="header">
<th align="center">Attribute</th>
<th align="center">Modifier</th>
</tr>
<tr class="row0">
<td class="content_table">Strength</td>
<td class="content_table" align="center" nowrap=""><span class="gem_bonus">+2</span> <font size="-1"><sup>(a)</sup></font></td>
</tr>
<tr class="row1">
<td class="content_table">Intelligence</td>
<td class="content_table" align="center" nowrap=""><span class="gem_malus">-1</span></td>
</tr>
<tr class="row0">
<td class="content_table">Dexterity</td>
<td class="content_table" align="center" nowrap=""><span class="gem_bonus">+2</span></td>
</tr>
<tr class="row1">
<td class="content_table">Initiative</td>
<td class="content_table" align="center" nowrap=""><span class="gem_malus">-20%</span></td>
</tr>
<tr class="row0">
<td class="content_table">actions per round</td>
<td class="content_table" align="center" nowrap=""><span class="gem_bonus">+1</span></td>
</tr>
<tr class="row1">
<td class="content_table">Mana points</td>
<td class="content_table" align="center" nowrap=""><span class="gem_bonus">+5%</span></td>
</tr>
</tbody></table>
<font size="-1"><sup>(a)</sup> the penalty or bonus are active when the item is used with one of the above mentioned skills.</font><br>

<h3>Bonus for the <i>level</i> of the skill</h3>
  <table class="content_table">
<tbody><tr class="header">
<th align="center">Skill</th>
<th align="center">Modifier</th>
</tr>
<tr class="row0">
<td class="content_table"><a href="/wod/spiel/hero/skill.php?name=Double+Strike&amp">Double Strike</a></td>
<td class="content_table" align="center" nowrap=""><span class="gem_bonus">+2</span></td>
</tr>
</tbody></table>

<h3>Bonus for the <i>effect</i> of the skill</h3>
  <p>Increase the bonus on the <b>effect</b>, <u>not</u> the <b>level</b> of the skill. The bonuses will be added to the amount of <b>damage</b> (when using that type of attack)or the amount of <b>healing</b> (when healing).</p>        <table class="content_table">
<tbody><tr class="header">
<th align="center">Skill</th>
<th align="center">Modifier</th>
</tr>
<tr class="row0">
<td class="content_table"><a href="/wod/spiel/hero/skill.php?name=Double+Strike&amp;">Double Strike</a></td>

<td class="content_table" align="center" nowrap=""><span class="gem_bonus">+13% of your hero\`s level</span> <font size="-1"><sup>(a)</sup></font></td>
</tr>
<tr class="row1">
<td class="content_table"><a href="/wod/spiel/hero/skill.php?name=Roundhouse&amp;">Roundhouse</a></td>

<td class="content_table" align="center" nowrap=""><span class="gem_bonus">+13% of your hero\`s level</span> <font size="-1"><sup>(a)</sup></font></td>
</tr>
</tbody></table>
<font size="-1"><sup>(a)</sup> the penalty or bonus are active when the item is used with one of the above mentioned skills.</font><br>

<h3>Attack bonus</h3>
<table class="content_table">
<tbody><tr class="header">
<th align="center">Attack Type</th>
<th align="center">Modifier</th>
</tr>
<tr class="row0">
<td class="content_table">melee</td>
<td class="content_table" align="center" nowrap=""><span class="gem_bonus">+25% of your hero\`s level</span> <font size="-1"><sup>(a)</sup></font></td>
</tr>
<tr class="row1">
<td class="content_table">social</td>
<td class="content_table" align="center" nowrap=""><span class="gem_bonus">+34% of your hero\`s level</span></td>
</tr>
</tbody></table>
<font size="-1"><sup>(a)</sup> the penalty or bonus are active when the item is used with one of the above mentioned skills.</font><br>

<h3>Defense bonus</h3>
<table class="content_table">
<tbody><tr class="header">
<th align="center">Attack Type</th>
<th align="center">Modifier</th>
</tr>
<tr class="row0">
<td class="content_table">melee</td>
<td class="content_table" align="center" nowrap=""><span class="gem_malus">-10%</span></td>
</tr>
<tr class="row1">
<td class="content_table">ranged</td>
<td class="content_table" align="center" nowrap=""><span class="gem_malus">-10%</span></td>
</tr>
<tr class="row0">
<td class="content_table">spell</td>
<td class="content_table" align="center" nowrap=""><span class="gem_malus">-25%</span></td>
</tr>
<tr class="row1">
<td class="content_table">spring trap</td>
<td class="content_table" align="center" nowrap=""><span class="gem_malus">-25%</span></td>
</tr>
<tr class="row0">
<td class="content_table">ambush</td>
<td class="content_table" align="center" nowrap=""><span class="gem_malus">-25%</span></td>
</tr>
</tbody></table>








<h2>Effect on those <u>affected by</u> this item</h2>
<p>These bonuses and malus only work when the item is used with one of the above mentioned skills.</p>













<h3>Defense bonus</h3>
<table class="content_table">
<tbody><tr class="header">
<th align="center">Attack Type</th>
<th align="center">Modifier</th>
<th align="center">Duration</th>
<th align="center">Comment</th>
</tr>
<tr class="row0">
<td class="content_table">social</td>
<td class="content_table" align="center" nowrap=""><span class="gem_bonus">-34% of your skill rank</span></td>
<td class="content_table">

2 rounds    </td>
<td class="content_table">
&nbsp;
</td>
</tr>
<tr class="row1">
<td class="content_table">social</td>
<td class="content_table" align="center" nowrap=""><span class="gem_bonus">-34% of your skill rank</span></td>
<td class="content_table">

until the end of the round
</td>
<td class="content_table">
&nbsp;
</td>
</tr>
<tr class="row0">
<td class="content_table">social</td>
<td class="content_table" align="center" nowrap=""><span class="gem_bonus">-34% of your skill rank</span></td>
<td class="content_table">

one round
</td>
<td class="content_table">
&nbsp;
</td>
</tr>
</tbody></table>









<p><input type="submit" name="back" value="Close" class="button clickable" onclick="window.close();;return false;"></p>

</div></body>`);
    expect(modifiers).toMatchObject({
      owner: [
        {
          group: "damageBonus",
          damageType: "psychological damage",
          attackType: "melee (a)",
          damageBonus: "0 / +2 / +4",
        },
        {
          group: "attributeBonus",
          attribute: "Strength",
          modifier: "+2 (a)",
        },
        {
          group: "attributeBonus",
          attribute: "Intelligence",
          modifier: "-1",
        },
        { group: "attributeBonus", attribute: "Dexterity", modifier: "+2" },
        {
          group: "attributeBonus",
          attribute: "Initiative",
          modifier: "-20%",
        },
        {
          group: "attributeBonus",
          attribute: "actions per round",
          modifier: "+1",
        },
        {
          group: "attributeBonus",
          attribute: "Mana points",
          modifier: "+5%",
        },
        {
          group: "bonusForTheLevelOfTheSkill",
          skill: "Double Strike",
          modifier: "+2",
        },
        {
          group: "bonusForTheEffectOfTheSkill",
          skill: "Double Strike",
          modifier: "+13% of your hero`s level (a)",
        },
        {
          group: "bonusForTheEffectOfTheSkill",
          skill: "Roundhouse",
          modifier: "+13% of your hero`s level (a)",
        },
        {
          group: "attackBonus",
          attackType: "melee",
          modifier: "+25% of your hero`s level (a)",
        },
        {
          group: "attackBonus",
          attackType: "social",
          modifier: "+34% of your hero`s level",
        },
        { group: "defenseBonus", attackType: "melee", modifier: "-10%" },
        { group: "defenseBonus", attackType: "ranged", modifier: "-10%" },
        { group: "defenseBonus", attackType: "spell", modifier: "-25%" },
        {
          group: "defenseBonus",
          attackType: "spring trap",
          modifier: "-25%",
        },
        { group: "defenseBonus", attackType: "ambush", modifier: "-25%" },
      ],
      affected: [
        {
          group: "defenseBonus",
          attackType: "social",
          modifier: "-34% of your skill rank",
          duration: "2 rounds",
        },
        {
          group: "defenseBonus",
          attackType: "social",
          modifier: "-34% of your skill rank",
          duration: "until the end of the round",
        },
        {
          group: "defenseBonus",
          attackType: "social",
          modifier: "-34% of your skill rank",
          duration: "one round",
        },
      ],
    });
  });
});
