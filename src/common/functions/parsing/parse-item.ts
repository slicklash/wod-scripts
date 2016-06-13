/// <reference path="../../../../lib/typings/browser.d.ts" />

/// <reference path="../dom/text-content.ts" />
/// <reference path="./parse-html.ts" />

interface ItemInfo {
    classes: ClassConstraints;
}

interface ClassConstraints {
    include: string[];
    exclude: string[];
}

const parseItem = (str:string) : ItemInfo => {

    debugger

    let info: ItemInfo,
        html = parseHTML(str, true),
        details: HTMLTableRowElement[] = <any>Array.from(html.querySelector('#details').querySelectorAll('.row0, .row1')),
        link = html.querySelector('#link');

    for (let row of details) {
        let key = textContent(row.cells[0]).trim();
        console.log(key, (<any>row.cells[1]));
    }

    return info;
};
