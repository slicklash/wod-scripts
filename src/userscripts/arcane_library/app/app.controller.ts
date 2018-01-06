import { parseHTML } from '../../../common/dom/parse-html';
import { httpFetch } from '../../../common/net/http-fetch';

import { ItemDetails, Constraints, parseItemDetails } from '../../../common/parsing/parse-item-details';
import { Modifiers, parseModifiers } from '../../../common/parsing/parse-modifiers';

import { log } from '../../../common/debugging/log';

import { IComponentController } from '../../../common/toymvc/core';

import { SearchForm } from './search/search-form/search-form';
import { SearchGrid } from './search/search-grid/search-grid';


export class AppController implements IComponentController {

    element: Element;

    searchValue: any;

    cmd: string = 'parse:torch';
    logMsg: string;

    $onInit (element: Element) {
        this.element = element;
        this.render();
    }

    onRunCommand () {
       let [cmd, ...args] = this.cmd.split(':');
       this.handleCommand(cmd, args);
    }

    handleCommand (cmd, args) {

        this.log(`command: ${cmd}`);

        if (args && args.length) {
            this.log(`args: [${args.join(',')}]`);
        }

        if (cmd === 'parse') {

            let name = args.join(':');
            this.log(`parsing ${name}...`);

            httpFetch('/wod/spiel/hero/item.php?name=' + encodeURIComponent(name)).then(resp => {

                let result = resp.data;
                let html = <any>parseHTML(result, true);
                let details = html.querySelector('#details');

                if (!details) {
                  return undefined;
                }

                let itemDetails = Object.assign(parseItemDetails(details), { name });

                let modifiers = parseModifiers(html.querySelector('#link'));

                if (modifiers) {
                  Object.assign(itemDetails, { modifiers });
                }

                httpFetch('http://localhost:8081/items', 'POST', itemDetails);
            });
        } else if (cmd === 'jobs') {
            httpFetch('http://localhost:8081/jobs').then(resp => {
                let jobs = JSON.parse(resp.data);
                if (jobs && jobs.length) {
                    jobs.forEach(x=> { this.handleCommand('parse', [x]); });
                }
            });
        }
    }

    render () {

      let grid;

      const applySearch = (searchValue = '') => {
        grid.search(searchValue);
      };

      const props = { onSearch: v => applySearch(v) };

      new SearchForm(document.getElementById('search-items'), props).$onInit();
      grid = new SearchGrid(document.getElementById('search-grid'), props);
      grid.$onInit();
      applySearch();
    }

    log (msg) {
       this.logMsg += msg + '\n';
    }
}
