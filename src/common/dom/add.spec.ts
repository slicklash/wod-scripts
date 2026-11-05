import { describe, expect, it } from "vitest";
import { add } from "./add";

describe("add", () => {
  it("should create div element", () => {
    const el = add<HTMLDivElement>("div");
    expect(el.tagName).toBe("DIV");
  });

  it("should create DIV element and add it to parent", () => {
    const parent = document.createElement("div");
    const el = add<HTMLDivElement>("div", parent);

    expect(el.parentNode).toBe(parent);
  });
});
