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
          "generateUUID": true,

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
        reporterOutput: "",
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib_test: {
        src: [
          'js/*.js',
          '!js/tabfunctions.js',
          '!js/protocols.js'
        ]
      }
    },
    copy: {
      dist: {
        files: [ 
          {src: 'index.dist.html', dest: 'dist/index.html'},
          {src: 'example/*', dest: 'dist/'},
          {expand:true, cwd: 'bower_components/jquery-ui/themes/ui-lightness/images/', src: '**', dest: 'dist/css/images/', flatten: true},
          {expand:true, cwd: 'bower_components/openseadragon/built-openseadragon/openseadragon/images/', src: '**', dest: 'dist/css/images/', flatten: true},
          {expand:true, cwd: 'bower_components/jquery.fancytree/dist', src: ['skin-**/*'], dest: 'dist/css/ft/'},
          {src: 'css/images/*', dest: 'dist/'},
          {src: 'templates/*', dest: 'dist/'},
          {src: 'js/<%= pkg.name %>.js', dest: 'dist/js/<%= pkg.name %>.js'},
          {src: 'js/protocols.example.js', dest: 'dist/js/protocols.js'}
//          {src: 'css/**/*.css', dest: 'dist/css/'}
        ]
      }
    },
    concat: {
      options: {
        // define a string to put between each file in the concatenated output
        //separator: ';'
      },
      js: {
        // the files to concatenate
        src: [
          'js/main.js',
          'js/jquery_patches_addons.js',
          'js/svgeditor.js',
          'js/**/*.js',
          '!js/protocols.js',
          '!js/protocols.*.js'
        ],
        // the location of the resulting JS file
        dest: 'dist/js/<%= pkg.name %>.js'
      },
      css: {
        src: [
          'css/*.css'
        ],
        dest: 'dist/css/<%= pkg.name %>.css'
      },
      dependenciesJs: {
        src: [
          'bower_components/jquery/dist/jquery.js',
          'bower_components/jquery-ui/jquery-ui.js',
          'bower_components/ui-contextmenu/jquery.ui-contextmenu.min.js',
          'bower_components/jquery.fancytree/dist/jquery.fancytree-all.js',
          'bower_components/jquery-dialogextend/build/jquery.dialogextend.js',
          'bower_components/jquery-svg/jquery.svg.min.js',
          'bower_components/jquery-svg/jquery.svgdom.min.js',
          'bower_components/jquery-xpath/jquery.xpath.min.js',
          'bower_components/openseadragon/built-openseadragon/openseadragon/openseadragon.min.js',
          'bower_components/spectrum/spectrum.js',
          'bower_components/svg-overlay/openseadragon-svg-overlay.js'
        ],
        dest: 'dist/js/dependencies.js'
      },
      dependenciesCss: {
        src: [
          'bower_components/jquery-ui/themes/ui-lightness/jquery-ui.css',
          'bower_components/jquery-ui/themes/ui-lightness/theme.css',
          'bower_components/spectrum/spectrum.css'
        ],
        dest: 'dist/css/dependencies.css'
      }
    },
    watch: {
      files: [
        '<%= jshint.lib_test.src %>',
        'index.html',
        'index.dist.html'
      ],
      tasks: ['jshint']
    },
    less: {
      development: {
        options: {
          paths: ['css']
        },
        files: {
          'css/style.css': 'css/less/style.less',
          'css/tabs.css': 'css/less/tabs.less',
          'css/xmlmarkup.css': 'css/less/xmlmarkup.less'
        }
      }
    },
/*    wiredep: {
      task: {
        src: [
          'index.dist.html'
        ],
        options: {
          // See wiredep's configuration documentation for the options
          // you may pass:

          // https://github.com/taptapship/wiredep#configuration
        }
      }
    }*/

  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  /*grunt.loadNpmTasks('grunt-wiredep');*/

  // Default task.
  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('dist', ['jshint', 'less:development', 'concat:js', 'concat:css', 'concat:dependenciesJs', 'concat:dependenciesCss', 'copy:dist']);
  grunt.registerTask('dist-watch', ['watch', 'dist']);
};