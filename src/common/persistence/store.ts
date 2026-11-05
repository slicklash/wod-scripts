export const Store = {
  get<T>(key: string, defaultValue: T): Promise<T> {
    return GM.getValue<string>(key, "").then((raw) => {
      if (!raw) return defaultValue;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return defaultValue;
      }
    });
  },

  set<T>(key: string, value: T): Promise<void> {
    return GM.setValue(key, JSON.stringify(value));
  },
};
