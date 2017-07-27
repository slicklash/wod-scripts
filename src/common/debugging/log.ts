export function log (...args) {
    let log: HTMLTextAreaElement = <any>document.getElementById('_log-window');
    if (!log) {
        let center = document.getElementById('gadgettable-center-gadgets');
        log = document.createElement('textarea');
        log.setAttribute('style', 'height: 200px; width:1000px');
        log.setAttribute('id', '_log-window');
        center.parentNode.insertBefore(log, center)
    }
    log.textContent += args.join(' ') + '\n';
}
