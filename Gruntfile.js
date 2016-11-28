module.exports = function(grunt) {
    grunt.initConfig({
        uglify: {
            options: {
                mangle: true
            },
            slyckSchedule: {
                files: {
                    'dist/slyckSchedule.min.js': ['src/js/slyckSchedule.js'],
                }
            }
        },
        less: {
            development: {
                options: {
                    paths: ['src/less']
                },
                files: {
                    'dist/slyckSchedule.css': 'src/less/slyckSchedule.less'
                }
            },
            production: {
                options: {
                    paths: ['src/less'],
                },
                files: {
                    'dist/slyckSchedule.css': 'src/less/slyckSchedule.less'
                }
            }
        },
        autoprefixer: {
            options: {
                //Browsers to prefix for
                browsers: ['last 2 version', 'ie 8', 'ie 9', 'Opera 12.1']
            },
            dist: {
                files: {
                    'dist/slyckSchedule.css': 'dist/slyckSchedule.css' // destination file and source file
                }
            }
        },
        watch: {
            scripts: {
                files: ['src/js/**/*.js', 'src/less/**/*.less', 'examples/**/*.html'],
                tasks: ['less:development', 'autoprefixer', 'copy'],
                options: {
                    spawn: false,
                },
            },
        },
        cssmin: {
            compress: {
                files: {
                    'dist/slyckSchedule.min.css': ['dist/slyckSchedule.css']
                }
            }
        },
        copy: {
            main: {
                expand: true,
                cwd: 'src/js',
                src: '**',
                dest: 'dist/',
            },
        },
        bump: {
            options: {
                files: ['package.json'],
                updateConfigs: [],
                commit: false,
                createTag: true,
                tagName: 'v%VERSION%',
                tagMessage: 'Version %VERSION%',
                push: true,
                pushTo: 'origin',
                gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
                globalReplace: false,
                prereleaseName: "pre",
                metadata: '',
                regExp: false
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default', ['less:development', 'autoprefixer', 'copy', 'watch']);
    grunt.registerTask('build', ['uglify', 'less:production', 'autoprefixer', 'cssmin', 'copy']);
}