
// --- Hero

function Hero(world) {
    this.world = world;
    this.name = '';
    this.title = '';
    this.level = 1;
    this.race = '';
    this.char_class = '';
    this.subclass = '';
    this.attributes = {
        'st'     : null,
        'co'     : null,
        'in'     : null,
        'dx'     : null,
        'ch'     : null,
        'ag'     : null,
        'pe'     : null,
        'wi'     : null,
        'hp'     : new HeroAttribute('HP'),
        'hhp'    : new HeroAttribute('HHP'),
        'mp'     : new HeroAttribute('MP'),
        'rmp'    : new HeroAttribute('RMP'),
        'ini'    : new HeroAttribute('Initiative'),
        'act'    : new HeroAttribute('Actions'),
        'rstpt'  : new HeroAttribute('Reset points'),
        'fame'   : new HeroAttribute('Fame'),
        'gender' : new HeroAttribute('Gender')
    };
    this.skills = [];
    this.armor = {};
    this.gear = {};
    this.modifiers = {};
}

Hero.prototype.parse = function(formHtml) {
    try {

        var title = innerText($('h1', formHtml)),
            tables = $('.content_table', formHtml),
            attrTable = tables[0],
            charTable = tables[1],
            armorTable = tables[2],
            content_rows = $('.row0', charTable).concat($('.row1', charTable));

        this.name = title.substring(0, title.lastIndexOf('-')).trim();
        this.parseAttributes(attrTable);
        this.parseCharacter(charTable);
        this.parseArmor(armorTable);

        if (g_check_gear.checked) {

            g_jobs++;

            var eq_url = location.href.replace('skills.php', 'items.php').replace('menukey=hero_skills', 'menukey=hero_gear'),
                hero = this;

            if (eq_url.indexOf('view=gear') < 0)  {
                eq_url += '&view=gear';
            }

            get(eq_url, function(gearHtml) {
                hero.parseGear(gearHtml);
                g_jobs--;
            }, this);

        } 
        else {
            delete this.gear;
        }
        
    }
    catch (ex) {
        GM_log('Hero.parse: ' + ex);
    }
    return this;
};

Hero.prototype.parseAttributes = function(attrTable) {

    var content_rows = attrTable.rows,
        index = ['st', 'co', 'in', 'dx', 'ch', 'ag', 'pe', 'wi'],
        re_race  = new RegExp('(' + this.world.races.join('|') + ') \\('),
        re_class = new RegExp('(' + this.world.classes.join('|') + ') \\('),
        i, cnt, row, breed, value, attr, m_race, m_class;

    for (i = 1, cnt = content_rows.length; i < cnt; i++) {
        row = content_rows[i];
        origin = row.cells[0].innerHTML;
        name = innerText(row.cells[0]).trim();
        value = $('tr', row.cells[1]);
        m_race = origin.match(re_race);
        m_class = origin.match(re_class);

        if (m_race) 
            this.race = m_race[1];

        if (m_class) 
            this.char_class = m_class[1];

        if (value.cells) {
            attr = new HeroAttribute(name);
            value = innerText(value.cells[1]).parseEffectiveValue();
            attr.value = value[0];
            attr.effective_value = value[1];
            attr.training_cost = HeroAttribute.getCost(attr.value);
            this.attributes[index[i - 1]] = attr;
        }
    }
};

Hero.prototype.parseCharacter = function (charTable) {

    var content_rows = charTable.rows;
        index = content_rows.length == 10 ? ['lvl', '-', 'fame', 'hp', 'mp', 'act', 'ini', 'rstpt', 'gender', 'title'] : ['lvl', '-', 'fame', '-', 'hp', 'mp', 'act', 'ini', 'rstpt', 'gender', 'title'];

    for (var rowIndex = 0, cnt = content_rows.length; rowIndex < cnt; rowIndex++) {

        var row = content_rows[rowIndex],
            cell1 = row.cells[0],
            name = innerText(cell1).trim(),
            property = index[rowIndex];

        switch(property) {
            case 'lvl':
                this.level = Number(innerText(row.cells[1]));
                break;
            case 'fame':
                this.attributes.fame.value = Number(innerText(row.cells[1]));
                break;
            case 'hp':
                var hp = innerText(row.cells[1]).parseEffectiveValue(),
                    hhp = innerText(row.cells[2]).parseEffectiveValue(),
                    hpa = this.attributes.hp,
                    hhpa = this.attributes.hhp;
                hpa.value = hp[0];
                hpa.effective_value = hp[1];
                hhpa.value = hhp[0];
                hhpa.effective_value = hhp[1];
                break;
            case 'mp':
                var mp = innerText(row.cells[1]).parseEffectiveValue(),
                    rmp = innerText(row.cells[2]).parseEffectiveValue(),
                    mpa = this.attributes.mp,
                    rmpa = this.attributes.rmp;
                mpa.value = mp[0];
                mpa.effective_value = mp[1];
                rmpa.value = rmp[0];
                rmpa.effective_value = rmp[1];
                break;
            case 'act':
                var act = innerText(row.cells[1]).parseEffectiveValue(),
                    acta = this.attributes.act;
                acta.value = act[0];
                acta.effective_value = act[1];
                break;
            case 'ini':
                var ini = innerText(row.cells[1]).parseEffectiveValue(),
                    inia = this.attributes.ini;
                inia.value = ini[0];
                inia.effective_value = ini[1];
                break;
            case 'rstpt':
                this.attributes.rstpt.value = Number(innerText(row.cells[1]));
                break;
            case 'gender':
                this.attributes.gender.value = innerText(row.cells[1]).trim().toUpperCase()[0];
                break;
            case 'title':
                this.title = innerText($('a', row.cells[1])).trim();
                break;
        }
    }
};

Hero.prototype.parseArmor = function (armorTable) {

    var content_rows = armorTable.rows;

    for (var i = 1, cnt = content_rows.length; i < cnt; i++) {

        var row = content_rows[i],
            cell1 = row.cells[0],
            type = innerText(cell1).trim().toLowerCase(),
            attack_type = innerText(row.cells[1]).replace('(z)', '').trim(),
            value = innerText(row.cells[2]).replace(/(\s|&nbsp;)/g, '').trim();

        if (!this.armor[type]) 
            this.armor[type] = {};

        var a = this.armor[type];
        a[attack_type] = value;
    }
};

Hero.prototype.parseGear = function (gearHtml) {

    var gear_html = add('div'),
        gear = {};

    if(/\d+ items were found in the dungeon. You may carry up to/.test(gearHtml)) {
        alert('You have too much items in your backpack, your current gear won\'t be shown.');
    }
    else {
        gear_html.innerHTML = gearHtml;

        var items = $('div[id="main_content"] form td[class="texttoken"]', gear_html, true),
            re_uses  = /\(([0-9]+)\/[0-9]+\)/;

        if (items) {
            for (var i = 0, cnt = items.length; i < cnt; i++) {
                var slot = items[i],
                    slot_name = slot.innerHTML,
                              row = slot.parentNode,
                              ctrl = $('select', row),
                              itm = ctrl ? ctrl.options[ctrl.selectedIndex].text.replace(/!$/,'') : '';

                gear[slot.innerHTML] = !re_uses.test(itm) ? itm : '';
            }
            this.gear = gear;
        }
    }
};

Hero.prototype.generateBBCode = function() {
    return parseTemplate(Hero.getProfileTemplate(), {"hero": this});
};

Hero.getProfileTemplate = function() {
    var template = '\
                                                                                                                                            \
[size=12][hero:<#=hero.name#>]<#if(hero.title){#>, <#}#>[i]<#=hero.title#>[/i] - [class:<#=hero.race#>] [class:<#=hero.char_class#>] - Level <#=hero.level#>[/size]\
[h1]Characteristics[/h1]\
[table][tr]\
[td]\
[table border=1][tr][th]Attribute[/th][th]Value[/th][th]Spent :ep:[/th][/tr]\
<# var c = 0, hattr = hero.attributes; for (var key in hattr) { var attr = hattr[key]; var efval = attr.effective_value !== attr.value ? ("[" + attr.effective_value + "]") : ""; c++; if (c > 8) break; #>\
[tr][td][size=12]<#=attr.name#>[/size][/td][td align=center][size=12]<#=attr.value#> [url=" "]<#=efval#>[/url][/size][/td][td align=right][size=12]<#=attr.training_cost#>[/size][/td][/tr]<# } #>\
[/table]\
[/td]\
[td][/td][td][/td][td][/td]\
[td valign=top]\
[table border=1]\
[tr][td][color=mediumseagreen][size=12]HP[/color][/td][td][size=12]<#=hattr.hp.value#> [url=" "][<#=hattr.hp.effective_value#>][/url][/size][/td][td][color=mediumseagreen][size=12]HHP[/color][/td][td][size=12]<#=hattr.hhp.value#> [url=" "][<#=hattr.hhp.effective_value#>][/url][/size][/td][/tr]\
[tr][td][color=dodgerblue][size=12]MP[/color][/td][td][size=12]<#=hattr.mp.value#> [url=" "][<#=hattr.mp.effective_value#>][/url][/size][/td][td][color=dodgerblue][size=12]RMP[/color][/td][td][size=12]<#=hattr.hhp.value#> [url=" "][<#=hattr.rmp.effective_value#>][/url][/size][/td][/tr]\
[tr][td colspan=2][size=12]Actions[/size][/td][td colspan=2][size=12]<#=hattr.act.value#> [url=" "][<#=hattr.act.effective_value#>][/url][/size][/td][/tr]\
[tr][td colspan=2][size=12]Initiative[/size][/td][td colspan=2][size=12]<#=hattr.ini.value#> [url=" "][<#=hattr.ini.effective_value#>][/url][/size][/td][/tr]\
[tr][td colspan=2][size=12]Reset points[/size][/td][td colspan=2][size=12]<#=hattr.rstpt.value#>[/size][/td][/tr]\
[tr][td colspan=2][size=12]Gender[/size][/td][td colspan=2][size=12]<#=hattr.gender.value#>[/size][/td][/tr]\
[tr][td colspan=2][size=12]Fame[/size][/td][td colspan=2][size=12]<#=hattr.fame.value#> :fame:[/size][/td][/tr]\
[/table]\
[/td]\
[/tr][/table]\
[table][tr][td valign=top]\
[h1]Armor[/h1]\
[table border=1]\
[tr][th][size=12]Damage type[/size][/th][th][size=12]Attack type[/size][/th][th][size=12]Armor (r)[/size][/th][/tr]\
<# var armor = hero.armor; for (var dmg_type in armor) { var arm = armor[dmg_type]; for (var atk_type in arm) { var val = arm[atk_type].split("/"); if (val[0] == val[1] && val[1] == val[2] && val[2] == 0) continue; #>\
[tr][td][size=12]<#=dmg_type#>[/size][/td][td align=center][size=12]<#=atk_type#>[/size][/td]\
[td][size=12]<#if(val[0]>0){#>[color=mediumseagreen]<#}#><#=val[0]#><#if(val[0]>0){#>[/color]<#}#>\
 / <#if(val[1]>0){#>[color=mediumseagreen]<#}#><#=val[1]#><#if(val[1]>0){#>[/color]<#}#>\
 / <#if(val[2]>0){#>[color=mediumseagreen]<#}#><#=val[2]#><#if(val[2]>0){#>[/color]<#}#>[/size][/td]\
[/tr]<#}}#>\
[/table]  [size=10]r - for normal / good / critical hits[/size]\
[h1]Initiative[/h1]\
[table border=1]\
[tr][th]Skill[/th][th]Attributes[/th][th]Initiative[/th][/tr]\
[tr][td]Standard (no skill)[/td][td align=center]ag,pe[/td][td align=center]<#=hattr.ag.effective_value*2+hattr.pe.effective_value+hattr.ini.effective_value#>[/td][/tr]\
<# var skills = hero.skills; for (var i = 0, cnt = skills.length; i < cnt; i++) { var skill = skills[i], color_skill;\
if (skill.type === "initiative"){ var m = skill.initiative_attr.match(/[a-z]{2}/gi), attr1 = hattr[m[0]], attr2 = hattr[m[1]];#>\
[tr][td][skill:"<#=skill.name#>" <#if(skill.color)#>color=<#=skill.color#><#;#> size=12][/td][td align=center]<#=skill.initiative_attr#>[/td][td align=center]<#=attr1.effective_value*2+attr2.effective_value+skill.effective_rank*2+hattr.ini.effective_value#>[/td][/tr]\
<#}}#>\
[/table]\
[/td][td][/td][td][/td][td valign=top]\
[h1]Standard Parries[/h1]\
[table border=1]\
[tr][th]Attack type[/th][th]Attributes[/th][th]Defence[/th][/tr]\
[tr][td]Melee[/td][td align=center]ag,dx[/td][td align=center]<#=hattr.ag.effective_value*2+hattr.dx.effective_value#>[/td][/tr]\
[tr][td]Ranged[/td][td align=center]ag,pe[/td][td align=center]<#=hattr.ag.effective_value*2+hattr.pe.effective_value#>[/td][/tr]\
[tr][td]Spell[/td][td align=center]wi,in[/td][td align=center]<#=hattr.wi.effective_value*2+hattr["in"].effective_value#>[/td][/tr]\
[tr][td]Social[/td][td align=center]wi,ch[/td][td align=center]<#=hattr.wi.effective_value*2+hattr.ch.effective_value#>[/td][/tr]\
[tr][td]Ambush[/td][td align=center]pe,in[/td][td align=center]<#=hattr.pe.effective_value*2+hattr["in"].effective_value#>[/td][/tr]\
[tr][td]Force of Nature[/td][td align=center]wi,ag[/td][td align=center]<#=hattr.wi.effective_value*2+hattr.ag.effective_value#>[/td][/tr]\
[tr][td]Activate trap[/td][td align=center]pe,ag[/td][td align=center]<#=hattr.pe.effective_value*2+hattr.ag.effective_value#>[/td][/tr]\
[tr][td]Explosion or Blast[/td][td align=center]ag,pe[/td][td align=center]<#=hattr.ag.effective_value*2+hattr.pe.effective_value#>[/td][/tr]\
[tr][td]Disease[/td][td align=center]co,ch[/td][td align=center]<#=hattr.co.effective_value*2+hattr.ch.effective_value#>[/td][/tr]\
[tr][td]Curse[/td][td align=center]ch,wi[/td][td align=center]<#=hattr.ch.effective_value*2+hattr.wi.effective_value#>[/td][/tr]\
[/table]  [size=10]used when no skill is available or set[/size][/td][/tr][/table]\
[h1]Skills[/h1]\
[table border=1][tr][th align=left]Name[/th][th]Level[/th][th]MP Cost[/th][th]Targets[/th][th colspan=2]Spent :gold: / :ep:[/th][/tr]\
<# var skills = hero.skills; for (var i = 0, cnt = skills.length; i < cnt; i++) { var skill = skills[i], color_skill;\
var erank = skill.effective_rank !== skill.rank ? ("[" + skill.effective_rank + "]") : "";\
var pos_mark = skill.max_affected && skill.one_pos ? "&sup1;" : "";\
var r = skill.roll();\
var mp = skill.mp_cost != 0 ? skill.mp_cost : ""; var color_affect = (skill.type.match(/attack|degradation/) ? "tomato" : "mediumseagreen");#>\
[tr][td][skill:"<#=skill.name#>" <#if(skill.color)#>color=<#=skill.color#><#;#> size=12][/td]\
[td align=center][size=12]<#=skill.rank#> [url=" "]<#=erank#>[/url][/size][/td]\
[td align=center][size=12][color=dodgerblue]<#=mp#>[/color][/size][/td]\
[td align=center][size=12][color=<#=color_affect#>]<#=skill.max_affected#><#=pos_mark#>[/color][/size][/td]\
[td align=right]<#=skill.training_cost_gold#>[/td]\
[td align=right]<#=skill.training_cost_ep#>[/td][/tr]<# } #>\
[/table]  [size=10]1 - in one position[/size]\
<# if (hero.gear) { #>\
[h1]Equipment[/h1]\
[table]\
[tr][td valign=top]\
[table border=1][tr][th align=left]Slot[/th][th]Item[/th][/tr]\
<# var gear = hero.gear; for (var key in gear) { var slot = key[0].toUpperCase() + key.substring(1), item = gear[key]; if (key.indexOf("pocket") != 0) { #>\
[tr][td]<#=slot#>[/td][td]<#if(item.length > 0) #>[item:<#=item#>]<#;#>[/td][/tr]\
<# }} #>\
[/table][/td][td valign=top]\
[table border=1][tr][th align=left]Pocket items[/th][/tr]\
<# var gear = hero.gear; for (var key in gear) { var slot = key, item = gear[key]; if (key.indexOf("pocket") == 0 && item.length > 0) { #>\
[tr][td][item:<#=item#>][/td][/tr]\
<# }} #>\
[/table][/td][/tr][/table]\
<# } #>\
\
';
    return template;
};
