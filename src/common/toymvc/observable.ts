import { ensureMetadata, getByPath } from './core'

export function observable ($ctrl, path, isComputed = undefined, expression = undefined, dependencies = undefined) {

    if (isComputed === false && path.indexOf('$ctrl.') !== 0) throw 'non computed path must start with: $ctrl.';

    if ($ctrl.$subscribers && $ctrl.$subscribers[path]) return $ctrl.$subscribers[path];

    let subscribers = [];
    let setter;
    let value;

    let update = newValue => {
        if (newValue === value) return;
        value = newValue;
        subscribers.forEach(fn => { fn(newValue) });
    };

    let key = path;
    let parent = $ctrl;

    if (isComputed) {
        value = expression();
        let onDependencyChanged = () => { update(expression()) };
        dependencies.forEach(subscribe => { subscribe(onDependencyChanged) });
    }
    else {
        let r = getByPath($ctrl, path, true);
        parent = r.parent;
        key = r.key;
        value = expression || parent[key];
        setter = update;
    }

    Object.defineProperty(parent, key, { get: () => value, set: setter || function () {}, enumerable: true });

    ensureMetadata($ctrl);
    $ctrl.$subscribers[path] = fn => { subscribers.push(fn); };
    return $ctrl.$subscribers[path];
}
