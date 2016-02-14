/// <reference path="_references.ts" />

interface IAdventureContext {
    idHero: string;
    adventure: string;
    place: string;
    description: HTMLElement;
    finding: HTMLElement;
}

let _context : IAdventureContext;

function getContext() : IAdventureContext {

    if (!_context) {

        let h1 = document.querySelector('h1'),
            title = h1 ? h1.textContent : '';

        if (!title || title.indexOf('adventure') !== 0) return;

        let description = <any>document.querySelector('.REP_LVL_DESCRIPTION');

        _context = {
            adventure : title.replace('adventure ', ''),
            description: description,
            finding: <any>document.querySelector('p label'),
            place : description ? description.parentElement.querySelector('h3 > a').textContent : '*',
            idHero : (<any>document.querySelector('[href*="session_hero_id"]')).href.match(/session_hero_id=([\d]+)/)[1],
        };

        if (!_context.description) _context.description = <any>h1.parentElement.querySelector('p');
    }

    return _context;
}
