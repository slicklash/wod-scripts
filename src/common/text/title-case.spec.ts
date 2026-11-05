import { describe, expect, it } from "vitest";
import { titleCase } from "./title-case";

describe("titleCase", () => {
  it("should capitalize first character and lowercase the rest", () => {
    expect(titleCase("hello")).toBe("Hello");
  });

  it("should handle already capitalized input", () => {
    expect(titleCase("Hello")).toBe("Hello");
  });

  it("should lowercase remaining characters", () => {
    expect(titleCase("HELLO")).toBe("Hello");
  });

  it("should return empty string for empty input", () => {
    expect(titleCase("")).toBe("");
  });

  it("should handle single character", () => {
    expect(titleCase("a")).toBe("A");
  });

  it("should handle mixed case", () => {
    expect(titleCase("hElLo")).toBe("Hello");
  });
});
