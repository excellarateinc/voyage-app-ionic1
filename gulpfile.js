const gulp = require('gulp');
const concat = require('gulp-concat');
const minifyCss = require('gulp-minify-css');
const rename = require('gulp-rename');
const runSequence = require('run-sequence');
const wiredep = require('wiredep').stream;
const plugins = require('gulp-load-plugins')();

const paths = {
  markup: ['./src/**/*.html', './src/**/*.svg'],
  images: ['./src/img/**/*'],
  sass: ['./scss/**/*.scss', './src/app/**/*.scss'],
  js: [
    './src/app/**/*.module.js',
    './src/app/**/*.js',
    '!./src/app/**/*.spec.js'
  ],
  jsOrder: [
    '**/app.module.js',
    '**/*.module.js',
    '**/*.js'
  ]
};

// Runs Karma tests
gulp.task('test', test);

// Runs ESLint against JavaScript to check for best practices
gulp.task('es-lint', esLint);

// Runs Sass Lint against Sass to check for best practices
gulp.task('sass-lint', sassLint);

// Generates environment constants like URL of the API
gulp.task('generate-constants', generateConstants);

gulp.task('serve', plugins.shell.task([
  'ionic serve -p 3000'
]));

gulp.task('serve-lab', plugins.shell.task([
  'ionic serve -p 3000 --lab'
]));


/**
 * Hook in to the Ionic tasks and run gulp tasks before them
 */

gulp.task('serve:before', function(done) {
  runSequence('include-dev-js', "copy-lib", "copy-images", "markup", "babel", "sass", "watch", done)
});

gulp.task('emulate:before', function(done) {
  runSequence('include-dev-js', "copy-lib", "copy-images", "markup", "babel", "sass", done)
});

gulp.task('run:before', function(done) {
  runSequence('include-dev-js', "copy-lib", "copy-images", "markup", "babel", "sass", done)
});

gulp.task('build:before', function(done) {
  runSequence('include-dev-js', "copy-lib", "copy-images", "markup", "babel", "sass", done)
});


/**
 * NOTE!  All tasks and functions below only exist to support the tasks above and shouldn't need to be run directly.
 */

gulp.task('default', ['sass']);

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(plugins.sass())
    .on('error', plugins.sass.logError)
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(paths.js, ['es-lint']).on('change', function(event) {
    if (event.type === 'added' || event.type === 'deleted' || event.type === 'renamed') {
      includeDevJs();
    }
  });


  gulp.watch(paths.sass, ['sass-lint', 'sass']);
  gulp.watch(paths.js, ['babel']);
  gulp.watch(paths.markup, ['markup']);
  gulp.watch(paths.images, ['copy-images']);
});

gulp.task('babel', function(done) {
  gulp.src(paths.js)
    .pipe(plugins.babel())
    .pipe(gulp.dest('./www/app'))
    .on('end', done);
});

gulp.task('copy-lib', function(done) {
  gulp.src('./src/lib/**/*')
    .pipe(gulp.dest('./www/lib'))
    .on('end', done);
});

gulp.task('copy-images', function(done) {
  gulp.src(paths.images)
    .pipe(plugins.imagemin())
    .pipe(gulp.dest('./www/img'))
    .on('end', done);
});

gulp.task('markup', function(done) {
  gulp.src(paths.markup)
    .pipe(gulp.dest('./www'))
    .on('end', done);
});

/**
 * Starts a new Karma server to run unit tests.
 * @param done
 */
function test(done) {
  new KarmaServer({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done).start();
}


/**
 * Takes all non-test JavaScript files and run ESLint on them with default formatting.
 * failAfterError is set to resolve with an error code if any error level best practices aren't met.
 */
function esLint() {
  return gulp.src(paths.js)
    .pipe(plugins.eslint())
    .pipe(plugins.eslint.format())
    .pipe(plugins.eslint.failAfterError());
}


/**
 * Takes all Sass files and runs Sass Lint on them with default formatting.
 * The force element nesting rule is disabled because to override bootstrap styles we often need really specific
 * element nesting, and nesting them inside each other will violate the nesting depth rule, which is more important.
 */
function sassLint() {
  return gulp.src(paths.sass)
    .pipe(plugins.sassLint({
      rules: {
        'force-element-nesting': 0
      }
    }))
    .pipe(plugins.sassLint.format())
    .pipe(plugins.sassLint.failOnError())
}


/**
 * Determines the environment by checking the NODE_ENV environment variable, but defaults to development
 * if none is found.  The template used here is the default template, just with a newline added at the
 * end to comply with the style guide.
 */
function generateConstants() {
  const configJson = require('./src/app/environment-constants/environment-constants.config.json');
  const environmentConfig = configJson[process.env.NODE_ENV || 'development'];

  return plugins.ngConstant({
    name: 'launchpadApp.constants',
    constants: environmentConfig,
    wrap: false,
    stream: true,
    template:
    'angular.module("<%- moduleName %>"<% if (deps) { %>, <%= JSON.stringify(deps) %><% } %>)\n'
    + '<% constants.forEach(function(constant) { %>\n'
    +  '.constant("<%- constant.name %>", <%= constant.value %>)\n'
    +  '<% }) %>\n'
    +  ';\n'
  })
    .pipe(plugins.rename('constants.module.js'))
    .pipe(gulp.dest('./src/app/environment-constants/'));
}

/**
 * Uses gulp-inject to insert script tags for all development JavaScript files (excluding tests) in the src folder.
 * Handles including all development JavaScript so developers don't have to worry about the include order and remembering
 * to include all of their JavaScript files.
 */
gulp.task('include-dev-js', includeDevJs);


/** Takes the index.html file as the target, then gets all non-test JavaScript files in proper order via
 * getOrderedJsFiles and injects them into index.html as script tags.  The gulp-inject plugin looks for
 * <!-- inject:js --> and <!-- endinject --> in index.html and inserts the tags there.  We want the path in the tags to
 * be the path relative to index.html, so { relative: true } is passed to gulp inject along with the sorted JavaScript
 * files. The resulting index.html file is then written back into the src/ folder, overwriting the original one.
 */
function includeDevJs() {
  const target = gulp.src('src/index.html');
  return target
    .pipe(plugins.inject(getOrderedJsFiles(), {relative: true}))
    .pipe(gulp.dest('src/'));
}


/**
 * Take all files matching the patterns in config.js and order them by
 * the order specified with the patterns in config.jsOrder
 */
function getOrderedJsFiles() {
  return gulp.src(paths.js)
    .pipe(plugins.order(paths.jsOrder))
}
