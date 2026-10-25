// ==UserScript==
// @name           Numismatist
// @description    Shows medal summary for whole group
// @version        1.2.1
// @downloadURL    https://raw.github.com/slicklash/wod-scripts/master/release/numismatist.user.js
// @author         Never
// @include        http*://*.world-of-dungeons.*/wod/spiel/dungeon/dungeon.php*
// @include        http*://*.world-of-dungeons.*/wod/spiel/help/dungeonlist.php*
// @include        http*://*.world-of-dungeons.*/wod/spiel/hero/title_list.php?menukey=hero_titles*
// @include        http*://*.world-of-dungeons.*/wod/spiel/hero/advance.php?menukey=level_costs*
// @run-at         document-start
// @grant          GM.xmlHttpRequest
// @grant          GM.getValue
// @grant          GM.setValue
// ==/UserScript==

(function() {
'use strict';
function add(tag, parent, innerHTML) {
    const elem = typeof tag === "string" ? document.createElement(tag) : tag;
    if (parent?.nodeType)
        parent.appendChild(elem);
    if (innerHTML)
        elem.innerHTML = innerHTML;
    return elem;
}
function attr(elem, nameOrMap, value) {
    if (typeof nameOrMap === "string") {
        if (value === undefined)
            return elem.getAttribute(nameOrMap) ?? "";
        if (value === null)
            elem.removeAttribute(nameOrMap);
        else
            elem.setAttribute(nameOrMap, value);
    }
    else {
        Object.entries(nameOrMap).forEach(([k, v]) => v === null ? elem.removeAttribute(k) : elem.setAttribute(k, v));
    }
    return elem;
}
function parseHtml(str, returnBody) {
    const e = document.implementation.createHTMLDocument();
    e.body.innerHTML = str;
    return returnBody ? e.body : e.body.children.length === 1 ? e.body.children[0] : e.body.children;
}
function httpFetch(url, method = "GET", body) {
    return new Promise((resolve, reject) => {
        const isJSON = typeof body !== "string";
        GM.xmlHttpRequest({
            method,
            url,
            headers: body !== undefined && isJSON
                ? { "Content-Type": "application/json" }
                : {},
            data: body === undefined ? undefined : isJSON ? JSON.stringify(body) : body,
            onload: ({ readyState, status, responseText, responseHeaders }) => {
                if (readyState !== 4)
                    return;
                const type = responseHeaders
                    .match(/^content-type:\s*([^;\r\n]+)/im)?.[1]
                    .trim()
                    .toLowerCase();
                const data = type?.includes("json")
                    ? JSON.parse(responseText)
                    : responseText;
                if (status >= 200 && status < 300)
                    resolve({ data });
                else
                    reject({ status, data });
            },
            onerror: reject,
        });
    });
}
var Store = {
    get(key, defaultValue) {
        return GM.getValue(key, defaultValue);
    },
    set(key, value) {
        return GM.setValue(key, value);
    },
};
const CACHE_KEY = "numismatist";
const FORM = () => document.forms.the_form.gruppe_id.value;
const normalize = (text) => text
    .replace("swamp dragons", "swamp dragon")
    .replace(" revival", "")
    .replace("an awesome", "")
    .replace(/the /g, "")
    .trim();
const hash = (text) => Math.abs(text.padEnd(11, "0").split("").map((x) => x.charCodeAt(0)).reduce((a, x) => (a + ((a << 7) + (a << 3))) ^ x)).toString(16);
const html = (data) => parseHtml(data, true);
const text = (el) => el?.textContent?.trim() || "";
const number = (value) => Number(value.replace(/\s/g, ""));
const rows = () => Array.from(document.querySelectorAll(".content_table tr"));
const getLastReportKey = async () => {
    const resp = await httpFetch("/wod/spiel/dungeon/report.php?menukey=reports");
    const last = resp && html(resp.data).querySelector("#main_content .row0");
    return last ? hash(text(last)) : "none";
};
async function getGroupHeroes(id) {
    const resp = await httpFetch(`/wod/spiel/dungeon/group.php?id=${id}`);
    if (!resp)
        throw new Error("Failed to load group heroes");
    return Array.from(html(resp.data).querySelectorAll(".main_content tbody .content_table_mainline a")).map((a) => ({ name: text(a), profileUrl: a.getAttribute("href") || "" }));
}
const getHeroProfiles = (heroes) => Promise.all(heroes.map(parseProfile));
async function parseProfile(hero) {
    const resp = await httpFetch(hero.profileUrl);
    if (!resp)
        throw new Error(`Failed to load profile: ${hero.name}`);
    const doc = html(resp.data);
    const profile = { name: hero.name, isMentor: true };
    doc.querySelectorAll(".content_table tr").forEach((row) => {
        const cells = row.querySelectorAll("td");
        const key = text(cells[0]);
        const value = text(cells[1]);
        if (key === "class")
            profile.isMentor = value.includes("Mentor");
        if (key === "fame")
            profile.fame = number(value);
        if (key.includes("gained"))
            profile.exp = number(value);
    });
    if (profile.isMentor)
        return profile;
    const medalsUrl = Array.from(doc.querySelectorAll("#smarttabs__details_inner a"))
        .map((a) => a.getAttribute("href"))
        .find((url) => url?.includes("goallist"));
    if (!medalsUrl) {
        profile.medals = [];
        return profile;
    }
    try {
        const resp = await httpFetch(medalsUrl);
        profile.medals = resp
            ? Array.from(html(resp.data).querySelectorAll(".details.earned .label")).map((el) => hash(normalize(text(el).toLowerCase())))
            : [];
    }
    catch {
        profile.medals = [];
    }
    return profile;
}
async function buildCache(groupId) {
    const profiles = await getHeroProfiles(await getGroupHeroes(groupId));
    const cache = {
        key: await getLastReportKey(),
        groupId,
        heroes: profiles.filter((hero) => !hero.isMentor),
    };
    await Store.set(CACHE_KEY, JSON.stringify(cache));
    return cache;
}
async function main() {
    const groupId = FORM();
    if (!groupId)
        return;
    const key = await getLastReportKey();
    let cache = JSON.parse(await Store.get(CACHE_KEY, "{}"));
    if (cache.key !== key || cache.groupId !== groupId) {
        cache = await buildCache(groupId);
    }
    const heroes = cache.heroes || [];
    const path = location.pathname;
    if (path.includes("dungeonlist"))
        showDungeonMedalInfo(heroes);
    else if (path.includes("title_list"))
        showFameMedalInfo(heroes);
    else if (path.includes("dungeon/dungeon.php"))
        showDungeonMedalInfo(heroes, true);
    else
        showLevelUpMedalInfo(heroes);
}
const formatNumber = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const setMissingTitle = (row, type, names) => {
    row.setAttribute("title", `${type} (${names.length}):\n\n${names.join("\n")}`);
};
function showLevelUpMedalInfo(profiles) {
    rows().forEach((tr, i) => {
        const td = tr.cells[0];
        td.setAttribute("style", "min-width: 50px");
        if (i <= 2)
            return;
        const required = parseInt(tr.cells[2].textContent.replace(/\s/g, ""), 10);
        const missing = profiles
            .filter((hero) => hero.exp && hero.exp < required)
            .map((hero) => ({
            name: `${hero.name} (${formatNumber(required - hero.exp)})`,
            deficit: required - hero.exp,
        }))
            .sort((a, b) => a.deficit - b.deficit)
            .map((hero) => hero.name);
        addMedalIcon(!missing.length, td, "left");
        if (missing.length)
            setMissingTitle(tr, "Exp deficit", missing);
    });
}
function showFameMedalInfo(profiles) {
    const medals = ["pin", "oak leaf", "shamrock", "laurel"];
    rows().forEach((tr, i) => {
        const td = add("td");
        td.setAttribute("style", "min-width: 210px");
        if (i === 0) {
            td.innerHTML = "<strong>medal</strong>";
        }
        else {
            const name = `${i > 4 ? "large " : ""}${medals[(i - 1) % 4]}${i > 12 ? " of honor" : i > 8 ? " and ribbon" : ""}`;
            const a = add("a", td);
            a.href = `/wod/spiel/hero/item.php?name=${name.replace(/ /g, "+")}&is_popup=1`;
            a.target = "_blank";
            a.textContent = name;
            const required = parseInt(tr.cells[0].textContent.replace(/\d+. title/, ""), 10);
            const missing = profiles
                .filter((hero) => hero.fame && hero.fame < required)
                .map((hero) => `${hero.name} (${formatNumber(required - hero.fame)})`)
                .sort();
            addMedalIcon(!missing.length, td);
            if (missing.length)
                setMissingTitle(tr, "Fame deficit", missing);
        }
        tr.insertBefore(td, tr.cells[1]);
    });
}
function showDungeonMedalInfo(profiles, dungeonPage = false) {
    const medals = {};
    profiles.forEach((hero) => (hero.medals || []).forEach((medal) => {
        (medals[medal.toLowerCase()] ||= []).push(hero.name);
    }));
    document
        .querySelectorAll(`#main_content .content_table > tbody > tr > td:nth-child(${dungeonPage ? 1 : 2})`)
        .forEach((td) => {
        const key = hash(normalize(text(td).toLowerCase()));
        const heroes = medals[key] || [];
        const achieved = profiles.length > 0 && heroes.length === profiles.length;
        if (!achieved) {
            const missing = profiles
                .filter((hero) => !heroes.includes(hero.name))
                .map((hero) => hero.name)
                .sort();
            setMissingTitle(td, "Missing medal", missing);
        }
        addMedalIcon(achieved, td);
    });
}
function addMedalIcon(achieved, elem, position = "right") {
    const img = add("img", elem);
    img.src = `/wod/css/icons/common/medal_big${achieved ? "" : "_gray"}.png`;
    attr(img, "style", `width: 24px; float: ${position}`);
}
if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", main, { once: true });
else
    main();

})();