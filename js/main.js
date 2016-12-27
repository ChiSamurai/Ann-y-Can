/* exported binaryImageSourceIRI,svgIRI,parsedURL,IDs,svgNode,svg */

var binaryImageSourceIRI = null;
var svgIRI = null;
var parsedURL = null;

var IDs = {
    binaryImage: null,
    svg: null,
    canvasAnnotation: null,  // the annotation which defines svg as canvas for the binary image
    annotationsResources: null
};

var svgNode;

var initOptions = {
    showDialogs :   { 
        "svg-elements": true,
        "annotations-pool": true,
        "log-console": false,
        "annotations-display": true
    },
    seadragon : {
        id: "binary-container",
        prefixUrl: "css/images/",
        visibilityRatio: 0.2,
        minZoomImageRatio: 0.4,
        maxZoomPixelRatio: Infinity,
        initialPage: 1,
        imageLoaderLimit: 10,
        showNavigator: true,
        showRotationControl: true,
//        debugMode: true,
        sequenceMode: false,
//        showReferenceStrip: true,
        tileSources: [
/*            "http://localhost:8080/exist/apps/tamboti/api/iiif/i_59729dbe-b326-5053-98e9-399177249a87/info.json",
            "http://localhost:8080/exist/apps/tamboti/iiif/i_af81ff5f-4052-5956-8a40-fcc114448b95/info.json"
*/        ]
    },
    menus:[
        {
            name: 'contextmenu-elements',
            target: '#menu-context-container',
            template : "templates/menu-context.html"
        },
        {
            name: 'main',
            target: '#menu-container',
            template : "templates/menu.html"
        }
    ]
};


// If tab shall be closed, show a dialog for saving the progress
$(document).ready(function(){ 
    var stayOnPageTimeout;
    window.onbeforeunload = function () {
        stayOnPageTimeout = setTimeout(function() {
            $("#dialog-leave-site").dialog("open");
        }, 1000);
        return "You are leaving the page";
    };
    window.onunload = function() {
        console.debug("UNLOADING");
        $("#dialog-leave-site").remove();
        clearTimeout(stayOnPageTimeout);
    };
});

$(function(){
    
    $("#main").svg();
    $.urlParam = function(name){
        var results = new RegExp('[?&amp;]' + name + '=([^&#]*)').exec(window.location.href);
        if (results===null){
           return null;
        }
        else{
           return results[1] || 0;
        }
    };


    function init(initOptions){
        parsedURL = $.ParseURLString(window.location.href);
        // $( document ).tooltip();
        // Load menu templates
        $.when(Menu.loadTemplates(initOptions.menus)).done(function () {
            // Load dialogs
            $.ajax({
                cache: false,
                url: 'templates/dialogs.html',
                dataType: 'html'
            }).done(function(data) {
                var menuOptions = {};
                console.debug("dialogs loaded");
                // initialize menu
                $('#content').append(data);
                Menu.init(menuOptions);
                Dialogs.init(initOptions.showDialogs);

//                tabFunctions.init();
                // init Seadragon viewer node
                SeadragonViewer.init(initOptions.seadragon);
                SeadragonViewer.initSVGOverlay();

                // Register "open" Event handler to update image information dialog on loading a binary
                SeadragonViewer.instance.addHandler("open", function(event){
                    var infoNode = $("<pre><code>" + Serializer.json2html(event.eventSource.source) + "</code></pre>");
                    $("#dialog-showIIIFInfo").empty().append(infoNode);
                });


                // Do the options.protocol.init for pre-processing stuff (i.e. url parsing)
                options.protocols.init();

                var iiifInfoUrl = options.protocols.getIIIFInfoURL.services[parsedURL.queryParams.openBinaryMethod].get(IDs.binaryImage);
                // init the OpenSeadragon SVG overlay plugin with jquery-SVG functionality
                // init the svg element editor

                // $.when(SVGEditor.init($("#svg-edit-overlay-item"))).then(
                //     SVGFunctions.init($(SeadragonViewer.overlay.node()).svg("get"))
                // ).then(

                $.when(SVGFunctions.init($(SeadragonViewer.overlay.node()).svg("get"))).then(
                    console.debug("SVGFunctions module initialized")
                ).then(
                    // open IIIF image according to the submitted method (defined in protocols.js)
                    SeadragonViewer.loadBinary(iiifInfoUrl)
                ).then(
                    SVGFunctions.load(IDs.svg)
                ).then(
                    // Initialize the Annotations module
                    Annotations.init()
                ).then(
                // Load the existing annotations
                    Annotations.getAnnotations(IDs.svg)
                ).then(function() {
                // Load resources into the Annotations Pool
                    if(IDs.annotationsResources){
                        IDs.annotationsResources.forEach(function(resourceId){
                            Annotations.loadTargets(resourceId, false);
                        });
                    }
                    //Initialization complete... drop event
                    $.event.trigger({
                        type: "Annycan.initComplete"
                    });
                });
            });

        }).fail(function (response, status, xhr) {
            log("Error initializing the menu: " + xhr.status + " " + xhr.statusText, "error");
        });
        
    }
    
    $(document).ready(function() {
        init(initOptions);
    });

});
