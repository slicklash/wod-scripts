'use strict';

process.chdir(__dirname);

let gulp = require('gulp'),
    concat = require('gulp-concat-util'),
    replace = require('gulp-replace'),
    merge = require('merge2'),
    run = require('run-sequence'),
    del = require('del'),
    ts = require('gulp-typescript'),
    jshint = require('gulp-jshint'),
    sourcemaps = require('gulp-sourcemaps'),
    remapIstanbul = require('remap-istanbul/lib/gulpRemapIstanbul'),
    exec = require('child_process').exec,
    Server = require('karma').Server,
    packageJSON  = require('./package'),
    jshintrc = packageJSON.jshintrc;

let build_dir = 'build/',
    common_dir = 'src/common/',
    us_dir = 'src/userscripts/',
    release_dir = 'release/',
    scripts = [
        { key: 'common', dir: 'common' },
        { key: 'adventure', dir: 'adventure_assistant' },
        { key: 'arcane', dir: 'arcane_library' },
        { key: 'favmenu', dir: 'favorite_menu' },
        { key: 'heroes', dir: 'hero_list' },
        // { key: 'profile', dir: 'profile_export' },
        // { key: 'report', dir: 'report_exporter' },
        { key: 'storage', dir: 'storage_management' },
        { key: 'trade', dir: 'tidy_trade' },
        // { key: 'wardrobe', dir: 'wardrobe' }
    ];

let createTsProject = overrides => ts.createProject(Object.assign({
        module: 'amd',
        target: 'es5',
        removeComments: true,
        sourceMap: false
}, overrides || {}));

let reAMD = /define\(\[?".+require, exports(.+)?\) {\n\s{4}"use strict";\n((?:\s{4}.+\n?)+)}\);/g;
let reIgnore = /exports\.(.+) = \1;/;
let noAMD = function (shouldOptimize, match, imports, body) {
    imports = (imports || '').split(/[,\s]+/).filter(x => !!x);
    imports.forEach(x => { body = body.replace(new RegExp(x + '.', 'g'), ''); });
    return (shouldOptimize ? '' : '\n\n') + body.split('\n').map(x => {
       if (reIgnore.test(x)) return shouldOptimize ? '' : '//';
       x = x.replace(/exports\.(.+) = /, 'var $1 = ').replace(/([^a-z_])exports\.([a-z0-9_$]+)([^a-z_])/gi, '$1$2$3');
       if (shouldOptimize) x = x.replace(/\s{4}/, '');
       return x;
    })
    .filter(x => x.trim()).join('\n');
};

let runall = function () {
    let argv = Array.from(arguments);
    let key = argv.pop();
    run.apply(null, argv.map(x => x.indexOf(':') < 0 ? `${x}:${key}` : x));
}

scripts.forEach(x => {

    gulp.task('release:' + x.key, () => { runall('compile', '_concat', '_lint', x.key); });

    gulp.task('compile:' + x.key, () => {
        return gulp
                .src([`${us_dir + x.dir}/main.ts`, 'lib/typings/index.d.ts'])
                .pipe(ts(createTsProject({ outFile: x.dir + '.js', removeComments: true })))
                .pipe(replace(reAMD, noAMD.bind(null, true)))
                .pipe(gulp.dest(build_dir));
    });

    gulp.task('test:' + x.key, () => {
        if (x.key === 'common')
            runall('_test_clean', '_test_compile', '_test_run', '_remap', x.key);
        else
            runall('_test_clean', '_test_compile:common', '_test_compile', '_test_run', '_remap', x.key);
    });

    //////////

    let specConfig = {
        projectName: x.key,
        configFile: __dirname + '/karma.conf.js',
        basePath: __dirname + '/build',
        specs: [
            { pattern: '**/*controller.js', included: true, watched: false },
            { pattern: '**/!(*spec).js', included: true, watched: false },
            { pattern: (x.key !== 'common' ? 'userscripts/': '') + '**/*spec.js', included: true, watched: false },
        ]
    };

    gulp.task('_test_run:' + x.key, done => { new Server(specConfig, done).start(); });

    gulp.task('_test_compile:' + x.key, () => {

        let rootDir, outDir;

        if (x.key !== 'common') {
            rootDir = us_dir + x.dir;
            outDir = 'userscripts/' + x.dir + '/';
        }
        else {
            rootDir = common_dir;
            outDir = 'common/';
        }

        let sources = [rootDir + '/**/*.ts', 'lib/typings/index.d.ts'];

        return gulp
                .src(sources)
                .pipe(sourcemaps.init())
                .pipe(ts(createTsProject()))
                .pipe(replace(reAMD, noAMD.bind(null, false)))
                .pipe(sourcemaps.write('.', { sourceRoot: file => file.cwd + '/' + rootDir }))
                .pipe(gulp.dest(build_dir + outDir));
    });

    gulp.task('_test_clean:' + x.key, () => { return del([ build_dir + '**']); });

    gulp.task('_remap:' + x.key, () => {
        let basePath = build_dir + '/coverage';
        exec(`./node_modules/remap-istanbul/bin/remap-istanbul -i ${basePath}/coverage-final.json -t html -o ${basePath}`);
    });

    gulp.task('_concat:' + x.key, () => {
        return merge(gulp.src(us_dir + x.dir + '/header.js'),
                     gulp.src(build_dir + x.dir + '.js')
                         .pipe(concat.header("(function() {\n'use strict';\n"))
                         .pipe(concat.footer('\n})();\n')))
                .pipe(concat(x.dir + '.user.js'))
                .pipe(gulp.dest(release_dir));
    });

    gulp.task('_lint:' + x.key, () => {
        return gulp.src(release_dir + x.dir + '.user.js')
                   .pipe(jshint(jshintrc))
                   .pipe(jshint.reporter('default'));
    });

});

gulp.task('compile', scripts.map(x => 'compile:' + x.key));

gulp.task('default', ['compile']);
