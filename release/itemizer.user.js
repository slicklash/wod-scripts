// ==UserScript==
// @name           Itemizer
// @description    Scripts improves items found page
// @version        1.0.2
// @downloadURL    https://raw.github.com/slicklash/wod-scripts/master/release/itemizer.user.js
// @author         Never
// @include        https://*.world-of-dungeons.*/wod/spiel/*dungeon/report.php*
// @run-at         document-start
// ==/UserScript==

(function() {
'use strict';
function add(tag, parent, innerHTML) {
    const elem = typeof tag === "string" ? document.createElement(tag) : tag;
    parent && parent.nodeType && parent.appendChild(elem);
    innerHTML && (elem.innerHTML = innerHTML);
    return elem;
}
function textContent(elem, value) {
    if (!elem)
        return "";
    return typeof value === "undefined" ? elem.textContent : (elem.textContent = value);
}
function main() {
    let tables = Array.from(document.querySelectorAll("table")).filter((x) => { var _a; return ((_a = x.previousElementSibling) === null || _a === void 0 ? void 0 : _a.tagName) === "H2" && !x.className; });
    showSummary(parseHeros(tables));
    tables = Array.from(document.querySelectorAll("table")).filter(x => !x.id && !x.className && x.querySelector(".rep_initiative"));
    showLevel(parseRounds(tables));
}
function parseHeros(tables) {
    return tables.map((table) => {
        let gold = 0;
        const texts = Array.from(table.querySelectorAll("p")).map((p) => {
            const img = p.querySelector("img");
            if (img && img.src.includes("gold.gif")) {
                gold = Number(textContent(img.previousSibling).split(" ").pop());
            }
            return textContent(p);
        });
        const isKnockedOut = texts.some((x) => x.includes("was knocked"));
        const [tbl_own, tbl_found] = table.querySelectorAll("table");
        const heroName = table.previousElementSibling.textContent;
        const ownItems = parseItems(heroName, tbl_own);
        const foundItems = parseItems(heroName, tbl_found);
        const hero = {
            name: heroName,
            itemsUsed: groupUsed(ownItems).filter((x) => x.used !== 0),
            itemsLost: isKnockedOut ? foundItems : [],
            itemsFound: !isKnockedOut ? foundItems : [],
            itemsDamaged: ownItems.filter((x) => x.damaged !== 0),
            isKnockedOut,
            goldFound: gold,
        };
        return hero;
    });
}
function parseItems(heroName, table) {
    if (!table)
        return [];
    return Array.from(table.querySelectorAll("tr"))
        .slice(1)
        .reduce((acc, tr) => {
        var _a, _b;
        const tds = Array.from(tr.querySelectorAll("td"));
        if (tds.length < 3)
            return acc;
        const item = tds[1];
        const damaged = (((_a = tds[3]) === null || _a === void 0 ? void 0 : _a.textContent) || "").trim().match(/-\d+/);
        const uses = (((_b = tds[4]) === null || _b === void 0 ? void 0 : _b.textContent) || "").trim().match(/-?\d+/gm);
        const used = uses && uses.length > 2 ? Number(uses[2]) : 0;
        const remaining = uses && uses.length > 1 ? Number(uses[0]) : 1;
        acc.push({
            heroName,
            name: textContent(item).trim(),
            html: item.innerHTML,
            isUnique: item.innerHTML.includes("item_unique"),
            isConsumable: uses && uses.length > 1,
            used,
            usedHtml: used,
            remaining,
            damaged: damaged ? Number(damaged[0]) : 0,
            calc: function () {
                this.usedHtml = this.remaining < Math.abs(this.used) ? `<span style="color:tomato">${this.used}</span>` : `${this.used}`;
            },
        });
        return acc;
    }, []);
}
function parseRounds(tables) {
    const seenHeroes = [];
    return []
        .concat(...tables.map((table) => {
        const room = table.parentElement.children[0].textContent.match(/room (\d+)/);
        const tds = [...table.querySelectorAll("tr td:nth-child(2)")];
        const regex = /(.+)uses (.+) on/;
        return tds.reduce((acc, td) => {
            var _a;
            const t = td.textContent.replace(/\n/g, " ");
            const m = t.match(regex);
            if (!m)
                return acc;
            const [, hero, buff] = m;
            if (!buff.includes("/"))
                return acc;
            let [skill, item] = buff.split("/");
            skill = skill.substr(0, skill.lastIndexOf("(")).trim();
            item = item.slice(0, -1);
            const heroName = hero.trim();
            if (!seenHeroes.includes(heroName))
                seenHeroes.push(heroName);
            acc.push({
                heroName,
                name: item,
                count: 1,
                html: td.querySelector('[href*="item"]').outerHTML,
                skill,
                skillHtml: td.querySelector('[href*="skill"]').outerHTML,
                mpHtml: (_a = td.querySelector(".rep_mana_cost")) === null || _a === void 0 ? void 0 : _a.outerHTML,
                room: room ? Number(room[1]) : undefined,
            });
            return acc;
        }, []);
    }))
        .sort((a, b) => seenHeroes.indexOf(a.heroName) - seenHeroes.indexOf(b.heroName));
}
function groupUsed(items) {
    const seen = new Map();
    return items.reduce((acc, item) => {
        if (seen.has(item.name)) {
            const existing = seen.get(item.name);
            existing.used += item.used;
            existing.remaining += item.remaining;
            existing.calc();
        }
        else {
            item.html = item.html.replace("item_destroyed", "");
            seen.set(item.name, item);
            item.calc();
            acc.push(item);
        }
        return acc;
    }, []);
}
const tr = (cells) => `<tr>${cells.map((x) => `<td style="vertical-align:top">${x}</td>`).join("")}</tr>`;
function showSummary(heroes) {
    if (!heroes.length)
        return;
    const used = [].concat(...heroes.map((x) => x.itemsUsed));
    const damaged = [].concat(...heroes.map((x) => x.itemsDamaged));
    const found = [].concat(...heroes.map((x) => x.itemsFound));
    const lost = [].concat(...heroes.map((x) => x.itemsLost));
    add("table", document.querySelector('[name="the_form"] h2'), tr([
        table("Consumables used", ["html", "usedHtml", "heroName"], used),
        table("Items damaged", ["html", "damaged", "heroName"], damaged),
    ]) +
        tr([
            table("Items found", ["html", "heroName"], found),
            table("Items lost", ["html"], lost),
        ]));
}
function showLevel(items) {
    if (!items.length)
        return;
    add("table", document.querySelector(".rep_round_headline").previousElementSibling, tr([
        table("Items used", ["heroName", (item) => `${item.skillHtml}${item.count > 1 ? ` x ${item.count}` : ""}`, "mpHtml", "html"], compress(items)),
    ]));
}
function table(title, columns, items) {
    const format = (col, item) => typeof col === "function" ? col(item) : item[col];
    return (`<h2>${title} (${items.length})</h2><table class="content_table" style="font-size:14px;font-weight:normal" >` +
        items
            .sort(sortItems)
            .sort((a, b) => (a.room ? a.room - b.room : 0))
            .map((item, i, arr) => {
            const str = `<tr class="row${i % 2}">${columns.map((col) => '<td style="text-align: left">' + format(col, item) + "</td>").join("")}</tr>`;
            if ((i > 0 && arr[i - 1].room !== item.room) || (i === 0 && item.room))
                return `<tr><td colspan="${columns.length}">Room ${item.room}</td></tr>${str}`;
            return str;
        })
            .join("") +
        "</table>");
}
function compress(items) {
    const seen = new Map();
    let lastKey = "";
    return items.reduce((acc, item) => {
        const key = `${item.room},${item.heroName},${item.skill},${item.name}`;
        if (key === lastKey && seen.has(key)) {
            const existing = seen.get(key);
            existing.count++;
        }
        else {
            seen.set(key, item);
            acc.push(item);
        }
        lastKey = key;
        return acc;
    }, []);
}
function sortItems(a, b) {
    let cmp = b.isUnique - a.isUnique;
    if (cmp === 0)
        cmp = a.isConsumable - b.isConsumable;
    if (cmp === 0)
        cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    return cmp;
}
document.addEventListener("DOMContentLoaded", () => main());

})();