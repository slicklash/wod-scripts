import { titleCase } from './title-case'

export function camelCase (x) {
    return x ? x.split(' ').map((y,i) => i < 1 ? y.toLowerCase() : titleCase(y)).join('') : '';
}
