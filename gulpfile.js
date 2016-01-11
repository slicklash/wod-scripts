var gulp = require('gulp'),
    concat = require('gulp-concat-util'),
    merge = require('merge2'),
    tsd = require('gulp-tsd'),
    ts = require('gulp-typescript'),
    run = require('run-sequence');

var build_dir = 'build/',
    re_dir = 'release/',
    scripts = [
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

    gulp.task('ts:' + x.key, function () {
        return gulp
                .src('src/' + x.name + '/*.ts')
                .pipe(ts({
                     out: x.name + '.js',
                     removeComments: true,
                     target: 'es5',
                 }))
                .pipe(gulp.dest(build_dir));
    });

    gulp.task('concat:' + x.key, function() {
        return merge(gulp.src('src/' + x.name + '/header.js'),
                     gulp
                       .src(build_dir + x.name + '.js')
                       .pipe(concat.header('(function(window, document, undefined) {\n'))
                       .pipe(concat.footer('\n})(window, document);\n')))
                .pipe(concat(x.name + '.user.js'))
                .pipe(gulp.dest(re_dir));
    });

    gulp.task('re:' + x.key, function() {
        run('ts:' + x.key, 'concat:' + x.key);
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
