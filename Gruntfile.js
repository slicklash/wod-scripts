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
                src: [
                    'src/common/selector.ts',
                    'src/common/functions/functions.dom.ts',
                    'src/favorite_menu/*.ts'
                ],
                reference: 'src/favorite_menu/_references.ts',
                out: 'build/favorite_menu.js'
            },
            wardrobe: {
                src: ['src/common/*.ts', 'src/wardrobe/*.ts'],
                reference: 'src/wardrobe/_references.ts',
                out: 'build/wardrobe.js'
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

        concat: {
            options: {
                process: function(src, filepath) {
                    if (filepath.indexOf('header.js') > -1) {
                        return src + '\n' + '(function(window, undefined) {' + '\n';
                    }
                    return src;
                },
                footer: '})();'
            },
            favmenu: {
                src: ['src/favorite_menu/header.js', 'build/favorite_menu.js'],
                dest: 'release/favorite_menu.user.js'
            },
            wardrobe: {
                src: ['src/wardrobe/header.js', 'build/wardrobe.js'],
                dest: 'release/wardrobe.user.js'
            }
        },

        karma: {
            test1: {
                configFile: 'tests/karma.conf.js'
            }
        },

        watch: {
            wardrobe: {
                files: [ 'src/wardrobe/*.ts' ],
                tasks: ['re:wardrobe'],
                options: {
                    atBegin: false,
                    spawn: false
                }
            },
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

    grunt.registerTask('init', ['tsd']);
    grunt.registerTask('compile', ['ts']);

    grunt.registerTask('re:wardrobe', ['ts:wardrobe', 'concat:wardrobe']);
    grunt.registerTask('re:favmenu', ['ts:favmenu', 'concat:favmenu']);

    grunt.registerTask('default', ['compile']);
};
