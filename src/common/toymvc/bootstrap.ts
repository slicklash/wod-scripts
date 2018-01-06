import { IComponent, IComponentController } from './core'

export function bootstrap (component: IComponent, parentElem?: Element) {

    parentElem = <Element>(parentElem || document);

    let selectors = (Array.isArray(component.directives) ? component.directives : []).concat([component]).map(x => x.selector);
    let tpl = component.template;

    for (let x of selectors) {
       tpl = tpl.replace(new RegExp(`<${x}\\s*/>|<${x}></${x}>`, 'ig'), `<div class="component-${x}"></div>`);
    }

    Array.from(parentElem.querySelectorAll('.component-' + component.selector)).forEach((elem: Element) => {
        let f: any = component.controller;
        let $ctrl: IComponentController = new f();
        elem.innerHTML = tpl;
        $ctrl.$onInit(elem);
    });

    if (selectors.length > 1) {
        component.directives.forEach(comp => { bootstrap(comp, parentElem) });
    }
}

export abstract class Component {
  element: Element;
  props: any;
  abstract render();
}

export function render (comp: Component, elem: Element) {
  elem.innerHTML = comp.render();
}

export function html (comp: Component, props?: any): string {
  return '';
}
