/// <reference path="_references.ts" />

const RescuingFatherWuel = 'Rescuing Father Wuel';
const Passingtime = 'Passingtime';
const IngenuityTest = 'Ingenuity Test';

function initHighlights(context: IAdventureContext) {

    let { adventure, place } = context,
        adventures = {};

    adventures[RescuingFatherWuel] = getWuelHighlights;
    adventures[Passingtime] = getPassingtimeHighlights;
    adventures[IngenuityTest] = getIngenuityTestHighlights;

    if (!(adventure in adventures)) return;

    let highlights = adventures[adventure]()[place];

    if (!highlights) return;

    let texts = context.texts.map(x => x.innerHTML);

    highlights.forEach(x => {

        let start = x.indexOf('_'),
            end = x.indexOf('_', start + 1),
            search = new RegExp(start > -1 ? x.replace(/_/g, '') : x, 'g'),
            highlight = start > -1 ? `${x.substring(0, start)}<span style="color:orchid">${x.substring(start + 1, end)}</span>${x.substring(end + 1)}` : `<span style="color:orchid">${x}</span>`;

        texts.forEach((x,i) => { texts[i] = x.replace(search, highlight) });
    });

    context.texts.forEach((x,i) => { x.innerHTML = texts[i] });
}

function getPassingtimeHighlights() {
    return {
        '*': ['bejeweled necklace'],
        'Grandfather answers': ['stonemasonry', 'carpenters']
    };
}

function getWuelHighlights() {
   return {
        '*': ['juicy fruits', 'food in layers', 'nutty things', 'fish with arms', 'things that zap',
              'lavendar-colored wand', 'the _mayor_ here', 'taken _all the classes_', 'an unusual _iridescent one_',
              'fine _electric eel_', 'fine _octopus_', 'fine _lantern fish_', 'fine _puffer fish_', 'fine _mackerel_', 'fine _piranha_',
              'other _gear for mages_', 'other _ranged weapons_', 'other _armors_', 'other _melee weapons_', 'herbs, incense and poisons', 'other enhanced _jewelry_', 'instruments and parchments', 'other _exotic items_'],
        'Kotko: church': ['enchanted band'],
        'Kotko: woman with red feather': ['peanuts', 'eggplant', 'banana', 'sandwich', 'orange', 'fried chicken']
    };
}

function getIngenuityTestHighlights() {
    return {
        '*': ['bejeweled necklace', 'blue key', 'Large', 'Medium', 'Small', 'Tiny'],
        'Middle of the River : Chatting': ['red key', 'crescent', 'rectangle', 'circle', 'heart', 'diamond', 'plus-sign', 'oval', 'star', 'triangle', 'square'],
        'Freshwater Spring': ['under _the water_'],
        'The Fairytale Princess': ['pink hair ribbons'],
        'The Hut': ['Turquoise', 'Yellow', 'Green', 'Red', 'Magenta', 'Black', 'Blue', 'Purple', 'Orange', 'White']
    };
}

