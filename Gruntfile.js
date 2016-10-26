/*global module:false*/
module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    // Task configuration.
    jshint: {
      options: {
        curly: true,
        debug: true,
        devel: true,
        eqeqeq: true,
        immed: true,
        latedef: false,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        browser: true,
        jquery: true,
        globals: {
          "options": true,
          "message": true,
          "log": true,
          "binaryImageSourceIRI": true,
          "svgIRI": true,
          "parsedURL": true,
          "IDs": true,
          "svgNode": true,

          "Annotations": true,
          "Dialogs": true,
          "Serializer": true,
          "SVGFunctions": true,
          "SVGEditor": true,
          "Menu": true,
          "MenuContext": true,
          "ProtocolResolver": true,
          "OpenSeadragon": true,
          "SeadragonViewer": true,
          "XMLFunctions": true,
          "XMLDisplay": true,
          "ElementsList": true
        },
        reporterOutput: ""
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib_test: {
        src: [
          'js/*.js',
          '!js/tabfunctions.js'
        ]
      }
    },
    copy: {
      dist: {
        files: [ {src: 'index.html', dest: 'dist/index.html'} ]
      }
    },
    concat: {
      options: {
        // define a string to put between each file in the concatenated output
        //separator: ';'
      },
      dist: {
        // the files to concatenate
        src: ['js/**/*.js'],
        // the location of the resulting JS file
        dest: 'dist/<%= pkg.name %>.js'
      }
    }    
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  // Default task.
  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('dist', ['jshint', 'concat']);

};
