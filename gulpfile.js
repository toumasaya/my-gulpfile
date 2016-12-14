var browserSync = require('browser-sync');
var del = require('del');
var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');
var cached = require('gulp-cached');
var changed = require('gulp-changed');
var cssnano = require('gulp-cssnano');
var debug = require('gulp-debug');
var filter = require('gulp-filter');
var gulpIf = require('gulp-if');
var notify = require('gulp-notify');
var plumber = require('gulp-plumber');
var pug = require('gulp-pug');
var pugInheritance = require('gulp-pug-inheritance');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var runSequence = require('run-sequence');

// Development tasks
// -----------------

// Start browser-sync server
gulp.task('browserSync', function(){
  browserSync({
    server: {
      baseDir: 'dist'
    }
  });
});

// pug
gulp.task('pug', function() {
  return gulp.src('app/pug/**/*.pug')
    .pipe(plumber({
      handleError: function(err) {
        console.log(err);
        this.emit('end');
      }
    }))
    //only pass unchanged *main* files and *all* the partials
    .pipe(changed('dist', {extension: '.html'}))

    //filter out unchanged partials, but it only works when watching
    .pipe(gulpIf(global.isWatching, cached('pug')))
    .pipe(debug({title: 'debug-before'}))

    //find files that depend on the files that have changed
    .pipe(pugInheritance({basedir: 'app/pug', extension: '.pug', skip: 'node_modules'}))
    .pipe(debug({title: 'debug-after'}))

    //filter out partials (folders and files starting with "_" )
    .pipe(filter(function(file) {
      return !/\/_/.test(file.path) && !/^_/.test(file.relative);
    }))
    .pipe(debug({title: 'debug-after-filter'}))

    //process pug templates
    .pipe(pug({
      pretty: true
    }))

    //save all the files
    .pipe(gulp.dest('dist'))
    .pipe(notify({message: 'Server "<%= file.path %>"'}))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('setWatch', function() {
  global.isWatching = true;
});

// sass
gulp.task('sass', function(){
  return gulp.src('app/sass/**/*.{scss,sass}')
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .on('error', sass.logError)
    .pipe(sourcemaps.write())
    .pipe(debug({title: 'debug-sass'}))
    .pipe(gulp.dest('app/css'))
    .pipe(notify({message: 'Server "<%= file.path %>"'}))
    .pipe(browserSync.reload({
      stream: true
    }));
});

// Cleaning
gulp.task('clean', function(){
  return del(['dist/**/*']);
});

// Optimizeing tasks
// -----------------

// Optimizeing CSS with cssnano
gulp.task('cssnano', function(){
  return gulp.src('app/css/**/*.css')
    .pipe(cssnano({
      zindex: false // fixed the z-index bug
    }))
    .pipe(debug({title: 'debug-css'}))
    .pipe(gulp.dest('dist/css'))
    .pipe(notify({message: 'Server "<%= file.path %>"'}))
    .pipe(browserSync.reload({
      stream: true
    }))
});

// Watchers
// ------------------

gulp.task('watch', ['setWatch', 'pug'], function(){
  gulp.watch('app/pug/**/*.pug', ['pug']);
  gulp.watch('app/sass/**/*.{scss,sass}', ['sass']);
  gulp.watch('app/css/**/*.css', ['cssnano']);
});

// Build Sequence
// -------------------

gulp.task('default', function(){
  runSequence('watch', ['pug', 'sass','browserSync']);
});

gulp.task('build', function(){
  runSequence('clean', ['pug', 'sass', 'cssnano']);
});
