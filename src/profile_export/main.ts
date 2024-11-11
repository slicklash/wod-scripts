import { add } from "@common/dom/add";
import { attr } from "@common/dom/attr";
import { cssClass } from "@common/dom/css-class";
import { httpFetch } from "@common/net/http-fetch";
import { Hero } from "./hero";
import { HeroSkill } from "./hero-skill";

/***
 * TODO:
 *   - parse race
 *   - parse skill modifiers
 *   - parse equipment
 *   - parse subclass
 *   - parse talents
 */

// prettier-ignore
const frmSkills: HTMLFormElement = document.querySelector("#main_content form");
let btnExport, chkboxItems, imgLoader;

const exportProfile = function () {
  attr(btnExport, "disabled", "true");
  cssClass(btnExport, "button clickable", false);
  cssClass(btnExport, "button_disabled", true);
  attr(imgLoader, "style", null, true);

  httpFetch(location.href.replace("skills.php", "attributes.php")).then(
    (resp) => {
      // prettier-ignore
      const skillRows = Array.from(frmSkills.querySelectorAll(".row0")).concat(Array.from(frmSkills.querySelectorAll(".row1")));
      let pendingCount = 0;
      // prettier-ignore
      const hero = new Hero();
      // prettier-ignore
      const p = hero.parse((resp && resp.data) || "", chkboxItems.checked);

      const onSkillParseComplete = function () {
        pendingCount--;
        if (pendingCount <= 0) {
          p.then(() => {
            hero.addUpperCoinsArmor();

            const h1 = frmSkills.querySelector("h1");
            const d = new Date();
            // prettier-ignore
            const stamp = [d.getDate(), d.getMonth() + 1, d.getFullYear() % 100].map((x) => ("" + x).padStart(2, "0")).join(".");
            const bbcode = `${hero.generateBBCode().trim()}\n[size=9]\nGenerated: ${stamp} - [url=@downloadURL]Profile Export[/url] @version[/size]`;
            // prettier-ignore
            let txtExport = h1.parentElement.querySelector("#profile-export-result");
            if (!txtExport) {
              txtExport = add("textarea", h1.parentNode);
              // prettier-ignore
              attr(txtExport, { rows: "4", cols: "50", id: "profile-export-result" });
            }
            txtExport.innerHTML = bbcode;
            attr(imgLoader, "style", "display: none");
            attr(btnExport, "disabled", "false", true);
            cssClass(btnExport, "button clickable", true);
            cssClass(btnExport, "button_disabled", false);
          });
        }
      };

      for (let i = 0; i < skillRows.length; i++) {
        const skill = new HeroSkill();
        // prettier-ignore
        skill.can_undo = Boolean(skillRows[i].querySelector('input[name*="undo"]'));
        skill.parse(skillRows[i]);
        if (skill.rank > 0) {
          pendingCount++;
          httpFetch(skill.url).then((resp) => {
            const skillHtml = (resp && resp.data) || "";
            skill.hero = hero;
            skill.onDone = onSkillParseComplete;
            skill.fetchInfo.call(skill, skillHtml);
          });
          hero.skills.push(skill);
        }
      }
    },
  );
};

if (
  frmSkills &&
  frmSkills.action &&
  frmSkills.action.match(/hero\/skills\.php/i)
) {
  // prettier-ignore
  const button = (Array.from(frmSkills.querySelectorAll("tbody .button")) as HTMLButtonElement[]).find((b) => b.value === "Show Details");

  if (button) {
    btnExport = add<HTMLInputElement>("input");
    chkboxItems = add<HTMLInputElement>("input");
    const label_items = add<HTMLLabelElement>("label");
    label_items.innerHTML = "Equipment";
    // prettier-ignore
    attr(btnExport, { type: "button", class: "button clickable", value: "Export", style: "margin-left: 4px" });
    // prettier-ignore
    attr(chkboxItems, { type: "checkbox", id: "export-items", style: "margin-left: 4px" });
    attr(label_items, { for: "export-items" });
    btnExport.addEventListener("click", exportProfile, false);
    button.parentNode.insertBefore(label_items, button.nextSibling);
    button.parentNode.insertBefore(chkboxItems, label_items);
    button.parentNode.insertBefore(btnExport, chkboxItems);
    // prettier-ignore
    button.parentNode.insertBefore(add<HTMLBRElement>("br"), label_items.nextSibling);
    // prettier-ignore
    imgLoader = attr(add("img", add("div")), { src: `${location.protocol}//${location.host}/wod/css/img/ajax-loader.gif`, style: "display: none", });
    button.parentNode.insertBefore(imgLoader, button.parentNode.firstChild);
  }
}
