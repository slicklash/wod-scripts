import { getByPath } from './core'

export function bindValue (elem, $ctrl, path, isTwoWay = undefined) {

    let sub = $ctrl.$subscribers[path];
    let key = elem.tagName === 'INPUT' ? 'value' : 'textContent';
    let { parent, key: prop } = getByPath($ctrl, path);
    elem[key] = parent[prop] || '';

    sub(() => {
        let { parent, key: prop } = getByPath($ctrl, path);
        let val = parent[prop];
        elem[key] = val !== undefined ? val : '';
    });

    if (isTwoWay) elem.addEventListener('input', () => {
        let { parent, key: prop } = getByPath($ctrl, path);
        parent[prop] = elem[key];
    });
}
