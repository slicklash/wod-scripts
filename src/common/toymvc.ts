/// <reference path="../../lib/typings/browser.d.ts" />
//

const ATTR = 'data-t';

const _ensureMetadata = $ctrl => {
    if (!$ctrl.$subscribers) Object.defineProperty($ctrl, '$subscribers', { value: {}, enumerable: false });
}

const observable = ($ctrl, path, isComputed = undefined, expression = undefined, dependencies = undefined) => {

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

    _ensureMetadata($ctrl);
    $ctrl.$subscribers[path] = fn => { subscribers.push(fn); };
    return $ctrl.$subscribers[path];
}

function bindValue(elem, $ctrl, path, isTwoWay = undefined) {
    let sub = $ctrl.$subscribers[path];
    let key = elem.tagName === 'INPUT' ? 'value' : 'textContent';
    let { parent, key: prop } = getByPath($ctrl, path);
    elem[key] = parent[prop];
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

function compile($ctrl, elem, tpl) {
    tpl = tpl.replace(/[^">]?\{\{(.+)\}\}[^"<]?/gi, (exp, value) => `<span [textContent]="{{${value}}}"></span>`);
    elem.innerHTML = tpl.replace(/\[?\(?([a-z]+)\)?\]?="([^"]+)"/gi, (attr, name, exp) => {
        if (attr[0] === '[')
            return `${ATTR}-bind="${exp}" ${ATTR}-mode="${attr[1] === '(' ? 'twoway' : 'oneway'}"`;
        else if (attr[0] === '(')
            return `${ATTR}-${name}="${exp}"`;
        return attr;
    });
    link($ctrl, elem);
}

function getByPath (obj, path, init = undefined): any {
    let parent = obj;
    if (path.indexOf('{{') === 0) return { parent, key: path };
    let parts = path.split('.').slice(1);
    let key = parts[0];
    while(parts.length) {
        key = parts.shift();
        if (parts.length) {
            if (init && parent[key] === undefined) parent[key] = {};
            parent = parent[key];
        }
    }
    return { parent: parent, key: key };
};

function link($ctrl, elem) {

    _ensureMetadata($ctrl);

    debugger
    const ATTRS = ['bind', 'click', 'change', 'mode'];
    let nodes = elem.querySelectorAll(ATTRS.map(x => `[${ATTR}-${x}]`).join(','));

    Array.from(nodes).forEach((node: Element) => {

        let attr: any = {};
        ATTRS.forEach(x => { attr[x] = node.getAttribute(`${ATTR}-${x}`) || '' });

        let bind = attr.bind;
        if (bind) {
            let p = bind.indexOf('{{');
            if (p === -1) {
                observable($ctrl, bind, false);
                bindValue(node, $ctrl, bind, attr.mode === 'twoway');
            }
            else if (p === 0) {
                let exp = bind.replace(/\{\{(.+)\}\}/gi, '$1');
                let dep = exp.split(/\s+/).filter(x => x.indexOf('$ctrl.') === 0).map(x=>observable($ctrl, x));
                let fn = Function('$ctrl', 'return ' + exp).bind(null, $ctrl);
                observable($ctrl, bind, true, fn, dep);
                bindValue(node, $ctrl, bind);
            }
        }

        ['click', 'change'].forEach(name => {
            let target = (attr[name] || '').replace('()', '');
            if (target) node.addEventListener(name, () => {
                let { parent, key } = getByPath($ctrl, target);
                parent[key]();
            }, false);
        });
    });
}

function prepareView (rootComponentClass) {
    let tpl = rootComponentClass.$template;
    rootComponentClass.$components.forEach(x=> {
        tpl = tpl.replace(new RegExp(`<${x.$selector}\\s*/>|<${x.$selector}></${x.$selector}>`, 'ig'), `<div class="comp-${x.$selector}"></div>`);
    });
    return tpl;
}

function bootstrap (rootComponentClass, rootElem) {
    rootComponentClass.$components.forEach(x=> {
        Array.from(rootElem.querySelectorAll('.comp-' + x.$selector)).forEach(elem => {
            compile(new x(), elem, x.$template);
        });
    });
}

