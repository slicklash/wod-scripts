/// <reference path="_references.ts" />

function initQuestLog(context: IAdventureContext) {

    if (!context || !context.isQuest) return;

    let questLog = new QuestLog(context),
        choice: string;

    if (!questLog.isSupported) return;

    window.addEventListener('adventure.choiceSelected', (e: CustomEvent) => {
        choice = e.detail;
    });

    var form = (<any>document.forms).the_form;

    if (form) {
        form.addEventListener('submit', () => {
             if (choice) questLog.onChoice(choice);
        });
    }
}

interface IQuestLogData {
    itemsPicked: string[],
    itemsFound: string[],
    tasksDone: string[]
}

interface IPlaceInfoMap {
    [key: string] : IPlaceOptions
}

interface IPlaceOptions {
    pickSingle?: string[];
    pickSingleTransform?: (x: string) => string;
    collect?: IActionEvent[];
    use?: IActionEvent[];
    do?: IActionEvent[];
    reset?: string;
}

interface IActionEvent {
    match: string;
    found?: string[];
    picked?: string[];
    done?: string[];
}

class QuestLog {

    public isSupported: boolean = true;

    private _id: string;
    private _data: IQuestLogData;
    private _info: IPlaceInfoMap;
    private _placeOptions: IPlaceOptions;

    constructor(private _context: IAdventureContext) {

        let { adventure, place } = _context, adventures = {};

        adventures[Quests.IngenuityTest] = this.getIngenuityTestInfo;
        adventures[Quests.RescuingFatherWuel] = this.getRescueFatherWuelInfo;
        adventures[Quests.Passingtime] = this.getPassingTimeInfo;

        if (!(adventure in adventures)) {
            this.isSupported = false;
            return;
        }

        this._info = adventures[adventure]();
        this._placeOptions  = this._info[place];

        this._id = `${_context.world}_${_context.idHero}_${_context.adventure.replace(/ /g, '').toLowerCase()}`;

        this.load();

        if (this._placeOptions) this.checkPlace();

        console.log('questlog:', this._data);
        console.log('context:', _context.place, _context.texts);

        this.display();
    }

    onChoice(choice: string) {

        if (!this._placeOptions) return;

        this.pickItem(choice);

        this.save();

        console.log('on submit', choice, this._data);
    }

    pickItem(item: string) {

        let op = this._placeOptions;

        if (op.pickSingle) {
            let itm = (op.pickSingleTransform ? op.pickSingleTransform(item) : item).trim();
            if (itm && op.pickSingle.indexOf(itm) > -1) {
                this._data.itemsPicked = this._data.itemsPicked.filter(x => op.pickSingle.indexOf(x) < 0);
                this._data.itemsPicked.push(itm);
            }
        }
    }

    checkPlace() {

        let op = this._placeOptions,
            isChanged = false,
            text = this._context.text;

        if (op.reset && text.indexOf(op.reset) > -1) {
            this.reset();
            return;
        }

        if (op.collect) {
            op.collect.forEach(x => {
                if (text.indexOf(x.match) > -1) {
                    x.found.forEach(itm => {
                        if (this._data.itemsFound.indexOf(itm) < 0) {
                            this._data.itemsFound.push(itm);
                            isChanged = true;
                        }
                    });
                }
            });
        }

        if (op.use) {
            op.use.forEach(x => {
                if (text.indexOf(x.match) > -1) {
                    if (x.found) this._data.itemsFound = this._data.itemsFound.filter(itm => x.found.indexOf(itm) < 0);
                    if (x.picked) this._data.itemsPicked = this._data.itemsPicked.filter(itm => x.picked.indexOf(itm) < 0);
                    isChanged = true;
                }
            });
        }

        if (op.do) {
            op.do.forEach(x => {
                if (text.indexOf(x.match) > -1) {
                    x.done.forEach(task => {
                        if (this._data.tasksDone.indexOf(task) < 0) {
                            this._data.tasksDone.push(task);
                            isChanged = true;
                        }
                    });
                }
            });
        }

        if (isChanged) this.save();
    }

    display(): void {

        let h1 = document.querySelector('h1');

        if (!h1) return;

        const toText = (title: string, items: any[]) => {
            if (!items || !items.length) return '';
            items.sort();
            return title + '\n' + items.join('\n');
        }

        let data = this._data,
            text = [toText('backpack:', data.itemsPicked.concat(data.itemsFound)), toText('done:', data.tasksDone)].join('\n\n');

        h1.setAttribute('title', text);
    }

    load() : void {

        let empty : IQuestLogData = { itemsPicked: [], itemsFound: [], tasksDone: [] },
            value = GM_getValue(this._id),
            loaded : IQuestLogData = value ? JSON.parse(value) : {};

        Object.keys(loaded).forEach(x => { if (!empty[x]) delete loaded[x]; });

        this._data = Object.assign(empty, loaded);
    }

    save(): void {
        GM_setValue(this._id, JSON.stringify(this._data));
    }

    reset(): void {
        this._data = { itemsPicked: [], itemsFound: [], tasksDone: [] };
        GM_setValue(this._id, undefined);
    }

    getPassingTimeInfo() : IPlaceInfoMap {
        return {}
    }

    getRescueFatherWuelInfo() : IPlaceInfoMap {
        return {
            '*': {
              collect: [
                  { match: 'unusual iridescent one', found: ['iridescent rock'] },
                  { match: 'fine electric eel', found: ['electric eel'] },
                  { match: 'fine octopus', found: ['octopus'] },
                  { match: 'fine lantern', found: ['lantern fish'] },
                  { match: 'fine puffer', found: ['puffer fish'] },
                  { match: 'fine mackerel', found: ['mackerel'] },
                  { match: 'fine piranha', found: ['piranha'] },
              ]
            },
            "Pekkerin Fen: Mel's School for Adventurers": {
              do: [
                  { match: 'Welcome to class #1', done: ['Adventure class #1'] },
                  { match: 'Welcome to class #2', done: ['Adventure class #2'] },
                  { match: 'Welcome to class #3', done: ['Adventure class #3'] },
                  { match: 'Welcome to class #4', done: ['Adventure class #4'] }
              ]
            },
            "Town Hall: Mayor's Office": { reset: 'Father Wuel, welcome' }
        }
    }

    getIngenuityTestInfo() : IPlaceInfoMap {
        return {
            '*': {
              collect: [
                  { match: 'You find a sparkly bejeweled necklace', found: ['bejeweled necklace'] },
                  { match: 'you see a blue key', found: ['blue key'] },
                  { match: 'You thank them for the wings', found: ['wings'] }
              ],
              use: [
                  { match: "it doesn't last forever", picked: ['bunch of driftwood', 'limburger cheese'] },
                  { match: 'You put a shell in', picked: ['bunch of tiny shells'] }
              ],
              do: [
                  { match: 'River mini-game done', done: ['River mini-game'] }
              ]
            },
            'The Fairytale Princess': { collect: [ { match: 'hands you some pink hair ribbons', found: ['pink hair ribbons'] } ] },
            "Rialb's Ghost": { collect: [ { match: 'purple key', found: ['purple key'] } ] },
            'Dwarf': { use: [ { match: 'He drinks it all down', found: ['water'], picked: ['bananas'] } ] },
            'Rickety Shed : Pick ...': { pickSingle: ['coil of rope', 'grass skirt', 'boat oars'] },
            'Sheltered Beach : Pick ...': { pickSingle: ['iridescent rock', 'bunch of driftwood', 'large carapace'] },
            'Middle of the River : Pick ...': {
                pickSingle: ['leaf lettuce', 'pumpkin', 'bananas', 'deck of playing cards', 'carrots', 'rainbow trout', 'corn', 'limburger cheese', 'suspenders'],
                pickSingleTransform: (x) => x.indexOf('Buy ') === 0 ? x.replace('Buy ', '') : ''
            },
            'Middle of the River : Chatting': { collect: [ { match: 'red key', found: ['red key'] } ] },
            'Rocky Shore, at a River': { collect: [ { match: 'decent rowboat here', found: ['rowboat with oars'] } ] },
            'Waves Beach : Pick ...': { pickSingle: ['bunch of tiny shells', 'bulbaroose shell', 'conch shell'] },
            'Freshwater Spring': { collect: [ { match: 'the water', found: ['water'] } ] },
            'The Upside-Down Carnival Machine': { do: [ { match: 'Carnival Machine mini-game done', done: ['Carnival Machine mini-game'] } ] },
            'Up on a Ledge': { do: [ { match: 'Thief mini-game done', done: ['Thief mini-game'] } ] },
            'Copious Cutouts': { do: [ { match: 'Copious Cutouts mini-game done', done: ['Copious Cutouts mini-game'] } ] },
            'Back at the Guild': { reset: 'Across the bridge' }
        }
    }
}
