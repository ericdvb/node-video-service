import gulp from 'gulp';
import sass from 'gulp-sass';
import minifycss from 'gulp-minify-css';
import rename from 'gulp-rename';
import tinylr from 'tiny-lr';
import babelify from 'babelify';
import watchify from 'watchify';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import assign from 'lodash.assign';
import sourcemaps from 'gulp-sourcemaps';
import gutil from 'gulp-util';

const customOpts = {
  entries: ['./scripts/main.js'],
  debug: true
};
const opts = assign({}, watchify.args, customOpts);

gulp.task('express', () => {
  var express = require('express');
  var app = express();
  app.use(require('connect-livereload')({port: 35729}));
  app.use(express.static(__dirname));
  app.listen(4000, '0.0.0.0');
});

gulp.task('sass', () => {
  gulp.src('./sass/**/*.scss')
    .pipe(sass({
      includePaths: ['node_modules/foundation-sites/scss/'],
      outputStyle: 'expanded'
    }).on('error', sass.logError))
    .pipe(gulp.dest('./css'));
});

gulp.task('livereload', () => {
  var tinylrInstance = tinylr(); 
  tinylrInstance.listen(35729);
});

function bundle() {
  return watchify(browserify(opts)
      .transform('babelify', {presets: ['es2015']}))
    .bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps:true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist'));
}

function notifyLiveReload(event) {
  tinylr.changed(event.path);
}

gulp.task('watch', () => {
  gulp.watch('sass/*.scss', ['sass']);
  gulp.watch('*.html', notifyLiveReload);
  gulp.watch('css/*.css', notifyLiveReload);
  gulp.watch('scripts/*.js', bundle);
  gulp.watch('dist/*.js').on('change', notifyLiveReload);
});

gulp.task('default', ['sass', 'express', 'livereload', 'watch'], () => {});
