// ==UserScript==
// @name           Itemizer
// @description    Scripts improves items found page
// @version        1.0.0
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
    const tables = Array.from(document.querySelectorAll("table")).filter((x) => { var _a; return ((_a = x.previousElementSibling) === null || _a === void 0 ? void 0 : _a.tagName) === "H2" && !x.className; });
    showSummary(parseHeros(tables));
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
            itemsUsed: ownItems.filter((x) => x.used !== 0),
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
        const uses = (((_b = tds[4]) === null || _b === void 0 ? void 0 : _b.textContent) || "").trim();
        const used = uses.match(/-\d+/);
        acc.push({
            heroName,
            name: textContent(item).trim(),
            html: item.innerHTML,
            isUnique: item.innerHTML.includes("item_unique"),
            isConsumable: Boolean(uses),
            used: used ? Number(used[0]) : 0,
            damaged: damaged ? Number(damaged[0]) : 0,
        });
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
        table("Consumables used", ["html", "used", "heroName"], used),
        table("Items damaged", ["html", "damaged", "heroName"], damaged),
    ]) +
        tr([
            table("Items found", ["html", "heroName"], found),
            table("Items lost", ["html"], lost),
        ]));
}
function table(title, columns, items) {
    return (`<h2>${title} (${items.length})</h2><table class="content_table" style="font-size:14px;font-weight:normal" >` +
        items
            .sort(sortItems)
            .map((item, i) => `<tr class="row${i % 2}">${columns.map((x) => "<td>" + item[x] + "</td>").join("")}</tr>`)
            .join("") +
        "</table>");
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