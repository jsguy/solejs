module.exports = function(grunt) {

	//	Concatenation file order
	var concatFiles = [
		'src/template/_head.js',
		'node_modules/ulib/src/ulib.pubsub.js',
		'node_modules/ulib/src/ulib.plugin.js',
		'node_modules/ulib/src/ulib.cookie.js',
		'src/template/_foot.js',
		'src/sole.js'];

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		//	Create the dist
		concat: {
			testbuild: {
				options: {
					separator: ';',
					//  We'd prefer to fail on missing files, but at least this will 
					//	supposedly warn: https://github.com/gruntjs/grunt-contrib-concat/issues/15
					nonull: true
				},
				files: {
					'test/build/testbuild.js': concatFiles
				}
			},
			distbuild: {
				options: {
					separator: ';'
				},
				files: {
					'dist/version/<%= pkg.name %>-<%= pkg.version %>.js': concatFiles,
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
					'dist/version/<%= pkg.name %>-<%= pkg.version %>.min.js': 'dist/version/<%= pkg.name %>-<%= pkg.version %>.js',
					'dist/<%= pkg.name %>-latest.min.js': 'dist/<%= pkg.name %>-latest.js'
				}
			}
		},
		jshint: {
			files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
			options: {
				ignores: ['src/template/_head.js', 'src/template/_foot.js', 'test/libs/*.js', 'test/build/testbuild.js'],
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
			//	Just build when watching
			tasks: ['concat:testbuild']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-concat');

	grunt.registerTask('test', ['jshint', 'qunit']);
	grunt.registerTask('testbuild', ['concat:testbuild']);
	grunt.registerTask('default', ['concat:testbuild', 'jshint', 'qunit', 'concat:distbuild', 'uglify']);
};