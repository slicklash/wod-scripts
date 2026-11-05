import { describe, it, expect } from "vitest";
import { parseHtml } from "./parse-html";

describe("parseHtml", () => {
  it("parses a single element", () => {
    const result = parseHtml<HTMLDivElement>("<div>hello</div>");

    expect(result.tagName).toBe("DIV");
    expect(result.textContent).toBe("hello");
  });

  it("parses nested elements", () => {
    const result = parseHtml<HTMLUListElement>("<ul><li>item</li></ul>");

    expect(result.tagName).toBe("UL");
    expect(result.children.length).toBe(1);
    expect(result.children[0].tagName).toBe("LI");
  });

  it("returns fragment for multiple root elements", () => {
    const result = parseHtml<HTMLCollection>("<div>first</div><div>second</div>");

    expect(result.length).toBe(2);
  });

  it("returns body when returnBody is true", () => {
    const result = parseHtml<HTMLBodyElement>("<div>test</div>", true);

    expect(result.tagName).toBe("BODY");
    expect(result.children.length).toBe(1);
  });

  it("parses element with attributes", () => {
    const result = parseHtml<HTMLDivElement>('<div id="test" class="foo">content</div>');

    expect(result.id).toBe("test");
    expect(result.className).toBe("foo");
  });

  it("returns empty HTML collection when string is empty", () => {
    const result = parseHtml<HTMLCollection>("");

    expect(result.length).toBe(0);
  });
});
