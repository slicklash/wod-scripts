import { describe, expect, it } from "vitest";
import { camelCase } from "./camel-case";

describe("camelCase", () => {
  it("should convert space-separated words to camelCase", () => {
    expect(camelCase("hello world")).toBe("helloWorld");
  });

  it("should handle single word", () => {
    expect(camelCase("hello")).toBe("hello");
  });

  it("should lowercase first word", () => {
    expect(camelCase("Hello World")).toBe("helloWorld");
  });

  it("should handle multiple words", () => {
    expect(camelCase("one two three")).toBe("oneTwoThree");
  });

  it("should return empty string for empty input", () => {
    expect(camelCase("")).toBe("");
  });

  it("should handle all caps", () => {
    expect(camelCase("ABC DEF")).toBe("abcDef");
  });

  it("should handle words with internal capitals by lowercasing first word and title-casing rest", () => {
    expect(camelCase("helloWorld fooBar")).toBe("helloworldFoobar");
  });
});
