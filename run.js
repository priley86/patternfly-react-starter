'use strict';

/* eslint-disable no-console, global-require */

var fs = require('fs');
var del = require('del');
var ejs = require('ejs');
var webpack = require('webpack');

// TODO: Update configuration settings
var config = {
  title: 'Patternfly React Starter', // Your website title
  url: 'https://patternfly-react-starter.firebaseapp.com', // Your website URL
  project: 'patternfly-react-starter', // Firebase project. See README.md -> How to Deploy
  trackingID: 'UA-XXXXX-Y' };

var tasks = new Map(); // The collection of automation tasks ('clean', 'build', 'publish', etc.)

function run(task) {
  var start = new Date();
  console.log('Starting \'' + task + '\'...');
  return Promise.resolve().then(function () {
    return tasks.get(task)();
  }).then(function () {
    console.log('Finished \'' + task + '\' after ' + (new Date().getTime() - start.getTime()) + 'ms');
  }, function (err) {
    return console.error(err.stack);
  });
}

//
// Clean up the output directory
// -----------------------------------------------------------------------------
tasks.set('clean', function () {
  return del(['public/dist/*', '!public/dist/.git'], { dot: true });
});

//
// Copy ./index.html into the /public folder
// -----------------------------------------------------------------------------
tasks.set('html', function () {
  var webpackConfig = require('./webpack.config');
  var assets = JSON.parse(fs.readFileSync('./public/dist/assets.json', 'utf8'));
  var template = fs.readFileSync('./public/index.ejs', 'utf8');
  var render = ejs.compile(template, { filename: './public/index.ejs' });
  var output = render({ debug: webpackConfig.debug, bundle: assets.main.js, config: config });
  fs.writeFileSync('./public/index.html', output, 'utf8');
});

//
// Generate sitemap.xml
// -----------------------------------------------------------------------------
tasks.set('sitemap', function () {
  var urls = require('./routes.json').filter(function (x) {
    return !x.path.includes(':');
  }).map(function (x) {
    return { loc: x.path };
  });
  var template = fs.readFileSync('./public/sitemap.ejs', 'utf8');
  var render = ejs.compile(template, { filename: './public/sitemap.ejs' });
  var output = render({ config: config, urls: urls });
  fs.writeFileSync('public/sitemap.xml', output, 'utf8');
});

//
// Bundle JavaScript, CSS and image files with Webpack
// -----------------------------------------------------------------------------
tasks.set('bundle', function () {
  var webpackConfig = require('./webpack.config');
  return new Promise(function (resolve, reject) {
    webpack(webpackConfig).run(function (err, stats) {
      if (err) {
        reject(err);
      } else {
        console.log(stats.toString(webpackConfig.stats));
        resolve();
      }
    });
  });
});

//
// Build website into a distributable format
// -----------------------------------------------------------------------------
tasks.set('build', function () {
  global.DEBUG = process.argv.indexOf('--debug') >= 0 || false;
  return Promise.resolve().then(function () {
    return run('clean');
  }).then(function () {
    return run('bundle');
  }).then(function () {
    return run('html');
  }).then(function () {
    return run('sitemap');
  });
});

//
// Build and publish the website
// -----------------------------------------------------------------------------
tasks.set('publish', function () {
  var firebase = require('firebase-tools');
  return run('build').then(function () {
    return firebase.login({ nonInteractive: false });
  }).then(function () {
    return firebase.deploy({
      project: config.project,
      cwd: __dirname
    });
  }).then(function () {
    setTimeout(function () {
      return process.exit();
    });
  });
});

//
// Build website and launch it in a browser for testing (default)
// -----------------------------------------------------------------------------
tasks.set('start', function () {
  var count = 0;
  global.HMR = !(process.argv.indexOf('--no-hmr') >= 0); // Hot Module Replacement (HMR)
  return run('clean').then(function () {
    return new Promise(function (resolve) {
      var bs = require('browser-sync').create();
      var webpackConfig = require('./webpack.config');
      var compiler = webpack(webpackConfig);
      // Node.js middleware that compiles application in watch mode with HMR support
      // http://webpack.github.io/docs/webpack-dev-middleware.html
      var webpackDevMiddleware = require('webpack-dev-middleware')(compiler, {
        publicPath: webpackConfig.output.publicPath,
        stats: webpackConfig.stats
      });
      compiler.plugin('done', function (stats) {
        // Generate index.html page
        var bundle = stats.compilation.chunks.find(function (x) {
          return x.name === 'main';
        }).files[0];
        var template = fs.readFileSync('./public/index.ejs', 'utf8');
        var render = ejs.compile(template, { filename: './public/index.ejs' });
        var output = render({ debug: true, bundle: '/dist/' + bundle, config: config });
        fs.writeFileSync('./public/index.html', output, 'utf8');

        // Launch Browsersync after the initial bundling is complete
        // For more information visit https://browsersync.io/docs/options
        if (++count === 1) {
          bs.init({
            port: process.env.PORT || 3000,
            ui: { port: Number(process.env.PORT || 3000) + 1 },
            server: {
              baseDir: 'public',
              middleware: [webpackDevMiddleware, require('webpack-hot-middleware')(compiler), require('connect-history-api-fallback')()]
            }
          }, resolve);
        }
      });
    });
  });
});

// Execute the specified task or default one. E.g.: node run build
run(/^\w/.test(process.argv[2] || '') ? process.argv[2] : 'start' /* default */);