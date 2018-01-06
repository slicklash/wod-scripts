'use strict';

let ts = require('gulp-typescript');

function tsc (overrides) {
    return ts.createProject('tsconfig.json', overrides || {});
}

module.exports = tsc;
