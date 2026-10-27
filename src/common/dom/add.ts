export function add<T>(tag, parent?, innerHTML?): T {
  const elem = typeof tag === "string" ? document.createElement(tag) : tag;
  if (parent?.nodeType) parent.appendChild(elem);
  if (innerHTML) elem.innerHTML = innerHTML;
  return elem;
}
