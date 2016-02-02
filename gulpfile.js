var gulp = require('gulp'),
    concat = require('gulp-concat-util'),
    merge = require('merge2'),
    tsd = require('gulp-tsd'),
    ts = require('gulp-typescript'),
    run = require('run-sequence'),
    Server = require('karma').Server;

var build_dir = 'build/',
    re_dir = 'release/',
    scripts = [
        { key: 'common', name: 'common' },
        { key: 'adventure', name: 'adventure_assistant' },
        { key: 'favmenu', name: 'favorite_menu' },
        { key: 'heroes', name: 'hero_list' },
        { key: 'profile', name: 'profile_export' },
        { key: 'report', name: 'report_exporter' },
        { key: 'storage', name: 'storage_management' },
        { key: 'trade', name: 'tidy_trade' },
        { key: 'wardrobe', name: 'wardrobe' }
    ];

scripts.forEach(function (x) {

    gulp.task('compile:' + x.key, function () {
        return gulp
                .src('src/' + x.name + '/*.ts')
                .pipe(ts({
                     out: x.name + '.js',
                     removeComments: true,
                     target: 'es5',
                 }))
                .pipe(gulp.dest(build_dir));
    });

    gulp.task('_concat:' + x.key, function() {
        return merge(gulp.src('src/' + x.name + '/header.js'),
                     gulp
                       .src(build_dir + x.name + '.js')
                       .pipe(concat.header('(function() {\n'))
                       .pipe(concat.footer('\n})();\n')))
                .pipe(concat(x.name + '.user.js'))
                .pipe(gulp.dest(re_dir));
    });

    gulp.task('test:' + x.key, function (done) {
        new Server({
            configFile: __dirname + '/tests/karma.conf.js',
            basePath: __dirname + '/tests/' + x.name,
        }, done).start();
    });

    gulp.task('release:' + x.key, function() {
        run('compile:' + x.key, '_concat:' + x.key);
    });

});

gulp.task('tsd', function (callback) {
    tsd({
        command: 'reinstall',
        config: 'lib/tsd.json'
    }, callback);
});

gulp.task('compile', scripts.map(function(x) { return 'ts:' + x.key }));

gulp.task('default', ['compile']);
