// ==UserScript==
// @name           Hero List
// @description    Scripts adds functionality to order your heroes
// @version        1.2.2
// @author         Never
// @include        https://*.world-of-dungeons.*/wod/spiel/settings/heroes.php*
// @run-at         document-start
// @grant          GM.getValue
// @grant          GM.setValue
// @grant          GM.xmlHttpRequest
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_xmlhttpRequest
// ==/UserScript==

(function() {
'use strict';
function add(tag, parent, innerHTML) {
    const elem = typeof tag === "string" ? document.createElement(tag) : tag;
    parent && parent.nodeType && parent.appendChild(elem);
    innerHTML && (elem.innerHTML = innerHTML);
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
function textContent(elem, value) {
    if (!elem)
        return "";
    return typeof value === "undefined" ? elem.textContent : (elem.textContent = value);
}
function insertAfter(node, ...elems) {
    const parent = node.parentNode;
    elems.forEach((elem) => {
        parent.insertBefore(elem, node.nextSibling);
        node = elem;
    });
}
function httpFetch(url, method = "GET", data) {
    return new Promise((resolve, reject) => {
        const request = {
            method,
            url,
            headers: { Cookie: document.cookie },
            onload: (resp) => {
                if (resp.readyState !== 4)
                    return;
                if (resp.status >= 200 && resp.status < 300) {
                    resolve({ data: resp.responseText });
                }
                else {
                    reject({ data: resp.responseText });
                }
            },
        };
        if (typeof data === "object") {
            request.data = JSON.stringify(data);
            request.headers = { "Content-Type": "application/json" };
        }
        if (typeof GM === "object") {
            GM.xmlHttpRequest(request);
        }
        else {
            GM_xmlhttpRequest(request);
        }
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
const leadingZero = (x) => (x < 10 ? "0" + x : x.toString());
const formatTime = (x) => `${leadingZero(Math.trunc(x / 60))}:${leadingZero(x % 60)}`;
const minutes = (t) => t
    .split(":")
    .reduce((acc, x) => (acc > 0 ? acc + Number(x) : Number(x) * 60), 0);
function parseHeroTable([, ...rows], currentTime) {
    return new Promise((resolve) => {
        const formatDungeonTitle = (dungeon, time) => {
            const minutesToWait = time.includes("tomorrow")
                ? minutes(time.replace("tomorrow", "").trim()) + 1440
                : minutes(time);
            const localTime = time.split("/")[0];
            const title = currentTime
                ? `${localTime} (in ${formatTime(minutesToWait - minutes(currentTime))}) - ${dungeon}`
                : `${localTime} - ${dungeon}`;
            return title;
        };
        Promise.all(rows.map((x) => getHeroInfo(formatDungeonTitle, x))).then((result) => {
            resolve(result.sort((a, b) => a.weight - b.weight));
        });
    });
}
function getHeroInfo(formatDungeonTitle, row) {
    return new Promise((resolve) => {
        const cells = row.cells;
        const hid = Number(cells[0].querySelector("input").value).toString();
        const level = Number(textContent(cells[2]));
        const next = cells[4];
        const dungeon = getDungeonName(next);
        const time = textContent(cells[4]).trim();
        Store.get(hid).then((value) => {
            let info;
            try {
                info = value ? JSON.parse(value) : {};
            }
            catch (_a) {
                info = {};
            }
            const weight = info.weight || (level === 0 ? 100 : level);
            if (dungeon) {
                textContent(next, formatDungeonTitle(dungeon, time));
            }
            const timeCell = add("td");
            textContent(timeCell, time);
            resolve({ weight: Number(weight), row, group: info.group || "no group" });
        });
    });
}
function getDungeonName(td) {
    let tooltip = attr(td, "onmouseover") || "";
    const n = tooltip.lastIndexOf("left;'>");
    if (n > -1)
        tooltip = tooltip.slice(n);
    return tooltip
        .replace(/.+\(this,'(.+)'\);/, "$1")
        .replace(/.+>(.+)<\/th.+/i, "$1");
}
function saveWeights(rows) {
    const promises = [];
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.cells;
        const hid = Number(cells[0].querySelector("input").value).toString();
        let weight = Number(cells[6].querySelector("input").value);
        if (isNaN(weight))
            weight = 0;
        const p = httpFetch("/wod/spiel/hero/profile.php?id=" + hid);
        p.then((resp) => {
            const data = resp.data;
            const n = data.indexOf("group:");
            const group = data
                .slice(n, n + 200)
                .split("<a")[1]
                .split(/[><]/)[1];
            return Store.set(hid, JSON.stringify({ weight, group }));
        });
        promises.push(p);
    }
    Promise.all(promises).then(() => {
        const form = document.forms.the_form;
        if (form)
            form.submit();
    });
}
function main(main_content) {
    const table = (main_content || document.querySelector("#main_content")).querySelector("form table");
    const rows = table
        ? Array.from(table.querySelectorAll("tr"))
        : undefined;
    if (rows) {
        const newTable = add("table");
        const newTbody = add("tbody", newTable);
        attr(newTable, "class", "content_table");
        const headerWeight = add("th");
        const label = add("span", headerWeight);
        const buttonSave = add("input", headerWeight);
        label.innerHTML = "weight<br/>";
        attr(buttonSave, {
            type: "button",
            value: "Update",
            class: "button clickable",
        });
        buttonSave.addEventListener("click", () => {
            saveWeights(rows);
        }, false);
        rows[0].appendChild(headerWeight);
        newTbody.appendChild(rows[0]);
        const groupName = add("th");
        textContent(groupName, "group");
        rows[0].insertBefore(groupName, rows[0].cells[4]);
        const time = document.querySelector("#clock");
        let group;
        const makeInput = (row, value) => {
            const colWeight = add("td", row);
            const txt = add("input");
            attr(txt, { type: "text", style: "width: 30px", value });
            attr(colWeight, "align", "center");
            add(txt, colWeight);
        };
        let color = 0;
        parseHeroTable(rows, time ? time.textContent : undefined).then((heroes) => {
            heroes.forEach((hero, i) => {
                const row = hero.row;
                makeInput(row, hero.weight);
                attr(row, "class", "row" + (color++ % 2));
                const c = add("td");
                c.innerHTML = `<a href="/wod/spiel/dungeon/group.php?name=${hero.group}" target="_blank" />${hero.group}</a>`;
                row.insertBefore(c, row.cells[4]);
                if (i > 0 && group !== hero.group) {
                    group = hero.group;
                }
                add(hero.row, newTbody);
            });
            insertAfter(table, newTable);
            table.parentNode.removeChild(table);
        });
    }
}
document.addEventListener("DOMContentLoaded", () => main());

})();