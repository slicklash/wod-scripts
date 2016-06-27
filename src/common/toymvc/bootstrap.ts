import { IComponent } from './core'
import { compile } from './compile'

export function bootstrap (component: IComponent, parentElem?: Element) {

    parentElem = <Element>(parentElem || document);

    let selectors = (Array.isArray(component.directives) ? component.directives : []).concat([component]).map(x => x.selector);
    let tpl = component.template;

    for (let x of selectors) {
       tpl = tpl.replace(new RegExp(`<${x}\\s*/>|<${x}></${x}>`, 'ig'), `<div class="component-${x}"></div>`);
    }

    Array.from(parentElem.querySelectorAll('.component-' + component.selector)).forEach(elem => {
        let $ctrl = new component.controller();
        compile($ctrl, elem, tpl);
        if (typeof $ctrl.$onInit === 'function') $ctrl.$onInit();
    });

    if (selectors.length > 1) {
        component.directives.forEach(comp => { bootstrap(comp, parentElem) });
    }
}
