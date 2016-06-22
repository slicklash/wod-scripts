var rows = document.querySelectorAll('.row0, .row1'),
    i, row, input, report_id, report_name, button, controls,
    socket, connected;

for(i = 0; i < rows.length; i++) {
    row = rows[i];
    controls = row.querySelector('td:last-child');
    input = controls.querySelector('input');
    report_name = input.getAttribute('name');
    report_id = input.getAttribute('value');
    button = createExportButton('Export', handleExport);
    button.setAttribute('data-name', report_name);
    button.setAttribute('data-id', report_id);
    controls.appendChild(button);
}

try2connect();

interface unsafeWindow {
    WebSocket: any;
    MozWebSocket: any;
}

declare var unsafeWindow;

function try2connect() {
    var wsImpl = unsafeWindow.WebSocket || unsafeWindow.MozWebSocket;

    socket = new wsImpl('ws://localhost:8765/');

    socket.onmessage = function (evt) {
        console.log(evt);
    };

    socket.onopen = function () {
        var sessid = document.cookie.substring(document.cookie.indexOf('PHPSESSID'));
        sessid = sessid.substring(0, sessid.indexOf(';'));
        sessid += ';' + document.forms['the_form'].wod_post_id.value;
        socket.send(sessid);
        connected = true;
        console.log('.. connection open');
    };

    socket.onclose = function () {
        connected = false;
        console.log('.. connection open');
    }
}

function createExportButton(title, handler): HTMLElement {
    var button = document.createElement('input');
    button.setAttribute('type', 'button');
    button.setAttribute('value', title);
    button.className = 'button clickable';
    button.addEventListener('click', handler);
    return button;
}

function handleExport(e) {
    report_name = e.target.getAttribute('data-name');
    report_id = e.target.getAttribute('data-id');
    var msg = report_name + '=' + report_id;
    console.log(msg);
    socket.send(msg);
 }
