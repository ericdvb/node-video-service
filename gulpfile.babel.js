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
import nodemon from 'gulp-nodemon';

gulp.task('express', () => {
  //var express = require('express');
  //var app = express();
  //app.use(require('connect-livereload')({ port: 35729 }));
  //app.use(express.static(__dirname));
  //app.listen(4000, '0.0.0.0');

  nodemon({
    script: 'dist/server.js',
    ext:    'js',
    env:    {'NODE_ENV': 'development'}
  });
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

function bundle(event) {

  var filename = event.path.slice( event.path.lastIndexOf( '/' ) + 1 );

  const customOpts = {
    entries: ['./scripts/' + filename],
    debug: true
  };
  const opts = assign({}, watchify.args, customOpts);

  console.log(filename);
  //console.log(opts);

  return watchify(browserify(opts)
      .exclude('http')
      .transform('babelify', {presets: ['es2015']})
    )
    .bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(
      source( filename )
    )
    .pipe(buffer())
    .pipe(sourcemaps.init({loadmaps:true}))
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
  gulp.watch('scripts/{main,server}.js', bundle);
  gulp.watch('dist/*.js').on('change', notifyLiveReload);
});

gulp.task('default', ['sass', 'express', 'livereload', 'watch'], () => {});
