
module.exports = function (config) {

  var files = [
      { pattern: '../lib/*polyfills.js', included: true, watched: false },
  ].concat(config.specs);

  var specFiles = config.projectName === 'common' ? '**/!(*spec|*header).js' : '!(common)/**/!(*spec|*header).js';
  var preprocessors = {};

  preprocessors[specFiles] = ['coverage'];

  config.set({

    browsers: config.DEBUG ? ['Chrome'] : ['PhantomJS'],
    frameworks: ['jasmine'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    singleRun: !config.DEBUG,

    files: files,

    exclude: [
        '**/coverage/'
    ],

    failOnEmptyTestSuite: false,

    preprocessors: preprocessors,

    reporters: !config.DEBUG ? ['spec', 'coverage'] : ['progress'],

    coverageReporter: {
        reporters:[
            { type: 'json', subdir: '.', file: 'coverage-final.json'},
            { type: 'html', subdir: './pew'}
        ]
    },

  })

}

