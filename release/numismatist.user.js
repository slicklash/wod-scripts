// ==UserScript==
// @name           Numismatist
// @description    Shows medal summary for whole group
// @version        1.1.1
// @downloadURL    https://raw.github.com/slicklash/wod-scripts/master/release/numismatist.user.js
// @author         Never
// @include        http*://*.world-of-dungeons.*/wod/spiel/dungeon/dungeon.php*
// @include        http*://*.world-of-dungeons.*/wod/spiel/help/dungeonlist.php*
// @include        http*://*.world-of-dungeons.*/wod/spiel/hero/title_list.php?menukey=hero_titles*
// @include        http*://*.world-of-dungeons.*/wod/spiel/hero/advance.php?menukey=level_costs*
// @run-at         document-start
// @grant          GM.xmlHttpRequest
// @grant          GM_xmlhttpRequest
// @grant          GM.getValue
// @grant          GM.setValue
// @grant          GM_getValue
// @grant          GM_setValue
// ==/UserScript==

(function() {
'use strict';
function add(tag, parent, innerHTML) {
    const elem = typeof tag === "string" ? document.createElement(tag) : tag;
    if (parent && parent.nodeType)
        parent.appendChild(elem);
    if (innerHTML)
        elem.innerHTML = innerHTML;
    return elem;
}
function attr(elem, nameOrMap, value, remove) {
    if (remove) {
        elem.removeAttribute(nameOrMap);
    }
    else if (typeof nameOrMap === "object") {
        Object.keys(nameOrMap).forEach((key) => { elem.setAttribute(key, nameOrMap[key]); });
    }
    else if (value) {
        elem.setAttribute(nameOrMap, value);
    }
    else {
        return elem.getAttribute(nameOrMap);
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
        const request = {
            method,
            url,
            headers: {},
            onload: (resp) => {
                if (resp.readyState !== 4)
                    return;
                const contentType = resp.responseHeaders
                    ?.match(/^content-type:\s*([^;\r\n]+)/im)?.[1]
                    ?.trim()
                    .toLowerCase();
                const data = contentType === "application/json" || contentType?.endsWith("+json")
                    ? JSON.parse(resp.responseText)
                    : resp.responseText;
                if (resp.status >= 200 && resp.status < 300)
                    resolve({ data });
                else
                    reject({ status: resp.status, data });
            },
            onerror: reject,
        };
        if (body !== undefined) {
            request.data =
                typeof body === "object" && body !== null ? JSON.stringify(body) : body;
            if (typeof body === "object" && body !== null)
                request.headers["Content-Type"] = "application/json";
        }
        (typeof GM === "object" && GM?.xmlHttpRequest
            ? GM.xmlHttpRequest
            : GM_xmlhttpRequest)(request);
    });
}
function GX_getValue(key, defaultValue) {
    if (typeof GM === "object")
        return GM.getValue(key, defaultValue);
    return Promise.resolve(GM_getValue(key));
}
function GX_setValue(key, value) {
    if (typeof GM === "object")
        return GM.setValue(key, value);
    return Promise.resolve(GM_setValue(key, value));
}
var Store = {
    get: GX_getValue,
    set: GX_setValue,
};
const normalize = (text) => text
    .replace("swamp dragons", "swamp dragon")
    .replace(" revival", "")
    .replace("an awesome", "")
    .replace(/the /g, "")
    .trim();
const hash = (text) => Math.abs(text.padEnd(11, "0").split("").map((x) => x.charCodeAt(0)).reduce((a, x) => (a + ((a << 7) + (a << 3))) ^ x)).toString(4 * 4);
const getLastReportKey = () => httpFetch("/wod/spiel/dungeon/report.php?menukey=reports").then((resp) => {
    if (!resp)
        return "none";
    const html = parseHtml(resp.data, true);
    const last = html.querySelector("#main_content .row0");
    if (!last)
        return "none";
    return hash(last.textContent.trim());
});
async function buildCache() {
    const groupHeroes = await getGroupHeroes(document.forms.the_form.gruppe_id.value);
    const profiles = await getHeroProfiles(groupHeroes);
    const cache = {
        key: await getLastReportKey(),
        heroes: profiles.filter((x) => !x.isMentor),
    };
    await Store.set("numismatist", JSON.stringify(cache));
    return cache;
}
async function main() {
    const idGroup = document.forms.the_form.gruppe_id.value;
    if (!idGroup)
        return;
    const key = await getLastReportKey();
    let cache = JSON.parse(await Store.get("numismatist", "{}"));
    if (cache.key !== key) {
        cache = await buildCache();
    }
    const heroes = cache.heroes || [];
    if (location.pathname.includes("dungeonlist")) {
        showDungeonMedalInfo(heroes);
    }
    else if (location.pathname.includes("title_list")) {
        showFameMedalInfo(heroes);
    }
    else if (location.pathname.includes("dungeon/dungeon.php")) {
        showDungeonMedalInfo(heroes, true);
    }
    else {
        showLevelUpMedalInfo(heroes);
    }
}
function getGroupHeroes(idGroup) {
    return new Promise((resolve, reject) => {
        httpFetch(`/wod/spiel/dungeon/group.php?id=${idGroup}`)
            .catch(reject)
            .then((resp) => {
            const groupHeroes = resp &&
                Array.from(parseHtml(resp.data, true).querySelectorAll(".main_content tbody .content_table_mainline a")).map((x) => ({
                    name: x.textContent,
                    profileUrl: x.getAttribute("href") || "",
                }));
            if (groupHeroes && getGroupHeroes.length)
                resolve(groupHeroes);
        });
    });
}
function getHeroProfiles(groupHeroes) {
    return Promise.all(groupHeroes.map((hero) => parseProfile(hero)));
}
function parseProfile(hero) {
    return new Promise((resolve, reject) => {
        httpFetch(hero.profileUrl)
            .catch(reject)
            .then((resp) => {
            if (!resp)
                return;
            const html = parseHtml(resp.data, true);
            const profile = {
                name: hero.name,
                isMentor: true,
            };
            const rows = Array.from(html.querySelectorAll(".content_table tr"));
            rows.forEach((x) => {
                if (x.cells[0].textContent.trim() === "class") {
                    profile.isMentor = x.cells[1].textContent.trim().includes("Mentor");
                }
                else if (x.cells[0].textContent.trim() === "fame") {
                    profile.fame = Number(x.cells[1].textContent.replace(/ /g, ""));
                }
                else if (x.cells[0].textContent.trim().includes("gained")) {
                    profile.exp = Number(x.cells[1].textContent.replace(/ /g, ""));
                }
            });
            if (profile.isMentor) {
                resolve(profile);
                return;
            }
            const medalsUrl = Array.from(html.querySelectorAll("#smarttabs__details_inner a"))
                .map((x) => x.getAttribute("href"))
                .find((x) => x && x.includes("goallist"));
            httpFetch(medalsUrl)
                .catch(reject)
                .then((resp2) => {
                if (!resp2)
                    return;
                profile.medals = Array.from(parseHtml(resp2.data, true).querySelectorAll(".details.earned .label")).map((x) => hash(normalize(x.innerHTML.trim().toLowerCase())));
                resolve(profile);
            });
        });
    });
}
function showLevelUpMedalInfo(profiles) {
    const rows = (Array.from(document.querySelectorAll(".content_table tr")));
    rows.forEach((tr, i) => {
        const td = tr.cells[0];
        td.setAttribute("style", "min-width: 50px");
        if (i > 2) {
            const requiredExp = parseInt(tr.cells[2].textContent.replace(/\s/g, ""), 10);
            const notObtained = profiles
                .filter((x) => x.exp && x.exp < requiredExp)
                .map((x) => ({
                name: `${x.name} (${(requiredExp - x.exp).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ")})`,
                missing: requiredExp - x.exp,
            }))
                .sort((a, b) => a.missing - b.missing)
                .map((x) => x.name);
            if (notObtained.length) {
                addMedalIcon(false, td, "left");
                tr.setAttribute("title", `Exp deficit (${notObtained.length}):\n\n${notObtained.join("\n")}`);
            }
            else {
                addMedalIcon(true, td, "left");
            }
        }
    });
}
function showFameMedalInfo(profiles) {
    const rows = (Array.from(document.querySelectorAll(".content_table tr")));
    const medals = ["pin", "oak leaf", "shamrock", "laurel"];
    rows.forEach((tr, i) => {
        const td = add("td");
        td.setAttribute("style", "min-width: 210px");
        if (i > 0) {
            const name = `${i > 4 ? "large " : ""}${medals[(i - 1) % medals.length]}${i > 12 ? " of honor" : i > 8 ? " and ribbon" : ""}`;
            const a = add("a", td);
            a.href = `/wod/spiel/hero/item.php?name=${name.replace(/ /g, "+")}&is_popup=1`;
            a.target = "_blank";
            a.textContent = name;
            const requiredFame = parseInt(tr.cells[0].textContent.replace(/\d+. title/, ""), 10);
            const notObtained = profiles
                .filter((x) => x.fame && x.fame < requiredFame)
                .map((x) => `${x.name} (${(requiredFame - x.fame).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ")})`)
                .sort();
            if (notObtained.length) {
                addMedalIcon(false, td);
                tr.setAttribute("title", `Fame deficit (${notObtained.length}):\n\n${notObtained.join("\n")}`);
            }
            else {
                addMedalIcon(true, td);
            }
        }
        else {
            td.innerHTML = "<strong>medal</strong>";
        }
        tr.insertBefore(td, tr.cells[1]);
    });
}
function showDungeonMedalInfo(profiles, dungeonPage = false) {
    const map = profiles.reduce((acc, x) => {
        (x.medals || []).forEach((m) => {
            const key = m.toLowerCase();
            if (!Array.isArray(acc[key]))
                acc[key] = [];
            acc[key].push(x.name);
        });
        return acc;
    }, {});
    const dungeons = Array.from(document.querySelectorAll(`#main_content .content_table > tbody > tr > td:nth-child(${dungeonPage ? 1 : 2})`));
    dungeons.forEach((td) => {
        const key = normalize(td.textContent.trim().toLowerCase());
        const heroes = map[hash(key)] || [];
        const allHeroes = profiles.length && heroes.length === profiles.length ? true : false;
        if (!allHeroes) {
            const notObtained = profiles
                .filter((x) => heroes.indexOf(x.name) < 0)
                .map((x) => x.name)
                .sort();
            td.setAttribute("title", `Missing medal (${notObtained.length}):\n\n${notObtained.join("\n")}`);
        }
        addMedalIcon(allHeroes, td);
    });
}
function addMedalIcon(isAchieved, elem, position = "right") {
    const img = add("img", elem);
    img.src = `/wod/css/icons/common/${isAchieved ? "medal_big" : "medal_big_gray"}.png`;
    attr(img, "style", "width: 24px; float: " + position);
}
document.addEventListener("DOMContentLoaded", () => main());

})();