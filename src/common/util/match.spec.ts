import { describe, expect, it, vi } from "vitest";
import { match } from "./match";

describe("match", () => {
  it("matches primitive values", () => {
    expect(
      match("foo")
        .with("foo", () => 1)
        .otherwise(() => 0),
    ).toBe(1);

    expect(
      match(42)
        .with(42, () => 1)
        .otherwise(() => 0),
    ).toBe(1);

    expect(
      match(true)
        .with(true, () => 1)
        .otherwise(() => 0),
    ).toBe(1);

    expect(
      match(null)
        .with(null, () => 1)
        .otherwise(() => 0),
    ).toBe(1);

    expect(
      match(undefined)
        .with(undefined, () => 1)
        .otherwise(() => 0),
    ).toBe(1);
  });

  it("matches partial objects", () => {
    const value = { primary: true, rank: 3 };

    expect(
      match(value)
        .with({ primary: true }, () => 10)
        .otherwise(() => 0),
    ).toBe(10);
  });

  it("matches multiple object properties", () => {
    expect(
      match({ primary: true, rank: 3 })
        .with({ primary: true, rank: 2 }, () => 10)
        .with({ primary: true, rank: 3 }, () => 20)
        .otherwise(() => 0),
    ).toBe(20);
  });

  it("matches predicates", () => {
    expect(
      match(10)
        .with(
          (v) => v < 5,
          () => "small",
        )
        .with(
          (v) => v > 5,
          () => "large",
        )
        .otherwise(() => "unknown"),
    ).toBe("large");
  });

  it("uses the first matching case", () => {
    expect(
      match({ primary: true, secondary: true })
        .with({ primary: true }, () => 10)
        .with({ secondary: true }, () => 20)
        .otherwise(() => 0),
    ).toBe(10);
  });

  it("calls fallback when nothing matches", () => {
    expect(
      match("foo")
        .with("bar", () => 1)
        .otherwise(() => 0),
    ).toBe(0);
  });

  it("calls fallback when no cases are defined", () => {
    expect(match(42).otherwise(() => 10)).toBe(10);
  });

  it("passes the original value to handlers", () => {
    const value = { rank: 3 };

    expect(
      match(value)
        .with({ rank: 3 }, (v) => v.rank * 10)
        .otherwise(() => 0),
    ).toBe(30);
  });

  it("passes the original value to fallback", () => {
    expect(match(5).otherwise((v) => v * 2)).toBe(10);
  });

  it("evaluates lazily", () => {
    const handler = vi.fn(() => 10);
    const fallback = vi.fn(() => 0);

    const matcher = match(5).with(5, handler);

    expect(handler).not.toHaveBeenCalled();

    expect(matcher.otherwise(fallback)).toBe(10);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(fallback).not.toHaveBeenCalled();
  });

  it("does not execute handlers after the first match", () => {
    const second = vi.fn(() => 20);

    expect(
      match(5)
        .with(5, () => 10)
        .with(5, second)
        .otherwise(() => 0),
    ).toBe(10);

    expect(second).not.toHaveBeenCalled();
  });

  it("uses Object.is equality", () => {
    expect(
      match(NaN)
        .with(NaN, () => 1)
        .otherwise(() => 0),
    ).toBe(1);
    expect(
      match(-0)
        .with(0, () => 1)
        .otherwise(() => 0),
    ).toBe(0);
  });

  it("compares nested objects by reference", () => {
    const nested = { rank: 3 };

    expect(
      match({ nested })
        .with({ nested }, () => 10)
        .otherwise(() => 0),
    ).toBe(10);

    expect(
      match({ nested })
        .with({ nested: { rank: 3 } }, () => 10)
        .otherwise(() => 0),
    ).toBe(0);
  });
});
