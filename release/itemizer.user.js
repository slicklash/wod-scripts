// ==UserScript==
// @name           Itemizer
// @description    Scripts improves items found page
// @version        1.0.3
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
        var _a, _b, _c;
        const tds = Array.from(tr.querySelectorAll("td"));
        if (tds.length < 3)
            return acc;
        const item = tds[1];
        const damaged = (((_a = tds[3]) === null || _a === void 0 ? void 0 : _a.textContent) || "").trim().match(/-\d+/);
        const uses = (_c = (((_b = tds[4]) === null || _b === void 0 ? void 0 : _b.textContent) || "").trim().match(/-?\d+/gm)) === null || _c === void 0 ? void 0 : _c.map(Number);
        let used = 0;
        let remaining = 1;
        if (uses) {
            if (uses.length > 2 && uses[0] < uses[1])
                used = uses[2];
            remaining = uses[0];
        }
        acc.push({
            heroName,
            name: textContent(item).trim(),
            html: item.innerHTML,
            isUnique: item.innerHTML.includes("item_unique"),
            isConsumable: Boolean(uses && uses.length > 1),
            used,
            uses,
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
    const regex_uses = /(.+)uses (.+) on/;
    const regex_skill = /skill\.php\?name=(.+)&/;
    const regex_item = /item\.php\?name=(.+)&/;
    return []
        .concat(...tables.map((table) => {
        const room = table.parentElement.children[0].textContent.match(/room (\d+)/);
        const tds = [...table.querySelectorAll("tr td:nth-child(2)")];
        return tds.reduce((acc, td) => {
            var _a;
            const t = td.textContent.replace(/\n/g, " ");
            let m = t.match(regex_uses);
            if (!m)
                return acc;
            const [, hero] = m;
            m = td.innerHTML.match(regex_item);
            if (!m)
                return acc;
            const item = m[1];
            const skill = td.innerHTML.match(regex_skill)[1];
            const heroName = hero.trim();
            if (!seenHeroes.includes(heroName))
                seenHeroes.push(heroName);
            acc.push({
                heroName,
                name: item,
                count: 1,
                html: Array.from(td.querySelectorAll('[href*="item"]')).map((x) => x.outerHTML).join(", "),
                skill,
                skillHtml: td.querySelector('[href*="skill"]').outerHTML,
                mpHtml: ((_a = td.querySelector(".rep_mana_cost")) === null || _a === void 0 ? void 0 : _a.outerHTML) || "",
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
    const uses = (x) => { var _a; return ((_a = x.uses) === null || _a === void 0 ? void 0 : _a.length) ? ` (${x.uses[0]}/${x.uses[1]})` : ""; };
    add("table", document.querySelector('[name="the_form"] h2'), tr([
        table("Consumables used", ["html", "usedHtml", "heroName"], used),
        table("Items damaged", ["html", "damaged", "heroName"], damaged),
    ]) +
        tr([
            table("Items found", [(x) => `${x.html}${uses(x)}`, "heroName"], found),
            table("Items lost", [(x) => `${x.html}${uses(x)}`], lost),
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