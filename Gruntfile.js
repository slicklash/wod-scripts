module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-tsd');
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');

    var config = {

        tsd: {
            dev: {
                options: {
                    command: 'reinstall',
                    config: 'lib/tsd-dev.json'
                }
            }
        },

        ts: {
            options: {
                target: 'es5',
                sourcemap: false,
                declaration: false,
                comments: false,
            },
            favmenu: {
                src: ['src/common/*.ts', 'src/favorite_menu/*.ts'],
                reference: 'src/favorite_menu/_references.ts',
                out: 'build/favorite_menu.js'
            },
            heroes: {
                src: ['src/common/*.ts', 'src/hero_list/*.ts'],
                reference: 'src/hero_list/_references.ts',
                out: 'build/hero_list.js'
            },
            /*heroes_test: {
                src: ['tests/hero_list/*.ts'],
                reference: 'tests/_references.ts',
                out: 'build/hero_list.tests.js'
            },*/
            profile: {
                src: ['src/common/*.ts', 'src/profile_export/*.ts'],
                reference: 'src/profile_export/_references.ts',
                out: 'build/profile_export.js'
            },
            storage: {
                src: ['src/common/*.ts', 'src/storage_management/*.ts'],
                reference: 'src/storage_management/_references.ts',
                out: 'build/storage_management.js'
            },
            trade: {
                src: ['src/common/*.ts', 'src/tidy_trade/*.ts'],
                reference: 'src/tidy_trade/_references.ts',
                out: 'build/tidy_trade.js'
            },
        },

        karma: {
            test1: {
                configFile: 'tests/karma.conf.js'
            }
        },

        watch: {
            tests: {
                files: [
                    'src/**/*.ts',
                    'tests/**/*.tests.ts'
                ],
                tasks: ['ts', 'karma'],
                options: {
                    atBegin: false,
                    spawn: false
                }
            }
        }
    };

    grunt.initConfig(config);

    grunt.registerTask("init", ["tsd"]);
    grunt.registerTask("compile", ["ts"]);

    grunt.registerTask("default", ["compile"]);
};
