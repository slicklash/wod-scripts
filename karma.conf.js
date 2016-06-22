
module.exports = function (config) {

  // var files = [
  //       { pattern: '*|)}>#*.js', included: true, watched: false },
  //       { pattern: '*|)}>#*.js.map', included: false, watched: false },
  //       { pattern: '*|)}>#*.ts', included: false, watched: false },
  // ];

  var files = [
      { pattern: '../lib/*polyfills.js', included: true, watched: false },
      config.specFile
  ];

  // if (config.projectName !== 'common') {
  //     files.push(
  //       { pattern: '../common#<{(||)}>#!(*spec).js', included: true, watched: false }
  //     );
  // }

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

    preprocessors: {
        '**/!(*spec|*header).js': ['coverage']
    },

    reporters: !config.DEBUG ? ['spec', 'coverage'] : ['progress'],

    coverageReporter: {
        reporters:[
            { type: 'json', subdir: '.', file: 'coverage-final.json'}
        ]
    },

  })

}

