module.exports = function(grunt) {
    // Load Grunt tasks declared in the package.json file
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        // grunt-contrib-connect will serve the files of the project
        // on specified port and hostname
        connect: {
            all: {
                options: {
                    port: 9000,
                    hostname: "0.0.0.0",
                    // Prevents Grunt to close just after the task (starting the server) completes
                    // This will be removed later as `watch` will take care of that
                    //keepalive: true,
                    // Livereload needs connect to insert a cJavascript snippet
                    // in the pages it serves. This requires using a custom connect middleware
                    middleware: function(connect, options) {

                        return [

                            // Load the middleware provided by the livereload plugin
                            // that will take care of inserting the snippet
                            require('grunt-contrib-livereload/lib/utils').livereloadSnippet,

                            // Serve the project folder
                            connect.static(options.base)
                        ];
                    }
                }
            }
        },
        open: {
            all: {
                // Gets the port from the connect configuration
                path: 'http://localhost:<%= connect.all.options.port%>'
            }
        },
        // grunt-regarde monitors the files and triggers livereload
        // Surprisingly, livereload complains when you try to use grunt-contrib-watch instead of grunt-regarde 
        regarde: {
            all: {
                // This'll just watch the index.html file, you could add **/*.js or **/*.css
                // to watch Javascript and CSS files too.
                files: ['index.html', '**/*.js', '**/*.js'],
                // This configures the task that will run when the file change
                tasks: ['livereload', 'build']
            }
        },
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
    grunt.registerTask('serve', ['livereload-start', 'connect', 'open', 'regarde'])
}
