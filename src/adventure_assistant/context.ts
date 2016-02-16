/// <reference path="_references.ts" />

interface IAdventureContext {
    idHero: string;
    adventure: string;
    place: string;
    texts: HTMLElement[];
}

let _context : IAdventureContext;

function getContext() : IAdventureContext {

    if (!_context) {

        let h1 = document.querySelector('h1'),
            title = h1 ? h1.textContent : '';

        if (!title || title.indexOf('adventure') !== 0) return;

        _context = {
            adventure : title.replace('adventure ', ''),
            texts: <any>Array.from(document.querySelectorAll('form > p, .REP_LVL_DESCRIPTION')),
            place : (document.querySelector('#smarttabs__level_inner h3 > a') || { textContent: '*' }).textContent,
            idHero : (<any>document.querySelector('[href*="session_hero_id"]')).href.match(/session_hero_id=([\d]+)/)[1],
        };

    }

    return _context;
}
