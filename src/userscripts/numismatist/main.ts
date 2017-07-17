import { parseHTML } from '../../common/dom/parse-html'
import { add } from '../../common/dom/add'
import { attr } from '../../common/dom/attr'
import { httpFetch } from '../../common/net/http-fetch'

export function main (main_content?) {

    let idGroup = (<any>document.forms).the_form.gruppe_id.value;

    getGroupHeroes(idGroup).then(getMedalInfo)
                           .then(showMedalInfo);
}

interface IHeroProfileInfo {
    name: string;
    url: string;
    medals?: string[];
}

function getGroupHeroes(idGroup: string): Promise<IHeroProfileInfo[]> {

    return new Promise((resolve, reject) => {

        httpFetch(`/wod/spiel/dungeon/group.php?id=${idGroup}`).catch(reject).then(resp => {

            let heroProfiles = (Array.from((parseHTML<HTMLElement>(resp.data, true))
                                                         .querySelectorAll('.main_content tbody .content_table_mainline a')) as HTMLAnchorElement[])
                                                         .map(x => { return { name: x.textContent, url: x.getAttribute('href') } });

            resolve(heroProfiles);
        });
    });

}

function getMedalInfo(profiles: IHeroProfileInfo[]) : Promise<IHeroProfileInfo[]> {

    let promises = profiles.map(profile => new Promise((resolve, reject) => {

        httpFetch(profile.url).then(resp => {

            let url = (Array.from((parseHTML<HTMLElement>(resp.data, true)).querySelectorAll('#smarttabs__details_inner a')) as HTMLAnchorElement[])
                            .map(x => x.getAttribute('href'))
                            .find(x => x && x.includes('goallist'));

            httpFetch(url).then(resp2 => {

                profile.medals = Array.from((parseHTML<HTMLElement>(resp2.data, true)).querySelectorAll('.details.earned .label'))
                                      .map(x => x.innerHTML);

                resolve(profile);
            });
        });

    }));

    return <any>Promise.all(promises);
}

function showMedalInfo(profiles: IHeroProfileInfo[]) {

    let map: { [x: string]: string[] } = profiles.reduce((acc, x) => {

        x.medals.forEach(m => {
            let key = m.toLowerCase();
            if (!Array.isArray(acc[key])) acc[key] = [];
            acc[key].push(x.name);
        });

        return acc;

    }, <any>{});

    let dungeons = Array.from(document.querySelectorAll('#main_content .content_table tbody tr td:nth-child(2)'));

    dungeons.forEach(td => {

        let key = td.textContent.trim().toLowerCase();
        let heroes = map[key] || [];
        let allHeroes = heroes.length === profiles.length;

        if (!allHeroes) {
            let text = profiles.filter(x => heroes.indexOf(x.name) < 0).map(x => x.name).join('\n');
            td.setAttribute('title', text);
        }

        let img: HTMLImageElement = add('img', td);

        img.src = `/wod/css/icons/common/${allHeroes ? 'medal_big' : 'medal_big_gray' }.png`;
        attr(img, 'style', 'width: 24px');
    });

}


if (!(<any>window).__karma__) document.addEventListener('DOMContentLoaded', () => main());
