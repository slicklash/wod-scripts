import { describe, expect, it } from "vitest";
import { parseEffectiveValue } from "./parse-effective-value";

describe("parseEffectiveValue", () => {
  it("10[11]", () => {
    expect(parseEffectiveValue("10[11]")).toEqual([10, 11]);
  });

  it("10", () => {
    expect(parseEffectiveValue("10")).toEqual([10, 10]);
  });

  it("-", () => {
    expect(parseEffectiveValue("-")).toEqual([0, 0]);
  });
});
