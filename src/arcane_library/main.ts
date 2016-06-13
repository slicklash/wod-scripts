/// <reference path="../../lib/typings/browser.d.ts" />

/// <reference path="../common/functions/dom/add.ts" />
/// <reference path="../common/functions/dom/attr.ts" />
/// <reference path="../common/functions/dom/text-content.ts" />
/// <reference path="../common/functions/dom/insert-after.ts" />

/// <reference path="../common/functions/ajax/http-fetch.ts" />
/// <reference path="../common/functions/parsing/parse-html.ts" />
/// <reference path="../common/functions/parsing/parse-item.ts" />

function main (main_content?) {

    let main = main_content || document.querySelector('#main_content'),
        h1 = main.querySelector('h1');

    if (h1) {
        let ctrl = new Controller();
        ctrl.init(h1);
    }
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
       this.inputCmd.value = '';
       this.handleCommand(cmd, args);
    }

    handleCommand (cmd, args) {
        this.log(`command: ${cmd}`);
        if (args && args.length) {
            this.log(`args: [${args.join(',')}]`);
        }

        if (cmd === 'parse') {
            httpFetch('/wod/spiel/hero/item.php?name=' + args.join(':')).then((result: string) => {
                let item = parseItem(result);
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
        attr(this.inputCmd, {'type': 'text'});
        attr(this.buttonRun, {'type': 'button', 'class': 'button clickable', 'value':'run'});
        attr(this.outputWindow,  {'style': 'width:500px;height:200px', 'readonly': 'readonly'});

        panel.style.display = 'none';
        insertAfter(header, panel);

        header.style.cursor = 'pointer';
        header.addEventListener('click', () => { panel.style.display = panel.style.display ? '' : 'none'; });

        this.buttonRun.addEventListener('click', this.onRunCommand.bind(this));
    }

    log (msg) {
       this.outputWindow.value += msg + '\n';
    }
}

if (!(<any>window).__karma__) document.addEventListener('DOMContentLoaded', () => main());
