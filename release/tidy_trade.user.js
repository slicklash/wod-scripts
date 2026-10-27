// ==UserScript==
// @name           Tidy Trade
// @description    Sorts trade items and calculates the total sum of uses
// @version        1.1.6
// @author         Never
// @include        http*://*.world-of-dungeons.net/wod/spiel/trade/exchange_details*
// @run-at         document-start
// @grant          none
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
function getItemInfo(table) {
    const rows = Array.from(table.cloneNode(true).querySelectorAll("tr"));
    const sums = {};
    const items = rows.map((row) => {
        const cells = row.cells;
        const icons = cells[2].querySelectorAll("img");
        const link = cells[2].querySelector("a");
        const name = textContent(link);
        const size = textContent(cells[2]).replace(name, "").trim();
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
    });
    items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) ||
        a.uses - b.uses);
    return [items, sums];
}
function tidyTrade(table) {
    const [items, sums] = getItemInfo(table);
    if (!items.length)
        return false;
    const newTable = add("table");
    items.forEach((item, index) => {
        const row = add("tr", newTable);
        attr(add("td", row), "align", "right").textContent =
            String(index + 1);
        add(item.rarity, attr(add("td", row), "valign", "top"));
        add(item.condition, attr(add("td", row), "valign", "top"));
        const cell = attr(add("td", row), {
            valign: "top",
            align: "left",
        });
        if (item.control)
            add(item.control, add("td", row));
        add(item.link, cell);
        add("span", cell).innerHTML = "&nbsp;" + item.size;
        if (sums[item.name] > 1) {
            const total = add("span", cell);
            attr(total, "style", "color: #666").innerHTML =
                `&nbsp;<sup>&sum;=${sums[item.name]}</sup>`;
            sums[item.name] = 0;
        }
    });
    table.parentNode.replaceChild(newTable, table);
    return true;
}
function main(mainContent) {
    const content = mainContent ?? document.querySelector("#main_content");
    if (!content ||
        !textContent(content.querySelector("h1")).includes("Trade with")) {
        return false;
    }
    const tables = content.querySelectorAll("table");
    if (tables[1])
        tidyTrade(tables[1]);
    if (tables[2])
        tidyTrade(tables[2]);
    return true;
}
if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", () => main(), { once: true });
else
    main();

})();