/// <reference path="../../lib/typings/browser.d.ts" />

/// <reference path="../common/functions/dom/add.ts" />
/// <reference path="../common/functions/dom/attr.ts" />
/// <reference path="../common/functions/dom/text-content.ts" />


function main(main_content?) {

    let main = main_content || document.querySelector('#main_content');

    return true;
}

if (!(<any>window).__karma__) document.addEventListener('DOMContentLoaded', () => main());
