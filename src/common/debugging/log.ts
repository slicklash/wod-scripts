export function log(...args) {
    let el: HTMLTextAreaElement = <any> document.getElementById('_log-window');
    if (!el) {
        const center = document.getElementById('gadgettable-center-gadgets');
        el = document.createElement('textarea');
        el.setAttribute('style', 'height: 200px; width:1000px');
        el.setAttribute('id', '_log-window');
        center.parentNode.insertBefore(el, center);
    }
    el.textContent += args.join(' ') + '\n';
}
