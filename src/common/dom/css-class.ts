export function cssClass(elem: Element, name: string, toggleOn?: boolean) {
  if (toggleOn === undefined) return elem.classList.contains(name);
  elem.classList.toggle(name, toggleOn);
  return elem;
}
