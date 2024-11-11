import { parseHtml } from "@common/dom/parse-html";
import { add } from "@common/dom/add";
import { attr } from "@common/dom/attr";
import { httpFetch } from "@common/net/http-fetch";
import { Store } from "@common/persistence/store";

const normalize = (text: string) =>
  text
    .replace("swamp dragons", "swamp dragon")
    .replace(" revival", "")
    .replace("an awesome", "")
    .replace(/the /g, "")
    .trim();

const hash = (text: string) =>
  // prettier-ignore
  Math.abs(text.padEnd(11, "0").split("").map((x) => x.charCodeAt(0)).reduce((a, x) => (a + ((a << 7) + (a << 3))) ^ x)).toString(4 * 4);

const getLastReportKey = () =>
  httpFetch("/wod/spiel/dungeon/report.php?menukey=reports").then((resp) => {
    if (!resp) return "none";
    const html = parseHtml<HTMLElement>(resp.data, true);
    const last = html.querySelector("#main_content .row0").textContent.trim();
    return hash(last);
  });

async function buildCache() {
  const groupHeroes = await getGroupHeroes(
    (<any>document.forms).the_form.gruppe_id.value,
  );
  const profiles = await getHeroProfiles(groupHeroes);
  const cache = {
    key: await getLastReportKey(),
    heroes: profiles.filter((x) => !x.isMentor),
  };
  await Store.set("numismatist", JSON.stringify(cache));
  return cache;
}

export async function main() {
  const idGroup = (<any>document.forms).the_form.gruppe_id.value;
  if (!idGroup) return;

  const key = await getLastReportKey();
  let cache = JSON.parse(await Store.get("numismatist", "{}"));

  if (cache.key !== key) {
    cache = await buildCache();
  }

  const heroes = cache.heroes || [];

  if (location.pathname.includes("dungeonlist")) {
    showDungeonMedalInfo(heroes);
  } else if (location.pathname.includes("title_list")) {
    showFameMedalInfo(heroes);
  } else {
    showLevelUpMedalInfo(heroes);
  }
}

interface IHero {
  name: string;
  profileUrl: string;
}

interface IHeroProfileInfo {
  name: string;
  medals?: string[];
  fame?: number;
  exp?: number;
  isMentor: boolean;
}

function getGroupHeroes(idGroup: string): Promise<IHero[]> {
  return new Promise((resolve, reject) => {
    httpFetch(`/wod/spiel/dungeon/group.php?id=${idGroup}`)
      .catch(reject)
      .then((resp) => {
        const groupHeroes =
          resp &&
          (
            Array.from(
              parseHtml<HTMLElement>(resp.data, true).querySelectorAll(
                ".main_content tbody .content_table_mainline a",
              ),
            ) as HTMLAnchorElement[]
          ).map((x) => ({
            name: x.textContent,
            profileUrl: x.getAttribute("href"),
          }));

        resolve(groupHeroes);
      });
  });
}

function getHeroProfiles(groupHeroes: IHero[]): Promise<IHeroProfileInfo[]> {
  return <any>Promise.all(groupHeroes.map((hero) => parseProfile(hero)));
}

function parseProfile(hero: IHero): Promise<IHeroProfileInfo> {
  return new Promise((resolve, reject) => {
    httpFetch(hero.profileUrl)
      .catch(reject)
      .then((resp) => {
        if (!resp) return;
        const html = parseHtml<HTMLElement>(resp.data, true);
        const profile: IHeroProfileInfo = {
          name: hero.name,
          isMentor: true,
        };

        const rows = Array.from(
          html.querySelectorAll(".content_table tr"),
        ) as HTMLTableRowElement[];

        rows.forEach((x) => {
          if (x.cells[0].textContent.trim() === "class") {
            profile.isMentor = x.cells[1].textContent.trim().includes("Mentor");
          } else if (x.cells[0].textContent.trim() === "fame") {
            profile.fame = Number(x.cells[1].textContent.replace(/ /g, ""));
          } else if (x.cells[0].textContent.trim().includes("gained")) {
            profile.exp = Number(x.cells[1].textContent.replace(/ /g, ""));
          }
        });

        if (profile.isMentor) {
          resolve(profile);
          return;
        }

        const medalsUrl = (
          Array.from(
            html.querySelectorAll("#smarttabs__details_inner a"),
          ) as HTMLAnchorElement[]
        )
          .map((x) => x.getAttribute("href"))
          .find((x) => x && x.includes("goallist"));

        httpFetch(medalsUrl)
          .catch(reject)
          .then((resp2) => {
            if (!resp2) return;
            profile.medals = Array.from(
              parseHtml<HTMLElement>(resp2.data, true).querySelectorAll(
                ".details.earned .label",
              ),
            ).map((x) => hash(normalize(x.innerHTML.trim().toLowerCase())));

            resolve(profile);
          });
      });
  });
}

function showLevelUpMedalInfo(profiles: IHeroProfileInfo[]) {
  const rows: HTMLTableRowElement[] = <any>(
    Array.from(document.querySelectorAll(".content_table tr"))
  );

  rows.forEach((tr, i) => {
    const td = tr.cells[0];
    td.setAttribute("style", "min-width: 50px");

    if (i > 2) {
      const requiredExp = parseInt(
        tr.cells[2].textContent.replace(/\s/g, ""),
        10,
      );
      const notObtained = profiles
        .filter((x) => x.exp < requiredExp)
        .map((x) => ({
          name: `${x.name} (${(requiredExp - x.exp).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ")})`,
          missing: requiredExp - x.exp,
        }))
        .sort((a, b) => a.missing - b.missing)
        .map((x) => x.name);

      if (notObtained.length) {
        addMedalIcon(false, td, "left");
        tr.setAttribute(
          "title",
          `Exp deficit (${notObtained.length}):\n\n${notObtained.join("\n")}`,
        );
      } else {
        addMedalIcon(true, td, "left");
      }
    }
  });
}

function showFameMedalInfo(profiles: IHeroProfileInfo[]) {
  const rows: HTMLTableRowElement[] = <any>(
    Array.from(document.querySelectorAll(".content_table tr"))
  );
  const medals = ["pin", "oak leaf", "shamrock", "laurel"];

  rows.forEach((tr, i) => {
    const td = add<HTMLTableCellElement>("td");
    td.setAttribute("style", "min-width: 210px");

    if (i > 0) {
      const name = `${i > 4 ? "large " : ""}${medals[(i - 1) % medals.length]}${i > 12 ? " of honor" : i > 8 ? " and ribbon" : ""}`;
      const a = add<HTMLAnchorElement>("a", td);
      a.href = `/wod/spiel/hero/item.php?name=${name.replace(/ /g, "+")}&is_popup=1`;
      a.target = "_blank";
      a.textContent = name;

      const requiredFame = parseInt(
        tr.cells[0].textContent.replace(/\d+. title/, ""),
        10,
      );
      const notObtained = profiles
        .filter((x) => x.fame < requiredFame)
        .map(
          (x) =>
            `${x.name} (${(requiredFame - x.fame).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ")})`,
        )
        .sort();

      if (notObtained.length) {
        addMedalIcon(false, td);
        tr.setAttribute(
          "title",
          `Fame deficit (${notObtained.length}):\n\n${notObtained.join("\n")}`,
        );
      } else {
        addMedalIcon(true, td);
      }
    } else {
      td.innerHTML = "<strong>medal</strong>";
    }

    tr.insertBefore(td, tr.cells[1]);
  });
}

function showDungeonMedalInfo(profiles: IHeroProfileInfo[]) {
  const map: { [x: string]: string[] } = profiles.reduce(
    (acc, x) => {
      x.medals.forEach((m) => {
        const key = m.toLowerCase();
        if (!Array.isArray(acc[key])) acc[key] = [];
        acc[key].push(x.name);
      });

      return acc;
    },
    <any>{},
  );

  const dungeons = Array.from(
    document.querySelectorAll(
      "#main_content .content_table tbody tr td:nth-child(2)",
    ),
  );

  dungeons.forEach((td) => {
    const key = normalize(td.textContent.trim().toLowerCase());
    const heroes = map[hash(key)] || [];
    const allHeroes = profiles.length && heroes.length === profiles.length;

    if (!allHeroes) {
      const notObtained = profiles
        .filter((x) => heroes.indexOf(x.name) < 0)
        .map((x) => x.name)
        .sort();
      td.setAttribute(
        "title",
        `Missing medal (${notObtained.length}):\n\n${notObtained.join("\n")}`,
      );
    }

    addMedalIcon(allHeroes, td);
  });
}

function addMedalIcon(
  isAchieved: boolean,
  elem: Element,
  position: string = "right",
) {
  const img: HTMLImageElement = add<HTMLImageElement>("img", elem);

  img.src = `/wod/css/icons/common/${isAchieved ? "medal_big" : "medal_big_gray"}.png`;
  attr(img, "style", "width: 24px; float: " + position);
}

document.addEventListener("DOMContentLoaded", () => main());
