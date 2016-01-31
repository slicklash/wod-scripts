
module.exports = function(config) {

  config.set({

    browsers: ['PhantomJS'],
    frameworks: ['jasmine'],
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    singleRun: true,
    concurrency: Infinity

    files: [
      '**/*.spec.ts'
    ],

    exclude: [
    ],

    preprocessors: {
       '**/*.ts': ['typescript']
    },

    typescriptPreprocessor: {

      options: {
        sourceMap: false,
        target: 'ES5',
      },

      transformPath: function(path) {
        return path.replace(/\.ts$/, '.js');
      }
    },

  })
}
