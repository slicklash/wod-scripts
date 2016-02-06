
const cssClass = (elem, name: string, toggle?: boolean) => {
    let has = elem.className.indexOf(name) !== -1;
    if (typeof toggle !== 'boolean') return has;
    if (has && toggle) return elem;
    elem.className = toggle ? elem.className + ' ' + name : elem.className.replace(name,'').replace(/^\s+|\s+$/g,'');
    return elem;
};
