/* jshint node:true */
'use strict';

var fs = require('fs');
var path = require('path');
var merge = require('merge-stream');
var moment = require('moment');
var serverPort = 9050;
var defaultLang = 'en-gb';
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

function getFolders(dir) {
    return fs.readdirSync(dir)
      .filter(function(file) {
        return fs.statSync(path.join(dir, file)).isDirectory();
      });
}

gulp.task('styles', function () {
  return gulp.src('app/styles/main.scss')
    .pipe($.plumber())
    .pipe($.sass({
      style: 'expanded',
      precision: 10
    }))
    .pipe($.autoprefixer({browsers: ['last 1 version']}))
    .pipe(gulp.dest('.tmp/styles'));
});

gulp.task('jshint', function () {
  return gulp.src('app/scripts/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.jshint.reporter('fail'));
});

gulp.task('template', function () {
  var data = JSON.parse(fs.readFileSync('./app/templates/data.json'));
  data.currentLanguage = 'en-gb';
  data.generatedTime = moment().format('MMM Do YY, HH:mm:ss');

  return gulp.src('./app/templates/pages/*.html')
    .pipe($.data(data))
    .pipe($.swig({ defaults: { cache: false } }))
    .pipe(gulp.dest('.tmp'));

});

gulp.task('html', ['styles'], function () {
  var lazypipe = require('lazypipe');
  var cssChannel = lazypipe()
    .pipe($.csso)
    .pipe($.replace, 'bower_components/bootstrap-sass-official/assets/fonts/bootstrap','fonts');
  var assets = $.useref.assets({searchPath: '{.tmp,app}'});

  return gulp.src('.tmp/**/*.html')
    .pipe(assets)
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', cssChannel()))
    //.pipe($.rev())
    .pipe(assets.restore())
    .pipe($.useref())
    //.pipe($.revReplace())
    .pipe($.if('*.html', $.minifyHtml({conditionals: true, loose: true})))
    .pipe(gulp.dest('dist'));
});

gulp.task('images', function () {
  return gulp.src('app/images/**/*')
    .pipe($.imagemin({
      progressive: true,
      //interlaced: true,
      svgoPlugins: [
        { removeUnknownsAndDefaults: false },
        { removeViewBox: false },
        { convertShapeToPath: false },
        { mergePaths: false },
        { cleanupNumericValues: false },
        { convertPathData: false },
        { convertTransform: false },
        { moveElemsAttrsToGroup: false },
        { moveGroupAttrsToElems : false }
      ]
    }))
    //.pipe($.rev())
    .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', function () {
  return gulp.src(require('main-bower-files')().concat('app/fonts/**/*'))
    .pipe($.filter('**/*.{eot,svg,ttf,woff,woff2}'))
    .pipe($.flatten())
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', function () {
  return gulp.src([
    'app/*.*',
    '!app/*.html',
    'CNAME'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('clean', require('del').bind(null, ['.tmp', 'dist']));

gulp.task('connect', ['styles'], function () {
  var serveStatic = require('serve-static');
  var serveIndex = require('serve-index');
  var app = require('connect')()
    .use(require('connect-livereload')({port: 35729}))
    .use(serveStatic('.tmp'))
    .use(serveStatic('app'))
    // paths to bower_components should be relative to the current file
    // e.g. in app/index.html you should use ../bower_components
    .use('/bower_components', serveStatic('bower_components'))
    .use(serveIndex('app'));

  require('http').createServer(app)
    .listen(serverPort)
    .on('listening', function () {
      console.log('Started connect web server on http://localhost:' + serverPort);
    });
});

gulp.task('serve', ['connect', 'watch'], function () {
  require('opn')('http://localhost:' + serverPort);
});

// inject bower components
gulp.task('wiredep', function () {
  var wiredep = require('wiredep').stream;

  gulp.src('app/styles/*.scss')
    .pipe(wiredep())
    .pipe(gulp.dest('app/styles'));

  gulp.src('app/*.html')
    .pipe(wiredep({exclude: ['bootstrap-sass-official']}))
    .pipe(gulp.dest('app'));

  gulp.src('app/templates/**/*.html')
    .pipe(wiredep({exclude: ['bootstrap-sass-official']}))
    .pipe(gulp.dest('app'));
});

gulp.task('watch', ['connect'], function () {
  $.livereload.listen();

  // watch for changes
  gulp.watch([
    'app/*.html',
    '.tmp/styles/**/*.css',
    '.tmp/**/*.html',
    'app/scripts/**/*.js',
    'app/images/**/*'
  ]).on('change', $.livereload.changed);

  gulp.watch('app/styles/**/*.scss', ['styles']);
  gulp.watch(['app/templates/**/*.html', 'app/data/**/*.json'], ['template']);
  gulp.watch('bower.json', ['wiredep']);
});

gulp.task('build', ['jshint', 'template', 'images', 'html', 'fonts', 'extras'], function () {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', ['clean'], function () {
  gulp.start('build');
});

gulp.task('deploy', ['build'], function () {
	var ghpages = require('gh-pages');
	var path = require('path');

	ghpages.publish(path.join(__dirname, 'dist'), function(err) {
		console.error(err);
	});
});

gulp.task('deploy-no-build', function () {
	var ghpages = require('gh-pages');
	var path = require('path');

	ghpages.publish(path.join(__dirname, 'dist'), function(err) {
		console.error(err);
	});
});
