
let _t;

if (location.href.indexOf('.net') > 0) {
    _t = (text) => { return text; };
}
else {
    _t = (text) => { return text === 'Commit' ? 'nderungen' : text; };
}
