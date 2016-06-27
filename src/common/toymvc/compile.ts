import { ATTR } from './core'
import { link } from './link'

export function compile ($ctrl, elem, tpl) {

    tpl = tpl.replace(/[^">]?\{\{(.+)\}\}[^"<]?/gi, (exp, value) => `<span [textContent]="{{${value}}}"></span>`);

    elem.innerHTML = tpl.replace(/\[?\(?([a-z]+)\)?\]?="([^"]+)"/gi, (attr, name, exp) => {
        if (name === 'ngModel') {
            return `${ATTR}-bind="${exp}" ${ATTR}-mode="oneway" ${ATTR}-change="${exp}=$event.target.value"`;
        }
        else if (attr[0] === '[')
            return `${ATTR}-bind="${exp}" ${ATTR}-mode="${attr[1] === '(' ? 'twoway' : 'oneway'}"`;
        else if (attr[0] === '(')
            return `${ATTR}-${name}="${exp}"`;
        return attr;
    });

    link($ctrl, elem);
}
