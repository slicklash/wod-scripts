/// <reference path="../../lib/typings/browser.d.ts" />

/// <reference path="../common/functions/dom/add.ts" />
/// <reference path="../common/functions/dom/attr.ts" />
/// <reference path="../common/functions/dom/text-content.ts" />
/// <reference path="../common/functions/dom/insert-after.ts" />

/// <reference path="../common/functions/ajax/http-fetch.ts" />
/// <reference path="../common/functions/parsing/parse-html.ts" />
/// <reference path="../common/functions/parsing/parse-item-details.ts" />
/// <reference path="../common/functions/parsing/parse-modifiers.ts" />

function main (main_content?) {

    let main = main_content || document.querySelector('#main_content'),
        h1 = main.querySelector('h1');

    if (h1) {
        try {
        let ctrl = new Controller();
        ctrl.init(h1);
        }
        catch (x) {
            console.log(x);
        }
    }
}

interface ItemInfo extends ItemDetails {
    name: string;
    modifiers?: Modifiers;
}

class Controller {

    inputCmd;
    buttonRun;
    outputWindow;

    init (header) {
        this.createUI(header);
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

                let html = parseHTML(result, true);
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

    createUI (header) {

        let panel = add('div');
        this.inputCmd = add('input', panel);
        this.buttonRun = add('input', panel);
        add('br', panel);
        this.outputWindow = add('textarea', panel);

        attr(panel, {'height': '100px'});
        attr(this.inputCmd, {'type': 'text', 'value': 'parse:torch'});
        attr(this.buttonRun, {'type': 'button', 'class': 'button clickable', 'value':'run'});
        attr(this.outputWindow,  {'style': 'width:500px;height:200px', 'readonly': 'readonly'});

        panel.style.display = 'none';
        insertAfter(header, panel);

        header.style.cursor = 'pointer';
        header.addEventListener('click', () => { panel.style.display = panel.style.display ? '' : 'none'; });

        this.buttonRun.addEventListener('click', this.onRunCommand.bind(this));
        this.inputCmd.addEventListener('keyup', (e: KeyboardEvent) => { if (e.which === 13) this.onRunCommand() });
    }

    log (msg) {
       this.outputWindow.value += msg + '\n';
    }
}

if (!(<any>window).__karma__) document.addEventListener('DOMContentLoaded', () => main());
