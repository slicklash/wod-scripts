import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("Store", async () => {
  // Mock GM.getValue and GM.setValue
  const storage: Record<string, string> = {};

  const mockGetValue = vi.fn((key: string, defaultValue?: string) => {
    return Promise.resolve(key in storage ? storage[key] : defaultValue ?? "");
  });

  const mockSetValue = vi.fn((key: string, value: string) => {
    storage[key] = value;
    return Promise.resolve();
  });

  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("GM", { getValue: mockGetValue, setValue: mockSetValue });
    Object.keys(storage).forEach((k) => delete storage[k]);
    mockGetValue.mockClear();
    mockSetValue.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const { Store } = await import("./store");

  describe("get", () => {
    it("should return deserialized value for existing key", async () => {
      storage["test"] = JSON.stringify({ name: "Alice", level: 5 });
      const result = await Store.get("test", {});
      expect(result).toEqual({ name: "Alice", level: 5 });
    });

    it("should return default value when key does not exist", async () => {
      const result = await Store.get("missing", { fallback: true });
      expect(result).toEqual({ fallback: true });
    });

    it("should return default value for empty string response", async () => {
      storage["empty"] = "";
      const result = await Store.get("empty", { defaultVal: 42 });
      expect(result).toEqual({ defaultVal: 42 });
    });

    it("should return default value when JSON parse fails", async () => {
      storage["corrupt"] = "not valid json";
      const result = await Store.get("corrupt", { safe: true });
      expect(result).toEqual({ safe: true });
    });

    it("should handle plain string values", async () => {
      storage["filter"] = JSON.stringify("some filter text");
      const result = await Store.get("filter", "");
      expect(result).toBe("some filter text");
    });

    it("should handle numeric values", async () => {
      storage["count"] = JSON.stringify(42);
      const result = await Store.get("count", 0);
      expect(result).toBe(42);
    });

    it("should handle null stored as 'null'", async () => {
      storage["null-val"] = "null";
      const result = await Store.get("null-val", "default");
      expect(result).toBeNull();
    });
  });

  describe("set", () => {
    it("should store serialized object", async () => {
      await Store.set("obj", { key: "value" });
      expect(mockSetValue).toHaveBeenCalledWith("obj", JSON.stringify({ key: "value" }));
      expect(storage["obj"]).toBe('{"key":"value"}');
    });

    it("should store plain string", async () => {
      await Store.set("str", "hello world");
      expect(mockSetValue).toHaveBeenCalledWith("str", JSON.stringify("hello world"));
      expect(storage["str"]).toBe('"hello world"');
    });

    it("should store number", async () => {
      await Store.set("num", 123);
      expect(mockSetValue).toHaveBeenCalledWith("num", "123");
    });

    it("should store empty object", async () => {
      await Store.set("empty-obj", {});
      expect(storage["empty-obj"]).toBe("{}");
    });

    it("should return a resolved promise", async () => {
      const result = await Store.set("key", "value");
      expect(result).toBeUndefined();
    });
  });

  describe("get/set round-trip", () => {
    it("should preserve object structure", async () => {
      const original = { items: [1, 2, 3], nested: { deep: true } };
      await Store.set("roundtrip", original);
      const result = await Store.get("roundtrip", {});
      expect(result).toEqual(original);
    });

    it("should preserve string values", async () => {
      const original = "filter text with spaces";
      await Store.set("str-roundtrip", original);
      const result = await Store.get("str-roundtrip", "");
      expect(result).toBe(original);
    });
  });
});
