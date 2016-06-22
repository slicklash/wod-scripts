/// <reference path="./_references.ts" />

// --- World

class World {
    classes = [];
    races = [];
    lexicon = {};
    locale: string;

    constructor() {
        this.locale = location.hostname.substr(location.hostname.lastIndexOf('.') + 1);
        if (this.locale === 'net')
            this.locale = 'en';
    }

    parse(classRaceHtml) {
        var tmp = add('div');
        tmp.innerHTML = classRaceHtml;

        var form = $('form', tmp)[1],
            rows = $('.content_table tbody tr', form);

        if (!rows && rows.length === 0)
            return;

        for (var i = 1, cnt = rows.length; i < cnt; i++) {
            var cells     = rows[i].cells,
                name      = innerText(cells[1]).trim(),
                          isRace    = attr($('img', cells[2]), 'src').indexOf('yes.png') > -1;

            if (isRace) {
                this.races.push(name);
            }
            else {
                this.classes.push(name);
            }
        }

        this.initLexicon();
    }

    initLexicon() {

        switch(this.locale)
        {
            default:
                this.lexicon = {
                    'Type'                  : 'type',
                    'Target'                : 'target',
                    'Item'                  : 'item',
                    'SkillClass'            : 'skill class',
                    'Attack'                : 'attack',
                    'AttackType'            : 'attack type',
                    'Damage'                : 'damage',
                    'Defence'               : 'defense',
                    'Initiative'            : 'initiative',
                    'Degradation'           : 'degradation',
                    'Improvement'           : 'improvement',
                    'Healing'               : 'healing',
                    'InRound'               : 'in round',
                    'InPreRound'            : 'in pre round',
                    'MayBeUsed'             : 'may be used',
                    'OnePosition'           : 'one position',
                    'MaxCharactersAffected' : 'Max. characters affected',
                    'MaxOpponentsAffected'  : 'Max. opponents affected',
                    'ManaCost'              : 'Mana points cost',
                    'OfHeroesLevel'         : '% of your hero`s level',
                    'OneEnemy'              : 'one enemy',
                    'OneTeam'               : 'one team'
                };
                break;
            case 'es':
                this.lexicon = {
                    'Type'                  : 'Tipo',
                    'Target'                : 'Objetivo',
                    'Item'                  : 'Objeto',
                    'SkillClass'            : 'Clase de habilidades',
                    'Attack'                : 'Ataque',
                    'AttackType'            : 'tipo de ataque',
                    'Damage'                : 'Daño',
                    'Defence'               : 'Parada',
                    'Initiative'            : 'Iniciativa',
                    'Degradation'           : 'Empeoramiento',
                    'Improvement'           : 'Mejora',
                    'Healing'               : 'Curación',
                    'InRound'               : 'in Ronda',
                    'InPreRound'            : 'in Ronda preliminar',
                    'MayBeUsed'             : 'may be used',
                    'OnePosition'           : 'una posición',
                    'MaxCharactersAffected' : 'Max. characters affected',
                    'MaxOpponentsAffected'  : 'Max. opponents affected',
                    'ManaCost'              : 'Costes de Puntos de mana',
                    'OfHeroesLevel'         : '% del nivel del héroe',
                    'OneEnemy'              : 'Un enemigo',
                    'OneTeam'               : 'one team'
                };
                break;
        }
    }
}
