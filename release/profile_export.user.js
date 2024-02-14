// ==UserScript==
// @name           Profile Export
// @description    Script allows to export hero profile information to BBCode
// @version        1.0.12
// @downloadURL    https://raw.github.com/slicklash/wod-scripts/master/release/profile_export.user.js
// @author         Never
// @include        http*://*.world-of-dungeons.net/wod/spiel/hero/skills.php*
// @grant          GM.xmlHttpRequest
// @grant          GM_xmlhttpRequest
// ==/UserScript==

(function() {
'use strict';
function add(tag, parent, innerHTML) {
    const elem = typeof tag === "string" ? document.createElement(tag) : tag;
    parent && parent.nodeType && parent.appendChild(elem);
    innerHTML && (elem.innerHTML = innerHTML);
    return elem;
}
function attr(elem, nameOrMap, value, remove) {
    if (remove) { elem.removeAttribute(nameOrMap); }
    else if (typeof nameOrMap === "object") { Object.keys(nameOrMap).forEach((key) => { elem.setAttribute(key, nameOrMap[key]); }); }
    else if (value) { elem.setAttribute(nameOrMap, value); }
    else { return elem.getAttribute(nameOrMap); }
    return elem;
}
function textContent(elem, value) {
    if (!elem) return "";
    return typeof value === "undefined" ? elem.textContent : (elem.textContent = value);
}
function parseEffectiveValue(str) {
    const b = str.replace(/[a-z:,\s\n]+/gi, "").match(/([0-9]+)(\[([0-9-]+)\])?/);
    if (b === null) return [0, 0];
    return b[3] ? [Number(b[1]), Number(b[3])] : [Number(b[1]), Number(b[1])];
}
const SEC_COSTS = "0,40,120,400,960,1880,3320,5360,8120,11720,16240,21840,28600,36680,46160,57160,69840,84280,100640,119000,139520,162280,187440,215120,245480,278600,314600,353640,395840,441320,490200,542640,598760,658680,722520,79440,862560,939000,1019920,1105440,195680".split(",");
const EXC_COSTS = "0,50,150,500,1300,2700,4850,7950,12200,17800,24950,33850,44700,57750,73200,91250,112150,136100,163350,194150,228750,267350,320200,357550,409650,466750,529100,596950,670550,750150,836050,928450,1027650,1133900,1247450,1368600,1497600,1634700,1780200,1934400,2097500".split(",");
const TAL_COSTS = "0,1440,3240,5440,8080,11200,14840,19040,23840,29280,35400,42240,49840,58240,67480,77600,88640,100640,113640,127680,142800,159040,176440,195040,214880,236000,258440,282240,307440,334080,362200,391840,423040,455840,490280,526400,564240,603840,645240,688480,733600".split(",");
class HeroSkill {
    constructor() {
        this.name = "";
        this.type = "";
        this.rank = 0;
        this.effective_rank = 0;
        this.primary = false;
        this.secondary = false;
        this.exceptional = false;
        this.talent = false;
        this.in_round = true;
        this.pre_round = false;
        this.target = "";
        this.max_affected = "";
        this.one_pos = false;
        this.mp_base = 0;
        this.mp_cost = 0;
        this.item = "";
        this.skill_class = "";
        this.initiative_attr = "";
        this.attack_type = "";
        this.attack_attr = "";
        this.defence_attr = "";
        this.effect_attr = "";
        this.training_cost_ep = "";
        this.training_cost_gold = "";
        this.url = "";
        this.color = "";
        this.hero = null;
        this.onDone = null;
    }
    roll() {
        const res = { attack: "", defence: "", effect: "" };
        return res;
    }
    fetchInfo(data) {
        try {
            const skill_info = add("div");
            skill_info.innerHTML = data;
            const table_rows = Array.from(skill_info
                .querySelector("form")
                .querySelectorAll(".content_table table tr"));
            for (let i = 0, cnt = table_rows.length; i < cnt; i++) {
                const property = textContent(table_rows[i].cells[0]).trim(), value = textContent(table_rows[i].cells[1])
                    .replace(/(\s|&nbsp;)/g, " ")
                    .trim();
                switch (property) {
                    case "type":
                        this.type = value;
                        break;
                    case "may be used":
                        this.in_round = value.indexOf("in round") > -1;
                        this.pre_round = value.indexOf("in pre round") > -1;
                        break;
                    case "target":
                        this.target = value;
                        this.one_pos = value.indexOf("one position") > -1;
                        break;
                    case "Max. characters affected":
                    case "Max. opponents affected":
                        this.max_affected = value;
                        break;
                    case "Mana points cost":
                        if (value !== "-") {
                            const mp = value.match(/([0-9])+ \(([0-9]+)\)/);
                            this.mp_base = Number(mp[2]);
                            this.mp_cost = Math.floor(this.mp_base * (0.8 + 0.1 * this.effective_rank));
                        }
                        break;
                    case "item":
                        this.item = value;
                        break;
                    case "skill class":
                        this.skill_class = value;
                        break;
                    case "attack type":
                        this.attack_type = value;
                        break;
                    case "attack":
                        this.attack_attr = value;
                        break;
                    case "damage":
                        this.effect_attr = value;
                        break;
                    case "initiative":
                        this.initiative_attr = value;
                        break;
                    case "defense":
                        this.defence_attr = value;
                        break;
                    case "healing":
                        this.effect_attr = value;
                        break;
                    default:
                        break;
                }
            }
            if (this.max_affected.includes("% of your hero`s level")) {
                const tmp = this.max_affected
                    .replace("% of your hero`s level", "*" + this.hero.level + "/100")
                    .replace(" ", "");
                this.max_affected = Math.floor(eval(tmp)).toString();
            }
            else if (this.max_affected.includes("% of your skill rank")) {
                const tmp = this.max_affected
                    .replace("% of your skill rank", "*" + this.effective_rank + "/100")
                    .replace(" ", "");
                this.max_affected = Math.floor(eval(tmp)).toString();
            }
            switch (this.type) {
                case "attack":
                case "degradation":
                    if (this.target.indexOf("one enemy") > -1)
                        this.max_affected = "1";
                    break;
                case "improvement":
                case "healing":
                    if (this.target.indexOf("one team") > -1)
                        this.max_affected = "1";
                    break;
                default:
                    break;
            }
        }
        catch (ex) {
            console.error(ex);
        }
        if (typeof this.onDone === "function")
            this.onDone(this);
    }
    parse(row_html) {
        try {
            const link = row_html.cells[1].querySelector("a"), rank_row = row_html.cells[2].querySelector("tr"), rank = rank_row
                ? parseEffectiveValue(textContent(rank_row.cells[1]))
                : [0, 0], title = unescape(link.href).match(/name=([a-z\- :()'!+]+)/i);
            if (title !== null && rank[0] !== 0) {
                this.name = title[1].replace(/\+/g, " ");
                this.talent = this.name.indexOf("Talent:") > -1;
                this.rank = rank[0];
                this.effective_rank = rank[1];
                this.url = link.href;
                if (!this.talent) {
                    switch (attr(link, "class")) {
                        case "skill_primary":
                            this.primary = true;
                            break;
                        case "skill_secondary":
                            this.secondary = true;
                            this.color = "lightslategray";
                            break;
                        case "skill_foreign":
                            this.exceptional = true;
                            this.color = "#858585";
                            break;
                        default:
                            break;
                    }
                }
                this.calculateCost();
            }
        }
        catch (error) {
            console.error(error);
        }
        return this;
    }
    calculateCost() {
        let cost = 0;
        if (this.primary) {
            for (let i = this.rank; i > 1; i--)
                cost += (Math.pow(i, 2) - i) * 20;
            if (cost === 0)
                cost = 40;
        }
        else if (this.secondary) {
            cost = SEC_COSTS[this.rank] ? Number(SEC_COSTS[this.rank]) : 0;
        }
        else if (this.exceptional) {
            cost = EXC_COSTS[this.rank] ? Number(EXC_COSTS[this.rank]) : 0;
        }
        else if (this.talent) {
            cost = TAL_COSTS[this.rank] ? Number(TAL_COSTS[this.rank]) : 0;
        }
        this.training_cost_ep = ("" + cost).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ");
        this.training_cost_gold = ("" + cost * 0.9).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ");
        return this;
    }
}
function httpFetch(url, method = "GET", data) {
    return new Promise((resolve, reject) => {
        const request = {
            method,
            url,
            headers: { Cookie: document.cookie },
            onload: (resp) => {
                if (resp.readyState !== 4)
                    return;
                if (resp.status >= 200 && resp.status < 300) {
                    resolve({ data: resp.responseText });
                }
                else {
                    reject({ data: resp.responseText });
                }
            },
        };
        if (typeof data === "object") {
            request.data = JSON.stringify(data);
            request.headers = { "Content-Type": "application/json" };
        }
        if (typeof GM === "object") {
            GM.xmlHttpRequest(request);
        }
        else {
            GM_xmlhttpRequest(request);
        }
    });
}
const table = (props, rows) => `[table ${props}]${rows.join("")}[/table]`;
const row = (props, cells) => `[tr ${props}]${cells.join("")}[/tr]`;
const td = (props = "", content = "") => `[td ${props}]${content}[/td]`;
const title = (hero) => `[size=12][hero:${hero.name}]${hero.title && ", [i]" + hero.title + "[/i]"} - [class:${hero.race}] [class:${hero.char_class}] - Level ${hero.level}[/size]`;
const bbcode_attr = (a) => {
    const efval = a.effective_value !== a.value ? " [" + a.effective_value + "]" : "";
    return `[tr][td][size=12]${a.name}[/size][/td][td align=center][size=12]${a.value}[url=" "]${efval}[/url][/size][/td][td align=right][size=12]${a.training_cost}[/size][/td][/tr]`;
};
const characteristics = (hero) => `[h1]Characteristics[/h1][table][tr][td][table border=1]
[tr][th]Attribute[/th][th]Value[/th][th]Spent :ep:[/th][/tr]
${Object.values(hero.attributes).slice(0, 8).map(bbcode_attr).join("")}
[/table][/td]
[td][/td][td][/td]
[td valign=top][table border=1][tr][td][color=mediumseagreen][size=12]HP[/color][/td][td][size=12]${hero.attributes.hp.value} [url=" "][${hero.attributes.hp.effective_value}][/url][/size][/td]
[td][color=mediumseagreen][size=12]HHP[/color][/td][td][size=12]${hero.attributes.hhp.value} [url=" "][${hero.attributes.hhp.effective_value}][/url][/size][/td]
[/tr]
[tr][td][color=dodgerblue][size=12]MP[/color][/td][td][size=12]${hero.attributes.mp.value} [url=" "][${hero.attributes.mp.effective_value}][/url][/size][/td]
[td][color=dodgerblue][size=12]RMP[/color][/td][td][size=12]${hero.attributes.hhp.value} [url=" "][${hero.attributes.rmp.effective_value}][/url][/size][/td]
[/tr]
[tr][td colspan=2][size=12]Actions[/size][/td][td colspan=2][size=12]${hero.attributes.act.value} [url=" "][${hero.attributes.act.effective_value}][/url][/size][/td][/tr]
[tr][td colspan=2][size=12]Initiative[/size][/td][td colspan=2][size=12]${hero.attributes.ini.value} [url=" "][${hero.attributes.ini.effective_value}][/url][/size][/td][/tr]
[tr][td colspan=2][size=12]Reset points[/size][/td][td colspan=2][size=12]${hero.reset_points}[/size][/td][/tr]
[tr][td colspan=2][size=12]Gender[/size][/td][td colspan=2][size=12]${hero.gender}[/size][/td][/tr]
[tr][td colspan=2][size=12]Fame[/size][/td][td colspan=2][size=12]${hero.fame} :fame:[/size][/td][/tr]
[/table][/td][/tr][/table]`;
const bbcode_arm = (hero) => Object.entries(hero.armor)
    .map(([dmg_type, arm]) => Object.entries(arm)
    .filter(([, val]) => val[0] > 0 || val[1] > 0 || val[2] > 0)
    .map(([atk_type, val]) => `[tr][td][size=12]${dmg_type}[/size][/td][td align=center][size=12]${atk_type}[/size][/td]
[td align=center][size=12]${val[0] > 0 ? "[color=mediumseagreen]+" + val[0] + "[/color]" : "0"} / ${val[1] > 0 ? "[color=mediumseagreen]+" + val[1] + "[/color]" : "0"} / ${val[2] > 0 ? "[color=mediumseagreen]+" + val[2] + "[/color]" : "0"} [/size][/td][/tr]`)
    .join(""))
    .join("");
const armor = (hero) => `[table][tr][td valign=top][h1]Armor[/h1][table border=1]
[tr][th][size=12]Damage type[/size][/th][th][size=12]Attack type[/size][/th][th][size=12]Armor (r)[/size][/th][/tr]${bbcode_arm(hero)}[/table]`;
const parries = (hero) => {
    const hattr = hero.attributes;
    return `[h1]Standard Parries[/h1][table border=1][tr][th]Attack type[/th][th]Attributes[/th][th]Defence[/th][/tr]
[tr][td]Melee[/td][td align=center]ag,dx[/td][td align=center]${hattr.ag.effective_value * 2 + hattr.dx.effective_value}[/td][/tr]
[tr][td]Ranged[/td][td align=center]ag,pe[/td][td align=center]${hattr.ag.effective_value * 2 + hattr.pe.effective_value}[/td][/tr]
[tr][td]Spell[/td][td align=center]wi,in[/td][td align=center]${hattr.wi.effective_value * 2 + hattr["in"].effective_value}[/td][/tr]
[tr][td]Social[/td][td align=center]wi,ch[/td][td align=center]${hattr.wi.effective_value * 2 + hattr.ch.effective_value}[/td][/tr]
[tr][td]Ambush[/td][td align=center]pe,in[/td][td align=center]${hattr.pe.effective_value * 2 + hattr["in"].effective_value}[/td][/tr]
[tr][td]Force of Nature[/td][td align=center]wi,ag[/td][td align=center]${hattr.wi.effective_value * 2 + hattr.ag.effective_value}[/td][/tr]
[tr][td]Activate trap[/td][td align=center]pe,ag[/td][td align=center]${hattr.pe.effective_value * 2 + hattr.ag.effective_value}[/td][/tr]
[tr][td]Explosion or Blast[/td][td align=center]ag,pe[/td][td align=center]${hattr.ag.effective_value * 2 + hattr.pe.effective_value}[/td][/tr]
[tr][td]Disease[/td][td align=center]co,ch[/td][td align=center]${hattr.co.effective_value * 2 + hattr.ch.effective_value}[/td][/tr]
[tr][td]Curse[/td][td align=center]ch,wi[/td][td align=center]${hattr.ch.effective_value * 2 + hattr.wi.effective_value}[/td][/tr]
[/table]  [size=10]used when no skill is available or set[/size][/td][/tr][/table]`;
};
const initiative = (hero) => `[h1]Initiative[/h1][table border=1]
[tr][th]Skill[/th][th]Attributes[/th][th]Initiative[/th][/tr]
[tr][td]Standard (no skill)[/td][td align=center]ag,pe[/td][td align=center]${hero.attributes.ag.effective_value * 2 + hero.attributes.pe.effective_value + hero.attributes.ini.effective_value}[/td][/tr]
${hero.skills
    .filter((x) => x.type === "initiative")
    .map((skill) => {
    const m = skill.initiative_attr.match(/[a-z]{2}/gi), attr1 = hero.attributes[m[0]], attr2 = hero.attributes[m[1]];
    return ('[tr][td][skill:"' + skill.name + '"' + (skill.color ? " color=" + skill.color : "") + " size=12][/td][td align=center]" +
        skill.initiative_attr +
        "[/td][td align=center]" + (attr1.effective_value * 2 + attr2.effective_value + skill.effective_rank * 2 + hero.attributes.ini.effective_value) + "[/td][/tr]");
})
    .join("")}[/table]`;
const skills = (hero) => {
    return ("[h1]Skills[/h1][table border=1][tr][th align=left]Name[/th][th]Level[/th][th]MP Cost[/th][th]Targets[/th][th colspan=2]Spent :gold: / :ep:[/th][/tr]" +
        hero.skills
            .map((skill) => {
            const erank = skill.effective_rank !== skill.rank ? "[" + skill.effective_rank + "]" : "";
            const pos_mark = skill.max_affected && skill.one_pos ? "&sup1;" : "";
            const mp = skill.mp_cost != 0 ? skill.mp_cost : "";
            const color_affect = skill.type.match(/attack|degradation/) ? "tomato" : "mediumseagreen";
            return `[tr][td][skill:"${skill.name}" ${skill.color ? "color=" + skill.color : ""} size=12][/td]
[td align=center][size=12]${skill.rank} [url=" "]${erank}[/url][/size][/td]
[td align=center][size=12][color=dodgerblue]${mp}[/color][/size][/td]
[td align=center][size=12][color=${color_affect}]${skill.max_affected}${pos_mark}[/color][/size][/td]
[td align=right]${skill.training_cost_gold}[/td]
[td align=right]${skill.training_cost_ep}[/td][/tr]`;
        })
            .join("") +
        "[/table]  [size=10]1 - in one position[/size]");
};
const gear = (hero) => {
    if (!hero.gear)
        return "";
    const items = [...Object.entries(hero.gear)];
    return ("[h1]Equipment[/h1][table][tr][td valign=top][table border=1][tr][th align=left]Slot[/th][th]Item[/th][/tr]" +
        items
            .filter((x) => !x[0].includes("pocket"))
            .map(([key, item]) => {
            const slot = key[0].toUpperCase() + key.substring(1);
            return `[tr][td]${slot}[/td][td]${item ? "[item:" + item + "]" : ""}[/td][/tr]`;
        })
            .join("") +
        "[/table][/td][td valign=top][table border=1][tr][th align=left]Pocket items[/th][/tr]" +
        items
            .filter((x) => x[0].includes("pocket") && x[1])
            .map(([, item]) => `[tr][td]${item ? "[item:" + item + "]" : ""}[/td][/tr]`)
            .join("") +
        "[/table][/table]");
};
function toBBCode(hero) {
    return [
        title,
        characteristics,
        (h) => table("", [row("", [td("", armor(h)), td(), td(), td("", parries(h))])]),
        initiative,
        skills,
        gear,
    ]
        .map((f) => f(hero).trim())
        .join("");
}
const RE_ATTR = /^(Strength|Constitution|Intelligence|Dexterity|Charisma|Agility|Perception|Willpower)/;
const RE_RACE = /(Borderlander|Dinturan|Gnome|Halfling|Kargashian|Kerasi|Mag Mor|Targeshian|Partan|Tirem Ag|Woodlander) \(/;
const RE_CLASS = /(Adventurer|Alchemist|Apprentice|Archer|Barbarian|Bard|Cloud Raider|Cloudraider|Conjuror|Draclin|Drifter|Engineer|Fighter|Gladiator|Hunter|Juggler|Knight|Lightbringer|Mage|Muse|Nieri|Paladin|Priest|Scholar|Shadow Seeker|Shaman|Star Kinder|Warlock|Warlord|Zealot) \(/;
const ATTR_COSTS = "0,0,100,500,1300,2800,5100,8500,13200,19400,27400,37400,49700,64500,82100,102800,126800,154400,185900,221600,261800,306800,356800,412200,473300,540400,613800,693800,780800,875000,976800".split(",");
class HeroAttribute {
    constructor(name) {
        this.name = name;
        this.value = 0;
        this.effective_value = 0;
        this.training_cost = 0;
    }
    static getCost(value) {
        return ATTR_COSTS[value] ? ("" + Number(ATTR_COSTS[value])).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ") : 0;
    }
}
class Hero {
    constructor() {
        this.name = "";
        this.level = 1;
        this.race = "";
        this.char_class = "";
        this.subclass = "";
        this.actions = 1;
        this.initiative = "";
        this.reset_points = 0;
        this.fame = 0;
        this.gender = "M";
        this.title = "";
        this.skills = [];
        this.hasUpperCoins = false;
        this.attributes = {
            st: new HeroAttribute("Strength"),
            co: new HeroAttribute("Constitution"),
            in: new HeroAttribute("Intelligence"),
            dx: new HeroAttribute("Dexterity"),
            ch: new HeroAttribute("Charisma"),
            ag: new HeroAttribute("Agility"),
            pe: new HeroAttribute("Perception"),
            wi: new HeroAttribute("Willpower"),
            hp: new HeroAttribute("HP"),
            hhp: new HeroAttribute("HHP"),
            mp: new HeroAttribute("MP"),
            rmp: new HeroAttribute("RMP"),
            ini: new HeroAttribute("Initiative"),
            act: new HeroAttribute("Actions"),
        };
        this.armor = {};
        this.gear = {};
        this.modifiers = {};
        this.bonus_damage = {};
        this.bonus_attack = {};
        this.bonus_defence = {};
    }
    generateBBCode() {
        this.skills.sort((a, b) => {
            let cmp = b.effective_rank - a.effective_rank;
            if (cmp === 0)
                cmp = b.rank - a.rank;
            if (cmp === 0)
                cmp = Number(b.training_cost_ep.replaceAll(" ", "")) - Number(a.training_cost_ep.replaceAll(" ", ""));
            if (cmp === 0)
                cmp = a.name.localeCompare(b.name);
            return cmp;
        });
        return toBBCode(this);
    }
    parse(attrPageHtml, withItems = false) {
        try {
            const page = add("div", null, attrPageHtml);
            const form = page.querySelector('form[name="the_form"]');
            const tables = [...page.querySelectorAll('[name="the_form"] > table')];
            const title = form.querySelector("h1");
            const content_rows = [...form.querySelectorAll(".row0, .row1")];
            this.name = textContent(title).replace("- Attributes and Characteristics", "").trim();
            for (let i = 0, cnt = content_rows.length; i < cnt; i++) {
                const row = content_rows[i], cell1 = row.cells[0], property = textContent(cell1).trim();
                if (property.match(RE_ATTR)) {
                    const race = cell1.innerHTML.match(RE_RACE), ch_class = cell1.innerHTML.match(RE_CLASS);
                    if (race)
                        this.race = race[1];
                    if (ch_class)
                        this.char_class = ch_class[1];
                    const val = row.cells[1].querySelector("tr");
                    if (val.cells) {
                        const attr_name = property.toLowerCase().substring(0, 2).replace("de", "dx");
                        const attr = this.attributes[attr_name];
                        const efval = parseEffectiveValue(textContent(val.cells[1]));
                        attr.value = efval[0];
                        attr.effective_value = efval[1];
                        attr.training_cost = HeroAttribute.getCost(attr.value);
                    }
                }
                else {
                    switch (property.toLowerCase()) {
                        case "hero's level": {
                            this.level = Number(textContent(row.cells[1]));
                            break;
                        }
                        case "fame": {
                            this.fame = Number(textContent(row.cells[1]));
                            break;
                        }
                        case "hit points": {
                            const hp = parseEffectiveValue(textContent(row.cells[1])), hhp = parseEffectiveValue(textContent(row.cells[2])), hpa = this.attributes["hp"], hhpa = this.attributes["hhp"];
                            hpa.value = hp[0];
                            hpa.effective_value = hp[1];
                            hhpa.value = hhp[0];
                            hhpa.effective_value = hhp[1];
                            break;
                        }
                        case "mana points": {
                            const mp = parseEffectiveValue(textContent(row.cells[1])), rmp = parseEffectiveValue(textContent(row.cells[2])), mpa = this.attributes["mp"], rmpa = this.attributes["rmp"];
                            mpa.value = mp[0];
                            mpa.effective_value = mp[1];
                            rmpa.value = rmp[0];
                            rmpa.effective_value = rmp[1];
                            break;
                        }
                        case "actions per round": {
                            const act = parseEffectiveValue(textContent(row.cells[1])), acta = this.attributes["act"];
                            acta.value = act[0];
                            acta.effective_value = act[1];
                            break;
                        }
                        case "reset points": {
                            this.reset_points = Number(textContent(row.cells[1]));
                            break;
                        }
                        case "title": {
                            this.title = textContent(row.cells[1])
                                .replace("Choose title", "")
                                .trim();
                            break;
                        }
                        case "initiative": {
                            const ini = parseEffectiveValue(textContent(row.cells[1])), inia = this.attributes["ini"];
                            inia.value = ini[0];
                            inia.effective_value = ini[1];
                            break;
                        }
                        case "gender": {
                            this.gender = textContent(row.cells[1]).trim().toUpperCase()[0];
                            break;
                        }
                        default:
                            break;
                    }
                }
            }
            this.parseTables(tables);
            if (withItems) {
                return this.fetchGear();
            }
            delete this.gear;
            return Promise.resolve();
        }
        catch (ex) {
            console.error(ex);
        }
    }
    parseTables(tables) {
        const names = ["armor", "damage", "attack bonuses", "defence bonuses"];
        const tbl = tables.reduce((acc, t) => {
            var _a;
            for (const cell of [0, 2, 4]) {
                const name = (_a = t.rows[0].cells[cell]) === null || _a === void 0 ? void 0 : _a.textContent;
                if (names.includes(name)) {
                    acc[name] = [
                        ...t.rows[1].cells[cell].querySelectorAll(".row0, .row1"),
                    ].map((x) => [...x.cells].map((x) => x.textContent.replace("(z)", "").trim()));
                }
            }
            return acc;
        }, {});
        this.parseArmor(tbl.armor);
        this.parseDamageBonus(tbl.damage);
        this.parseAttackBonus(tbl["attack bonuses"]);
        this.parseDefenceBonus(tbl["defence bonuses"]);
    }
    parseArmor(rows) {
        if (!rows)
            return;
        for (const row of rows) {
            let [property, attack_type, value] = row;
            attack_type = attack_type.replace("(z)", "").trim();
            const values = value.replace(/(\s|&nbsp;)/g, "").trim().split("/").map(Number);
            if (!this.armor[property])
                this.armor[property] = {};
            this.armor[property][attack_type] = values;
        }
    }
    parseDamageBonus(rows) {
        if (!rows)
            return;
        for (const row of rows) {
            let [property, attack_type, value] = row;
            attack_type = attack_type.replace("(z)", "").trim();
            value = value.replace(/(\s|&nbsp;)/g, "").trim();
            if (!this.bonus_damage[property])
                this.bonus_damage[property] = {};
            this.bonus_damage[property][attack_type] = value;
        }
    }
    parseAttackBonus(rows) {
        if (!rows)
            return;
        for (const row of rows) {
            let [attack_type, value] = row;
            attack_type = attack_type.replace("(z)", "").trim();
            value = value.replace(/(\s|&nbsp;)/g, "").trim();
            this.bonus_attack[attack_type] = value;
        }
    }
    parseDefenceBonus(rows) {
        if (!rows)
            return;
        for (const row of rows) {
            let [attack_type, value] = row;
            attack_type = attack_type.replace("(z)", "").trim();
            this.bonus_defence[attack_type] = value.trim();
        }
    }
    fetchGear() {
        let eq_url = location.href
            .replace("skills.php", "items.php")
            .replace("menukey=hero_skills", "menukey=hero_gear");
        if (eq_url.indexOf("view=gear") < 0)
            eq_url += "&view=gear";
        return httpFetch(eq_url).then((resp) => {
            const gear_html = add("div"), gear = {};
            const gearHtml = (resp && resp.data) || "";
            if (/\d+ items were found in the dungeon. You may carry up to/.test(gearHtml)) {
                alert("You have too much items in your backpack, your current gear won't be shown.");
            }
            gear_html.innerHTML = gearHtml;
            const items = Array.from(gear_html.querySelectorAll('div[id="main_content"] form td[class="texttoken"]')), re_uses = /\(([0-9]+)\/[0-9]+\)/, re_upper_coin = /(Six of coins|Seven of coins|Eight of coins|Nine of coins|Ten of coins)/;
            let upperCoins = 0;
            if (items) {
                for (let i = 0, cnt = items.length; i < cnt; i++) {
                    const slot = items[i], row = slot.parentNode, ctrl = row.querySelector("select"), itm = ctrl
                        ? ctrl.options[ctrl.selectedIndex].text.replace(/!$/, "")
                        : "";
                    if (re_upper_coin.test(itm)) {
                        upperCoins += 1;
                    }
                    gear[slot.innerHTML] = !re_uses.test(itm) ? itm : "";
                }
                if (upperCoins === 5) {
                    this.hasUpperCoins = true;
                }
            }
            this.gear = gear;
        });
    }
    addUpperCoinsArmor() {
        if (!this.hasUpperCoins)
            return;
        const damage_types = ["crushing damage", "cutting damage", "piercing damage"];
        for (let i = 0; i < damage_types.length; i++) {
            const dmg_type = damage_types[i];
            if (!this.armor[dmg_type])
                this.armor[dmg_type] = {};
            if (!this.armor[dmg_type].all)
                this.armor[dmg_type].all = [0, 0, 0];
            const value = this.armor[dmg_type].all;
            this.armor[dmg_type].all = [value[0] + 6, value[1] + 4, value[2] + 2];
        }
    }
}
function cssClass(elem, name, toggleOn) {
    const classNames = elem.className.split(" ");
    const has = classNames.some((x) => x === name);
    if (typeof toggleOn !== "boolean")
        return has;
    if (has && toggleOn)
        return elem;
    elem.className = toggleOn
        ? elem.className + " " + name
        : classNames.filter((x) => x !== name).join(" ");
    return elem;
}
const frmSkills = document.querySelector("#main_content form");
let btnExport, chkboxGear, imgLoader;
const exportProfile = function () {
    attr(btnExport, "disabled", "true");
    cssClass(btnExport, "button clickable", false);
    cssClass(btnExport, "button_disabled", true);
    attr(imgLoader, "style", null, true);
    httpFetch(location.href.replace("skills.php", "attributes.php")).then((resp) => {
        const skillRows = Array.from(frmSkills.querySelectorAll(".row0")).concat(Array.from(frmSkills.querySelectorAll(".row1")));
        let pendingCount = 0;
        const hero = new Hero();
        hero.parse((resp && resp.data) || "", chkboxGear.checked);
        const onSkillParseComplete = function () {
            pendingCount--;
            if (pendingCount <= 0) {
                hero.addUpperCoinsArmor();
                const h1 = frmSkills.querySelector("h1");
                const d = new Date();
                const stamp = [d.getDate(), d.getMonth() + 1, d.getFullYear() % 100].map((x) => ("" + x).padStart(2, "0")).join(".");
                const bbcode = `${hero.generateBBCode().trim()}\n[size=9]\nGenerated: ${stamp} - [url=https://raw.github.com/slicklash/wod-scripts/master/release/profile_export.user.js]Profile Export[/url] 1.0.12[/size]`;
                const txtExport = h1.querySelector("#profile-export-result") || add("textarea", h1.parentNode);
                attr(txtExport, { rows: "4", cols: "50", id: "profile-export-result" });
                txtExport.innerHTML = bbcode;
                attr(imgLoader, "style", "display: none");
            }
        };
        for (let i = 0; i < skillRows.length; i++) {
            const skill = new HeroSkill().parse(skillRows[i]);
            if (skill.rank > 0) {
                pendingCount++;
                httpFetch(skill.url).then((resp) => {
                    const skillHtml = (resp && resp.data) || "";
                    skill.hero = hero;
                    skill.onDone = onSkillParseComplete;
                    skill.fetchInfo.call(skill, skillHtml);
                });
                hero.skills.push(skill);
            }
        }
    });
};
if (frmSkills &&
    frmSkills.action &&
    frmSkills.action.match(/hero\/skills\.php/i)) {
    const button = Array.from(frmSkills.querySelectorAll("tbody .button")).find((b) => b.value === "Show Details");
    if (button) {
        btnExport = add("input");
        chkboxGear = add("input");
        const label_gear = add("label");
        label_gear.innerHTML = "Equipment";
        attr(btnExport, { type: "button", class: "button clickable", value: "Export", style: "margin-left: 4px" });
        attr(chkboxGear, { type: "checkbox", id: "export-gear", style: "margin-left: 4px" });
        attr(label_gear, { for: "export-gear" });
        btnExport.addEventListener("click", exportProfile, false);
        button.parentNode.insertBefore(label_gear, button.nextSibling);
        button.parentNode.insertBefore(chkboxGear, label_gear);
        button.parentNode.insertBefore(btnExport, chkboxGear);
        button.parentNode.insertBefore(add("br"), label_gear.nextSibling);
        imgLoader = attr(add("img", add("div")), { src: `${location.protocol}//${location.host}/wod/css/img/ajax-loader.gif`, style: "display: none", });
        button.parentNode.insertBefore(imgLoader, button.parentNode.firstChild);
    }
}

})();
