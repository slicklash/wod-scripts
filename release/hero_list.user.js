// ==UserScript==
// @name           Hero List
// @description    Script adds functionality to order your heroes
// @version        2.0.0
// @author         Never
// @downloadURL    https://raw.github.com/slicklash/wod-scripts/master/release/hero_list.user.js
// @updateURL      https://raw.github.com/slicklash/wod-scripts/master/release/hero_list.user.js
// @match          https://*.world-of-dungeons.net/wod/spiel/settings/heroes.php*
// @run-at         document-end
// @grant          GM.getValue
// @grant          GM.setValue
// @grant          GM.xmlHttpRequest
// ==/UserScript==

(function() {
'use strict';
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
const formatTime = (m) => `${String(Math.trunc(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const minutes = (time) => time.split(":").reduce((h, m) => h * 60 + Number(m), 0);
function formatDungeonTitle(dungeon, time, currentTime) {
    const localTime = time.split("/")[0];
    const tomorrow = time.includes("tomorrow");
    const wait = minutes(time.replace("tomorrow", "").trim()) + (tomorrow ? 1440 : 0);
    return `${localTime}${currentTime ? ` (in ${formatTime(wait - minutes(currentTime))})` : ""} - ${dungeon}`;
}
function getDungeonName(td) {
    return (attr(td, "onmouseover") || "")
        .replace(/^.*left;'>/, "")
        .replace(/.+\(this,'(.+)'\);/, "$1")
        .replace(/.+>(.+)<\/th.+/i, "$1");
}
async function parseHeroTable(rows, currentTime) {
    const heroes = await Promise.all(rows.map(async (row) => {
        const cells = row.cells;
        const heroId = cells[0].querySelector("input").value;
        const level = Number(textContent(cells[2]));
        const dungeon = getDungeonName(cells[4]);
        const time = textNormalized(cells[4]);
        const info = await Store.get(heroId, {});
        if (dungeon)
            textContent(cells[4], formatDungeonTitle(dungeon, time, currentTime));
        return { row, weight: info.weight ?? (level || 100), groupName: info.group || "no group" };
    }));
    return heroes.sort((a, b) => a.weight - b.weight);
}
async function saveWeights(rows) {
    await batchMap(rows, async (row) => {
        const cells = row.cells;
        const heroId = cells[0].querySelector("input").value;
        const weight = Number(cells[6].querySelector("input").value) || 0;
        const { data } = (await httpFetch(`/wod/spiel/hero/profile.php?id=${heroId}`));
        const index = data.indexOf("group:");
        const group = index > -1
            ? data
                .slice(index, index + 200)
                .split("<a")[1]
                ?.split(/[><]/)[1]
            : undefined;
        if (group)
            await Store.set(heroId, { weight, group });
    }, { limit: 4 });
    document.forms.namedItem("the_form")?.submit();
}
function add(tagName, parent, innerHTML) {
    const elem = document.createElement(tagName);
    if (parent)
        parent.appendChild(elem);
    if (innerHTML)
        elem.innerHTML = innerHTML;
    return elem;
}
async function main(root = document.querySelector("#main_content")) {
    const myHeroesTable = root?.querySelector("form table");
    if (!myHeroesTable)
        return;
    const rows = Array.from(myHeroesTable.rows);
    if (rows.length < 2)
        return;
    const headerRow = rows[0];
    const groupNameHeader = add("th");
    textContent(groupNameHeader, "group");
    headerRow.insertBefore(groupNameHeader, headerRow.cells[4]);
    const heroWeightHeader = add("th");
    const label = add("span", heroWeightHeader);
    textContent(label, "weight");
    add("br", label);
    attr(add("input", heroWeightHeader), {
        type: "button",
        value: "Update",
        class: "button clickable",
    }).addEventListener("click", () => saveWeights(rows.slice(1)));
    headerRow.append(heroWeightHeader);
    const newTable = attr(add("table"), "class", "content_table");
    const tbody = add("tbody", newTable);
    tbody.append(headerRow);
    const currentTime = document.querySelector("#clock")?.textContent ?? undefined;
    const myHeroes = await parseHeroTable(rows.slice(1), currentTime);
    myHeroes.forEach(({ row, groupName, weight }, index) => {
        const groupNameCell = add("td");
        const link = attr(add("a", groupNameCell), {
            href: `/wod/spiel/dungeon/group.php?name=${encodeURIComponent(groupName)}`,
            target: "_blank",
        });
        textContent(link, groupName);
        row.insertBefore(groupNameCell, row.cells[4]);
        const weightCell = attr(row.insertCell(), "align", "center");
        attr(add("input", weightCell), {
            type: "text",
            style: "width: 30px",
            value: `${weight}`,
        });
        attr(row, "class", `row${index % 2}`);
        tbody.append(row);
    });
    myHeroesTable.replaceWith(newTable);
}
if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", () => main(), { once: true });
else
    main();

})();