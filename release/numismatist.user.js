// ==UserScript==
// @name           Numismatist
// @description    Shows medal summary for whole group
// @version        2.0.0
// @downloadURL    https://raw.github.com/slicklash/wod-scripts/master/release/numismatist.user.js
// @updateURL      https://raw.github.com/slicklash/wod-scripts/master/release/numismatist.user.js
// @author         Never
// @match          https://*.world-of-dungeons.net/wod/spiel/dungeon/dungeon.php*
// @match          https://*.world-of-dungeons.net/wod/spiel/help/dungeonlist.php*
// @match          https://*.world-of-dungeons.net/wod/spiel/hero/title_list.php?menukey=hero_titles*
// @match          https://*.world-of-dungeons.net/wod/spiel/hero/advance.php?menukey=level_costs*
// @run-at         document-end
// @grant          GM.xmlHttpRequest
// @grant          GM.getValue
// @grant          GM.setValue
// ==/UserScript==

(function() {
'use strict';
function parseHtml(str, returnBody) {
    const e = document.implementation.createHTMLDocument();
    e.body.innerHTML = str;
    return returnBody ? e.body : e.body.children.length === 1 ? e.body.children[0] : e.body.children;
}
function textNormalized(x, options) {
    const text = typeof x === "string" ? x : (x?.textContent ?? "");
    return (text ?? "")
        .replace(/&nbsp;/g, "\u00A0")
        .replace(/[\s\u00A0]+/g, options?.collapse === false ? "" : " ")
        .trim();
}
function httpFetch(url, method = "GET", body) {
    return new Promise((resolve, reject) => {
        const isJSON = typeof body !== "string";
        GM.xmlHttpRequest({
            method,
            url,
            headers: body !== undefined && isJSON ? { "Content-Type": "application/json" } : {},
            data: body === undefined ? undefined : isJSON ? JSON.stringify(body) : body,
            onload: ({ readyState, status, responseText, responseHeaders }) => {
                if (readyState !== 4)
                    return;
                const type = responseHeaders
                    ?.match(/^content-type:\s*([^;\r\n]+)/im)?.[1]
                    ?.trim()
                    ?.toLowerCase();
                const data = type?.includes("json") ? JSON.parse(responseText) : responseText;
                if (status >= 200 && status < 300)
                    resolve({ data });
                else
                    reject({ status, data });
            },
            onerror: reject,
        });
    });
}
const Store = {
    get(key, defaultValue) {
        return GM.getValue(key, "").then((raw) => {
            if (!raw)
                return defaultValue;
            try {
                return JSON.parse(raw);
            }
            catch {
                return defaultValue;
            }
        });
    },
    set(key, value) {
        return GM.setValue(key, JSON.stringify(value));
    },
};
async function batchMap(items, fn, options = {}) {
    const { limit = 3, skipErrors = false } = options;
    const results = [];
    for (let i = 0; i < items.length; i += limit) {
        const batch = items.slice(i, i + limit).entries();
        const promises = Array.from(batch, ([j, item]) => fn(item, j).catch((err) => {
            if (!skipErrors)
                throw err;
            return undefined;
        }));
        const done = await Promise.all(promises);
        for (const r of done) {
            if (r !== undefined)
                results.push(r);
        }
    }
    return results;
}
const hash = (text) => Math.abs([...text.padEnd(11, "0")].map((x) => x.charCodeAt(0)).reduce((a, x) => (a + ((a << 7) + (a << 3))) ^ x)).toString(16);
const CACHE_KEY = "numismatist";
const html = (data) => parseHtml(data, true);
const number = (value) => Number(value.replace(/\s/g, ""));
const normalizeDungeonName = (text) => text.replace("swamp dragons", "swamp dragon").replace(" revival", "").replace("an awesome", "").replace(/the /g, "").trim();
async function getLastReportKey() {
    const { data = "" } = await httpFetch("/wod/spiel/dungeon/report.php?menukey=reports");
    const last = html(data).querySelector("#main_content .row0");
    return last ? hash(textNormalized(last)) : "none";
}
async function getGroupHeroes(id) {
    const { data = "" } = await httpFetch(`/wod/spiel/dungeon/group.php?id=${id}`);
    if (!data)
        throw new Error("Failed to load group heroes");
    return Array.from(html(data).querySelectorAll(".main_content tbody .content_table_mainline a")).map((a) => ({
        name: textNormalized(a),
        profileUrl: a.getAttribute("href") || "",
    }));
}
async function parseProfile(hero) {
    const { data = "" } = await httpFetch(hero.profileUrl);
    if (!data)
        throw new Error(`Failed to load profile: ${hero.name}`);
    const doc = html(data);
    const profile = { name: hero.name, isMentor: true };
    doc.querySelectorAll(".content_table tr").forEach((row) => {
        const [keyCell, valueCell] = row.querySelectorAll("td");
        const key = textNormalized(keyCell);
        const value = textNormalized(valueCell);
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
        const { data = "" } = await httpFetch(medalsUrl);
        profile.medals = data ? Array.from(html(data).querySelectorAll(".details.earned .label")).map((el) => hash((0, normalizeDungeonName)(textNormalized(el).toLowerCase()))) : [];
    }
    catch {
        profile.medals = [];
    }
    return profile;
}
async function buildCache(groupId) {
    const profiles = await batchMap(await getGroupHeroes(groupId), parseProfile);
    const cache = { key: await getLastReportKey(), groupId, heroes: profiles.filter((hero) => !hero.isMentor) };
    await Store.set(CACHE_KEY, cache);
    return cache;
}
async function getCachedHeroes(groupId) {
    const key = await getLastReportKey();
    const cache = await Store.get(CACHE_KEY, { key: "", groupId: "", heroes: [] });
    if (cache.key !== key || cache.groupId !== groupId) {
        return (await buildCache(groupId)).heroes;
    }
    return cache.heroes;
}
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
function textContent(elem, value) {
    if (!elem)
        return "";
    return typeof value === "undefined" ? elem.textContent : (elem.textContent = value);
}
function formatNumber(number) {
    return number ? ("" + number).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1 ") : "0";
}
function addMedal(achieved, parent, position = "right") {
    attr(add("img", parent), {
        src: `/wod/css/icons/common/medal_big${achieved ? "" : "_gray"}.png`,
        style: `width: 24px; float: ${position}`,
    });
}
function setMissingTitle(row, type, names) {
    row.setAttribute("title", `${type} (${names.length}):\n\n${names.join("\n")}`);
}
function showLevelUpMedals(profiles) {
    document.querySelectorAll(".content_table tr").forEach((tr, i) => {
        const td = tr.cells[0];
        td.setAttribute("style", "min-width: 50px");
        if (i <= 2)
            return;
        const required = parseInt(textNormalized(tr.cells[2].textContent ?? "", { collapse: false }), 10);
        const missing = profiles
            .filter((hero) => hero.exp && hero.exp < required)
            .map((hero) => ({ name: `${hero.name} (${formatNumber(required - hero.exp)})`, deficit: required - hero.exp }))
            .sort((a, b) => a.deficit - b.deficit)
            .map((h) => h.name);
        addMedal(!missing.length, td, "left");
        if (missing.length)
            setMissingTitle(tr, "Exp deficit", missing);
    });
}
function showFameMedals(profiles) {
    const medals = ["pin", "oak leaf", "shamrock", "laurel"];
    document.querySelectorAll(".content_table tr").forEach((tr, i) => {
        const td = add("td");
        attr(td, "style", "min-width: 210px");
        if (i === 0) {
            textContent(td, "medal");
            td.innerHTML = "<strong>medal</strong>";
        }
        else {
            const name = `${i > 4 ? "large " : ""}${medals[(i - 1) % 4]}${i > 12 ? " of honor" : i > 8 ? " and ribbon" : ""}`;
            const a = add("a", td);
            attr(a, { href: `/wod/spiel/hero/item.php?name=${name.replace(/ /g, "+")}&is_popup=1`, target: "_blank" });
            textContent(a, name);
            const required = parseInt(textNormalized(tr.cells[0]).replace(/\d+\. title/, ""), 10);
            const missing = profiles
                .filter((hero) => hero.fame && hero.fame < required)
                .map((h) => `${h.name} (${formatNumber(required - h.fame)})`)
                .sort();
            addMedal(!missing.length, td);
            if (missing.length)
                setMissingTitle(tr, "Fame deficit", missing);
        }
        tr.insertBefore(td, tr.cells[1]);
    });
}
function showDungeonMedals(profiles, dungeonPage = false) {
    const medals = {};
    profiles.forEach((hero) => (hero.medals || []).forEach((medal) => (medals[medal.toLowerCase()] ||= []).push(hero.name)));
    document.querySelectorAll(`#main_content .content_table > tbody > tr > td:nth-child(${dungeonPage ? 1 : 2})`).forEach((td) => {
        const key = hash(normalizeDungeonName(textNormalized(td).toLowerCase()));
        const heroes = medals[key] || [];
        const achieved = profiles.length > 0 && heroes.length === profiles.length;
        if (!achieved) {
            setMissingTitle(td.closest("tr"), "Missing medal", profiles
                .filter((h) => !heroes.includes(h.name))
                .map((h) => h.name)
                .sort());
        }
        addMedal(achieved, td);
    });
}
async function main() {
    const groupId = document.forms?.the_form?.gruppe_id?.value;
    if (!groupId)
        return;
    const heroes = await getCachedHeroes(groupId);
    const path = location.pathname;
    if (path.includes("dungeonlist"))
        showDungeonMedals(heroes);
    else if (path.includes("title_list"))
        showFameMedals(heroes);
    else if (path.includes("dungeon/dungeon.php"))
        showDungeonMedals(heroes, true);
    else
        showLevelUpMedals(heroes);
}
if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", main, { once: true });
else
    main();

})();