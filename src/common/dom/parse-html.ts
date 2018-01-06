export function parseHTML<T>(str, returnBody?: boolean): T {
  const e = (<any> document.implementation).createHTMLDocument();
  e.body.innerHTML = str;
  return returnBody ? e.body : e.body.children.length === 1 ? e.body.children[0] : e.body.children;
}
