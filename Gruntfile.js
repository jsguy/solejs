module.exports = function(grunt) {

	//	Concatenation file order
	var concatFiles = ['src/_headsole.js', '../ulib/ulib.pubsub.js', '../ulib/ulib.plugin.js', '../ulib/ulib.cookie.js', 'src/_footsole.js', 'src/sole.js'];

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: {
				separator: ';'
			},
			dist: {
				//  We'd prefer to fail on missing files, but at least this will warn: https://github.com/gruntjs/grunt-contrib-concat/issues/15
				nonull: true,
				/*
				src: ['src/_headsole.js', '../ulib/ulib.pubsub.js', '../ulib/ulib.plugin.js', '../ulib/ulib.cookie.js', 'src/_footsole.js', 'src/sole.js'],
				dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js',
				dest: 'dist/<%= pkg.name %>-latest.js'
				*/
				files: {
					'dist/<%= pkg.name %>-<%= pkg.version %>.js': concatFiles,
					'dist/<%= pkg.name %>-latest.js': concatFiles
				}
			}
		},
		qunit: {
			files: ['test/**/*.htm']
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
			},
			dist: {
				files: {
					'dist/<%= pkg.name %>-<%= pkg.version %>.min.js': 'dist/<%= pkg.name %>-<%= pkg.version %>.js',
					'dist/<%= pkg.name %>-latest.min.js': 'dist/<%= pkg.name %>-latest.js'
				}
			}
		},
		jshint: {
			files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
			options: {
				ignores: ['src/_headsole.js', 'src/_footsole.js', 'test/libs/*.js'],
				// options here to override JSHint defaults
				globals: {
					jQuery: true,
					console: true,
					module: true,
					document: true
				},
				//	Ignore specific errors
				'-W015': true,	//	Indentation of }
				'-W099': true,	//	Mixed spaces and tabs
				'-W032': true	//	Unnecessary semicolon
			}
		},
		watch: {
			files: ['<%= jshint.files %>'],
			tasks: ['jshint', 'qunit']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-concat');

	grunt.registerTask('test', ['jshint', 'qunit']);
	grunt.registerTask('default', ['jshint', 'qunit', 'concat', 'uglify']);
};