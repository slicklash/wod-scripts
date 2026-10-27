export const Store = {
  get(key: string, defaultValue?: string): Promise<string> {
    return GM.getValue(key, defaultValue);
  },
  set(key: string, value: string): Promise<void> {
    return GM.setValue(key, value);
  },
};
