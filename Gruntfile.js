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
            adventure: {
                src: [
                    'src/adventure_assistant/*.ts'
                ],
                reference: 'src/adventure_assistant/_references.ts',
                out: 'build/adventure_assistant.js'
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
            heroes: {
                src: [
                    'lib/def/greasemonkey/greasemonkey.d.ts',
                    'src/common/selector.ts',
                    'src/common/functions/functions.dom.ts',
                    'src/hero_list/*.ts'
                ],
                reference: 'src/hero_list/_references.ts',
                out: 'build/hero_list.js'
            },
            /*heroes_test: {
                src: ['tests/hero_list/*.ts'],
                reference: 'tests/_references.ts',
                out: 'build/hero_list.tests.js'
            },*/
            profile: {
                src: [
                    'src/common/prototypes/prototypes.string.ts',
                    'src/common/selector.ts',
                    'src/common/functions/functions.ajax.ts',
                    'src/common/functions/functions.dom.ts',
                    'src/common/parsing/template.parser.ts',
                    'src/profile_export/**/*.ts'
                ],
                reference: 'src/profile_export/_references.ts',
                out: 'build/profile_export.js'
            },
            storage: {
                src: [
                    'src/common/selector.ts',
                    'src/common/functions/functions.dom.ts',
                    'src/storage_management/*.ts'
                ],
                reference: 'src/storage_management/_references.ts',
                out: 'build/storage_management.js'
            },
            trade: {
                src: [
                    'src/common/selector.ts',
                    'src/common/functions/functions.dom.ts',
                    'src/tidy_trade/*.ts'
                ],
                reference: 'src/tidy_trade/_references.ts',
                out: 'build/tidy_trade.js'
            },
            wardrobe: {
                src: ['src/common/*.ts', 'src/wardrobe/*.ts'],
                reference: 'src/wardrobe/_references.ts',
                out: 'build/wardrobe.js'
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
            adventure: {
                src: ['src/adventure_assistant/header.js', 'build/adventure_assistant.js'],
                dest: 'release/adventure_assistant.user.js'
            },
            favmenu: {
                src: ['src/favorite_menu/header.js', 'build/favorite_menu.js'],
                dest: 'release/favorite_menu.user.js'
            },
            heroes: {
                src: ['src/hero_list/header.js', 'build/hero_list.js'],
                dest: 'release/hero_list.user.js'
            },
            profile: {
                src: ['src/profile_export/header.js', 'build/profile_export.js'],
                dest: 'release/profile_export.user.js'
            },
            storage: {
                src: ['src/storage_management/header.js', 'build/storage_management.js'],
                dest: 'release/storage_management.user.js'
            },
            trade: {
                src: ['src/tidy_trade/header.js', 'build/tidy_trade.js'],
                dest: 'release/tidy_trade.user.js'
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
            adventure: {
                files: [ 'src/adventure_assistant/**/*.ts' ],
                tasks: ['re:adventure'],
                options: {
                    atBegin: false,
                    spawn: false
                }
            },
            profile: {
                files: [ 'src/profile_export/**/*.ts' ],
                tasks: ['re:profile'],
                options: {
                    atBegin: false,
                    spawn: false
                }
            },
            storage: {
                files: [ 'src/storage_management/**/*.ts' ],
                tasks: ['re:storage'],
                options: {
                    atBegin: false,
                    spawn: false
                }
            },
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

    grunt.registerTask('re:adventure', ['ts:adventure', 'concat:adventure']);
    grunt.registerTask('re:favmenu', ['ts:favmenu', 'concat:favmenu']);
    grunt.registerTask('re:heroes', ['ts:heroes', 'concat:heroes']);
    grunt.registerTask('re:profile', ['ts:profile', 'concat:profile']);
    grunt.registerTask('re:storage', ['ts:storage', 'concat:storage']);
    grunt.registerTask('re:trade', ['ts:trade', 'concat:trade']);
    grunt.registerTask('re:wardrobe', ['ts:wardrobe', 'concat:wardrobe']);

    grunt.registerTask('default', ['compile']);
};
