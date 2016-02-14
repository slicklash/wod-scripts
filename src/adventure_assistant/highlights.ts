/// <reference path="_references.ts" />

const RescuingFatherWuel = 'Rescuing Father Wuel';

function initHighlights(context: IAdventureContext) {

    console.log(context);

    let { adventure, place } = context;

    let adventures = {};

    adventures[RescuingFatherWuel] = {};

    if (!(adventure in adventures)) return;

    adventures[RescuingFatherWuel] = {
        '*': ['juicy fruits', 'food in layers', 'nutty things',
              'lavendar-colored wand', 'the _mayor_ here', 'taken _all the classes_', 'an unusual _iridescent one_',
              'fine _electric eel_', 'fine _octopus_', 'fine _lantern fish_', 'fine _puffer fish_', 'fine _mackerel_', 'fine _piranha_',
              'other _gear for mages_', 'other _ranged weapons_', 'other _armors_', 'other _melee weapons_', 'herbs, incense and poisons', 'other enhanced _jewelry_', 'instruments and parchments', 'other _exotic items_'],
        'Kotko: church': ['enchanted band'],
        'Kotko: woman with red feather': ['peanuts', 'eggplant', 'banana', 'sandwich', 'orange']
    };

    let highlights = adventures[adventure][place];

    if (!highlights) return;

    let descriptionText = context.description.innerHTML,
        findingText = context.finding ? context.finding.innerHTML : '';

    highlights.forEach(x => {

        let start = x.indexOf('_'),
            end = x.indexOf('_', start + 1),
            search = new RegExp(start > -1 ? x.replace(/_/g, '') : x, 'g'),
            highlight = start > -1 ? `${x.substring(0, start)}<span style="color:magenta">${x.substring(start + 1, end)}</span>${x.substring(end + 1)}` : `<span style="color:magenta">${x}</span>`;

        descriptionText = descriptionText.replace(search, highlight);
        if (findingText) findingText = findingText.replace(search, highlight);
    });

    context.description.innerHTML = descriptionText;
    if (findingText) context.finding.innerHTML = findingText;
}
