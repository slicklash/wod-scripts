import { AdventureContext } from "./context";

const QUEST_TITLES = ["Passingtime", "Rescuing Father Wuel", "Ingenuity Test"];

const APPOINTMENT_TITLES = [
  "The pumpkin hero tavern",
  "The Adventurers' Guild",
  "The Sunday Grove",
  "Free warriors arena of Nebulat",
  "Old Training Grounds",
  "The Fortunes of Madame",
  "Haiku medal",
  "Trading Post",
  "Z Delete Passingtime in-progress flag",
  "Z Clear Forced Exit",
  "Z Set Forced Exit",
];

type TabKey = "appointments" | "crafting" | "quests";

let _quests: HTMLElement[] = [];
let _appointments: HTMLElement[] = [];
let _crafting: HTMLElement[] = [];

const TAB_TITLES: Record<TabKey, string> = {
  quests: "Quests",
  appointments: "Appointments",
  crafting: "Crafting",
};

export function initTabs(): void {
  if (!document.querySelector(".paginator_row")) return;

  const categorize = (title: string): TabKey | null => {
    if (QUEST_TITLES.some((name) => title.includes(name))) return "quests";
    if (APPOINTMENT_TITLES.some((name) => title.includes(name)))
      return "appointments";
    return null;
  };

  const invertClass = (className: string) =>
    className === "row0" ? "row1" : "row0";

  const titleOf = (row: Element) => row.querySelector("h3")?.innerHTML ?? "";

  const adventures = Array.from(
    document.querySelectorAll<HTMLElement>(".row0, .row1"),
  );

  adventures.sort((a, b) => {
    const titleA = titleOf(a);
    const titleB = titleOf(b);

    const indexA = _sortByOrder(titleA);
    const indexB = _sortByOrder(titleB);

    if (indexA === -1) return indexB === -1 ? 0 : 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });

  adventures.forEach((adventure) => {
    adventure.parentNode?.appendChild(adventure);
  });

  _quests = [];
  _appointments = [];
  _crafting = [];

  let appClass = "row1";
  let craftClass = "row1";

  for (const adventure of adventures) {
    const className = adventure.className;
    const title = titleOf(adventure);

    if (!title) continue;

    const category = categorize(title);
    const currentClass = category === "appointments" ? appClass : craftClass;
    const nextClass =
      currentClass === className ? invertClass(currentClass) : className;

    if (category === "quests") {
      _quests.push(adventure);
    } else if (category === "appointments") {
      appClass = nextClass;
      _appointments.push(adventure);
    } else {
      craftClass = nextClass;
      _crafting.push(adventure);
      adventure.style.display = "none";
    }

    adventure.className = nextClass;
    _hideDescription(adventure);
  }

  const menu = document.createElement("ul");
  menu.innerHTML = '<li class="label">Adventures</li>';
  menu.append(
    makeTab("appointments", TAB_TITLES.appointments, true),
    makeTab("crafting", TAB_TITLES.crafting, false),
    makeTab("quests", TAB_TITLES.quests, false),
  );

  const bar = document.createElement("div");
  bar.className = "bar";

  const content = document.createElement("div");
  content.className = "content";

  const tab = document.createElement("div");
  tab.className = "tab";
  tab.append(menu, bar, content);

  const h1 = document.querySelector("h1");
  if (h1?.parentNode) {
    h1.parentNode.replaceChild(tab, h1);
  }

  _showTab("appointments", true);
  _showTab("crafting", false);
  _showTab("quests", false);
}

function _sortByOrder(title: string): number {
  const combined = [...QUEST_TITLES, ...APPOINTMENT_TITLES];
  return combined.findIndex((name) => title.includes(name));
}

function _hideDescription(row: Element): void {
  const td = row.querySelector("td")!;
  const header = td.children[0] as HTMLElement;

  const descriptionNodes = Array.from(td.childNodes).filter(
    (node) => node.nodeName !== "TABLE",
  );

  const description = document.createElement("div");
  description.style.display = "none";
  td.insertBefore(description, header.nextSibling);
  descriptionNodes.forEach((node) => description.appendChild(node));

  header.style.cursor = "pointer";

  const title = header.querySelector("h3") as HTMLElement;
  title.style.display = "inline";

  const icon = document.createElement("img");
  icon.src = "/wod/css/icons/common/more_text.png";
  icon.style.paddingLeft = "10px";
  title.parentNode!.appendChild(icon);

  title.parentElement!.style.paddingBottom = "5px";
  td.style.paddingBottom = "5px";

  header.addEventListener("click", () => {
    const isHidden = Boolean(description.style.display);

    description.style.display = isHidden ? "" : "none";
    icon.src = icon.src.replace(
      isHidden ? "more" : "less",
      isHidden ? "less" : "more",
    );
  });
}

function makeTab(key: TabKey, label: string, selected: boolean): HTMLLIElement {
  const action = document.createElement("a");
  action.href = "#";
  action.textContent = label;
  action.addEventListener("click", _selectTab);

  const tab = document.createElement("li");
  tab.className = selected ? "selected" : "not_selected";
  tab.appendChild(action);

  return tab;
}

function _selectTab(e: Event): void {
  e.preventDefault();

  const target = e.currentTarget as HTMLAnchorElement;
  const selectedTab = target.parentElement;

  if (!selectedTab) return;

  const selectedTitle = target.textContent?.trim() ?? "";
  _activeTab =
    (Object.entries(TAB_TITLES).find(
      ([, v]) => v === selectedTitle,
    )?.[0] as TabKey) ?? "appointments";

  selectedTab.className = "selected";
  if (selectedTab.nextElementSibling) {
    selectedTab.nextElementSibling.className = "not_selected";
  }
  if (selectedTab.previousElementSibling) {
    selectedTab.previousElementSibling.className = "not_selected";
  }

  _showTab("appointments", _activeTab === "appointments");
  _showTab("crafting", _activeTab === "crafting");
  _showTab("quests", _activeTab === "quests");
}

let _activeTab: TabKey = "appointments";

function _showTab(key: TabKey, visible: boolean): void {
  const list =
    key === "quests"
      ? _quests
      : key === "appointments"
        ? _appointments
        : _crafting;
  list.forEach((row) => {
    row.style.display = visible ? "" : "none";
  });
}

const HOT_KEY_CHARS = "123456789qwertyuiop";

export function initHotKeys(): void {
  const buttons: HTMLElement[] = Array.from(
    document.querySelectorAll('a, input[type="submit"]'),
  );
  let buttonNext: HTMLElement | undefined;
  let buttonMore: HTMLElement | undefined;

  if (buttons.length) {
    buttons.forEach((button) => {
      const innerHTML = button.innerHTML;
      const value =
        button instanceof HTMLInputElement ? button.value : undefined;

      if (innerHTML === "Next" || (value && value.trim() === "Ok")) {
        buttonNext = button;
        _addHotkeyFor(button.parentNode, "n");
      } else if (innerHTML === "More adventures") {
        buttonMore = button;
        _addHotkeyFor(buttonMore.parentNode, "m");
      }
    });

    if (buttonNext) {
      buttonNext.focus();
    } else if (buttonMore) {
      buttonMore.focus();
    }
  }

  const choices: HTMLInputElement[] = Array.from(
    document.querySelectorAll('input[type="radio"]'),
  );
  const choiceMap: Record<number, HTMLInputElement> = {};

  if (choices.length) {
    choices.forEach((choice, i) => {
      const labelElem = choice.parentNode;
      const hotkey: string = HOT_KEY_CHARS[i];
      const keyCode: number = hotkey.toUpperCase().charCodeAt(0);

      choiceMap[keyCode] = choice;
      if (labelElem) _addHotkeyFor(labelElem, hotkey);
    });
  }

  if (choices.length || buttonNext || buttonMore) {
    const normalizeKey = (key: number) =>
      key >= 96 && key <= 105 ? key - 48 : key;

    document.onkeyup = (e: KeyboardEvent) => {
      const activeElem = document.activeElement;

      if (
        activeElem &&
        activeElem.tagName.toLowerCase() === "input" &&
        activeElem.getAttribute("type") === "text"
      ) {
        return;
      }

      const keyCode = normalizeKey(e.which);

      if (buttonMore && keyCode === 77 /* m */) {
        buttonMore.focus();
      } else if (
        buttonNext &&
        (keyCode === 78 /* n */ || keyCode === 48) /* 0 */
      ) {
        buttonNext.focus();
      } else if (Object.prototype.hasOwnProperty.call(choiceMap, keyCode)) {
        const choice = choiceMap[keyCode];
        choice.checked = true;
        choice.focus();
        _publishChoiceEvent(choice);
        return false;
      }
    };
  }
}

function _publishChoiceEvent(choice: HTMLInputElement): void {
  const event = new CustomEvent("adventure.choiceSelected", {
    detail: choice.nextSibling?.textContent?.trim() ?? "",
  });

  window.dispatchEvent(event);
}

export function _addHotkeyFor(elem: Node | null, text: string): void {
  if (elem) {
    const span = document.createElement("span");
    span.innerHTML = `<sup style="padding: 1px 3px; border: 1px solid #666; font-size: 10px">${text}</sup>`;
    elem.appendChild(span);
  }
}

const HIGHLIGHT_TITLES = {
  IngenuityTest: "Ingenuity Test",
  Passingtime: "Passingtime",
  RescuingFatherWuel: "Rescuing Father Wuel",
};

export function initHighlights(context: AdventureContext): void {
  if (!context || !context.isQuest) {
    return;
  }

  const { adventure, place } = context;
  const adventures: Record<string, () => PlaceInfoMap> = {};

  adventures[HIGHLIGHT_TITLES.RescuingFatherWuel] = getWuelHighlights;
  adventures[HIGHLIGHT_TITLES.Passingtime] = getPassingtimeHighlights;
  adventures[HIGHLIGHT_TITLES.IngenuityTest] = getIngenuityTestHighlights;

  if (!(adventure in adventures)) {
    return;
  }

  const highlights = adventures[adventure]()[place] || [];

  const texts = context.texts.map((x) => x.innerHTML);

  highlights.forEach((x) => {
    const start = x.indexOf("_");
    const end = x.indexOf("_", start + 1);
    const search = new RegExp(start > -1 ? x.replace(/_/g, "") : x, "g");
    const highlight =
      start > -1
        ? `${x.substring(0, start)}<span style="color:orchid">${x.substring(start + 1, end)}</span>${x.substring(end + 1)}`
        : `<span style="color:orchid">${x}</span>`;

    texts.forEach((y, i) => {
      texts[i] = y.replace(search, highlight);
    });
  });

  const re_html = /&lt;(.+)&gt;(.+)&lt;\/\1&gt;/g;

  context.texts.forEach((x, i) => {
    x.innerHTML = texts[i].replace(
      re_html,
      '<$1 style="color:mediumseagreen">$2</$1>',
    );
  });
}

type PlaceInfoMap = Record<string, string[]>;

function getPassingtimeHighlights(): PlaceInfoMap {
  return {
    "*": ["bejeweled necklace"],
    "Grandfather answers": ["stonemasonry", "carpenters", "cobblers", "bakers"],
  };
}

function getWuelHighlights(): PlaceInfoMap {
  return {
    "*": [
      "juicy fruits",
      "food in layers",
      "nutty things",
      "fish with arms",
      "things that zap",
      "things that are purple",
      "things that glow in the dark",
      "fishes with sharp teeth",
      "lavendar-colored wand",
      "the _mayor_ here",
      "taken _all the classes_",
      "an unusual _iridescent one_",
      "fine _electric eel_",
      "fine _octopus_",
      "fine _lantern fish_",
      "fine _puffer fish_",
      "fine _mackerel_",
      "fine _piranha_",
      "other _gear for mages_",
      "other _ranged weapons_",
      "other _armors_",
      "other _melee weapons_",
      "herbs, incense and poisons",
      "other enhanced _jewelry_",
      "instruments and parchments",
      "other _exotic items_",
    ],
    "Kotko: church": ["enchanted band"],
    "Kotko: woman with red feather": [
      "peanuts",
      "eggplant",
      "banana",
      "sandwich",
      "orange",
      "fried chicken",
    ],
  };
}

function getIngenuityTestHighlights(): PlaceInfoMap {
  return {
    "*": [
      "bejeweled necklace",
      "blue key",
      "Large",
      "Medium",
      "Small",
      "Tiny",
      "pair of fairy wings",
    ],
    "Freshwater Spring": ["under _the water_"],
    "Middle of the River : Chatting": [
      "red key",
      "crescent",
      "rectangle",
      "circle",
      "heart",
      "diamond",
      "plus-sign",
      "oval",
      "star",
      "triangle",
      "square",
    ],
    "Rialb's Ghost": ["purple key"],
    "The Fairytale Princess": ["pink hair ribbons"],
    "The Hut": [
      "Turquoise",
      "Yellow",
      "Green",
      "Red",
      "Magenta",
      "Black",
      "Blue",
      "Purple",
      "Orange",
      "White",
    ],
  };
}
