'use strict';

process.chdir(__dirname);

let gulp = require('gulp'),
    tsc = require('./gulp/tsc'),
    stripAMD = require('./gulp/strip-amd'),
    runall = require('./gulp/runall'),
    concat = require('gulp-concat-util'),
    replace = require('gulp-replace'),
    merge = require('merge2'),
    run = require('run-sequence'),
    del = require('del'),
    jshint = require('gulp-jshint'),
    sourcemaps = require('gulp-sourcemaps'),
    remapIstanbul = require('remap-istanbul/lib/gulpRemapIstanbul'),
    exec = require('child_process').exec,
    KarmaServer = require('karma').Server,
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
        { key: 'numismatist', dir: 'numismatist' },
        // { key: 'profile', dir: 'profile_export' },
        // { key: 'report', dir: 'report_exporter' },
        { key: 'storage', dir: 'storage_management' },
        { key: 'trade', dir: 'tidy_trade' },
        // { key: 'wardrobe', dir: 'wardrobe' }
    ];


scripts.forEach(x => {

    gulp.task('release:' + x.key, () => { runall('compile', '_concat', '_lint', x.key); });

    gulp.task('compile:' + x.key, () => {
        return gulp
                .src([`${us_dir + x.dir}/main.ts`, 'lib/typings/index.d.ts'])
                .pipe(tsc({ outFile: x.dir + '.js', removeComments: true }))
                .pipe(stripAMD(true))
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

    gulp.task('_test_run:' + x.key, done => { new KarmaServer(specConfig, done).start(); });

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
                .pipe(tsc())
                .pipe(stripAMD(false))
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
