// ==UserScript==
// @name           Itemizer
// @description    Scripts improves items found page
// @version        2.0.0
// @downloadURL    https://raw.github.com/slicklash/wod-scripts/master/release/itemizer.user.js
// @updateURL      https://raw.github.com/slicklash/wod-scripts/master/release/itemizer.user.js
// @author         Never
// @match          https://*.world-of-dungeons.net/wod/spiel/*dungeon/report.php*
// @run-at         document-end
// ==/UserScript==

(function() {
'use strict';
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
const REGEX_USES = /(.+)uses (.+) on/;
const REGEX_ITEM = /item\.php\?name=(.+)&/;
const REGEX_SKILL = /skill\.php\?name=(.+)&/;
function parseGold(paragraphs) {
    for (const p of paragraphs) {
        const img = p.querySelector("img[src*='gold.gif']");
        if (img) {
            const text = textContent(img.previousSibling ?? null);
            return Number(text.split(" ").pop()) || 0;
        }
    }
    return 0;
}
function parseUses(cell) {
    const raw = textNormalized(cell).match(/-?\d+/g)?.map(Number) ?? [];
    return {
        raw,
        used: raw.length > 2 && raw[0] < raw[1] ? raw[2] : 0,
        remaining: raw[0] ?? 1,
    };
}
function formatUsed(item) {
    return item.remaining < Math.abs(item.used) ? `<span style="color:tomato">${item.used}</span>` : String(item.used);
}
function parseHeroes(tables) {
    return tables.map((table) => {
        const paragraphs = table.querySelectorAll("p");
        const goldFound = parseGold(paragraphs);
        const texts = Array.from(paragraphs, (p) => textContent(p));
        const isKnockedOut = texts.some((text) => text.includes("was knocked"));
        const [ownTable, foundTable] = table.querySelectorAll("table");
        const name = table.previousElementSibling?.textContent ?? "";
        const ownItems = parseItems(name, ownTable);
        const foundItems = parseItems(name, foundTable);
        return {
            name,
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
    return Array.from(table.querySelectorAll("tr"))
        .slice(1)
        .flatMap((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length < 3)
            return [];
        const item = cells[1];
        const html = item.innerHTML;
        const { raw: uses, used, remaining } = parseUses(cells[4]);
        const result = {
            heroName,
            name: textNormalized(item),
            html,
            isUnique: html.includes("item_unique"),
            isConsumable: Boolean(uses.length > 1),
            used,
            uses,
            usedHtml: String(used),
            remaining,
            count: 1,
            damaged: Number(textNormalized(cells[3]).match(/-\d+/)?.[0] ?? 0),
        };
        result.usedHtml = formatUsed(result);
        return [result];
    });
}
function parseRounds(tables) {
    const heroOrder = new Map();
    const items = [];
    for (const table of tables) {
        const room = Number(table.parentElement?.children[0]?.textContent.match(/room (\d+)/)?.[1]) || undefined;
        for (const td of table.querySelectorAll("tr td:nth-child(2)")) {
            const text = textNormalized(td).replace(/\n/g, " ");
            const hero = text.match(REGEX_USES)?.[1].trim();
            const html = td.innerHTML;
            const item = html.match(REGEX_ITEM)?.[1];
            const skill = html.match(REGEX_SKILL)?.[1];
            const skillLink = td.querySelector('[href*="skill"]');
            if (!hero || !item || !skill || !skillLink)
                continue;
            if (!heroOrder.has(hero))
                heroOrder.set(hero, heroOrder.size);
            items.push({
                heroName: hero,
                name: item,
                count: 1,
                html: Array.from(td.querySelectorAll('[href*="item"]'), (link) => link.outerHTML).join(", "),
                skill,
                skillHtml: skillLink.outerHTML,
                mpHtml: td.querySelector(".rep_mana_cost")?.outerHTML ?? "",
                room,
                used: 0,
                remaining: 0,
                usedHtml: "",
            });
        }
    }
    return items.sort((a, b) => heroOrder.get(a.heroName) - heroOrder.get(b.heroName));
}
function groupUsed(items) {
    const grouped = new Map();
    for (const item of items) {
        const existing = grouped.get(item.name);
        if (existing) {
            existing.used += item.used;
            existing.remaining += item.remaining;
            existing.usedHtml = formatUsed(existing);
        }
        else {
            item.usedHtml = formatUsed(item);
            grouped.set(item.name, item);
        }
    }
    return [...grouped.values()];
}
function compress(items) {
    const result = [];
    for (const item of items) {
        const previous = result[result.length - 1];
        if (previous && `${previous.room},${previous.heroName},${previous.skill},${previous.name}` === `${item.room},${item.heroName},${item.skill},${item.name}`) {
            previous.count++;
        }
        else {
            result.push(item);
        }
    }
    return result;
}
function buildTable(title, columns, items) {
    const sorted = [...items].sort((a, b) => {
        if ((a.room ?? 0) !== (b.room ?? 0))
            return (a.room ?? 0) - (b.room ?? 0);
        if (Number(b.isUnique) !== Number(a.isUnique))
            return Number(b.isUnique) - Number(a.isUnique);
        if (Number(a.isConsumable) !== Number(b.isConsumable))
            return Number(a.isConsumable) - Number(b.isConsumable);
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
    const rows = sorted.map((item, index) => {
        const cells = columns.map((column) => `<td style="text-align:left">${typeof column === "function" ? column(item) : (item[column] ?? "")}</td>`).join("");
        const row = `<tr class="row${index % 2}">${cells}</tr>`;
        if (index === 0 && item.room != null) {
            return `<tr><td colspan="${columns.length}">Room ${item.room}</td></tr>${row}`;
        }
        if (index > 0 && sorted[index - 1].room !== item.room) {
            return `<tr><td colspan="${columns.length}">Room ${item.room ?? ""}</td></tr>${row}`;
        }
        return row;
    });
    return `<h2>${title} (${items.length})</h2><table class="content_table" style="font-size:14px;font-weight:normal">${rows.join("")}</table>`;
}
function tr(cells) {
    return `<tr>${cells.map((html) => `<td style="vertical-align:top">${html}</td>`).join("")}</tr>`;
}
function renderSummary(heroes) {
    if (!heroes.length)
        return "";
    const collect = (key) => heroes.flatMap((hero) => hero[key]);
    const uses = (item) => (item.uses?.length ? ` (${item.uses[0]}/${item.uses[1]})` : "");
    const consumablesUsed = buildTable("Consumables used", ["html", "usedHtml", "heroName"], collect("itemsUsed"));
    const itemsDamaged = buildTable("Items damaged", ["html", "damaged", "heroName"], collect("itemsDamaged"));
    const itemsFound = buildTable("Items found", [(item) => item.html + uses(item), "heroName"], collect("itemsFound"));
    const itemsLost = buildTable("Items lost", [(item) => item.html + uses(item)], collect("itemsLost"));
    return tr([consumablesUsed, itemsDamaged]) + tr([itemsFound, itemsLost]);
}
function renderLevel(items) {
    if (!items.length)
        return "";
    const columns = ["heroName", (item) => `${item.skillHtml}${item.count > 1 ? ` x ${item.count}` : ""}`, "mpHtml", "html"];
    return tr([buildTable("Items used", columns, compress(items))]);
}
function add(tagName, parent, innerHTML) {
    const elem = document.createElement(tagName);
    if (parent)
        parent.appendChild(elem);
    if (innerHTML)
        elem.innerHTML = innerHTML;
    return elem;
}
function main() {
    const tables = Array.from(document.querySelectorAll("table"));
    const heroTables = tables.filter((t) => t.previousElementSibling?.tagName === "H2" && !t.className);
    const summaryHtml = renderSummary(parseHeroes(heroTables));
    if (summaryHtml) {
        const target = document.querySelector('[name="the_form"] h2');
        if (target)
            add("table", target, summaryHtml);
    }
    const roundTables = tables.filter((t) => !t.id && !t.className && t.querySelector(".rep_initiative"));
    const levelHtml = renderLevel(parseRounds(roundTables));
    if (levelHtml) {
        const target = document.querySelector(".rep_round_headline")?.previousElementSibling;
        if (target)
            add("table", target, levelHtml);
    }
}
if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", main, { once: true });
else
    main();

})();