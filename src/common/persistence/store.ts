declare let GM;

function GX_getValue(key: string, defaultValue?): Promise<string> {
  if (typeof GM === "object") return GM.getValue(key, defaultValue);
  return Promise.resolve(GM_getValue(key));
}

function GX_setValue(key: string, value: string): Promise<void> {
  if (typeof GM === "object") return GM.setValue(key, value);
  return Promise.resolve(GM_setValue(key, value));
}

export const Store = {
  get: GX_getValue,
  set: GX_setValue,
};
