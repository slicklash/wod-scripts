import { describe, expect, it } from "vitest";
import { formatNumber } from "./format-number";

describe("formatNumber", () => {
  it("should format thousands with space separator", () => {
    expect(formatNumber(1000)).toBe("1 000");
  });

  it("should format millions with space separators", () => {
    expect(formatNumber(1234567)).toBe("1 234 567");
  });

  it("should leave small numbers unchanged", () => {
    expect(formatNumber(999)).toBe("999");
  });

  it("should return '0' for zero", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("should format large numbers with multiple separators", () => {
    expect(formatNumber(1234567890)).toBe("1 234 567 890");
  });

  it("should handle single digit", () => {
    expect(formatNumber(5)).toBe("5");
  });

  it("should handle exact thousand boundary", () => {
    expect(formatNumber(100)).toBe("100");
    expect(formatNumber(1000)).toBe("1 000");
    expect(formatNumber(10000)).toBe("10 000");
  });
});
