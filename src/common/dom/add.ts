export function add<T>(tag, parent?, innerHTML?): T {
  const elem = typeof tag === "string" ? document.createElement(tag) : tag;
  parent && parent.nodeType && parent.appendChild(elem);
  innerHTML && (elem.innerHTML = innerHTML);
  return elem;
}
