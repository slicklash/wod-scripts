
const insertAfter = (node, ...elems) => {
    let parent = node.parentNode;
    elems.forEach(elem => {
        parent.insertBefore(elem, node.nextSibling);
        node = elem;
    });
};
