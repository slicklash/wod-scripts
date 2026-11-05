import { MENU_LAYOUT, MENU_NAME } from "./menu";
import { add } from "@common/dom/add";
import { attr } from "@common/dom/attr";
import { cssClass } from "@common/dom/css-class";
import { waitFor } from "@common/dom/wait-for";

const REGEX_LINK = /'([a-z_ ]+)',''\);$/i;

function main(verticalMenu: HTMLElement) {
  const skin = document.querySelector<HTMLLinkElement>('link[href*="skin"]')?.href.match(/skin[0-9-]+/i)?.[0] ?? "";

  const fontUrl = `${location.protocol}//fonts.wod-game.de/java_font_renderer/render?skin=${skin}`;

  const favMenu = add<HTMLDivElement>("div");
  const caption = add<HTMLAnchorElement>("a", favMenu);

  attr(favMenu, { class: "menu-1", id: "menu_my_menu" });
  attr(caption, {
    class: "menu-1-caption alink selected",
    onclick: "return menuOnClick(this,'','','');",
  });

  if (skin === "skin-1") {
    caption.textContent = MENU_NAME;
  } else {
    for (const profile of ["", "-hovered", "-selected"]) {
      const name = `font_menu-1${profile}`;

      attr(add("img", caption), {
        class: name,
        alt: MENU_NAME,
        src: `${fontUrl}&profil=${name}&text=${MENU_NAME}`,
      });
    }
  }

  attr(add("span", caption), "class", "menu-1-arrow open");

  const menuBody = add<HTMLDivElement>("div", add<HTMLDivElement>("div", favMenu));

  attr(menuBody.parentElement!, {
    class: "menu-1-body",
    style: "display: block",
  });
  attr(menuBody, "class", "menu-2");

  const items: Record<string, HTMLAnchorElement> = {};
  const openMenus: Record<string, Element> = {};

  const getName = (link: Element) => (attr(link, "onclick") as string | null)?.match(REGEX_LINK)?.[1];

  const closeMenu = (name: string) => {
    const menu = openMenus[name];
    if (!menu) return;

    cssClass(menu, "open", false);

    const arrow = menu.querySelector(".menu-1-arrow");
    if (arrow) {
      cssClass(arrow, "open", false);
      cssClass(arrow, "closed", true);
    }
  };

  for (const menu of verticalMenu.querySelectorAll(".menu-1.open")) {
    for (const link of menu.querySelectorAll("a")) {
      const name = getName(link);
      if (name) openMenus[name] = menu;
    }
  }

  for (const link of verticalMenu.querySelectorAll(".menu-2 a")) {
    const name = getName(link);
    if (name) items[name] = link.cloneNode(true) as HTMLAnchorElement;
  }

  for (const [key, [label, children]] of Object.entries(MENU_LAYOUT)) {
    const link = items[key] ?? add<HTMLAnchorElement>("a");

    if (!items[key]) {
      attr(link, { href: "#", class: "menu-2-caption" });
    }

    attr(link, "onclick", null);
    link.textContent = label;

    let submenu: HTMLDivElement | undefined;

    if (children) {
      submenu = add<HTMLDivElement>("div");
      attr(submenu, {
        class: "menu-2-body",
        style: "padding-top: 0px",
      });

      for (const [name, text] of Object.entries(children)) {
        const sublink = items[name];
        if (!sublink) continue;

        attr(sublink, "onclick", null);

        const menu3 = add<HTMLDivElement>("div", submenu);
        attr(menu3, "class", "menu-3");

        cssClass(sublink, "menu-2-caption", false);
        cssClass(sublink, "menu-3-caption", true);

        sublink.textContent = text;
        menu3.appendChild(sublink);

        closeMenu(name);
      }
    }

    closeMenu(key);

    const menu = add<HTMLDivElement>("div", menuBody);
    attr(menu, "class", "menu-2 open");

    menu.appendChild(link);
    if (submenu) menu.appendChild(submenu);
  }

  const separator = add<HTMLDivElement>("div");
  attr(separator, "class", "menu-between");

  verticalMenu.prepend(separator, favMenu);
}

waitFor(".menu-vertical .menu-0-body").then((elem) => main(elem as HTMLElement));
