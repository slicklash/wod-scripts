import { describe, expect, it } from "vitest";
import { evalAffected } from "./eval";

describe("evalAffected", () => {
  it("should evaluate percentage of hero level", () => {
    // "50% of your hero`s level" with level 20 => 50*20/100 = 10
    const result = evalAffected("50% of your hero`s level", 20, 5);
    expect(result).toBe("10");
  });

  it("should evaluate percentage of skill rank", () => {
    // "100% of your skill rank" with rank 7 => 100*7/100 = 7
    const result = evalAffected("100% of your skill rank", 20, 7);
    expect(result).toBe("7");
  });

  it("should handle fractional percentages", () => {
    // "25% of your hero`s level" with level 10 => 25*10/100 = 2
    const result = evalAffected("25% of your hero`s level", 10, 5);
    expect(result).toBe("2");
  });

  it("should return original value if no percentage pattern", () => {
    const result = evalAffected("5", 20, 10);
    expect(result).toBe("5");
  });

  it("should floor the result", () => {
    // "33% of your hero`s level" with level 7 => 33*7/100 = 2.31 => 2
    const result = evalAffected("33% of your hero`s level", 7, 5);
    expect(result).toBe("2");
  });

  it("should handle parentheses in expressions", () => {
    const result = evalAffected("(10 + 5)% of your hero`s level", 20, 5);
    expect(result).toBe("3");
  });

  it("should handle complex arithmetic", () => {
    // "50% of your hero`s level" with level 17 => 50*17/100 = 8.5 => 8
    const result = evalAffected("50% of your hero`s level", 17, 5);
    expect(result).toBe("8");
  });

  it("should handle addition with percentage of skill rank", () => {
    // "1 + 20% of your skill rank" with rank 5 => 1 + 20*5/100 = 2
    const result = evalAffected("1 + 20% of your skill rank", 10, 5);
    expect(result).toBe("2");
  });

  it("should handle addition with percentage of hero level", () => {
    // "1 + 13% of your hero`s level" with level 20 => 1 + 13*20/100 = 3.6 => 3
    const result = evalAffected("1 + 13% of your hero`s level", 20, 5);
    expect(result).toBe("3");
  });
});
