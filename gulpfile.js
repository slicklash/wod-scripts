var gulp = require('gulp'),
    concat = require('gulp-concat-util'),
    merge = require('merge2'),
    tsd = require('gulp-tsd'),
    ts = require('gulp-typescript'),
    run = require('run-sequence'),
    jshint = require('gulp-jshint'),
    sourcemaps = require('gulp-sourcemaps'),
    remapIstanbul = require('remap-istanbul/lib/gulpRemapIstanbul'),
    del = require('del'),
    exec = require('child_process').exec,
    Server = require('karma').Server;

var build_dir = 'build/',
    re_dir = 'release/',
    scripts = [
        { key: 'common', dir: 'common' },
        { key: 'adventure', dir: 'adventure_assistant' },
        { key: 'favmenu', dir: 'favorite_menu' },
        { key: 'heroes', dir: 'hero_list' },
        { key: 'profile', dir: 'profile_export' },
        { key: 'report', dir: 'report_exporter' },
        { key: 'storage', dir: 'storage_management' },
        { key: 'trade', dir: 'tidy_trade' },
        { key: 'wardrobe', dir: 'wardrobe' }
    ];

var createTsProject = function(overrides) {
    return ts.createProject(Object.assign({
        removeComments: false,
        target: 'es5',
    }, overrides || {}));
};

var compile = function(rootDir) {
    return gulp
            .src(rootDir + '**/*.ts')
            .pipe(sourcemaps.init())
            .pipe(ts(createTsProject()))
            .js
            .pipe(sourcemaps.write('.', { sourceRoot: function(file) { return file.cwd + '/' + rootDir; } }))
            .pipe(gulp.dest(rootDir));
};

scripts.forEach(function (x) {

    gulp.task('compile:' + x.key, function () {
        return compile('src/' + x.dir + '/');
    });

    gulp.task('test:' + x.key, function() {
        if (x.key === 'common')
            run('_clean:' + x.key, 'compile:' + x.key, '_test:' + x.key, '_remap:' + x.key);
        else
            run('_clean:common', '_clean:' + x.key, 'compile:common', 'compile:' + x.key, '_test:' + x.key, '_remap:' + x.key);
    });

    gulp.task('debug:' + x.key, function() {
        run('_clean:' + x.key, 'compile:' + x.key, '_debug:' + x.key);
    });

    gulp.task('coverage:' + x.key, function() {
        run('_remap:' + x.key);
    });

    gulp.task('release:' + x.key, function() {
        run('test:' + x.key, '_build:' + x.key, '_concat:' + x.key, '_lint:' + x.key);
    });

    //////////

    gulp.task('_clean:' + x.key, function () {
        return del([
            'src/' + x.dir + '/**/*.js',
            'src/' + x.dir + '/**/*.js.map',
            'src/' + x.dir + '/coverage/**',
            '!src/' + x.dir + '/header.js',
        ]);
    });

    var specConfig = {
        projectName: x.dir,
        configFile: __dirname + '/karma.conf.js',
        basePath: __dirname + '/src/' + x.dir
    };

    gulp.task('_test:' + x.key, function (done) {
        new Server(specConfig, done).start();
    });

    gulp.task('_debug:' + x.key, function (done) {
        specConfig.DEBUG = true;
        new Server(specConfig, done).start();
    });

    gulp.task('_remap:' + x.key, function () {
        var basePath = 'src/' + x.dir + '/coverage';
        exec('./node_modules/remap-istanbul/bin/remap-istanbul -i ' + basePath + '/coverage-final.json' + ' -t html -o ' + basePath);
    });

    gulp.task('_build:' + x.key, function () {
        return gulp
                .src(['src/' + x.dir + '/*.ts', '!src/' + x.dir + '/*.spec.ts'])
                .pipe(ts(createTsProject({
                     outFile: x.dir + '.js',
                     removeComments: true
                 })))
                .pipe(gulp.dest(build_dir));
    });

    gulp.task('_concat:' + x.key, function() {
        return merge(gulp.src('src/' + x.dir + '/header.js'),
                     gulp
                       .src(build_dir + x.dir + '.js')
                       .pipe(concat.header("(function() {\n'use strict';\n"))
                       .pipe(concat.footer('\n})();\n')))
                .pipe(concat(x.dir + '.user.js'))
                .pipe(gulp.dest(re_dir));
    });

    gulp.task('_lint:' + x.key, function() {
        return gulp.src(re_dir + x.dir + '.user.js')
                   .pipe(jshint())
                   .pipe(jshint.reporter('default'));
    });

});

gulp.task('tsd', function (callback) {
    tsd({
        command: 'reinstall',
        config: 'lib/tsd.json'
    }, callback);
});

gulp.task('compile', scripts.map(function(x) { return 'compile:' + x.key }));

gulp.task('default', ['compile']);
