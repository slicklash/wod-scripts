import { parseHTML } from '@common/dom/parse-html';
import { add } from '@common/dom/add';
import { attr } from '@common/dom/attr';
import { httpFetch } from '@common/net/http-fetch';
import { log } from '@common/debugging/log';

export function main(main_content?) {

    const isDungeonList = location.pathname.includes('dungeonlist');
    const idGroup = (<any> document.forms).the_form.gruppe_id.value;

    const p = getGroupHeroes(idGroup).then(getHeroProfiles.bind(null, isDungeonList));

    if (isDungeonList) {
        p.then(showDungeonMedalInfo);
    } else if (location.pathname.includes('title_list')) {
        p.then(showFameMedalInfo);
    } else {
        p.then(showLevelUpMedalInfo);
    }
}

interface IHero {
    name: string;
    profileUrl: string;
}

interface IHeroProfileInfo extends IHero {
    medals?: string[];
    fame?: number;
    exp?: number;
    isMentor: boolean;
}

function getGroupHeroes(idGroup: string): Promise<IHero[]> {

    return new Promise((resolve, reject) => {

        httpFetch(`/wod/spiel/dungeon/group.php?id=${idGroup}`).catch(reject).then(resp => {

            const groupHeroes = (Array.from((parseHTML<HTMLElement>(resp.data, true)).querySelectorAll('.main_content tbody .content_table_mainline a')) as HTMLAnchorElement[])
                                    .map(x => ({ name: x.textContent, profileUrl: x.getAttribute('href') }) );

            resolve(groupHeroes);
        });
    });
}

function getHeroProfiles(includeMedals: boolean, groupHeroes: IHero[]): Promise<IHeroProfileInfo[]> {
    return <any> Promise.all(groupHeroes.map(hero => parseProfile(includeMedals, hero)));
}

function parseProfile(includeMedals: boolean, hero: IHero): Promise<IHeroProfileInfo> {

    return new Promise((resolve, reject) => {

        httpFetch(hero.profileUrl).catch(reject).then(resp => {

            const html = parseHTML<HTMLElement>(resp.data, true);
            const profile: IHeroProfileInfo =  { name: hero.name, profileUrl: hero.profileUrl, isMentor: true };

            const rows = (Array.from(html.querySelectorAll('.content_table tr'))) as HTMLTableRowElement[];

            rows.forEach(x => {
                if (x.cells[0].textContent.trim() === 'class') {
                    profile.isMentor = x.cells[1].textContent.trim().includes('Mentor');
                } else if (x.cells[0].textContent.trim() === 'fame') {
                    profile.fame = Number(x.cells[1].textContent.replace(/ /g, ''));
                } else if (x.cells[0].textContent.trim().includes('gained')) {
                    profile.exp = Number(x.cells[1].textContent.replace(/ /g, ''));
                }
            });

            if (!includeMedals || profile.isMentor) {
                resolve(profile);
                return;
            }

            const medalsUrl = (Array.from(html.querySelectorAll('#smarttabs__details_inner a')) as HTMLAnchorElement[])
                                  .map(x => x.getAttribute('href'))
                                  .find(x => x && x.includes('goallist'));

            httpFetch(medalsUrl).catch(reject).then(resp2 => {

                profile.medals = Array.from((parseHTML<HTMLElement>(resp2.data, true)).querySelectorAll('.details.earned .label'))
                                      .map(x => x.innerHTML);

                resolve(profile);
            });
        });
    });
}

function showLevelUpMedalInfo(profiles: IHeroProfileInfo[]) {

    const rows: HTMLTableRowElement[] = <any> Array.from(document.querySelectorAll('.content_table tr'));

    const nonMentors = profiles.filter(x => !x.isMentor);

    rows.forEach((tr, i) => {

        const td = tr.cells[0];
        td.setAttribute('style', 'min-width: 50px');

        if (i > 2) {

            const requiredExp = parseInt(tr.cells[2].textContent.replace(/\s/g, ''), 10);
            const notObtained = nonMentors.filter(x => x.exp < requiredExp)
                                          .map(x => `${x.name} (${(requiredExp - x.exp).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ")})`).sort();

            if (notObtained.length) {
                addMedalIcon(false, td, 'left');
                tr.setAttribute('title', `Exp deficit (${notObtained.length}):\n\n${notObtained.join('\n')}`);
            } else {
                addMedalIcon(true, td, 'left');
            }
        }
    });
}

function showFameMedalInfo(profiles: IHeroProfileInfo[]) {

    const rows: HTMLTableRowElement[] = <any> Array.from(document.querySelectorAll('.content_table tr'));
    const medals = ['pin', 'oak leaf', 'shamrock', 'laurel'];
    const nonMentors = profiles.filter(x => !x.isMentor);

    rows.forEach((tr, i) => {

        const td = add<HTMLTableCellElement>('td');
        td.setAttribute('style', 'min-width: 210px');

        if (i > 0) {
            const name = `${i > 4 ? 'large' : ''}${medals[(i - 1) % medals.length]}${i > 12 ? ' of honor' : i > 8 ? ' and ribbon' : ''}`;
            const a = add<HTMLAnchorElement>('a', td);
            a.href = `/wod/spiel/hero/item.php?name=${name.replace(/ /g, '+')}&is_popup=1`;
            a.target = '_blank';
            a.textContent = name;

            const requiredFame = parseInt(tr.cells[0].textContent.replace(/\d+. title/, ''), 10);
            const notObtained = nonMentors.filter(x => x.fame < requiredFame)
                                          .map(x => `${x.name} (${(requiredFame - x.fame).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ")})`).sort();

            if (notObtained.length) {
                addMedalIcon(false, td);
                tr.setAttribute('title', `Fame deficit (${notObtained.length}):\n\n${notObtained.join('\n')}`);
            } else {
                addMedalIcon(true, td);
            }
        } else {
            td.innerHTML = '<strong>medal</strong>';
        }

        tr.insertBefore(td, tr.cells[1]);
    });
}

function showDungeonMedalInfo(profiles: IHeroProfileInfo[]) {

    const map: { [x: string]: string[] } = profiles.reduce((acc, x) => {

        x.medals.forEach(m => {
            const key = m.toLowerCase();
            if (!Array.isArray(acc[key])) acc[key] = [];
            acc[key].push(x.name);
        });

        return acc;

    }, <any> {});

    const dungeons = Array.from(document.querySelectorAll('#main_content .content_table tbody tr td:nth-child(2)'));

    const nonMentors = profiles.filter(x => !x.isMentor);

    dungeons.forEach(td => {

        const key = td.textContent.trim().toLowerCase().replace('the treasure map', 'treasure map');
        const heroes = map[key] || [];
        const allHeroes = profiles.length && heroes.length === nonMentors.length;

        if (!allHeroes) {
            const notObtained = profiles.filter(x => heroes.indexOf(x.name) < 0).map(x => x.name).sort();
            td.setAttribute('title', `Missing medal (${notObtained.length}):\n\n${notObtained.join('\n')}`);
        }

        addMedalIcon(allHeroes, td);
    });
}

function addMedalIcon(isAchieved: boolean, elem: Element, position: string = 'right') {

    const img: HTMLImageElement = add<HTMLImageElement>('img', elem);

    img.src = `/wod/css/icons/common/${isAchieved ? 'medal_big' : 'medal_big_gray' }.png`;
    attr(img, 'style', 'width: 24px; float: ' + position);
}

if (!(<any> window).__karma__) document.addEventListener('DOMContentLoaded', () => main());
