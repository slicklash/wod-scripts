// ==UserScript==
// @name           Itemizer
// @description    Scripts improves items found page
// @version        1.1.0
// @downloadURL    https://raw.github.com/slicklash/wod-scripts/master/release/itemizer.user.js
// @author         Never
// @include        https://*.world-of-dungeons.*/wod/spiel/*dungeon/report.php*
// @run-at         document-start
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
function textContent(elem, value) {
    if (!elem)
        return "";
    return typeof value === "undefined" ? elem.textContent : (elem.textContent = value);
}
const USES_REGEX = /(.+)uses (.+) on/;
const SKILL_REGEX = /skill\.php\?name=(.+)&/;
const ITEM_REGEX = /item\.php\?name=(.+)&/;
function main() {
    const heroTables = Array.from(document.querySelectorAll("table")).filter((table) => table.previousElementSibling?.tagName === "H2" && !table.className);
    showSummary(parseHeros(heroTables));
    const roundTables = Array.from(document.querySelectorAll("table")).filter((table) => !table.id && !table.className && table.querySelector(".rep_initiative"));
    showLevel(parseRounds(roundTables));
}
function parseHeros(tables) {
    return tables.map((table) => {
        let goldFound = 0;
        const texts = Array.from(table.querySelectorAll("p"), (p) => {
            const img = p.querySelector("img");
            if (img?.src.includes("gold.gif")) {
                goldFound = Number(textContent(img.previousSibling).split(" ").pop());
            }
            return textContent(p);
        });
        const isKnockedOut = texts.some((text) => text.includes("was knocked"));
        const [ownTable, foundTable] = table.querySelectorAll("table");
        const heroName = table.previousElementSibling?.textContent ?? "";
        const ownItems = parseItems(heroName, ownTable);
        const foundItems = parseItems(heroName, foundTable);
        return {
            name: heroName,
            itemsUsed: groupUsed(ownItems).filter((item) => item.used !== 0),
            itemsLost: isKnockedOut ? foundItems : [],
            itemsFound: isKnockedOut ? [] : foundItems,
            itemsDamaged: ownItems.filter((item) => item.damaged !== 0),
            isKnockedOut,
            goldFound,
        };
    });
}
function parseItems(heroName, table) {
    if (!table)
        return [];
    const items = [];
    for (const row of Array.from(table.querySelectorAll("tr")).slice(1)) {
        const cells = row.querySelectorAll("td");
        if (cells.length < 3)
            continue;
        const item = cells[1];
        const html = item.innerHTML;
        const damaged = cells[3]?.textContent?.trim().match(/-\d+/);
        const uses = cells[4]?.textContent?.trim().match(/-?\d+/g)?.map(Number);
        const used = uses && uses.length > 2 && uses[0] < uses[1] ? uses[2] : 0;
        const remaining = uses?.[0] ?? 1;
        const result = {
            heroName,
            name: textContent(item).trim(),
            html,
            isUnique: html.includes("item_unique"),
            isConsumable: Boolean(uses && uses.length > 1),
            used,
            uses,
            usedHtml: String(used),
            remaining,
            count: 1,
            damaged: damaged ? Number(damaged[0]) : 0,
        };
        result.calc = () => {
            result.usedHtml =
                result.remaining < Math.abs(result.used)
                    ? `<span style="color:tomato">${result.used}</span>`
                    : String(result.used);
        };
        items.push(result);
    }
    return items;
}
function parseRounds(tables) {
    const seenHeroes = new Set();
    const items = [];
    for (const table of tables) {
        const heading = table.parentElement?.children[0]?.textContent ?? "";
        const room = heading.match(/room (\d+)/)?.[1];
        for (const td of table.querySelectorAll("tr td:nth-child(2)")) {
            const text = (td.textContent ?? "").replace(/\n/g, " ");
            const heroMatch = text.match(USES_REGEX);
            if (!heroMatch)
                continue;
            const itemMatch = td.innerHTML.match(ITEM_REGEX);
            const skillMatch = td.innerHTML.match(SKILL_REGEX);
            if (!itemMatch || !skillMatch)
                continue;
            const skillLink = td.querySelector('[href*="skill"]');
            if (!skillLink)
                continue;
            const heroName = heroMatch[1].trim();
            seenHeroes.add(heroName);
            items.push({
                heroName,
                name: itemMatch[1],
                count: 1,
                html: Array.from(td.querySelectorAll('[href*="item"]'), (link) => link.outerHTML).join(", "),
                skill: skillMatch[1],
                skillHtml: skillLink.outerHTML,
                mpHtml: td.querySelector(".rep_mana_cost")?.outerHTML ?? "",
                room: room ? Number(room) : undefined,
                used: 0,
                remaining: 0,
                usedHtml: "",
            });
        }
    }
    const heroOrder = new Map([...seenHeroes].map((name, index) => [name, index]));
    return items.sort((a, b) => heroOrder.get(a.heroName) - heroOrder.get(b.heroName));
}
function groupUsed(items) {
    const grouped = new Map();
    for (const item of items) {
        const existing = grouped.get(item.name);
        if (existing) {
            existing.used += item.used;
            existing.remaining += item.remaining;
            existing.calc?.();
        }
        else {
            item.calc?.();
            grouped.set(item.name, item);
        }
    }
    return [...grouped.values()];
}
const tr = (cells) => `<tr>${cells.map((html) => `<td style="vertical-align:top">${html}</td>`).join("")}</tr>`;
function showSummary(heroes) {
    if (!heroes.length)
        return;
    const collect = (key) => heroes.flatMap((hero) => hero[key]);
    const used = collect("itemsUsed");
    const damaged = collect("itemsDamaged");
    const found = collect("itemsFound");
    const lost = collect("itemsLost");
    const uses = (item) => item.uses?.length ? ` (${item.uses[0]}/${item.uses[1]})` : "";
    add("table", document.querySelector('[name="the_form"] h2'), tr([
        table("Consumables used", ["html", "usedHtml", "heroName"], used),
        table("Items damaged", ["html", "damaged", "heroName"], damaged),
    ]) +
        tr([
            table("Items found", [(item) => item.html + uses(item), "heroName"], found),
            table("Items lost", [(item) => item.html + uses(item)], lost),
        ]));
}
function showLevel(items) {
    if (!items.length)
        return;
    add("table", document.querySelector(".rep_round_headline")?.previousElementSibling, tr([
        table("Items used", [
            "heroName",
            (item) => `${item.skillHtml}${item.count > 1 ? ` x ${item.count}` : ""}`,
            "mpHtml",
            "html",
        ], compress(items)),
    ]));
}
function table(title, columns, items) {
    const format = (column, item) => typeof column === "function" ? column(item) : (item[column] ?? "");
    const sorted = [...items].sort((a, b) => {
        const roomDiff = (a.room ?? 0) - (b.room ?? 0);
        if (roomDiff)
            return roomDiff;
        const uniqueDiff = Number(b.isUnique) - Number(a.isUnique);
        if (uniqueDiff)
            return uniqueDiff;
        const consumableDiff = Number(a.isConsumable) - Number(b.isConsumable);
        if (consumableDiff)
            return consumableDiff;
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
    const rows = sorted.map((item, index) => {
        const cells = columns
            .map((column) => `<td style="text-align:left">${format(column, item)}</td>`)
            .join("");
        const row = `<tr class="row${index % 2}">${cells}</tr>`;
        const previous = sorted[index - 1];
        return index === 0 && item.room != null
            ? `<tr><td colspan="${columns.length}">Room ${item.room}</td></tr>${row}`
            : index > 0 && previous.room !== item.room
                ? `<tr><td colspan="${columns.length}">Room ${item.room ?? ""}</td></tr>${row}`
                : row;
    });
    return `<h2>${title} (${items.length})</h2><table class="content_table" style="font-size:14px;font-weight:normal">${rows.join("")}</table>`;
}
function compress(items) {
    const result = [];
    let previousKey = "";
    let previousItem;
    for (const item of items) {
        const key = `${item.room},${item.heroName},${item.skill},${item.name}`;
        if (key === previousKey && previousItem) {
            previousItem.count++;
        }
        else {
            result.push(item);
            previousItem = item;
            previousKey = key;
        }
    }
    return result;
}
if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", main, { once: true });
else
    main();

})();