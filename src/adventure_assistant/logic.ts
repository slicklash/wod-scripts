import { Store } from "@common/persistence/store";
import { AdventureContext, Quests } from "./context";

export function initQuestLog(context: AdventureContext): void {
  if (!context || !context.isQuest) {
    return;
  }

  const questLog = new QuestLog(context);
  let choice: string;

  if (!questLog.isSupported) {
    return;
  }

  window.addEventListener("adventure.choiceSelected", (e: Event) => {
    const customEvent = e as CustomEvent;
    choice = customEvent.detail;
  });

  const form = (<any>document.forms).the_form;

  if (form) {
    form.addEventListener("submit", () => {
      if (choice) {
        questLog.onChoice(choice);
      }
    });
  }
}

// --- QuestLog ---

type QuestLogData = {
  itemsPicked: string[];
  itemsFound: string[];
  tasksDone: string[];
};

type PlaceInfoMap = {
  [key: string]: PlaceOptions;
};

type PlaceOptions = {
  pickSingle?: string[];
  pickSingleTransform?: (x: string) => string;
  collect?: ActionEvent[];
  use?: ActionEvent[];
  do?: ActionEvent[];
  reset?: string;
};

type ActionEvent = {
  match: string;
  found?: string[];
  picked?: string[];
  done?: string[];
};

export class QuestLog {
  isSupported: boolean = true;

  private _id?: string;
  private _data?: QuestLogData;
  private _info?: PlaceInfoMap;
  private _placeOptions?: PlaceOptions;

  constructor(private _context: AdventureContext) {
    const { adventure, place } = _context;
    const adventures: Record<string, () => PlaceInfoMap> = {};

    adventures[Quests.IngenuityTest] = this.getIngenuityTestInfo;
    adventures[Quests.RescuingFatherWuel] = this.getRescueFatherWuelInfo;
    adventures[Quests.Passingtime] = this.getPassingTimeInfo;

    if (!(adventure in adventures)) {
      this.isSupported = false;
      return;
    }

    this._info = adventures[adventure]();
    if (!this._info) {
      this.isSupported = false;
      return;
    }
    this._placeOptions = this._info[place];

    this._id = `${_context.world}_${_context.idHero}_${_context.adventure.replace(/ /g, "").toLowerCase()}`;

    this.load().then(() => {
      if (this._placeOptions) {
        this.checkPlace();
      }

      /* tslint:disable */
      console.log("questlog:", this._data);
      console.log("context:", _context.place, _context.texts);
      /* tslint:enable */

      this.display();
    });
  }

  onChoice(choice: string): void {
    if (!this._placeOptions) {
      return;
    }

    this.pickItem(choice);
    this.save();

    /* tslint:disable */
    console.log("on submit", choice, this._data);
    /* tslint:enable */
  }

  pickItem(item: string): void {
    const op = this._placeOptions;
    if (!op) return;

    if (op.pickSingle) {
      const itm = (
        op.pickSingleTransform ? op.pickSingleTransform(item) : item
      ).trim();
      if (itm && op.pickSingle.indexOf(itm) > -1) {
        if (!this._data) return;
        this._data.itemsPicked = this._data.itemsPicked.filter(
          (x) => op.pickSingle && op.pickSingle.indexOf(x) < 0,
        );
        this._data.itemsPicked.push(itm);
      }
    }
  }

  checkPlace(): void {
    const op = this._placeOptions;
    if (!op) return;
    let isChanged = false;
    const text = this._context.text;

    if (op.reset && text.indexOf(op.reset) > -1) {
      this.reset();
      return;
    }

    if (op.collect) {
      op.collect.forEach((x) => {
        if (text.indexOf(x.match) > -1) {
          x.found?.forEach((itm) => {
            if (
              this._data?.itemsFound &&
              this._data.itemsFound.indexOf(itm) < 0
            ) {
              this._data.itemsFound.push(itm);
              isChanged = true;
            }
          });
        }
      });
    }

    if (op.use) {
      op.use.forEach((x) => {
        if (text.indexOf(x.match) > -1) {
          if (x.found && this._data?.itemsFound)
            this._data.itemsFound = this._data.itemsFound.filter(
              (itm) => x.found && x.found.indexOf(itm) < 0,
            );
          if (x.picked && this._data?.itemsPicked)
            this._data.itemsPicked = this._data.itemsPicked.filter(
              (itm) => x.picked && x.picked.indexOf(itm) < 0,
            );
          isChanged = true;
        }
      });
    }

    if (op.do) {
      op.do.forEach((x) => {
        if (text.indexOf(x.match) > -1 && x.done) {
          x.done.forEach((task) => {
            if (this._data && this._data.tasksDone.indexOf(task) < 0) {
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
    const h1 = document.querySelector("h1");

    if (!h1) return;

    const toText = (title: string, items: unknown[]) => {
      if (!items || !items.length) return "";
      items.sort();
      return title + "\n" + (items as string[]).join("\n");
    };

    const data = this._data;
    if (!data) return;
    const text = [
      toText("backpack:", data.itemsPicked.concat(data.itemsFound)),
      toText("done:", data.tasksDone),
    ].join("\n\n");

    h1.setAttribute("title", text);
  }

  load(): Promise<void> {
    const empty: QuestLogData = {
      itemsPicked: [],
      itemsFound: [],
      tasksDone: [],
    };

    return new Promise((resolve) => {
      if (!this._id) {
        this._data = empty;
        resolve();
        return;
      }
      Store.get(this._id).then((value) => {
        const loaded: QuestLogData = value ? JSON.parse(value) : {};
        Object.keys(loaded).forEach((x) => {
          if (!empty[x]) delete loaded[x];
        });
        this._data = Object.assign(empty, loaded);
        resolve();
      });
    });
  }

  save(): void {
    if (!this._id || !this._data) return;
    Store.set(this._id, JSON.stringify(this._data));
  }

  reset(): void {
    if (!this._id) return;
    this._data = { itemsPicked: [], itemsFound: [], tasksDone: [] };
    Store.set(this._id, "{}");
  }

  getPassingTimeInfo(): PlaceInfoMap {
    return {};
  }

  getRescueFatherWuelInfo(): PlaceInfoMap {
    return {
      "*": {
        collect: [
          { match: "unusual iridescent one", found: ["iridescent rock"] },
          { match: "fine electric eel", found: ["electric eel"] },
          { match: "fine octopus", found: ["octopus"] },
          { match: "fine lantern", found: ["lantern fish"] },
          { match: "fine puffer", found: ["puffer fish"] },
          { match: "fine mackerel", found: ["mackerel"] },
          { match: "fine piranha", found: ["piranha"] },
        ],
      },
      "Pekkerin Fen: Mel's School for Adventurers": {
        do: [
          { match: "Welcome to class #1", done: ["Adventure class #1"] },
          { match: "Welcome to class #2", done: ["Adventure class #2"] },
          { match: "Welcome to class #3", done: ["Adventure class #3"] },
          { match: "Welcome to class #4", done: ["Adventure class #4"] },
        ],
      },
      "Town Hall: Mayor's Office": { reset: "Father Wuel, welcome" },
    };
  }

  getIngenuityTestInfo(): PlaceInfoMap {
    return {
      "*": {
        collect: [
          {
            match: "You find a sparkly bejeweled necklace",
            found: ["bejeweled necklace"],
          },
          { match: "you see a blue key", found: ["blue key"] },
          { match: "You thank them for the wings", found: ["wings"] },
        ],
        use: [
          {
            match: "it doesn't last forever",
            picked: ["bunch of driftwood", "limburger cheese"],
          },
          { match: "You put a shell in", picked: ["bunch of tiny shells"] },
        ],
        do: [{ match: "River mini-game done", done: ["River mini-game"] }],
      },
      "The Fairytale Princess": {
        collect: [
          {
            match: "hands you some pink hair ribbons",
            found: ["pink hair ribbons"],
          },
        ],
      },
      "Rialb's Ghost": {
        collect: [{ match: "purple key", found: ["purple key"] }],
      },
      Dwarf: {
        use: [
          {
            match: "He drinks it all down",
            found: ["water"],
            picked: ["bananas"],
          },
        ],
      },
      "Rickety Shed : Pick ...": {
        pickSingle: ["coil of rope", "grass skirt", "boat oars"],
      },
      "Sheltered Beach : Pick ...": {
        pickSingle: ["iridescent rock", "bunch of driftwood", "large carapace"],
      },
      "Middle of the River : Pick ...": {
        pickSingle: [
          "leaf lettuce",
          "pumpkin",
          "bananas",
          "deck of playing cards",
          "carrots",
          "rainbow trout",
          "corn",
          "limburger cheese",
          "suspenders",
        ],
        pickSingleTransform: (x) =>
          x.indexOf("Buy ") === 0 ? x.replace("Buy ", "") : "",
      },
      "Middle of the River : Chatting": {
        collect: [{ match: "red key", found: ["red key"] }],
      },
      "Rocky Shore, at a River": {
        collect: [
          { match: "decent rowboat here", found: ["rowboat with oars"] },
        ],
      },
      "Waves Beach : Pick ...": {
        pickSingle: ["bunch of tiny shells", "bulbaroose shell", "conch shell"],
      },
      "Freshwater Spring": {
        collect: [{ match: "the water", found: ["water"] }],
      },
      "The Upside-Down Carnival Machine": {
        do: [
          {
            match: "Carnival Machine mini-game done",
            done: ["Carnival Machine mini-game"],
          },
        ],
      },
      "Up on a Ledge": {
        do: [{ match: "Thief mini-game done", done: ["Thief mini-game"] }],
      },
      "Copious Cutouts": {
        do: [
          {
            match: "Copious Cutouts mini-game done",
            done: ["Copious Cutouts mini-game"],
          },
        ],
      },
      "Back at the Guild": { reset: "Across the bridge" },
    };
  }
}
