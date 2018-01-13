export function insertAfter(node, ...elems) {
    const parent = node.parentNode;
    elems.forEach(elem => {
        parent.insertBefore(elem, node.nextSibling);
        node = elem;
    });
}
