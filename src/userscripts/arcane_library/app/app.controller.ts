import { parseHTML } from '../../../common/dom/parse-html';
import { httpFetch } from '../../../common/net/http-fetch';

import { ItemDetails, Constraints, parseItemDetails } from '../../../common/parsing/parse-item-details';
import { Modifiers, parseModifiers } from '../../../common/parsing/parse-modifiers';

import { Grid, GridOptions } from  '../../../common/components/grid/grid';
import { GridDataSourceOptions, GridRequest } from  '../../../common/components/grid/grid.data-source';

import { log } from '../../../common/debugging/log';

import { FormControlGroup } from '../../../common/toymvc/forms/form-control-group';

import { IComponentController } from '../../../common/toymvc/core';

interface ItemInfo extends ItemDetails {
    name: string;
    modifiers?: Modifiers;
}

export class AppController implements IComponentController {

    element: Element;

    form: FormControlGroup;

    grid: Grid;

    cmd: string = 'parse:torch';
    logMsg: string;

    $onInit (element: Element) {

        this.element = element;

        this.initGrid();

        this.form = new FormControlGroup('form', this.element).reset({
            actionSearch: { enumerable: false, writable: false },
            actionCommand: { disabled: true, enumerable: false, writable: false },
        });

        this.form.valueChanges.subscribe(v => {

            console.log(v);
        });

        this.attachEvent();
        this.applySearch();
    }

    attachEvent () {

        (<any>this.form.controls).actionSearch.element.addEventListener('click', this.applySearch.bind(this));
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

                if (!details) return undefined;

                let itemDetails = Object.assign(parseItemDetails(details), { name });

                let modifiers = parseModifiers(html.querySelector('#link'));

                if (modifiers) Object.assign(itemDetails, { modifiers });

                httpFetch('http://localhost:8081/items', 'POST', itemDetails);
            });
        }
        else if (cmd === 'jobs') {
            httpFetch('http://localhost:8081/jobs').then(resp => {
                let jobs = JSON.parse(resp.data);
                if (jobs && jobs.length) {
                    jobs.forEach(x=> { this.handleCommand('parse', [x.item]); });
                }
            });
        }
    }

    rawFilter: string;

    applySearch () {
        this.grid.fetchPage(1);
    }

    onGridRequest (req: GridRequest) {

        Object.assign(req.params, this.form.value);

        // let raw = this.rawFilter;
        // if (raw) {
        //    let p: string[] = raw.split('&');
        //    p.forEach(x => {
        //        let [key, val] = x.split('=');
        //        req.params[key] = val;
        //    });
        // }
        return req;
    }

    initGrid () {

        this.grid = new Grid();

        let renderContrainsts = (key, row) => {
            let value = row[key];

            if (typeof value === 'string') {
                return value;
            }

            let con: Constraints = value;

            let result = [];

            if (con.include) {
                result.push('<span class="generic_yes">' + con.include.join(', ') + '</span>');
            }

            if (con.exclude) {
                result.push('<span class="generic_no">' + con.exclude.join(', ') + '</span>');
            }

            return result.join(' ');
        };

        let renderLevel = (row: ItemInfo) => {

            let req = row.requirements;

            if (!Array.isArray(req) || !req.length) return '';

            let level = (<string[]>req).find(x => x.indexOf('level is') > -1);

            if (!level) return '';

            return level.split(' ').pop();
        };

        let options: GridOptions = {
            columns: [
                { header: 'Name', field: 'name', render: (row) => `<a href="/wod/spiel/hero/item.php?name=${row.name}&IS_POPUP=1" target="_blank">${row.name}</a>` },
                { header: 'Location', field: 'location' },
                { header: 'Level', field: 'level', render: renderLevel },
                { header: 'Unique', field: 'unique' },
                { header: 'Effect', field: 'effect' },
                { header: 'Classes', field: 'heroClasses', render: renderContrainsts.bind(this, 'heroClasses') },
                { header: 'Races', field: 'races', render: renderContrainsts.bind(this, 'races') },
            ],
        };

        let dt: GridDataSourceOptions = {
            url: 'http://localhost:8081/items',
            onConstructRequest: this.onGridRequest.bind(this),
        };

        this.grid.init('#grid-items', options, dt);
    }

    log (msg) {
       this.logMsg += msg + '\n';
    }
}
