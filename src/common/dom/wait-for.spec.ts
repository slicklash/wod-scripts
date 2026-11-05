import { describe, it, expect, beforeEach } from "vitest";
import { waitFor } from "./wait-for";

describe("waitFor", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("resolves element if it exists", async () => {
    const el = document.createElement("div");
    el.id = "test";
    document.body.appendChild(el);

    const result = await waitFor("#test");

    expect(result).toBe(el);
  });

  it("resolves null if element not found", async () => {
    const result = await waitFor("#nonexistent");

    expect(result).toBe(null);
  });
});
