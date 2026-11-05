import { httpFetch } from "@common/net/http-fetch";
import { batchMap } from "@common/util/batch-map";
import { parseHeroProfileWithItems } from "./hero-builder";
import { sortSkills } from "./hero-profile";
import { applySkillInfo } from "./hero-skill";
import { generateFullBBCode, parseSkillRows } from "./logic";
import { createExportControls, displayResult, setIdleState, setLoadingState, type ExportControls } from "./ui";

export function main(): void {
  const frmSkills = document.querySelector<HTMLFormElement>("#main_content form");

  if (!frmSkills || !frmSkills.action || !frmSkills.action.match(/hero\/skills\.php/i)) {
    return;
  }

  const referenceButton = Array.from(frmSkills.querySelectorAll("tbody .button")).find((b): b is HTMLButtonElement => b instanceof HTMLButtonElement && b.value === "Show Details");

  if (!referenceButton) return;

  const controls = createExportControls(referenceButton);
  if (!controls) return;

  controls.btnExport.addEventListener("click", () => exportProfile(controls, frmSkills));
}

async function exportProfile(controls: ExportControls, form: HTMLFormElement): Promise<void> {
  setLoadingState(controls);

  const { data = "" } = await httpFetch(location.href.replace("skills.php", "attributes.php"));
  const skillRows = Array.from(form.querySelectorAll<HTMLTableRowElement>(".row0")).concat(Array.from(form.querySelectorAll<HTMLTableRowElement>(".row1")));

  const skillsFromRows = parseSkillRows(skillRows);

  const [hero, skills] = await Promise.all([
    parseHeroProfileWithItems(data, location.href, controls.chkboxItems.checked),
    batchMap(
      skillsFromRows,
      async (skill) => {
        const { data: skillHtml } = await httpFetch(skill.url);
        applySkillInfo(skill, skillHtml);
        return skill;
      },
      { limit: 4, skipErrors: true },
    ),
  ]);

  hero.skills = sortSkills(skills.filter((s) => s.rank > 0));

  const bbcode = generateFullBBCode(hero);
  const h1 = form.querySelector("h1");
  displayResult(h1, bbcode);
  setIdleState(controls);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", main, { once: true });
else main();
