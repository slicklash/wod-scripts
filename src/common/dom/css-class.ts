export function cssClass(elem, name: string, toggleOn?: boolean) {

    const classNames = elem.className.split(' ');
    const has = classNames.some(x => x === name);

    if (typeof toggleOn !== 'boolean') return has;

    if (has && toggleOn) return elem;

    elem.className = toggleOn ? elem.className + ' ' + name : classNames.filter(x => x !== name).join(' ');

    return elem;
}
