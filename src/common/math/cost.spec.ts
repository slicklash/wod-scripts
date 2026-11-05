import { describe, expect, it } from "vitest";
import { calculateAttributeCost, calculateSkillCost } from "./cost";

describe("calculateAttributeCost", () => {
  it("should cost 0 for ranks 0 and 1", () => {
    expect(calculateAttributeCost(0)).toBe(0);
    expect(calculateAttributeCost(0)).toBe(0);
  });

  it("should have increasing costs", () => {
    for (let i = 2; i < 31; i++) {
      expect(calculateAttributeCost(i)).toBeGreaterThan(calculateAttributeCost(i - 1));
    }
  });
});

describe("calculateSkillCost", () => {
  it("should calculate primary skill cost", () => {
    // rank 2 primary: (2*2 - 2) * 20 = 40
    const cost = calculateSkillCost({ rank: 2, costCategory: "primary" });
    expect(cost.ep).toBe(40);
    expect(cost.gold).toBe(36);
  });

  it("should calculate rank 5 primary cost", () => {
    // i=5: 20, i=4: 12, i=3: 6, i=2: 2 => sum=40 => 40*20=800
    const cost = calculateSkillCost({ rank: 5, costCategory: "primary" });
    expect(cost.ep).toBe(800);
    expect(cost.gold).toBe(720);
  });

  it("should return fixed cost for rank 1 primary", () => {
    const cost = calculateSkillCost({ rank: 1, costCategory: "primary" });
    expect(cost.ep).toBe(40);
    expect(cost.gold).toBe(36);
  });

  it("should calculate secondary skill cost from lookup table", () => {
    // SEC_COSTS[5] = 1880
    const cost = calculateSkillCost({ rank: 5, costCategory: "secondary" });
    expect(cost.ep).toBe(1880);
    expect(cost.gold).toBe(1692);
  });

  it("should calculate exceptional skill cost from lookup table", () => {
    // EXC_COSTS[3] = 500
    const cost = calculateSkillCost({ rank: 3, costCategory: "exceptional" });
    expect(cost.ep).toBe(500);
    expect(cost.gold).toBe(450);
  });

  it("should calculate talent skill cost from lookup table", () => {
    // TAL_COSTS[2] = 3240
    const cost = calculateSkillCost({ rank: 2, costCategory: "talent" });
    expect(cost.ep).toBe(3240);
    expect(cost.gold).toBe(2916);
  });

  it("should return 0 for unknown rank in lookup table", () => {
    const cost = calculateSkillCost({ rank: 100, costCategory: "secondary" });
    expect(cost.ep).toBe(0);
    expect(cost.gold).toBe(0);
  });
});
