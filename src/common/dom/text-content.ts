export function textContent(elem, value?) {
  if (!elem) return "";
  // prettier-ignore
  return typeof value === "undefined" ? elem.textContent : (elem.textContent = value);
}
