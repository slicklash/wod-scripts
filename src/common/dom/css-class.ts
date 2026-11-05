export function cssClass(elem: Element, name: string, toggle?: boolean) {
  if (toggle === undefined) return elem.classList.contains(name);
  elem.classList.toggle(name, toggle);
  return elem;
}
