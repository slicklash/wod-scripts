/// <reference path="../_references.ts" />

// --- HeroSkill

var _secCosts = '0,40,120,400,960,1880,3320,5360,8120,11720,16240,21840,28600,36680,46160,57160,\
69840,84280,100640,119000,139520,162280,187440,215120,245480,278600,314600,353640,\
395840,441320,490200,542640,598760,658680,722520,79440,862560,939000,1019920,1105440,195680'.split(','),
_excCosts = '0,50,150,500,1300,2700,4850,7950,12200,17800,24950,33850,44700,57750,73200,91250,\
112150,136100,163350,194150,228750,267350,320200,357550,409650,466750,529100,596950,670550,\
750150,836050,928450,1027650,1133900,1247450,1368600,1497600,1634700,1780200,1934400,2097500'.split(','),
_talCosts = '0,1440,3240,5440,8080,11200,14840,19040,23840,29280,35400,42240,49840,58240,\
67480,77600,88640,100640,113640,127680,142800,159040,176440,195040,214880,236000,258440,282240,\
307440,334080,362200,391840,423040,455840,490280,526400,564240,603840,645240,688480,733600'.split(',');

enum SkillNature {
    primary,
    secondary,
    foreign,
    talent
}

// interface IHeroSkill {
//     name: string;
//     level: number;
//     effectiveLevel: number;
//     type: string; //TODO: enum
//     talent: string;
//     rank: number;
//     effective_value: number;
//     nature: SkillNature;
//     skillClass: string;
//     inRound: boolean;
//     preRound: boolean;
//     target: string;
//     maxAffected: string;
//     crossPosition: boolean;
//     manaBase: number;
//     manaCost: number;
//     requiredItem: string;
//     isOffensive: boolean;
// }

class HeroSkill {

    name: string;
    level: number;
    initiative_attr = '';
    attack_type = '';
    attack_attr = '';
    defence_attr = '';
    effect_attr = '';
    training_cost_ep = '0';
    training_cost_gold = '0';
    url = '';
    color = '';
    hero = null;
    onDone = null;
    talent: boolean;
    rank: number;
    effectiveLevel: number;
    primary: boolean;
    secondary: boolean;
    exceptional: boolean;
    type: string;
    pre_round: boolean;
    in_round: boolean;
    target: string;
    one_pos: boolean;
    max_affected: string;
    mp_base: number;
    mp_cost: number;
    item: string;
    skill_class: string;
    isOffensive: boolean;
    effective_rank: number;



    parse(row_html) {
        try {
            var link = $('a', row_html.cells[1]),
                rank_row = $('tr', row_html.cells[2]),
                rank = rank_row ? innerText(rank_row.cells[1]).parseEffectiveValue() : [0,0],
                title = innerText(link).trim();

            if (title !== null && rank[0] !== 0)
            {
                this.name = title.replace(/\+/g, ' ');
                this.talent = this.name.indexOf('Talent:') > -1;
                this.rank = rank[0];
                this.effective_rank = rank[1];
                this.url = link.href;

                if (!this.talent) {
                    switch(attr(link, 'class')) {
                        case 'skill_primary'  : this.primary     = true; break;
                        case 'skill_secondary': this.secondary   = true; this.color = "lightslategray"; break;
                        case 'skill_foreign'  : this.exceptional = true; this.color = "#858585"; break;
                        default: break;
                    }
                }

                this.calculateCost();
            }
        }
        catch (error) {
            GM_log('HeroSkill.parse: ' + error);
        }

        return this;
    }

    fetchInfo(data) {
        try {
            var skill_info = add('div');
            skill_info.innerHTML = data;
            var table_rows = $('.content_table table tr', $('form', skill_info));

            var lex = this.hero.world.lexicon;

            for (var i = 0, cnt = table_rows.length; i < cnt; i++) {
                var property = innerText(table_rows[i].cells[0]).trim(),
                    value = innerText(table_rows[i].cells[1]).replace(/(\s|&nbsp;)/g, ' ').trim();

                switch(property) {
                    case lex.Type                   : this.type = value;  break;
                    case lex.MayBeUsed              : this.pre_round = value.indexOf(lex.InPreRound) > -1; this.in_round = !this.pre_round && value.indexOf(lex.InRound) > -1;  break;
                    case lex.Target                 : this.target = value; this.one_pos = value.indexOf(lex.OnePosition) > -1; break;
                    case lex.MaxCharactersAffected  :
                    case lex.MaxOpponentsAffected   : this.max_affected = value; break;
                    case lex.ManaCost               : if (value !== '-') {
                        var mp = value.match(/([0-9])+ \(([0-9]+)\)/);
                        this.mp_base = Number(mp[2]); this.mp_cost = Math.floor(this.mp_base * (0.8 + 0.1 * this.effective_rank)); 
                    }
                                                      break;
                    case lex.Item                   : this.item = value; break;
                    case lex.SkillClass             : this.skill_class = value; break;
                    case lex.AttackType             : this.attack_type = value; break;
                    case lex.Attack                 : this.attack_attr = value; break;
                    case lex.Damage                 : this.effect_attr = value; break;
                    case lex.Initiative             : this.initiative_attr = value; break;
                    case lex.Defence                : this.defence_attr = value; break;
                    case lex.Healing                : this.effect_attr = value; break;
                    default: break;
                }
            }

            if (this.max_affected.indexOf(lex.OfHeroesLevel) > -1) {
                var tmp = this.max_affected.replace(lex.OfHeroesLevel, '*' + this.hero.level +'/100').replace(' ', '');
                this.max_affected = Math.floor(eval(tmp)).toString();
            }

            switch(this.type) {
                case lex.Attack:
                case lex.Degradation:
                    if (this.target.indexOf(lex.OneEnemy) > -1) this.max_affected = '1';
                    this.isOffensive = true;
                    break;
                case lex.Improvement:
                case lex.Healing:
                    if (this.target.indexOf(lex.OneTeam) > -1) this.max_affected = '1';
                    break;
                default:
                    break;
            }

            console.log(this.name);
            console.log(this.target)
        }
        catch (ex) {
            GM_log('HeroSkill.fetchInfo: ' + ex);
        }

        if (typeof this.onDone === 'function') this.onDone(this);
    }

    roll() {
        var res = { 'attack': '', 'defence' : '', 'effect' : '' },
            re_tmp = /([a-z]{2}){1},([a-z]{2}){1}(\s*\(([+\-][0-9]+)%?\))?/i;

        return res;

        // if (this.attack_attr) {
        //     var m = this.attack_attr.match(re_tmp),
        //         attr1 = m[1],
        //         attr2 = m[2],
        //         mod = m[4] ? 1 + Number(m[4]) / 100 : 1;
        //     res.attack = Math.floor(mod * (this.hero.attributes[attr1].effective_value * 2 + this.hero.attributes[attr2].effective_value + this.effective_rank * 2));
        // }

        // if (this.defence_attr) {
        //     var m = this.defence_attr.match(re_tmp),
        //         attr1 = m[1],
        //         attr2 = m[2],
        //         mod = m[4] ? 1 + Number(m[4]) / 100 : 1;
        //     res.defence = Math.floor(mod * (this.hero.attributes[attr1].effective_value * 2 + this.hero.attributes[attr2].effective_value + this.effective_rank * 2));
        // }

        // if (this.effect_attr) {
        //     var m = this.effect_attr.match(re_tmp),
        //         attr1 = m[1],
        //         attr2 = m[2],
        //         mod = m[4] ? 1 + Number(m[4]) / 100 : 1;
        //     res.effect = Math.floor(mod * (this.hero.attributes[attr1].effective_value / 2 + this.hero.attributes[attr2].effective_value / 3 + this.effective_rank / 2));
        // }
    }

    calculateCost() {
        var cost = 0;

        if (this.primary) {
            for (var i = this.rank; i > 1; i--) cost += (Math.pow(i, 2) - i) * 20;
            if (cost === 0) cost = 40;
        }
        else if (this.secondary) {
            cost = _secCosts[this.rank] ? Number(_secCosts[this.rank]) : 0;
        }
        else if (this.exceptional) {
            cost = _excCosts[this.rank] ? Number(_excCosts[this.rank]) : 0;
        }
        else if (this.talent) {
            cost = _talCosts[this.rank] ? Number(_talCosts[this.rank]) : 0;
        }

        this.training_cost_ep = ('' + cost).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ");
        this.training_cost_gold = ('' + cost * 0.9).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ");
        return this;
    }
}
