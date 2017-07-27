export function add<T>(tag, parentNode?): T {
    let elem = typeof tag === 'string' ? document.createElement(tag) : tag;
    if (parentNode && parentNode.nodeType) {
        parentNode.appendChild(elem);
    }
    return elem;
}
