export function attr(elem: Element, name: string): string;
export function attr(
  elem: Element,
  name: string,
  value: string | null,
): Element;
export function attr<T>(elem: T, attrs: Record<string, string | null>): T;
export function attr(
  elem: Element,
  nameOrMap: string | Record<string, string | null>,
  value?: string | null,
): string | Element {
  if (typeof nameOrMap === "string") {
    if (value === undefined) return elem.getAttribute(nameOrMap) ?? "";
    if (value === null) elem.removeAttribute(nameOrMap);
    else elem.setAttribute(nameOrMap, value);
  } else {
    Object.entries(nameOrMap).forEach(([k, v]) =>
      v === null ? elem.removeAttribute(k) : elem.setAttribute(k, v),
    );
  }
  return elem;
}
