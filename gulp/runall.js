'use strict';

let run = require('run-sequence');

function runall () {
    let argv = Array.from(arguments);
    let key = argv.pop();
    run.apply(null, argv.map(x => key && x.indexOf(':') < 0 ? `${x}:${key}` : x));
}

module.exports = runall;
