import { describe, it, expect } from "vitest";
import { insertAfter } from "./insert-after";

describe("insertAfter", () => {
  it("inserts a node after the reference node", () => {
    const parent = document.createElement("div");
    const first = document.createElement("span");
    const second = document.createElement("span");

    parent.appendChild(first);
    insertAfter(first, second);

    expect(parent.children.length).toBe(2);
    expect(parent.children[0]).toBe(first);
    expect(parent.children[1]).toBe(second);
  });

  it("inserts multiple nodes after the reference node", () => {
    const parent = document.createElement("div");
    const ref = document.createElement("span");
    const a = document.createElement("span");
    const b = document.createElement("span");

    parent.appendChild(ref);
    insertAfter(ref, a, b);

    expect(parent.children.length).toBe(3);
    expect(parent.children[0]).toBe(ref);
    expect(parent.children[1]).toBe(a);
    expect(parent.children[2]).toBe(b);
  });

  it("skips null and undefined elements", () => {
    const parent = document.createElement("div");
    const ref = document.createElement("span");
    const a = document.createElement("span");

    parent.appendChild(ref);
    insertAfter(ref, null, undefined, a);

    expect(parent.children.length).toBe(2);
    expect(parent.children[1]).toBe(a);
  });

  it("handles empty elems list", () => {
    const parent = document.createElement("div");
    const ref = document.createElement("span");

    parent.appendChild(ref);
    insertAfter(ref);

    expect(parent.children.length).toBe(1);
  });
});
