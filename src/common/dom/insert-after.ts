export function insertAfter(node: Node, ...elems: (Node | null | undefined)[]) {
  const parent = node.parentNode;
  elems.forEach(
    (el) => el && parent?.insertBefore((node = el), node.nextSibling),
  );
}
