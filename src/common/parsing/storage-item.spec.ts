import { describe, expect, it } from "vitest";
import { createStorageItem, isConsumable } from "./storage-item";

describe("isConsumable", () => {
  const special = ["raw leather", "acorn seed", "reagent:x", "lesser emblem of x", "glass wand"];

  special.forEach((x) => {
    it(`should return true for ${x}`, () => {
      const item = createStorageItem();
      item.name = x;
      expect(isConsumable(item)).toEqual(true);
    });
  });

  it("should return false", () => {
    const item = createStorageItem();
    item.name = "torch";
    expect(isConsumable(item)).toEqual(false);
  });
});
