'use strict';

var path = require('path');

var basePath = '../../';

var absoluteBasePath = path.resolve(path.join(__dirname, basePath)),
    absoluteLibPath = path.resolve(path.join(__dirname, basePath, 'lib'));

module.exports = function(karma) {
  karma.set({

    basePath: basePath,

    frameworks: [
      'browserify',
      'mocha',
      'sinon-chai'
    ],

    files: [
      'test/**/*spec.js'
    ],

    preprocessors: {
      'client/**/*.js': ['electron','browserify'],
      'test/**/*spec.js': [ 'browserify' ]
    },

    client: {
      useIframe: false
    },
    reporters: [ 'spec' ],

    browsers: [ 'Electron' ],

    browserNoActivityTimeout: 30000,

    singleRun: false,
    autoWatch: true,
    browserify: {
      debug:true,
      transform: [
        ['babelify',
          { presets: [ 'es2015' ] } ]
      ],
      client: {
        src: 'client/lib/index.js',
        target: 'public/index.js'
      },
      ignoreMissing:true,
      paths: [ absoluteLibPath, absoluteBasePath ]
    }
  });
};
