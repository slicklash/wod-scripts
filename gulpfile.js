'use strict';

process.chdir(__dirname);

const gulp = require('gulp');
const tsc = require('./gulp/tsc');
const stripAMD = require('./gulp/strip-amd');
const runall = require('./gulp/runall');
const concat = require('gulp-concat-util');
const merge = require('merge2');
const jshint = require('gulp-jshint');
const packageJSON  = require('./package');
const jshintrc = packageJSON.jshintrc;

const build_dir = 'build/';
const us_dir = 'src/userscripts/';
const release_dir = 'release/';
const scripts = [
  { key: 'common', dir: 'common' },
  { key: 'adventure', dir: 'adventure_assistant' },
  { key: 'arcane', dir: 'arcane_library' },
  { key: 'favmenu', dir: 'favorite_menu' },
  { key: 'heroes', dir: 'hero_list' },
  { key: 'numismatist', dir: 'numismatist' },
  { key: 'storage', dir: 'storage_management' },
  { key: 'trade', dir: 'tidy_trade' },
];

scripts.forEach(x => {

  gulp.task('release:' + x.key, () => { runall('compile', '_concat', '_lint', x.key); });

  gulp.task('compile:' + x.key, () => {
    return gulp
      .src([`${us_dir + x.dir}/main.ts`])
      .pipe(tsc({ outFile: x.dir + '.js', removeComments: true })())
      .pipe(stripAMD(true))
      .pipe(gulp.dest(build_dir));
  });

  //////////

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
