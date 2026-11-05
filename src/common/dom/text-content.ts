export function textContent(elem: Element | null, value?: string) {
  if (!elem) return "";
  return typeof value === "undefined" ? elem.textContent : (elem.textContent = value);
}
