/// <reference path="core.ts" />
/// <reference path="observable.ts" />
/// <reference path="bind-value.ts" />

function link($ctrl, elem) {

    _ensureMetadata($ctrl);

    const ATTRS = ['bind', 'click', 'change', 'input', 'mode'];
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
                let exp = bind.replace(/\{\{(.+)\}\}/gi, '$1').trim();
                let dep = exp.split(/\s+/).filter(x => x.indexOf('$ctrl.') === 0).map(x=>observable($ctrl, x));
                let fn = Function('$ctrl', 'return ' + exp).bind(null, $ctrl);
                observable($ctrl, bind, true, fn, dep);
                bindValue(node, $ctrl, bind);
            }
        }

        ['click', 'change', 'input'].forEach(name => {
            let exp = (attr[name] || '').trim();
            if (exp) node.addEventListener(name, ($event) => {
                if (exp.slice(-1) === ')') {
                    let target = exp.replace('()', '');
                    let { parent, key } = getByPath($ctrl, target);
                    parent[key]();
                }
                else {
                    let fn = Function('$ctrl', '$event', exp).bind(null, $ctrl, $event);
                    fn();
                }
            }, false);
        });
    });
}
