export function match<T>(value: T) {
  const cases: Array<[Partial<T> | ((v: T) => boolean), (v: T) => unknown]> = [];
  const api = {
    with<R>(p: Partial<T> | ((v: T) => boolean), fn: (v: T) => R) {
      cases.push([p, fn]);
      return api;
    },
    otherwise<R>(fallback: (v: T) => R): R {
      const found = cases.find(([p]) => (typeof p === "function" ? p(value) : typeof p === "object" && p !== null ? Object.entries(p).every(([key, expected]) => Object.is((value as any)[key], expected)) : Object.is(value, p)));
      return found ? (found[1](value) as R) : fallback(value);
    },
  };
  return api;
}
