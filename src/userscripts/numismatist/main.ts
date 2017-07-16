import { parseHTML } from '../../common/dom/parse-html'
// import { add } from '../../common/dom/add'
// import { attr } from '../../common/dom/attr'
// import { textContent } from '../../common/dom/text-content'
// import { insertAfter } from '../../common/dom/insert-after'
import { httpFetch } from '../../common/net/http-fetch'

export function main (main_content?) {

    let idGroup = (<any>document.forms).the_form.gruppe_id.value;

    debugger

    getGroupHeroes(idGroup).then(getMedalInfo);
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

function getMedalInfo(profiles: IHeroProfileInfo[]) : Promise<any> {

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

    return Promise.all(promises);
}


if (!(<any>window).__karma__) document.addEventListener('DOMContentLoaded', () => main());
