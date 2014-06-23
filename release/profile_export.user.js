// ==UserScript==
// @name           Profile Export
// @description    Script allows to export hero profile information to BBCode
// @version        1.0.9
// @namespace      Never
// @include        http*://*.world-of-dungeons.*/wod/spiel/hero/skills.php*
// ==/UserScript==

(function(window, undefined) {


String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, '');
};

String.prototype.pad = function (len, str, left) {
    var res = this, tmp = str || ' ';
    if (left === true) {
        while (res.length < len)
            res = tmp + res;
    } else {
        while (res.length < len)
            res += tmp;
    }
    return res;
};

String.prototype.parseEffectiveValue = function () {
    var val = this.replace(/[a-z:,\s\n]+/gi, '').match(/([0-9]+)(\[([0-9\-]+)\])?/);
    if (val === null)
        return [0, 0];
    return val[3] ? [Number(val[1]), Number(val[3])] : [Number(val[1]), Number(val[1])];
};
function $(selector, parentNode, resultAsArray) {
    var context = parentNode || document;

    if (!selector || typeof selector !== 'string' || !(context.nodeType === 9 || context.nodeType === 1)) {
        return null;
    }

    var selectors = selector.split(/\s+/), result = [context], returnArray = resultAsArray || false;

    for (var i = 0, cnt = selectors.length; i < cnt; i++) {
        var new_result = [], m_elem = selectors[i].match(/^([\.#]?[a-z0-9\-_]+\w*)/i), sel = m_elem ? m_elem[1] : '', s = selectors[i].replace(sel, ''), re_attr = /(\[([a-z]+)([\*\^\$]?=)"(\w+)"\])/gi, filters = [], filter;

        while ((filter = re_attr.exec(s))) {
            if (filter.index === re_attr.lastIndex) {
                re_attr.lastIndex++;
            }

            filters.push({ 'attribute': filter[2], 'condition': filter[3], 'value': filter[4] });
        }

        var j, c2, c3, k, v;

        switch (sel[0]) {
            case '#':
                new_result = [document.getElementById(sel.substring(1))];
                if (!new_result[0]) {
                    return null;
                }
                break;
            case '.':
                for (j = 0, c2 = result.length; j < c2; j++) {
                    v = result[j].getElementsByClassName(sel.substring(1));
                    for (k = 0, c3 = v.length; k < c3; new_result.push(v[k++]))
                        ;
                }
                break;
            default:
                for (j = 0, c2 = result.length; j < c2; j++) {
                    v = result[j].getElementsByTagName(sel);
                    for (k = 0, c3 = v.length; k < c3; new_result.push(v[k++]))
                        ;
                }
                break;
        }

        if (filters.length > 0) {
            result = [];

            for (var g = 0, cntg = new_result.length; g < cntg; g++) {
                var elem = new_result[g], ok = false;

                for (var l = 0, cntl = filters.length; l < cntl; l++) {
                    filter = filters[l];
                    var attr = elem.getAttribute(filter.attribute);

                    if (attr) {
                        switch (filter.condition) {
                            case '*=':
                                ok = attr.indexOf(filter.value) > -1;
                                break;
                            case '^=':
                                ok = attr.indexOf(filter.value) === 0;
                                break;
                            case '$=':
                                ok = attr.indexOf(filter.value, attr.length - filter.value.length) > -1;
                                break;
                            default:
                                ok = attr === filter.value;
                                break;
                        }
                    }

                    if (ok === false) {
                        break;
                    }
                }

                if (ok === true) {
                    result.push(elem);
                }
            }
        } else {
            result = new_result;
        }
    }

    if (result.length === 0 || result[0] === context) {
        return null;
    }

    return !returnArray && result.length === 1 ? result[0] : result;
}
var get = function (url, callback, obj, async) {
    GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        onload: function (request) {
            if (request.readyState === 4) {
                if (request.status !== 200) {
                    alert('Data fetch failed. Please try again.');
                    return false;
                }
                if (typeof callback === 'function') {
                    if (!obj) {
                        callback(request.responseText);
                    } else {
                        callback.call(obj, request.responseText);
                    }
                }
            }
        }
    });
};
var innerText = function (elem, value) {
    if (!elem)
        return '';
    if (typeof value === 'undefined') {
        return elem.innerText ? elem.innerText : elem.textContent;
    }
    if (elem.innerText) {
        elem.innerText = value;
    } else {
        elem.textContent = value;
    }
};

var add = function (value, parentNode) {
    var newElem = typeof value !== 'object' ? document.createElement(value) : value;
    if (parentNode && parentNode.nodeType)
        parentNode.appendChild(newElem);
    return newElem;
};

var attr = function (elem, nameOrMap, value, remove) {
    if (remove) {
        elem.removeAttribute(nameOrMap);
    } else if (typeof nameOrMap === 'object') {
        for (var key in nameOrMap) {
            if (nameOrMap.hasOwnProperty(key)) {
                elem.setAttribute(key, nameOrMap[key]);
            }
        }
    } else if (value) {
        elem.setAttribute(nameOrMap, value);
    } else {
        return elem.getAttribute(nameOrMap);
    }
    return elem;
};

var cssClass = function (elem, name, toggle) {
    var has = elem.className.indexOf(name) !== -1;
    if (typeof toggle !== 'boolean')
        return has;
    if (has && toggle)
        return elem;
    elem.className = toggle ? elem.className + ' ' + name : elem.className.replace(name, '').replace(/^\s+|\s+$/g, '');
    return elem;
};
var parseTemplate = function (tpl, data) {
    try  {
        var code = "var p=[],print=function(){p.push.apply(p,arguments);};with(obj){p.push('" + tpl.replace(/[\r\t\n]/g, " ").replace(/'(?=[^#]*#>)/g, "\t").split("'").join("\\'").split("\t").join("'").replace(/<#=(.+?)#>/g, "',$1,'").split("<#").join("');").split("#>").join("p.push('") + "');}return p.join('');";
        var fn = new Function("obj", code);
        return fn(data);
    } catch (ex) {
        GM_log('parseTemplate: ' + ex);
    }
    return 'ERROR';
};
var _attrCosts = '0,0,100,500,1300,2800,5100,8500,13200,19400,27400,37400,49700,64500,82100,102800,126800,154400,\
185900,221600,261800,306800,356800,412200,473300,540400,613800,693800,780800,875000,976800'.split(',');

var HeroAttribute = (function () {
    function HeroAttribute(name) {
        this.value = 0;
        this.effective_value = 0;
        this.training_cost = 0;
        this.name = name;
    }
    HeroAttribute.getCost = function (value) {
        return _attrCosts[value] ? ('' + Number(_attrCosts[value])).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ") : '0';
    };
    return HeroAttribute;
})();
var _secCosts = '0,40,120,400,960,1880,3320,5360,8120,11720,16240,21840,28600,36680,46160,57160,\
69840,84280,100640,119000,139520,162280,187440,215120,245480,278600,314600,353640,\
395840,441320,490200,542640,598760,658680,722520,79440,862560,939000,1019920,1105440,195680'.split(','), _excCosts = '0,50,150,500,1300,2700,4850,7950,12200,17800,24950,33850,44700,57750,73200,91250,\
112150,136100,163350,194150,228750,267350,320200,357550,409650,466750,529100,596950,670550,\
750150,836050,928450,1027650,1133900,1247450,1368600,1497600,1634700,1780200,1934400,2097500'.split(','), _talCosts = '0,1440,3240,5440,8080,11200,14840,19040,23840,29280,35400,42240,49840,58240,\
67480,77600,88640,100640,113640,127680,142800,159040,176440,195040,214880,236000,258440,282240,\
307440,334080,362200,391840,423040,455840,490280,526400,564240,603840,645240,688480,733600'.split(',');

var HeroSkill = (function () {
    function HeroSkill() {
        this.name = '';
        this.type = '';
        this.rank = 0;
        this.effective_rank = 0;
        this.primary = false;
        this.secondary = false;
        this.exceptional = false;
        this.talent = false;
        this.in_round = true;
        this.pre_round = false;
        this.target = '';
        this.max_affected = '';
        this.one_pos = false;
        this.mp_base = 0;
        this.mp_cost = 0;
        this.item = '';
        this.skill_class = '';
        this.isOffensive = false;
        this.initiative_attr = '';
        this.attack_type = '';
        this.attack_attr = '';
        this.defence_attr = '';
        this.effect_attr = '';
        this.training_cost_ep = '0';
        this.training_cost_gold = '0';
        this.url = '';
        this.color = '';
        this.hero = null;
        this.onDone = null;
    }
    HeroSkill.prototype.parse = function (row_html) {
        try  {
            var link = $('a', row_html.cells[1]), rank_row = $('tr', row_html.cells[2]), rank = rank_row ? innerText(rank_row.cells[1]).parseEffectiveValue() : [0, 0], title = innerText(link).trim();

            if (title !== null && rank[0] !== 0) {
                this.name = title.replace(/\+/g, ' ');
                this.talent = this.name.indexOf('Talent:') > -1;
                this.rank = rank[0];
                this.effective_rank = rank[1];
                this.url = link.href;

                if (!this.talent) {
                    switch (attr(link, 'class')) {
                        case 'skill_primary':
                            this.primary = true;
                            break;
                        case 'skill_secondary':
                            this.secondary = true;
                            this.color = "lightslategray";
                            break;
                        case 'skill_foreign':
                            this.exceptional = true;
                            this.color = "#858585";
                            break;
                        default:
                            break;
                    }
                }

                this.calculateCost();
            }
        } catch (error) {
            GM_log('HeroSkill.parse: ' + error);
        }

        return this;
    };

    HeroSkill.prototype.fetchInfo = function (data) {
        try  {
            var skill_info = add('div');
            skill_info.innerHTML = data;
            var table_rows = $('.content_table table tr', $('form', skill_info));

            var lex = this.hero.world.lexicon;

            for (var i = 0, cnt = table_rows.length; i < cnt; i++) {
                var property = innerText(table_rows[i].cells[0]).trim(), value = innerText(table_rows[i].cells[1]).replace(/(\s|&nbsp;)/g, ' ').trim();

                switch (property) {
                    case lex.Type:
                        this.type = value;
                        break;
                    case lex.MayBeUsed:
                        this.pre_round = value.indexOf(lex.InPreRound) > -1;
                        this.in_round = !this.pre_round && value.indexOf(lex.InRound) > -1;
                        break;
                    case lex.Target:
                        this.target = value;
                        this.one_pos = value.indexOf(lex.OnePosition) > -1;
                        break;
                    case lex.MaxCharactersAffected:
                    case lex.MaxOpponentsAffected:
                        this.max_affected = value;
                        break;
                    case lex.ManaCost:
                        if (value !== '-') {
                            var mp = value.match(/([0-9])+ \(([0-9]+)\)/);
                            this.mp_base = Number(mp[2]);
                            this.mp_cost = Math.floor(this.mp_base * (0.8 + 0.1 * this.effective_rank));
                        }
                        break;
                    case lex.Item:
                        this.item = value;
                        break;
                    case lex.SkillClass:
                        this.skill_class = value;
                        break;
                    case lex.AttackType:
                        this.attack_type = value;
                        break;
                    case lex.Attack:
                        this.attack_attr = value;
                        break;
                    case lex.Damage:
                        this.effect_attr = value;
                        break;
                    case lex.Initiative:
                        this.initiative_attr = value;
                        break;
                    case lex.Defence:
                        this.defence_attr = value;
                        break;
                    case lex.Healing:
                        this.effect_attr = value;
                        break;
                    default:
                        break;
                }
            }

            if (this.max_affected.indexOf(lex.OfHeroesLevel) > -1) {
                var tmp = this.max_affected.replace(lex.OfHeroesLevel, '*' + this.hero.level + '/100').replace(' ', '');
                this.max_affected = Math.floor(eval(tmp)).toString();
            }

            switch (this.type) {
                case lex.Attack:
                case lex.Degradation:
                    if (this.target.indexOf(lex.OneEnemy) > -1)
                        this.max_affected = '1';
                    this.isOffensive = true;
                    break;
                case lex.Improvement:
                case lex.Healing:
                    if (this.target.indexOf(lex.OneTeam) > -1)
                        this.max_affected = '1';
                    break;
                default:
                    break;
            }

            console.log(this.name);
            console.log(this.target);
        } catch (ex) {
            GM_log('HeroSkill.fetchInfo: ' + ex);
        }

        if (typeof this.onDone === 'function')
            this.onDone(this);
    };

    HeroSkill.prototype.roll = function () {
        var res = { 'attack': '', 'defence': '', 'effect': '' }, re_tmp = /([a-z]{2}){1},([a-z]{2}){1}(\s*\(([+\-][0-9]+)%?\))?/i;

        return res;
    };

    HeroSkill.prototype.calculateCost = function () {
        var cost = 0;

        if (this.primary) {
            for (var i = this.rank; i > 1; i--)
                cost += (Math.pow(i, 2) - i) * 20;
            if (cost === 0)
                cost = 40;
        } else if (this.secondary) {
            cost = _secCosts[this.rank] ? Number(_secCosts[this.rank]) : 0;
        } else if (this.exceptional) {
            cost = _excCosts[this.rank] ? Number(_excCosts[this.rank]) : 0;
        } else if (this.talent) {
            cost = _talCosts[this.rank] ? Number(_talCosts[this.rank]) : 0;
        }

        this.training_cost_ep = ('' + cost).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ");
        this.training_cost_gold = ('' + cost * 0.9).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ");
        return this;
    };
    return HeroSkill;
})();
var Hero = (function () {
    function Hero(world) {
        this.name = '';
        this.title = '';
        this.level = 1;
        this.race = '';
        this.char_class = '';
        this.subclass = '';
        this.attributes = {
            'st': null,
            'co': null,
            'in': null,
            'dx': null,
            'ch': null,
            'ag': null,
            'pe': null,
            'wi': null,
            'hp': new HeroAttribute('HP'),
            'hhp': new HeroAttribute('HHP'),
            'mp': new HeroAttribute('MP'),
            'rmp': new HeroAttribute('RMP'),
            'ini': new HeroAttribute('Initiative'),
            'act': new HeroAttribute('Actions'),
            'rstpt': new HeroAttribute('Reset points'),
            'fame': new HeroAttribute('Fame'),
            'gender': new HeroAttribute('Gender')
        };
        this.skills = [];
        this.armor = {};
        this.gear = {};
        this.modifiers = {};
        this.generateBBCode = function () {
            return parseTemplate(Hero.getProfileTemplate(), { "hero": this });
        };
        this.world = world;
    }
    Hero.prototype.parse = function (attrHtml) {
        try  {
            var attr_html = add('div');
            attr_html.innerHTML = attrHtml;

            var formHtml = $('form', attr_html)[1], title = innerText($('h1', formHtml)), tables = $('.content_table', formHtml), attrTable = tables[0], charTable = tables[1], armorTable = tables[2], content_rows = $('.row0', charTable).concat($('.row1', charTable));

            this.name = title.substring(0, title.lastIndexOf('-')).trim();
            this.parseAttributes(attrTable);
            this.parseCharacter(charTable);
            this.parseArmor(armorTable);

            if (g_check_gear.checked) {
                g_jobs++;

                var eq_url = location.href.replace('skills.php', 'items.php').replace('menukey=hero_skills', 'menukey=hero_gear'), hero = this;

                if (eq_url.indexOf('view=gear') < 0) {
                    eq_url += '&view=gear';
                }

                get(eq_url, function (gearHtml) {
                    hero.parseGear(gearHtml);
                    g_jobs--;
                }, this);
            } else {
                delete this.gear;
            }
        } catch (ex) {
            GM_log('Hero.parse: ' + ex);
        }
        return this;
    };

    Hero.prototype.parseAttributes = function (attrTable) {
        var content_rows = attrTable.rows, index = ['st', 'co', 'in', 'dx', 'ch', 'ag', 'pe', 'wi'], re_race = new RegExp('(' + this.world.races.join('|') + ') \\('), re_class = new RegExp('(' + this.world.classes.join('|') + ') \\('), i, cnt, row, breed, value, attr, m_race, m_class, origin;

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
        var content_rows = charTable.rows, index = content_rows.length == 10 ? ['lvl', '-', 'fame', 'hp', 'mp', 'act', 'ini', 'rstpt', 'gender', 'title'] : ['lvl', '-', 'fame', '-', 'hp', 'mp', 'act', 'ini', 'rstpt', 'gender', 'title'];

        for (var rowIndex = 0, cnt = content_rows.length; rowIndex < cnt; rowIndex++) {
            var row = content_rows[rowIndex], cell1 = row.cells[0], name = innerText(cell1).trim(), property = index[rowIndex];

            switch (property) {
                case 'lvl':
                    this.level = Number(innerText(row.cells[1]));
                    break;
                case 'fame':
                    this.attributes.fame.value = Number(innerText(row.cells[1]));
                    break;
                case 'hp':
                    var hp = innerText(row.cells[1]).parseEffectiveValue(), hhp = innerText(row.cells[2]).parseEffectiveValue(), hpa = this.attributes.hp, hhpa = this.attributes.hhp;
                    hpa.value = hp[0];
                    hpa.effective_value = hp[1];
                    hhpa.value = hhp[0];
                    hhpa.effective_value = hhp[1];
                    break;
                case 'mp':
                    var mp = innerText(row.cells[1]).parseEffectiveValue(), rmp = innerText(row.cells[2]).parseEffectiveValue(), mpa = this.attributes.mp, rmpa = this.attributes.rmp;
                    mpa.value = mp[0];
                    mpa.effective_value = mp[1];
                    rmpa.value = rmp[0];
                    rmpa.effective_value = rmp[1];
                    break;
                case 'act':
                    var act = innerText(row.cells[1]).parseEffectiveValue(), acta = this.attributes.act;
                    acta.value = act[0];
                    acta.effective_value = act[1];
                    break;
                case 'ini':
                    var ini = innerText(row.cells[1]).parseEffectiveValue(), inia = this.attributes.ini;
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
            var row = content_rows[i], cell1 = row.cells[0], type = innerText(cell1).trim().toLowerCase(), attack_type = innerText(row.cells[1]).replace('(z)', '').trim(), value = innerText(row.cells[2]).replace(/(\s|&nbsp;)/g, '').trim();

            if (!this.armor[type])
                this.armor[type] = {};

            var a = this.armor[type];
            a[attack_type] = value;
        }
    };

    Hero.prototype.parseGear = function (gearHtml) {
        var gear_html = add('div'), gear = {};

        if (/\d+ items were found in the dungeon. You may carry up to/.test(gearHtml)) {
            alert('You have too much items in your backpack, your current gear won\'t be shown.');
        } else {
            gear_html.innerHTML = gearHtml;

            var items = $('div[id="main_content"] form td[class="texttoken"]', gear_html, true), re_uses = /\(([0-9]+)\/[0-9]+\)/;

            if (items) {
                for (var i = 0, cnt = items.length; i < cnt; i++) {
                    var slot = items[i], slot_name = slot.innerHTML, row = slot.parentNode, ctrl = $('select', row), itm = ctrl ? ctrl.options[ctrl.selectedIndex].text.replace(/!$/, '') : '';

                    gear[slot.innerHTML] = !re_uses.test(itm) ? itm : '';
                }
                this.gear = gear;
            }
        }
    };

    Hero.getProfileTemplate = function () {
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
var mp = skill.mp_cost != 0 ? skill.mp_cost : ""; var color_affect = skill.isOffensive ? "tomato" : "mediumseagreen";#>\
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
    return Hero;
})();
var VERSION = '1.0.9';

var g_form_skills = $('#main_content form'), g_match_location = g_form_skills && g_form_skills.action && /hero\/skills\.php/i.test(g_form_skills.action), g_buttons = $('tbody .button', g_form_skills), g_button_export, g_check_gear, g_img_wait, g_hero, g_jobs;

var exportSkills = function () {
    attr(g_button_export, 'disabled', 'true');
    cssClass(g_button_export, 'button clickable', false);
    cssClass(g_button_export, 'button_disabled', true);
    attr(g_img_wait, 'style', null, true);

    var urlClasses = location.href.replace('hero/skills.php', 'help/heroclasslist.php') + '&TABLE_PSNR[1]=30&TABLE_PSGO[1]=v', urlAttributes = location.href.replace('skills.php', 'attributes.php');

    get(urlClasses, function (htmlClasses) {
        var world = new World();
        world.parse(htmlClasses);

        get(urlAttributes, function (attrHtml) {
            g_jobs = 0;
            g_hero = new Hero(world);
            g_hero.parse(attrHtml);

            var skillTable = $('.content_table', g_form_skills), skill_rows = skillTable.rows, skills = [];

            for (var i = 0, cnt = skill_rows.length; i < cnt; i++) {
                var skill = new HeroSkill().parse(skill_rows[i]);
                if (skill.rank > 0) {
                    skill.hero = g_hero;
                    skill.onDone = showResult;
                    g_jobs++;
                    get(skill.url, skill.fetchInfo, skill, true);
                    skills.push(skill);
                }
            }

            skills.sort(function (x, y) {
                return y.effective_rank - x.effective_rank;
            });

            g_hero.skills = skills;
        });
    });
};

var showResult = function (skill) {
    if (skill)
        g_jobs--;
    if (g_jobs <= 0) {
        var h1 = $('h1', g_form_skills), txt_export = $('#profile-export-result', h1), date = new Date(), stamp = [date.getDate().toString().pad(2, '0', true), (date.getMonth() + 1).toString().pad(2, '0', true), date.getFullYear().toString().substring(2)].join('.'), url = '[url=https://raw.github.com/slicklash/wod-scripts/master/release/profile_export.user.js]Profile Export[/url]', bbcode = g_hero.generateBBCode().trim() + '\n[size=9]\nGenerated: ' + stamp + ' - ' + url + ' ' + VERSION + '[/size]';

        if (!txt_export)
            txt_export = add('textarea', h1.parentNode);
        attr(txt_export, { 'rows': '4', 'cols': '50', 'id': 'profile-export-result' });
        txt_export.innerHTML = bbcode;
        attr(g_img_wait, 'style', 'display: none');
    }
};

var main = function () {
    var button = g_buttons[g_buttons.length - 1];

    if (button) {
        g_button_export = add('input');
        g_check_gear = add('input');
        var label_gear = add('label');
        label_gear.innerHTML = 'Equipment';
        attr(g_button_export, { 'type': 'button', 'class': 'button clickable', 'value': 'Export', 'style': 'margin-left: 4px' });
        attr(g_check_gear, { 'type': 'checkbox', 'id': 'export-gear', 'style': 'margin-left: 4px' });
        attr(label_gear, { 'for': 'export-gear' });
        g_button_export.addEventListener('click', exportSkills, false);
        button.parentNode.insertBefore(label_gear, button.nextSibling);
        button.parentNode.insertBefore(g_check_gear, label_gear);
        button.parentNode.insertBefore(g_button_export, g_check_gear);
        button.parentNode.insertBefore(add('br'), label_gear.nextSibling);

        g_img_wait = attr(add('img', add('div')), { 'src': location.protocol + '//' + location.host + '/wod/css/img/ajax-loader.gif', 'style': 'display: none' });
        button.parentNode.insertBefore(g_img_wait, button.parentNode.firstChild);
    }
};

var dev = function () {
    var h1 = $('h1', g_form_skills), btn_dev = add('input', h1.parentNode);

    attr(btn_dev, { 'type': 'button', 'class': 'button clickable', 'value': 'Dev', 'style': 'margin-left: 4px' });

    var test1 = function () {
        var loc = location.href.replace('hero/skills.php', 'help/heroclasslist.php') + '&TABLE_PSNR[1]=30&TABLE_PSGO[1]=v';

        get(loc, function (html) {
            var world = new World();
            world.parse(html);

            console.log(world.races);
            console.log(world.classes);

            alert('done');
        });
    };

    btn_dev.addEventListener('click', test1, false);
};

if (g_match_location) {
    main();
    dev();
}
var World = (function () {
    function World() {
        this.classes = [];
        this.races = [];
        this.lexicon = {};
        this.locale = location.hostname.substr(location.hostname.lastIndexOf('.') + 1);
        if (this.locale === 'net')
            this.locale = 'en';
    }
    World.prototype.parse = function (classRaceHtml) {
        var tmp = add('div');
        tmp.innerHTML = classRaceHtml;

        var form = $('form', tmp)[1], rows = $('.content_table tbody tr', form);

        if (!rows && rows.length === 0)
            return;

        for (var i = 1, cnt = rows.length; i < cnt; i++) {
            var cells = rows[i].cells, name = innerText(cells[1]).trim(), isRace = attr($('img', cells[2]), 'src').indexOf('yes.png') > -1;

            if (isRace) {
                this.races.push(name);
            } else {
                this.classes.push(name);
            }
        }

        this.initLexicon();
    };

    World.prototype.initLexicon = function () {
        switch (this.locale) {
            default:
                this.lexicon = {
                    'Type': 'type',
                    'Target': 'target',
                    'Item': 'item',
                    'SkillClass': 'skill class',
                    'Attack': 'attack',
                    'AttackType': 'attack type',
                    'Damage': 'damage',
                    'Defence': 'defense',
                    'Initiative': 'initiative',
                    'Degradation': 'degradation',
                    'Improvement': 'improvement',
                    'Healing': 'healing',
                    'InRound': 'in round',
                    'InPreRound': 'in pre round',
                    'MayBeUsed': 'may be used',
                    'OnePosition': 'one position',
                    'MaxCharactersAffected': 'Max. characters affected',
                    'MaxOpponentsAffected': 'Max. opponents affected',
                    'ManaCost': 'Mana points cost',
                    'OfHeroesLevel': '% of your hero`s level',
                    'OneEnemy': 'one enemy',
                    'OneTeam': 'one team'
                };
                break;
            case 'es':
                this.lexicon = {
                    'Type': 'Tipo',
                    'Target': 'Objetivo',
                    'Item': 'Objeto',
                    'SkillClass': 'Clase de habilidades',
                    'Attack': 'Ataque',
                    'AttackType': 'tipo de ataque',
                    'Damage': 'Daño',
                    'Defence': 'Parada',
                    'Initiative': 'Iniciativa',
                    'Degradation': 'Empeoramiento',
                    'Improvement': 'Mejora',
                    'Healing': 'Curación',
                    'InRound': 'in Ronda',
                    'InPreRound': 'in Ronda preliminar',
                    'MayBeUsed': 'may be used',
                    'OnePosition': 'una posición',
                    'MaxCharactersAffected': 'Max. characters affected',
                    'MaxOpponentsAffected': 'Max. opponents affected',
                    'ManaCost': 'Costes de Puntos de mana',
                    'OfHeroesLevel': '% del nivel del héroe',
                    'OneEnemy': 'Un enemigo',
                    'OneTeam': 'one team'
                };
                break;
        }
    };
    return World;
})();
})();