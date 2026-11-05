export function add<T extends Element = Element>(tagName: string, parent?: ParentNode | null, innerHTML?: string): T {
  const elem = document.createElement(tagName) as unknown as T;
  if (parent) parent.appendChild(elem);
  if (innerHTML) ((elem as unknown) as HTMLElement).innerHTML = innerHTML;
  return elem;
}
