import { add } from '@common/dom/add';
import { attr } from '@common/dom/attr';
import { cssClass } from '@common/dom/css-class';
import { waitFor } from '@common/dom/wait-for';

// --- Main

const MENU_NAME        = 'Favorites';

const MENU_LAYOUT = {
   my_heroes: [
        'My Heroes', {
            hero_attributes       : 'Attributes',
            hero_skills           : 'Skills',
            hero_gear             : 'Equipment',
            hero_storage          : 'Storage',
            hero_cellar           : 'Cellar',
            hero_skillconf        : 'Settings',
            arena                 : 'Arena',
            hero_profiles         : 'Profile',
            hero_events           : 'Adventures',
        },
    ],
    group: [
        'My Group', {
            dungeon               : 'Dungeon',
            reports               : 'Reports',
            hero_group_cellar     : 'GS',
            hero_group_treasure   : 'TV',
            group_cashbox         : 'Funds',
        },
    ],
    trade_exchange: [
        'Trade', {
            trade_market          : 'Marketplace',
            trade_auction         : 'Auctions',
            trade_bids            : 'Offers',
        },
    ],
    recruite_ranking: [
        'Leaderboard', {
            duells_ranking_groups : 'Groups',
            duells_ranking_clans  : 'Clans',
        },
    ],
};

function main(verticalMenu: HTMLElement) {

    if (!verticalMenu) return;

    const match_skin = (<any> document.querySelector('link[href*="skin"]')).href.match(/skin[0-9\-]+/i);
    const skin = match_skin ? match_skin[0] : '';
    const font_render_url = `${window.location.protocol}//fonts.neise-games.de/java_font_renderer/render?skin=${skin}`;
    const fav_menu = add<HTMLDivElement>('div');
    const caption = add<HTMLAnchorElement>('a', fav_menu);
    const supports_img = skin !== 'skin-1';

    attr(fav_menu, { class: 'menu-1', id: 'menu_my_menu' });
    attr(caption, { class: 'menu-1-caption alink selected', onclick: "return menuOnClick(this,'','','');" });

    if (supports_img) {
        attr(add('img', caption), { class: 'font_menu-1', alt: MENU_NAME, src : font_render_url + '&profil=font_menu-1&text=' + MENU_NAME });
        attr(add('img', caption), { class: 'font_menu-1-hovered', alt: MENU_NAME, src : font_render_url + '&profil=font_menu-1-hovered&text=' + MENU_NAME });
        attr(add('img', caption), { class: 'font_menu-1-selected', alt: MENU_NAME, src : font_render_url + '&profil=font_menu-1-selected&text=' + MENU_NAME });
    } else {
        caption.textContent = MENU_NAME;
    }

    attr(add('span', caption), 'class', 'menu-1-arrow open');

    const menu0 = add('div', fav_menu);
    const menu_body = add('div', menu0);
    const menu_items = {};
    const open_links = {};

    attr(menu0, { class: 'menu-1-body', style : 'display: block' });
    attr(menu_body, 'class', 'menu-2');

    let match_name;
    const menu1 = Array.from(verticalMenu.querySelectorAll('.menu-1'));

    menu1.forEach(open_menu => {

        if (cssClass(open_menu, 'open')) {

            const tmp = open_menu.querySelectorAll('a');

            for (let j = 0, c2 = tmp.length; j < c2; j++) {
                match_name = attr(tmp[j], 'onclick').match(/'([a-z_ ]+)',''\);$/i);
                if (match_name) open_links[match_name[1]] = open_menu;
            }
        }
    });

    const links = verticalMenu.querySelectorAll('.menu-2 a');

    for (let i = 0, cnt = links.length; i < cnt; i++) {

        const link = links[i];

        match_name = attr(link, 'onclick').match(/'([a-z_ ]+)',''\);$/i);

        if (match_name) {
            menu_items[match_name[1]] = link.cloneNode(true);
            // console.log(match_name[1], ' : ', link.innerText.replace(/^\s+|\s+$/g,""));
        }
    }

    Object.keys(MENU_LAYOUT).forEach(key => {

        let link = menu_items[key];
        let submenu;

        if (!link) {
            link = add('a');
            attr(link, { href: '#', class: 'menu-2-caption' });
        }

        attr(link, 'onclick', null, true);

        const menu_item = MENU_LAYOUT[key];

        if (typeof menu_item === 'string') {

            link.innerHTML = menu_item;

            const open_menu = open_links[key];

            if (open_menu) {

                const arrow = open_menu.querySelector('.menu-1-arrow');

                cssClass(open_menu, 'open', false);

                if (arrow) {
                    cssClass(arrow, 'open', false);
                    cssClass(arrow, 'closed', true);
                }
            }
        } else {

            link.textContent = menu_item[0];

            const submenu_items = menu_item[1];

            submenu = add('div');

            attr(submenu, { class: 'menu-2-body', style: 'padding-top: 0px' });

            Object.keys(submenu_items).forEach(subkey => {

                const sublink = menu_items[subkey];

                if (sublink) {

                    attr(sublink, 'onclick', null, true);

                    const menu3 = add<HTMLDivElement>('div', submenu);
                    const menu3_cap = add<HTMLAnchorElement>(sublink, menu3);

                    attr(menu3, 'class', 'menu-3');
                    cssClass(menu3_cap, 'menu-2-caption', false);
                    cssClass(menu3_cap, 'menu-3-caption', true);

                    menu3_cap.innerHTML = submenu_items[subkey];

                    const open_menu = open_links[subkey];

                    if (open_menu) {

                        const arrow = open_menu.querySelector('.menu-1-arrow');

                        cssClass(open_menu, 'open', false);

                        if (arrow) {
                            cssClass(arrow, 'open', false);
                            cssClass(arrow, 'closed', true);
                        }
                    }
                }
            });
        }

        const new_menu = add('div', menu_body);
        attr(new_menu, 'class', 'menu-2 open');
        add(link, new_menu);
        if (submenu) add(submenu, new_menu);
    });

    const menu_between = add<HTMLDivElement>('div');
    attr(menu_between, 'class', 'menu-between');
    verticalMenu.insertBefore(menu_between, verticalMenu.firstChild);
    verticalMenu.insertBefore(fav_menu, verticalMenu.firstChild);
}

waitFor('.menu-vertical .menu-0-body').then(main);
