// ==UserScript==
// @name           Tidy Trade
// @description    Sorts trade items and calculates the total sum of uses
// @version        2.0.0
// @author         Never
// @downloadURL    https://raw.github.com/slicklash/wod-scripts/master/release/tidy_trade.user.js
// @updateURL      https://raw.github.com/slicklash/wod-scripts/master/release/tidy_trade.user.js
// @match          https://*.world-of-dungeons.net/wod/spiel/trade/exchange_details*
// @run-at         document-end
// @grant          none
// ==/UserScript==

(function() {
'use strict';
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
function textNormalized(x, options) {
    const text = typeof x === "string" ? x : (x?.textContent ?? "");
    return (text ?? "")
        .replace(/&nbsp;/g, "\u00A0")
        .replace(/[\s\u00A0]+/g, options?.collapse === false ? "" : " ")
        .trim();
}
function main(mainContent) {
    const content = mainContent ?? document.querySelector("#main_content");
    if (!content || !textContent(content.querySelector("h1")).includes("Trade with")) {
        return false;
    }
    const tables = content.querySelectorAll("table");
    if (tables[1])
        tidyTrade(tables[1]);
    if (tables[2])
        tidyTrade(tables[2]);
    return true;
}
function tidyTrade(table) {
    const [items, sums] = getItemInfo(table);
    if (!items.length)
        return false;
    const newTable = add("table");
    items.forEach((item, index) => {
        const row = add("tr", newTable);
        attr(add("td", row), "align", "right").textContent = String(index + 1);
        attr(add("td", row), "valign", "top").appendChild(item.rarity);
        attr(add("td", row), "valign", "top").appendChild(item.condition);
        const cell = attr(add("td", row), {
            valign: "top",
            align: "left",
        });
        if (item.control)
            add("td", row).appendChild(item.control);
        cell.appendChild(item.link);
        add("span", cell).innerHTML = "&nbsp;" + item.size;
        if (sums[item.name] > 1) {
            const total = add("span", cell);
            attr(total, "style", "color: #666").innerHTML = `&nbsp;<sup>&sum;=${sums[item.name]}</sup>`;
            sums[item.name] = 0;
        }
    });
    table.parentNode?.replaceChild(newTable, table);
    return true;
}
function getItemInfo(table) {
    const cloned = table.cloneNode(true);
    const rows = Array.from(cloned.querySelectorAll("tr"));
    const sums = {};
    const items = rows
        .map((row) => {
        const cells = row.cells;
        const cell2 = cells[2];
        if (!cell2)
            return null;
        const icons = cell2.querySelectorAll("img");
        const link = cell2.querySelector("a");
        const name = textContent(link);
        const size = textNormalized(cells[2]).replace(name, "");
        const uses = Number(size.match(/\(([0-9]+)\/[0-9]+\)/)?.[1] ?? 1);
        const item = {
            name,
            condition: icons[1],
            rarity: icons[0],
            size,
            uses,
            link,
            control: cells[3]?.querySelector("input") ?? null,
            cells,
        };
        sums[name] = (sums[name] ?? 0) + uses;
        return item;
    })
        .filter((x) => x !== null);
    items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) || a.uses - b.uses);
    return [items, sums];
}
if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", () => main(), { once: true });
else
    main();

})();