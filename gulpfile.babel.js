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

gulp.task('app', () => {
  nodemon({
    script: 'dist/server.js',
    ignore: ['./*.*', './dist/main.js'],
    watch: [
      'dist/server.js',
      'dist/audio.js',
      'dist/video.js',
      'dist/tweets.js',
      'dist/emails.js',
      'dist/requestDispatcher.js',
      'dist/delayedResponseHandlers.js'
    ]
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

  return watchify(browserify(opts)
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

gulp.task('copyToDist', (event) => {
  var path = './scripts/*.js';
  copyToDist({path: path});
});

function copyToDist(event) {
  console.log(event);
  var filename = event.path.slice( event.path.lastIndexOf( '/' ) + 1 );
  gulp.src(['scripts/' + filename, '!scripts/main.js'])
  .pipe(gulp.dest('dist'));
}

function notifyLiveReload(event) {
  tinylr.changed(event.path);
}

gulp.task('watch', () => {
  gulp.watch('sass/*.scss', ['sass']);
  gulp.watch('*.html', notifyLiveReload);
  gulp.watch('css/*.css', notifyLiveReload);
  gulp.watch('scripts/main.js', bundle);
  gulp.watch('scripts/server.js', copyToDist);
  gulp.watch(['scripts/*.js', '!scripts/main.js'], copyToDist);
  gulp.watch('dist/main.js').on('change', notifyLiveReload);
});

gulp.task('default', ['sass', 'copyToDist', 'app', 'livereload', 'watch'], () => {});
