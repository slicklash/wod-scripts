export function textNormalized(x: Element | null | string, options?: { collapse?: boolean }): string {
  const text = typeof x === "string" ? x : (x?.textContent ?? "");
  return (text ?? "")
    .replace(/&nbsp;/g, "\u00A0")
    .replace(/[\s\u00A0]+/g, options?.collapse === false ? "" : " ")
    .trim();
}
