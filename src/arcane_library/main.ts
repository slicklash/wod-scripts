/// <reference path="../common/toymvc.ts" />
/// <reference path="./app/index.ts" />

function main (main_content?) {

    let main = main_content || document.querySelector('#main_content'),
        h1: Element = main.querySelector('h1');

    if (h1) {
        try {
            let div: Element = document.createElement('div');
            div.setAttribute('class', 'component-app');
            h1.parentNode.insertBefore(div, h1.nextSibling);
            bootstrap(AppComponent);
        }
        catch (x) {
            debugger
            console.log(x);
        }
    }
}

if (!(<any>window).__karma__) document.addEventListener('DOMContentLoaded', () => main());
