import { add } from "@common/dom/add";
import { parseHeroes, parseRounds, renderLevel, renderSummary } from "./logic";

function main() {
  const tables = Array.from(document.querySelectorAll("table"));

  const heroTables = tables.filter((t) => t.previousElementSibling?.tagName === "H2" && !t.className);
  const summaryHtml = renderSummary(parseHeroes(heroTables));
  if (summaryHtml) {
    const target = document.querySelector('[name="the_form"] h2');
    if (target) add("table", target, summaryHtml);
  }

  const roundTables = tables.filter((t) => !t.id && !t.className && t.querySelector(".rep_initiative"));
  const levelHtml = renderLevel(parseRounds(roundTables));
  if (levelHtml) {
    const target = document.querySelector(".rep_round_headline")?.previousElementSibling;
    if (target) add("table", target, levelHtml);
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", main, { once: true });
else main();
