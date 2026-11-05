export function attr<T extends Element>(elem: T, name: string): string | null;
export function attr<T extends Element>(elem: T, name: string, value: string | null): T;
export function attr<T extends Element>(elem: T, attrs: Record<string, string | null>): T;
export function attr<T extends Element>(elem: T, nameOrMap: string | Record<string, string | null>, value?: string | null): string | null | T {
  if (typeof nameOrMap === "string") {
    if (value === undefined) return elem.getAttribute(nameOrMap);
    if (value === null) elem.removeAttribute(nameOrMap);
    else elem.setAttribute(nameOrMap, value);
  } else {
    Object.entries(nameOrMap).forEach(([k, v]) => (v === null ? elem.removeAttribute(k) : elem.setAttribute(k, v)));
  }
  return elem;
}
