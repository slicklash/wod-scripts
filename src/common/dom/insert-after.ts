export function insertAfter(node: Node, ...elems: (Node | null | undefined)[]) {
  const p = node.parentNode;
  elems.forEach((el) => el && p?.insertBefore((node = el), node.nextSibling));
}
