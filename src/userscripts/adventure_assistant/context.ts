/// <reference path="_references.ts" />

const Quests = {
    RescuingFatherWuel : 'Rescuing Father Wuel',
    Passingtime : 'Passingtime',
    IngenuityTest : 'Ingenuity Test'
}

interface IAdventureContext {
    idHero: string;
    world: string;
    adventure: string;
    place: string;
    texts: HTMLElement[];
    text: string;
    isQuest?: boolean;
}

let _context : IAdventureContext;

function getContext() : IAdventureContext {

    if (!_context) {

        let h1 = document.querySelector('h1'),
            title = h1 ? h1.textContent : '';

        if (!title || title.indexOf('adventure') !== 0) return;

        let texts = <any>Array.from(document.querySelectorAll('form > p, .REP_LVL_DESCRIPTION'));

        _context = {
            adventure : title.replace('adventure ', ''),
            texts: texts,
            text: texts.map(x => x.innerHTML.trim()).join(' '),
            place : (document.querySelector('#smarttabs__level_inner h3 > a') || { textContent: '*' }).textContent.trim(),
            idHero : (<any>document.querySelector('[href*="session_hero_id"]')).href.match(/session_hero_id=([\d]+)/)[1],
            world: document.location.hostname.split('.')[0]
        };

        _context.isQuest = Object.keys(Quests).some(x => _context.adventure.indexOf(Quests[x]) > -1);
    }

    return _context;
}
