// ==UserScript==
// @name           Favorite Menu
// @description    Script allows to alter main menu by injecting customizable entries
// @version        2.0.0
// @author         Never
// @downloadURL    https://raw.github.com/slicklash/wod-scripts/master/release/favorite_menu.user.js
// @updateURL      https://raw.github.com/slicklash/wod-scripts/master/release/favorite_menu.user.js
// @match          https://*.world-of-dungeons.net/*
// @run-at         document-start
// @grant          none
// ==/UserScript==

(function() {
'use strict';
const MENU_NAME = "Favorites";
const MENU_LAYOUT = {
    my_heroes: [
        "My Heroes",
        {
            hero_attributes: "Attributes",
            hero_skills: "Skills",
            hero_gear: "Equipment",
            hero_storage: "Storage",
            hero_cellar: "Cellar",
            hero_skillconf: "Settings",
            arena: "Arena",
            hero_profiles: "Profile",
            hero_events: "Adventures",
        },
    ],
    group: [
        "My Group",
        {
            dungeon: "Dungeon",
            reports: "Reports",
            hero_group_cellar: "GS",
            hero_group_treasure: "TV",
            group_cashbox: "Funds",
        },
    ],
    trade_exchange: [
        "Trade",
        {
            trade_market: "Marketplace",
            trade_auction: "Auctions",
            trade_bids: "Offers",
        },
    ],
    recruite_ranking: [
        "Leaderboard",
        {
            duells_ranking_groups: "Groups",
            duells_ranking_clans: "Clans",
        },
    ],
};
function add(tagName, parent, innerHTML) {
    const elem = document.createElement(tagName);
    if (parent)
        parent.appendChild(elem);
    if (innerHTML)
        elem.innerHTML = innerHTML;
    return elem;
}
function attr(elem, nameOrMap, value) {
    if (typeof nameOrMap === "string") {
        if (value === undefined)
            return elem.getAttribute(nameOrMap);
        if (value === null)
            elem.removeAttribute(nameOrMap);
        else
            elem.setAttribute(nameOrMap, value);
    }
    else {
        Object.entries(nameOrMap).forEach(([k, v]) => (v === null ? elem.removeAttribute(k) : elem.setAttribute(k, v)));
    }
    return elem;
}
function cssClass(elem, name, toggle) {
    if (toggle === undefined)
        return elem.classList.contains(name);
    elem.classList.toggle(name, toggle);
    return elem;
}
function waitFor(selector) {
    return new Promise((resolve) => {
        const start = Date.now();
        const check = () => {
            const elem = document.querySelector(selector);
            if (elem || document.readyState === "complete" || Date.now() - start > 30_000)
                resolve(elem);
            else
                setTimeout(check, 250);
        };
        check();
    });
}
const REGEX_LINK = /'([a-z_ ]+)',''\);$/i;
function main(verticalMenu) {
    const skin = document.querySelector('link[href*="skin"]')?.href.match(/skin[0-9-]+/i)?.[0] ?? "";
    const fontUrl = `${location.protocol}//fonts.wod-game.de/java_font_renderer/render?skin=${skin}`;
    const favMenu = add("div");
    const caption = add("a", favMenu);
    attr(favMenu, { class: "menu-1", id: "menu_my_menu" });
    attr(caption, {
        class: "menu-1-caption alink selected",
        onclick: "return menuOnClick(this,'','','');",
    });
    if (skin === "skin-1") {
        caption.textContent = MENU_NAME;
    }
    else {
        for (const profile of ["", "-hovered", "-selected"]) {
            const name = `font_menu-1${profile}`;
            attr(add("img", caption), {
                class: name,
                alt: MENU_NAME,
                src: `${fontUrl}&profil=${name}&text=${MENU_NAME}`,
            });
        }
    }
    attr(add("span", caption), "class", "menu-1-arrow open");
    const menuBody = add("div", add("div", favMenu));
    attr(menuBody.parentElement, {
        class: "menu-1-body",
        style: "display: block",
    });
    attr(menuBody, "class", "menu-2");
    const items = {};
    const openMenus = {};
    const getName = (link) => attr(link, "onclick")?.match(REGEX_LINK)?.[1];
    const closeMenu = (name) => {
        const menu = openMenus[name];
        if (!menu)
            return;
        cssClass(menu, "open", false);
        const arrow = menu.querySelector(".menu-1-arrow");
        if (arrow) {
            cssClass(arrow, "open", false);
            cssClass(arrow, "closed", true);
        }
    };
    for (const menu of verticalMenu.querySelectorAll(".menu-1.open")) {
        for (const link of menu.querySelectorAll("a")) {
            const name = getName(link);
            if (name)
                openMenus[name] = menu;
        }
    }
    for (const link of verticalMenu.querySelectorAll(".menu-2 a")) {
        const name = getName(link);
        if (name)
            items[name] = link.cloneNode(true);
    }
    for (const [key, [label, children]] of Object.entries(MENU_LAYOUT)) {
        const link = items[key] ?? add("a");
        if (!items[key]) {
            attr(link, { href: "#", class: "menu-2-caption" });
        }
        attr(link, "onclick", null);
        link.textContent = label;
        let submenu;
        if (children) {
            submenu = add("div");
            attr(submenu, {
                class: "menu-2-body",
                style: "padding-top: 0px",
            });
            for (const [name, text] of Object.entries(children)) {
                const sublink = items[name];
                if (!sublink)
                    continue;
                attr(sublink, "onclick", null);
                const menu3 = add("div", submenu);
                attr(menu3, "class", "menu-3");
                cssClass(sublink, "menu-2-caption", false);
                cssClass(sublink, "menu-3-caption", true);
                sublink.textContent = text;
                menu3.appendChild(sublink);
                closeMenu(name);
            }
        }
        closeMenu(key);
        const menu = add("div", menuBody);
        attr(menu, "class", "menu-2 open");
        menu.appendChild(link);
        if (submenu)
            menu.appendChild(submenu);
    }
    const separator = add("div");
    attr(separator, "class", "menu-between");
    verticalMenu.prepend(separator, favMenu);
}
waitFor(".menu-vertical .menu-0-body").then((elem) => main(elem));

})();