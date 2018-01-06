
export const Quests = {
    IngenuityTest : 'Ingenuity Test',
    Passingtime : 'Passingtime',
    RescuingFatherWuel : 'Rescuing Father Wuel',
};

export interface IAdventureContext {
    idHero: string;
    world: string;
    adventure: string;
    place: string;
    texts: HTMLElement[];
    text: string;
    isQuest?: boolean;
}

let _context: IAdventureContext;

export function getContext(): IAdventureContext {

    if (!_context) {

        const h1 = document.querySelector('h1');
        const title = h1 ? h1.textContent : '';

        if (!title || title.indexOf('adventure') !== 0) {
          return;
        }

        const texts = <any> Array.from(document.querySelectorAll('form > p, .REP_LVL_DESCRIPTION'));

        texts.forEach(x => {
            x.innerHTML = x.innerHTML.replace(/&lt;font\s+color\s*=\s*["'](.+)["']&gt;/g, '<font color="$1">')
                .replace(/&lt;\/font&gt;/g, '</font>')
                .replace(/<br>\s+<br>/g, '<br>');
        });

        _context = {
            adventure : title.replace('adventure ', ''),
            idHero : (<any> document.querySelector('[href*="session_hero_id"]')).href.match(/session_hero_id=([\d]+)/)[1],
            place : (document.querySelector('#smarttabs__level_inner h3 > a') || { textContent: '*' }).textContent.trim(),
            text: texts.map(x => x.innerHTML.trim()).join(' '),
            texts,
            world: document.location.hostname.split('.')[0],
        };

        _context.isQuest = Object.keys(Quests).some(x => _context.adventure.indexOf(Quests[x]) > -1);
    }

    return _context;
}
