/// <reference path="../../lib/typings/browser.d.ts" />

/// <reference path="../common/functions/dom/add.ts" />
/// <reference path="../common/functions/dom/attr.ts" />
/// <reference path="../common/functions/dom/text-content.ts" />
/// <reference path="../common/functions/dom/insert-after.ts" />

/// <reference path="../common/functions/ajax/http-fetch.ts" />
/// <reference path="../common/functions/parsing/parse-html.ts" />
/// <reference path="../common/functions/parsing/parse-item-details.ts" />
/// <reference path="../common/functions/parsing/parse-modifiers.ts" />

/// <reference path="../common/components/grid/grid.ts" />

function main (main_content?) {

    let main = main_content || document.querySelector('#main_content'),
        h1 = main.querySelector('h1');

    if (h1) {
        try {
            let ctrl = new Controller();
            ctrl.init(h1);
        }
        catch (x) {
            debugger
            console.log(x);
        }
    }
}

interface ItemInfo extends ItemDetails {
    name: string;
    modifiers?: Modifiers;
}

class Controller {

    inputSearch: HTMLInputElement;
    buttonSearch: HTMLInputElement;

    inputClass: HTMLInputElement;
    inputRace: HTMLInputElement;
    inputLocation: HTMLInputElement;
    inputUnique: HTMLInputElement;
    inputType: HTMLInputElement;
    inputSkill: HTMLInputElement;
    inputEffect: HTMLInputElement;
    inputNeeds: HTMLInputElement;

    grid: Grid;

    inputCmd;
    buttonRun;
    outputWindow;

    init (header) {
        this.renderUI(header);
    }

    onRunCommand () {
       let [cmd, ...args] = this.inputCmd.value.split(':');
       // this.inputCmd.value = '';
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

            httpFetch('/wod/spiel/hero/item.php?name=' + encodeURIComponent(name)).then((result: string) => {

                // debugger;

                let html = <any>parseHTML(result, true);
                let details = html.querySelector('#details');

                if (!details) return undefined;

                let itemDetails = Object.assign(parseItemDetails(details), { name });

                let modifiers = parseModifiers(html.querySelector('#link'));

                if (modifiers) Object.assign(itemDetails, { modifiers });

                // this.log(JSON.stringify(itemDetails));

                httpFetch('http://localhost:8081/items', 'POST', itemDetails);
            });
        }
        else if (cmd === 'jobs') {
            httpFetch('http://localhost:8081/jobs').then((jobs: any) => {
                jobs = JSON.parse(jobs);
                if (jobs && jobs.length) {
                    jobs.forEach(x=> { this.handleCommand('parse', [x.item]); });
                }
            });
        }
    }

    renderUI (header) {

        let panel = <HTMLDivElement>parseHTML(`
            <div style="display:none">

              <div class="search_container" style="float: none">
                <table class="search_short texttoken">
                <tbody>
                    <tr>
                        <td>
                            Name: <input type="text" id="input-search" value="" size="30">
                            <input type="button" id="btn-search" value="Search" class="button clickable" />
                        </td>
                    </tr>
                </tbody>
                </table>
              </div>
              <div style="border: thin solid #909090">
                 <table>
                   <tbody>
                       <tr>
                           <td>Class / Race </td>
                           <td>
                               <input type="text" id="input-class" />
                               <input type="text" id="input-race" />
                           </td>
                       </tr>
                       <tr>
                           <td>Location / Unique </td>
                           <td>
                               <input type="text" id="input-location" />
                               <input type="text" id="input-unique" />
                           </td>
                       </tr>
                       <tr>
                           <td>Type / Skill </td>
                           <td>
                               <input type="text" id="input-type" />
                               <input type="text" id="input-skill" />
                           </td>
                       </tr>
                       <tr>
                           <td>Effect / Needs </td>
                           <td>
                               <input type="text" id="input-effect" />
                               <input type="text" id="input-needs" />
                           </td>
                       </tr>
                       <tr>
                           <td>Consumable</td>
                           <td>
                               <label><input type="radio" name="input-usage" value="both" checked />Both</label>
                               <label><input type="radio" name="input-usage" value="yes" />Yes<label>
                               <label><input type="radio" name="input-usage" vaue="no" />No</label>
                           </td>
                       </tr>
                   </tbody>
                 </table>
              </div>

              <div id="grid-items"></div>

              <br/>

              <input type="text" id="input-cmd" value="search:*hatred*" />
              <input type="button" id="btn-run" value="run" class="button clickable" />

              <br/>

              <textarea id="output-window" readonly style="height: 50px; width:200px"></textarea>

              <br/>

            </div>
        `);

        insertAfter(header, panel);

        this.initGrid();

        header.style.cursor = 'pointer';
        header.addEventListener('click', () => { panel.style.display = panel.style.display ? '' : 'none'; });

        [this.inputSearch, this.buttonSearch,
         this.inputClass, this.inputRace,
         this.inputLocation, this.inputUnique,
         this.inputType, this.inputSkill,
         this.inputEffect, this.inputNeeds,
         this.buttonRun, this.inputCmd, this.outputWindow] = [
             '#input-search', '#btn-search',
             '#input-class', '#input-race',
             '#input-location', '#input-unique',
             '#input-type', '#input-skill',
             '#input-effect', '#input-needs',
             '#btn-run', '#input-cmd', '#output-window'].map(x => <any>panel.querySelector(x));

        this.buttonRun.addEventListener('click', this.onRunCommand.bind(this));
        this.inputCmd.addEventListener('keyup', (e: KeyboardEvent) => { if (e.which === 13) this.onRunCommand() });
        this.buttonSearch.addEventListener('click', this.applySearch.bind(this));
    }

    filters: any;

    applySearch (args) {
        this.filters = {
            name: this.inputSearch.value,
            'heroClasses.include': this.inputClass.value,
            'races.include': this.inputRace.value,
            location: this.inputLocation.value,
            unique: this.inputUnique.value,
            itemClasses: this.inputType.value,
            skills: this.inputSkill.value,
            effect: this.inputEffect.value,
            needs: this.inputNeeds.value,
        };
        this.grid.fetchPage(1);
    }

    onGridRequest (req: GridRequest) {
        Object.assign(req.params, this.filters);
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
        }

        let dt: GridDataSourceOptions = {
            url: 'http://localhost:8081/items',
            onConstructRequest: this.onGridRequest.bind(this),
        }

        this.grid.init('#grid-items', options, dt);
    }

    log (msg) {
       this.outputWindow.value += msg + '\n';
    }
}

if (!(<any>window).__karma__) document.addEventListener('DOMContentLoaded', () => main());
