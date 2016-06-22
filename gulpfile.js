process.chdir(__dirname);

var gulp = require('gulp'),
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

var build_dir = 'build/',
    re_dir = 'release/',
    scripts = [
        // { key: 'common', dir: 'common' },
        { key: 'adventure', dir: 'adventure_assistant' },
        // { key: 'arcane', dir: 'arcane_library' },
        { key: 'favmenu', dir: 'favorite_menu' },
        { key: 'heroes', dir: 'hero_list' },
        // { key: 'profile', dir: 'profile_export' },
        // { key: 'report', dir: 'report_exporter' },
        { key: 'storage', dir: 'storage_management' },
        { key: 'trade', dir: 'tidy_trade' },
        // { key: 'wardrobe', dir: 'wardrobe' }
    ];

var createTsProject = overrides => ts.createProject(Object.assign({
        module: 'amd',
        target: 'es5',
        removeComments: true,
        sourceMap: false
    }, overrides || {}));

var reAMD = /define\(".+require, exports(.+)?\) {\n\s{4}"use strict";\n((?:\s{4}.+\n?)+)}\);/g;
var reIgnore = /exports\.(.+) = \1;/;
var noAMD = (match, imports, body) => {
    var imports = (imports || '').split(/[,\s]+/).filter(x => !!x);
    imports.forEach(x => { body = body.replace(new RegExp(x + '.', 'g'), ''); });
    return body.split('\n').map(x => {
       if (reIgnore.test(x)) return '';
       return x.replace(/exports\.(.+) = /, 'var $1 = ').replace(/\s{4}/, '');
    })
    .filter(x => x.trim()).join('\n');
};

scripts.forEach(x => {

    gulp.task('release:' + x.key, () => {
        run('compile:' + x.key, '_concat:' + x.key, '_lint:' + x.key);
    });

    gulp.task('compile:' + x.key, () => {
        return gulp.src(['src/userscripts/' + x.dir + '/main.ts', 'lib/typings/index.d.ts'])
            .pipe(ts(createTsProject({ outFile: x.dir + '.js', removeComments: true })))
            .pipe(replace(reAMD, noAMD))
            .pipe(gulp.dest(build_dir));
    });

    gulp.task('test:' + x.key, function() {
        run('_test_compile:' + x.key, '_test_run:' + x.key);
    });

    //////////

    var specConfig = {
        projectName: x.dir,
        configFile: __dirname + '/karma.conf.js',
        basePath: __dirname + '/build',
        specFile: __dirname + '/build/' + x.dir + '.spec.js',
    };

    gulp.task('_test_run:' + x.key, function (done) {
        new Server(specConfig, done).start();
    });

    gulp.task('_test_compile:' + x.key, function() {
        return gulp.src(['src/userscripts/' + x.dir + '/*.spec.ts', 'lib/typings/index.d.ts'])
            .pipe(ts(createTsProject({ outFile: x.dir + '.spec.js' })))
            .pipe(replace(reAMD, noAMD))
            .pipe(gulp.dest(build_dir));
    });

    gulp.task('_concat:' + x.key, () => {
        return merge(gulp.src('src/userscripts/' + x.dir + '/header.js'),
                     gulp
                       .src(build_dir + x.dir + '.js')
                       .pipe(concat.header("(function() {\n'use strict';\n"))
                       .pipe(concat.footer('\n})();\n')))
                .pipe(concat(x.dir + '.user.js'))
                .pipe(gulp.dest(re_dir));
    });

    gulp.task('_lint:' + x.key, () => {
        return gulp.src(re_dir + x.dir + '.user.js')
                   .pipe(jshint(jshintrc))
                   .pipe(jshint.reporter('default'));
    });

    // var compile = function(rootDir) {
    //     return gulp
    //             .src(rootDir + '*|)}>#*.ts')
    //             .pipe(sourcemaps.init())
    //             .pipe(ts(createTsProject()))
    //             .js
    //             .pipe(sourcemaps.write('.', { sourceRoot: function(file) { return file.cwd + '/' + rootDir; } }))
    //             .pipe(gulp.dest(rootDir));
    // };

    // gulp.task('compile:' + x.key, function () {
    //     return compile('src/' + x.dir + '/');
    // });

    // gulp.task('test:' + x.key, function() {
    //     if (x.key === 'common')
    //         run('_clean:' + x.key, 'compile:' + x.key, '_test:' + x.key, '_remap:' + x.key);
    //     else
    //         run('_clean:common', '_clean:' + x.key, 'compile:common', 'compile:' + x.key, '_test:' + x.key, '_remap:' + x.key);
    // });
    //
    // gulp.task('debug:' + x.key, function() {
    //     run('_clean:' + x.key, 'compile:' + x.key, '_debug:' + x.key);
    // });
    //
    // gulp.task('coverage:' + x.key, function() {
    //     run('_remap:' + x.key);
    // });


    // gulp.task('_clean:' + x.key, function () {
    //     return del([
    //         'src/' + x.dir + '#<{(||)}>#*.js',
    //         'src/' + x.dir + '#<{(||)}>#*.js.map',
    //         'src/' + x.dir + '/coverage#<{(|*',
    //         '!src/' + x.dir + '/header.js',
    //     ]);
    // });
    //
    // var specConfig = {
    //     projectName: x.dir,
    //     configFile: __dirname + '/karma.conf.js',
    //     basePath: __dirname + '/src/' + x.dir
    // };
    //
    // gulp.task('_test:' + x.key, function (done) {
    //     new Server(specConfig, done).start();
    // });
    //
    // gulp.task('_debug:' + x.key, function (done) {
    //     specConfig.DEBUG = true;
    //     new Server(specConfig, done).start();
    // });
    //
    // gulp.task('_remap:' + x.key, function () {
    //     var basePath = 'src/' + x.dir + '/coverage';
    //     exec('./node_modules/remap-istanbul/bin/remap-istanbul -i ' + basePath + '/coverage-final.json' + ' -t html -o ' + basePath);
    // });

});

gulp.task('compile', scripts.map(function(x) { return 'compile:' + x.key }));

gulp.task('default', ['compile']);
