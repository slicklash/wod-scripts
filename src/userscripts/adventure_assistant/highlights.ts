import { IAdventureContext, Quests } from './context';

export function initHighlights(context: IAdventureContext) {

    if (!context || !context.isQuest) {
      return;
    }

    const { adventure, place } = context;
    const adventures = {};

    adventures[Quests.RescuingFatherWuel] = getWuelHighlights;
    adventures[Quests.Passingtime] = getPassingtimeHighlights;
    adventures[Quests.IngenuityTest] = getIngenuityTestHighlights;

    if (!(adventure in adventures)) {
      return;
    }

    const highlights = adventures[adventure]()[place];

    if (!highlights) {
      return;
    }

    const texts = context.texts.map(x => x.innerHTML);

    highlights.forEach(x => {

        const start = x.indexOf('_');
        const end = x.indexOf('_', start + 1);
        const search = new RegExp(start > -1 ? x.replace(/_/g, '') : x, 'g');
        const highlight = start > -1 ? `${x.substring(0, start)}<span style="color:orchid">${x.substring(start + 1, end)}</span>${x.substring(end + 1)}` : `<span style="color:orchid">${x}</span>`;

        texts.forEach((y, i) => { texts[i] = y.replace(search, highlight); });
    });

    context.texts.forEach((x, i) => { x.innerHTML = texts[i]; });
}

function getPassingtimeHighlights() {
    return {
        '*': ['bejeweled necklace'],
        'Grandfather answers': ['stonemasonry', 'carpenters', 'cobblers', 'bakers'],
    };
}

function getWuelHighlights() {
   return {
        '*': ['juicy fruits', 'food in layers', 'nutty things', 'fish with arms', 'things that zap',
              'things that are purple', 'things that glow in the dark', 'fishes with sharp teeth',
              'lavendar-colored wand', 'the _mayor_ here', 'taken _all the classes_', 'an unusual _iridescent one_',
              'fine _electric eel_', 'fine _octopus_', 'fine _lantern fish_', 'fine _puffer fish_', 'fine _mackerel_', 'fine _piranha_',
              'other _gear for mages_', 'other _ranged weapons_', 'other _armors_', 'other _melee weapons_', 'herbs, incense and poisons',
              'other enhanced _jewelry_', 'instruments and parchments', 'other _exotic items_'],
        'Kotko: church': ['enchanted band'],
        'Kotko: woman with red feather': ['peanuts', 'eggplant', 'banana', 'sandwich', 'orange', 'fried chicken'],
    };
}

function getIngenuityTestHighlights() {
    return {
        '*': ['bejeweled necklace', 'blue key', 'Large', 'Medium', 'Small', 'Tiny'],
        'Freshwater Spring': ['under _the water_'],
        'Middle of the River : Chatting': ['red key', 'crescent', 'rectangle', 'circle', 'heart', 'diamond', 'plus-sign', 'oval', 'star', 'triangle', 'square'],
        'Rialb\'s Ghost': ['purple key'],
        'The Fairytale Princess': ['pink hair ribbons'],
        'The Hut': ['Turquoise', 'Yellow', 'Green', 'Red', 'Magenta', 'Black', 'Blue', 'Purple', 'Orange', 'White'],
    };
}
