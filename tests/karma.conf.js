module.exports = function(config) {
    config.set({

        frameworks: ['jasmine'],

        browsers: ['PhantomJS'],

        files: [
            '../build/**/*.js',
        ],

        exclude: [
            '../tests/karma.conf.js'
        ],

        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        captureTimeout: 60000,
        singleRun: true,
        autoWatch: false
    });
};
