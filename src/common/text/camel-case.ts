import { titleCase } from "./title-case";

export function camelCase(text: string) {
  // prettier-ignore
  return text ? text.split(' ').map((x, i) => i < 1 ? x.toLowerCase() : titleCase(x)).join('') : '';
}
