import { describe, expect, it } from "vitest";
import { assembleContext } from "./context-builder";

const mockData = (overrides = {}) =>
  ({
    title: "adventure Ingenuity Test",
    idHero: "12345",
    place: "Test Place",
    texts: ["<p>Hello</p>", "<p>World</p>"],
    world: "localhost",
    ...overrides,
  }) as const;

describe("assembleContext", () => {
  it("builds a valid AdventureContext", () => {
    const ctx = assembleContext(mockData());

    expect(ctx).toMatchObject({
      idHero: "12345",
      adventure: "Ingenuity Test",
      place: "Test Place",
      texts: ["<p>Hello</p>", "<p>World</p>"],
      text: "<p>Hello</p> <p>World</p>",
      isQuest: true,
    });
    expect(ctx.world).toBe("localhost");
  });

  it("marks non-quest adventures", () => {
    const ctx = assembleContext(mockData({ title: "adventure Some Random" }));

    expect(ctx.isQuest).toBe(false);
    expect(ctx.adventure).toBe("Some Random");
  });

  it("freezes the context object", () => {
    const ctx = assembleContext(mockData());

    expect(() => {
      (ctx as any).idHero = "99999";
    }).toThrow();
  });

  it("defaults place to '*' when empty", () => {
    const ctx = assembleContext(mockData({ place: "" }));

    expect(ctx.place).toBe("*");
  });

  it("trims text entries", () => {
    const ctx = assembleContext(
      mockData({
        texts: ["  <p>test</p>  ", "  <p>test2</p>  "],
      }),
    );

    expect(ctx.texts).toEqual(["<p>test</p>", "<p>test2</p>"]);
  });

  it("throws when title is missing", () => {
    expect(() => assembleContext(mockData({ title: "" }))).toThrow('Page title must contain "adventure"');
  });

  it("throws when title does not contain adventure", () => {
    expect(() => assembleContext(mockData({ title: "Some Random Page" }))).toThrow();
  });

  it("throws when hero ID is missing", () => {
    expect(() => assembleContext(mockData({ idHero: "" }))).toThrow("hero ID");
  });

  it("detects Ingenuity Test quest", () => {
    expect(assembleContext(mockData()).isQuest).toBe(true);
  });

  it("detects Passingtime quest", () => {
    expect(assembleContext(mockData({ title: "adventure Passingtime" })).isQuest).toBe(true);
  });

  it("detects Rescuing Father Wuel quest", () => {
    expect(assembleContext(mockData({ title: "adventure Rescuing Father Wuel" })).isQuest).toBe(true);
  });
});
