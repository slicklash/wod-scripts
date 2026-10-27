// ==UserScript==
// @name           Hero List
// @description    Scripts adds functionality to order your heroes
// @version        1.3.1
// @author         Never
// @include        https://*.world-of-dungeons.*/wod/spiel/settings/heroes.php*
// @run-at         document-start
// @grant          GM.getValue
// @grant          GM.setValue
// @grant          GM.xmlHttpRequest
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
function textContent(elem, value) {
    if (!elem)
        return "";
    return typeof value === "undefined" ? elem.textContent : (elem.textContent = value);
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
                    ?.match(/^content-type:\s*([^;\r\n]+)/im)?.[1]
                    ?.trim()
                    ?.toLowerCase();
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
const formatTime = (minutes) => [Math.trunc(minutes / 60), minutes % 60].map((x) => String(x).padStart(2, "0")).join(":");
const minutes = (time) => time.split(":").reduce((total, part) => (total > 0 ? total + Number(part) : Number(part) * 60), 0);
function formatDungeonTitle(dungeon, time, currentTime) {
    const localTime = time.split("/")[0];
    const wait = time.includes("tomorrow")
        ? minutes(time.replace("tomorrow", "").trim()) + 1440
        : minutes(time);
    return currentTime
        ? `${localTime} (in ${formatTime(wait - minutes(currentTime))}) - ${dungeon}`
        : `${localTime} - ${dungeon}`;
}
async function parseHeroTable([, ...rows], currentTime) {
    const heroes = await Promise.all(rows.map(async (row) => {
        const cells = row.cells;
        const hid = Number(cells[0].querySelector("input").value).toString();
        const level = Number(textContent(cells[2]));
        const dungeonCell = cells[4];
        const dungeon = getDungeonName(dungeonCell);
        const time = textContent(dungeonCell).trim();
        let info = {};
        try {
            const value = await Store.get(hid);
            if (value)
                info = JSON.parse(value);
        }
        catch {
            info = {};
        }
        if (dungeon) {
            textContent(dungeonCell, formatDungeonTitle(dungeon, time, currentTime));
        }
        return {
            row,
            weight: Number(info.weight || (level === 0 ? 100 : level)),
            group: info.group || "no group",
        };
    }));
    return heroes.sort((a, b) => (a.weight || 0) - (b.weight || 0));
}
function getDungeonName(td) {
    let tooltip = attr(td, "onmouseover") || "";
    const index = tooltip.lastIndexOf("left;'>");
    if (index > -1)
        tooltip = tooltip.slice(index);
    return tooltip
        .replace(/.+\(this,'(.+)'\);/, "$1")
        .replace(/.+>(.+)<\/th.+/i, "$1");
}
async function saveWeights(rows) {
    await Promise.all(rows.slice(1).map(async (row) => {
        const cells = row.cells;
        const hid = Number(cells[0].querySelector("input").value).toString();
        const input = cells[6].querySelector("input");
        const weight = Number(input.value) || 0;
        const { data } = (await httpFetch(`/wod/spiel/hero/profile.php?id=${hid}`));
        const index = data.indexOf("group:");
        if (index > -1) {
            const group = data
                .slice(index, index + 200)
                .split("<a")[1]
                .split(/[><]/)[1];
            await Store.set(hid, JSON.stringify({ weight, group }));
        }
    }));
    const form = document.forms.namedItem("the_form");
    form?.submit();
}
function main(mainContent) {
    const content = mainContent ?? document.querySelector("#main_content");
    const table = content?.querySelector("form table");
    if (!table)
        return;
    const rows = Array.from(table.querySelectorAll("tr"));
    if (!rows.length)
        return;
    if (!textContent(content?.querySelector("h1")).includes("Hero"))
        return;
    const newTable = add("table");
    const tbody = add("tbody", newTable);
    attr(newTable, "class", "content_table");
    const header = rows[0];
    const weightHeader = add("th");
    const label = add("span", weightHeader);
    const saveButton = add("input", weightHeader);
    textContent(label, "weight");
    add("br", label);
    attr(saveButton, {
        type: "button",
        value: "Update",
        class: "button clickable",
    });
    saveButton.addEventListener("click", () => saveWeights(rows));
    header.append(weightHeader);
    tbody.append(header);
    const groupHeader = add("th");
    textContent(groupHeader, "group");
    header.insertBefore(groupHeader, header.cells[4]);
    const clock = document.querySelector("#clock");
    const currentTime = clock?.textContent ?? undefined;
    function addWeightInput(row, weight) {
        const cell = add("td", row);
        const input = add("input", cell);
        attr(input, { type: "text", style: "width: 30px", value: `${weight}` });
        attr(cell, "align", "center");
    }
    parseHeroTable(rows, currentTime).then((heroes) => {
        heroes.forEach((hero, index) => {
            const { row, group = "no group", weight = 0 } = hero;
            addWeightInput(row, weight);
            attr(row, "class", `row${index % 2}`);
            const cell = add("td");
            const link = add("a", cell);
            attr(link, {
                href: `/wod/spiel/dungeon/group.php?name=${encodeURIComponent(group)}`,
                target: "_blank",
            });
            textContent(link, group);
            row.insertBefore(cell, row.cells[4]);
            tbody.append(row);
        });
        table.replaceWith(newTable);
    });
}
if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", () => main(), { once: true });
else
    main();

})();