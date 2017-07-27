'use strict';

let replace = require('gulp-replace');

let reAMD = /define\(\[?".+require, exports(.+)?\) {\n\s{4}"use strict";\n((?:\s{4}.+\n?)*)}\);/g;
let reIgnore = /exports\.(.+) = \1;/;
let noAMD = function (shouldOptimize, match, imports, body) {
    imports = (imports || '').split(/[,\s]+/).filter(x => !!x);
    imports.forEach(x => { body = body.replace(new RegExp(x + '.', 'g'), ''); });
    return (shouldOptimize ? '' : '\n\n') + body.split('\n').map(x => {
       if (reIgnore.test(x)) return shouldOptimize ? '' : '//';
       x = x.replace(/exports\.(.+) = /, 'var $1 = ').replace(/([^a-z_])exports\.([a-z0-9_$]+)([^a-z_])/gi, '$1$2$3');
       if (shouldOptimize) x = x.replace(/\s{4}/, '');
       x = x.replace('Object.defineProperty(exports, "__esModule", { value: true });', '');
       return x;
    })
    .filter(x => x.trim()).join('\n');
};

function stripAMD (optimize) {
    return replace(reAMD, noAMD.bind(null, optimize));
}

module.exports = stripAMD;
