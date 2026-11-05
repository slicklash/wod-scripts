import { describe, it, expect, beforeEach } from "vitest";
import { textNormalized } from "./text-normalized";

describe("textNormalized", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("returns empty string for null element", () => {
    expect(textNormalized(null)).toBe("");
  });

  it("trims leading and trailing whitespace", () => {
    const el = document.createElement("div");
    el.textContent = "  hello world  ";
    container.appendChild(el);

    expect(textNormalized(el)).toBe("hello world");
  });

  it("collapses multiple spaces into one", () => {
    const el = document.createElement("div");
    el.textContent = "hello     world";
    container.appendChild(el);

    expect(textNormalized(el)).toBe("hello world");
  });

  it("replaces &nbsp; entities with space", () => {
    const el = document.createElement("div");
    el.innerHTML = "hello&nbsp;world";
    container.appendChild(el);

    expect(textNormalized(el)).toBe("hello world");
  });

  it("handles mixed whitespace and &nbsp;", () => {
    const el = document.createElement("div");
    el.innerHTML = "  hello&nbsp;&nbsp;  world  ";
    container.appendChild(el);

    expect(textNormalized(el)).toBe("hello world");
  });

  it("handles empty text content", () => {
    const el = document.createElement("div");
    el.textContent = "";
    container.appendChild(el);

    expect(textNormalized(el)).toBe("");
  });

  it("handles whitespace-only content", () => {
    const el = document.createElement("div");
    el.textContent = "   ";
    container.appendChild(el);

    expect(textNormalized(el)).toBe("");
  });

  it("preserves single spaces between words", () => {
    const el = document.createElement("div");
    el.textContent = "hello world foo bar";
    container.appendChild(el);

    expect(textNormalized(el)).toBe("hello world foo bar");
  });

  it("handles newline and tab characters", () => {
    const el = document.createElement("div");
    el.textContent = "hello\nworld\tfoo";
    container.appendChild(el);

    expect(textNormalized(el)).toBe("hello world foo");
  });

  // String input support
  it("accepts string input with collapse (default)", () => {
    expect(textNormalized("  hello   world  ")).toBe("hello world");
  });

  it("accepts string input with collapse: false to remove whitespace", () => {
    expect(textNormalized("hello world foo", { collapse: false })).toBe("helloworldfoo");
  });

  it("handles &nbsp; in string with collapse: false", () => {
    expect(textNormalized("1&nbsp;/&nbsp;2&nbsp;/&nbsp;3", { collapse: false })).toBe("1/2/3");
  });

  it("handles non-breaking space characters (U+00A0) with collapse: false", () => {
    expect(textNormalized("hello\xa0\xa0world", { collapse: false })).toBe("helloworld");
  });

  it("handles empty string", () => {
    expect(textNormalized("")).toBe("");
  });

  it("handles whitespace-only string", () => {
    expect(textNormalized("   ")).toBe("");
  });

  it("handles string with &nbsp; and collapse: true", () => {
    expect(textNormalized("hello&nbsp;&nbsp;world", { collapse: true })).toBe("hello world");
  });
});
