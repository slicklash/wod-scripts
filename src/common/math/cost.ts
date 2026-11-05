import type { HeroSkill } from "@common/parsing/parse-hero-skill";
import { match } from "@common/util/match";

export type SkillCostCategory = "primary" | "secondary" | "exceptional" | "talent";

const SEC_COSTS = [0, 40, 120, 400, 960, 1880, 3320, 5360, 8120, 11720, 16240, 21840, 28600, 36680, 46160, 57160, 69840, 84280, 100640, 119000, 139520, 162280, 187440, 215120, 245480, 278600, 314600, 353640, 395840, 441320, 490200, 542640, 598760, 658680, 722520, 790440, 862560, 939000, 1019920, 1105440, 1195680];

const EXC_COSTS = [0, 50, 150, 500, 1300, 2700, 4850, 7950, 12200, 17800, 24950, 33850, 44700, 57750, 73200, 91250, 112150, 136100, 163350, 194150, 228750, 267350, 320200, 357550, 409650, 466750, 529100, 596950, 670550, 750150, 836050, 928450, 1027650, 1133900, 1247450, 1368600, 1497600, 1634700, 1780200, 1934400, 2097500];

const TAL_COSTS = [0, 1440, 3240, 5440, 8080, 11200, 14840, 19040, 23840, 29280, 35400, 42240, 49840, 58240, 67480, 77600, 88640, 100640, 113640, 127680, 142800, 159040, 176440, 195040, 214880, 236000, 258440, 282240, 307440, 334080, 362200, 391840, 423040, 455840, 490280, 526400, 564240, 603840, 645240, 688480, 733600];

const ATTR_COSTS = [0, 0, 100, 500, 1300, 2800, 5100, 8500, 13200, 19400, 27400, 37400, 49700, 64500, 82100, 102800, 126800, 154400, 185900, 221600, 261800, 306800, 356800, 412200, 473300, 540400, 613800, 693800, 780800, 875000, 976800];

export function calculateSkillCost(skill: HeroSkill): { ep: number; gold: number } {
  const ep = match(skill)
    .with({ costCategory: "primary" }, (v) => Math.floor((v.rank * (v.rank * v.rank - 1)) / 3) * 20 || 40)
    .with({ costCategory: "secondary" }, (v) => SEC_COSTS[v.rank] || 0)
    .with({ costCategory: "exceptional" }, (v) => EXC_COSTS[v.rank] || 0)
    .with({ costCategory: "talent" }, (v) => TAL_COSTS[v.rank] || 0)
    .otherwise(() => 0);
  return { ep, gold: ep * 0.9 };
}

export function calculateAttributeCost(rank: number): number {
  return ATTR_COSTS[rank] || 0;
}
