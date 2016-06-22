export function cssClass (elem, name: string, toggleOn?: boolean) {

    let classNames = elem.className.split(' '),
        has = classNames.some(x => x === name);

    if (typeof toggleOn !== 'boolean') return has;

    if (has && toggleOn) return elem;

    elem.className = toggleOn ? elem.className + ' ' + name : classNames.filter(x => x !== name).join(' ');

    return elem;
}
