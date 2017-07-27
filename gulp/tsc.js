'use strict';

let ts = require('gulp-typescript');

function tsc (overrides) {
    let tsProj = ts.createProject(Object.assign({
        module: 'amd',
        target: 'es5',
        removeComments: true,
        sourceMap: false
    }, overrides || {}));
    return ts(tsProj);
}

module.exports = tsc;
