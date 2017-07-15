import { add } from '../common/dom/add'
import { attr } from '../common/dom/attr'
import { textContent } from '../common/dom/text-content'
import { insertAfter } from '../common/dom/insert-after'
import { httpFetch } from '../common/net/http-fetch'

export function main (main_content?) {

    let table = (main_content || document.querySelector('#main_content')).querySelector('form table'),
        rows: HTMLTableRowElement[] = table ? <HTMLTableRowElement[]>Array.from(table.querySelectorAll('tr')) : undefined;

}

if (!(<any>window).__karma__) document.addEventListener('DOMContentLoaded', () => main());
