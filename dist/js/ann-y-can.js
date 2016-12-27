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

/*exported message,log,generateUUID,Percent*/

//JQuery Patch (clone textarea has no value)
// Source: https://github.com/spencertipping/jquery.fix.clone

/* jshint ignore:start */  
(function (original) {
  jQuery.fn.clone = function () {
    var result           = original.apply(this, arguments),
        my_textareas     = this.find('textarea').add(this.filter('textarea')),
        result_textareas = result.find('textarea').add(result.filter('textarea')),
        my_selects       = this.find('select').add(this.filter('select')),
        result_selects   = result.find('select').add(result.filter('select'));

    for (var i = 0, l = my_textareas.length; i < l; ++i){
      $(result_textareas[i]).val($(my_textareas[i]).val());
    }
    for (var i = 0, l = my_selects.length; i < l; ++i) {
      for (var j = 0, m = my_selects[i].options.length; j < m; ++j) {
        if (my_selects[i].options[j].selected === true) {
          result_selects[i].options[j].selected = true;
        }
      }
    }
    return result;
  };
}) (jQuery.fn.clone);
/* jshint ignore:end*/ 

(function ($){
    $.arrayDistinct = function(array) {
       var result = [];
       $.each(array, function(i,v){
           if ($.inArray(v, result) === -1){
            result.push(v);
          }
       });
       return result;
    };
})(jQuery);

//JQuery addon: parseURLString
(function ($){
    $.ParseURLString = function(url){
      var protocol = url.substring(0, url.indexOf('://'));
      var rest = url.substring(url.indexOf('://') + 3);
      var hostWPort = rest.substring(0, rest.indexOf("/"));
      var host = hostWPort.substring(0, hostWPort.indexOf(":"));
      var port = hostWPort.substring(hostWPort.indexOf(":") + 1);
    
      rest = rest.substring(rest.indexOf('/') + 1);
      var urlPath = rest.substring(0, rest.indexOf('?'));
      var urlPathComponents = urlPath.split("/");
      
      rest = rest.substring(rest.indexOf('?') + 1);
      var queryParams = [];
      $(rest.split("&")).each(function(idx, data){
        var ampindex = data.indexOf("=");
        queryParams[data.slice(0,ampindex)] = (ampindex > -1?data.slice(ampindex+1):null);
      });
      return {
        protocol: protocol,
        hostWPort: hostWPort,
        host: host,
        port: port || "80",
        urlPath : urlPath,
        urlPathComponents: urlPathComponents,
        queryParams: queryParams
      };
    };
})(jQuery);

function message(messageText, type, autoHideAfterMs) {
      var $messageNode = $('<div class="message ' + type + '">' + messageText + '</div>');
      if(autoHideAfterMs){
        setTimeout(function(){
          $messageNode.fadeOut("slow", function(){
            $(this).remove();
          });
        }, autoHideAfterMs);
      }
      return $messageNode;
}

function log(message, type) {
    $('#log-console').prepend('<div class="' + type + '">' + message + '</div>');
}

function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c === 'x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

var Percent = {
    mult: function(a, b) {
        var percA = false;
        var percB = false;
        var floatA = 0;
        var floatB = 0;
        var multA = a;
        var multB = b;
        if(!$.isNumeric(a) && a.substr((a.length - 1), 1) === "%"){
            floatA = parseFloat(a.substr(0, a.length - 1), 10);
            percA = true;
        }else{
            floatA = parseFloat(a, 10);
        }

        if(!$.isNumeric(b) && b.substr((b.length - 1), 1) === "%"){
            floatB = parseFloat(b.substr(0, b.length - 1), 10);
            percB = true;
        }else{
            floatB = parseFloat(b, 10);
        }

        if(percA) {
          multA = floatA/100;
        }
        if(percB){
          multB = floatB/100;
        }
        console.debug(multA * multB);
        console.debug("multA:" + multA + " multB:" + multB);
        console.debug("floatA:" + floatA + " percA:" + percA);
        console.debug("floatB:" + floatB + " percB:" + percB);
        return multA * multB;
    }
};


var SVGEditor = {
    // colorpicker: {
    //     palette:[[]]
    // },
    elementListContainerId: null,
    elementColorpicker: null,
    defaultAlpha: 0.2,
    strokeWidth: 1,
    boxSize: 10,
    container: null,
    // svgNode: null, 
    // svgContainer: $(SeadragonViewer.overlay.node()).children("svg").first(),

    _validModes: ["rect", "path"],
    mode: {
        main: null, //rect, path etc
        sub: null // draw, edit
    },
    _grabbed: false,
    
    init: function(container) {
        var df = $.Deferred();
        var _self = this;
        this.container = container;
        // _self.svgNode = $('#svg-edit-overlay').svg();
        $(document).on("SVGEditor.colorpicker.addColor", function(data) {
            _self.colorpickerAddColor(data.color);
        });

        $(document).on("SVGEditor.dragStart", function() {
            // console.debug("**** dragStart");
            _self._grabbed = true;
        });
        
        $(document).on("mousemove", function(event) {
            if(_self._grabbed){
                // console.debug("**** DRAG");
                $.event.trigger({
                    type: "SVGEditor.drag",
                    event: event
                });
            }
        });

        $(document).on("mouseup", function(event) {
                // console.debug("**** mouseup");
            if(_self._grabbed){
                // console.debug("**** dragRelease");
                _self._grabbed = false;
                $.event.trigger({
                    type: "SVGEditor.dragRelease",
                    event: event
                });
            }
        });


        // register escape key
        $(document).on('keyup',function(event) {
            var keycode = ((typeof event.keyCode !== 'undefined' && event.keyCode) ? event.keyCode : event.which);
            switch(keycode) {
                case 27:
                    $.event.trigger({
                        type: "SVGEditor.escape",
                        event: event
                    });
                    
                    _self._grabbed = false;
                    _self.stopAction();
                    
                    break;
            }
        });

        this.elementColorpicker = $("#colorpicker").spectrum({
                color: "#ff0000",
                //  disabled: true,
                showSelectionPalette: false,
                palette:[[]],
                preferredFormat: "rgb",
                showPalette: true
        });


        // init the editor components
        $.when(_self.Rect._init(), _self.Path._init() ).then(function() {
            return df.resolve();
        });

        return df.promise();
    },

    _setMode: function(mainMode, subMode){
        this.stopAction();
        this.mode.main = mainMode;
        this.mode.sub = subMode;
    },
    
    startAction: function (mainMode, subMode, parameters) {
        this.stopAction();
        console.debug("Try to enter mode: " + mainMode + "/" + subMode);
        switch(mainMode){
            case "rect":
                switch(subMode){
                    case "draw":
                        this._setMode(mainMode, subMode);
                        this.elementListContainerId = ElementsList.fancytree.getActiveNode().key;
                        this.Rect.draw();
                        return true;
                    case "edit":
                        this._setMode(mainMode, subMode);
                        this.Rect.edit(parameters.id);
                        return true;
                }
                break;
            case "path":
                switch(subMode){
                    case "draw":
                        this._setMode(mainMode, subMode);
                        this.elementListContainerId = ElementsList.fancytree.getActiveNode().key;
                        this.Path.draw();
                        return true;
                    case "edit":
                        this._setMode(mainMode, subMode);
                        this.Path.edit(parameters.id);
                        // this.Rect.edit(parameters.rectId);
                        return true;
                }
                break;
            default:
                console.debug("mode not implemented");
        }
    },
    
    stopAction: function (mainMode, subMode) {
        // $.event.trigger({
        //     type: "SVGEditor.dragRelease",
        // });
        mainMode = mainMode?mainMode:this.mode.main;
        subMode = subMode?subMode:this.mode.sub;
        // console.debug("Stop Mode:" + mainMode + "/" + subMode);
        switch(mainMode){
            case "rect":
                switch(subMode){
                    case "draw":
                        $("#binary-container").css("cursor", "");
                        $(document).off("Seadragon.mouseClick");
                        this.Rect.stopEditing();
                        break;
                    case "edit":
                        this.Rect.stopEditing();
                        break;
                }
                break;
            case "path":
                switch(subMode){
                    case "draw":
                        $("#binary-container").css("cursor", "");
                        this.Path.stopDrawing();
                        // $(document).off("Seadragon.mouseClick");
                        break;
                    case "edit":
                        this.Path.stopEditing();
                        break;
            }
                break;
            // case "path":
        }
            
    },

    colorpickerToggle: function(toggle, color){
        var param = (toggle?"enable":"disable");
        this.elementColorpicker.spectrum(param);
        // Set the color if submitted
        if (color){
            this.elementColorpicker.spectrum("set", color);
        }
    },
    
    /**
     * Sets the colorpicker's predefined palette for 
     * @param {Object} palette - an object with color definitons like
     *     [
     *        ['black', 'white', 'blanchedalmond'],
     *        ['rgb(255, 128, 0);', 'hsv 100 70 50', 'lightyellow']
     *     ]
    */
    colorpickerSetPalette: function(palette) {
        this.elementColorpicker.spectrum("option" , "palette", palette);
    },
    
    /**
     * Check if color is already in the colorpicker's palette
     * @param {string} color - color in css notation
    */    
    
    colorpickerColorInPalette: function (color) {
        var exists = false;
        $.each($('#colorpicker').spectrum("option" , "palette"), function(index, data){
            if($.inArray(color, data) > -1) {
                exists = true;
            }
        });
        return exists;
    },
    
    colorpickerAddColor: function (color, arrayIndex) {
        arrayIndex = arrayIndex | 0;
        // Only add color to palette if not already in there
        if(!this.colorpickerColorInPalette(color)){
            $('#colorpicker').spectrum("option", "palette")[arrayIndex].push(color);
            // Add it as well to the contextmenu colorpickers
            MenuContext.colorpicker.options.palette[arrayIndex].push(color);
            // $.each($("#contextmenu-container").find("input.colorpicker"), function() {
            //     $(this).spectrum("option" , "palette")[arrayIndex].push(color);
            // });
        }
    },
    getFillColor: function(elementId) {
        return $("#" + elementId).css("fill");
    },

    setFillColor: function(elementId, tinycolor) {
        if(tinycolor !== null){
            console.debug(tinycolor);
            var colorString = tinycolor.toString();
            this.colorpickerAddColor(colorString);
            $("#" + elementId).css("fill", tinycolor.setAlpha(SVGEditor.defaultAlpha).toString());
        } else {
            $("#" + elementId).css("fill", "");
        }
    },
    
    mousePosToImageCoords: function(mousePos){
        var clientRect = SVGEditor.container[0].getClientRects()[0];
        // var clientRect = SeadragonViewer.overlay.node().getClientRects()[0];
        var viewportPoint = {
            x: mousePos.x - clientRect.left,
            y: mousePos.y - clientRect.top
        };
        var imagePoint = SeadragonViewer.instance.viewport.windowToImageCoordinates(new OpenSeadragon.Point((viewportPoint.x + SVGEditor.container[0].offsetLeft), (viewportPoint.y + SVGEditor.container[0].offsetTop)));
        return imagePoint;
    }
};

var Annotations = {
    Callbacks: {},
    _timer: null,
    dropTargets: null,
    configs: {},
    options:{
        search: {
            maxResults: 20,
            minChars: 3,
            searchTimeout: 700
        },
        configService: options.protocols.loadConfigDefinitions.default,
        annoSaveService: options.protocols.saveAnnotation.default,
        annoGetService: options.protocols.getAnnotations.default,
        getTargetsService: options.protocols.getTargets.default,
        searchResourcesService: options.protocols.searchResources.default,
        selectors: {
            "config-dropdown": "#annotation-config",
            "anno-dropdown": "#annotation-select",
            "anno-existing": "#annotations-display",
            "anno-element-containers": ".annotation-element-container",
            "target-tooltip": "#annotation-target-tooltip",
            "target-resource": "#annotation-target-resource",
            "target-div": "#annotation-targets"
        }
    },
    _newAnnoContainerId: function() {
        var max = 0;
        $(this.options.selectors["anno-element-containers"]).find("[data-annocontainerid]").each(function() {
            max = Math.max($(this).attr("data-annocontainerid"), max);
        });
        return max + 1;
    },

    _eventListener_toggle: {
        "mouseenter.displayDetails": function(){
            if(!$(this).hasClass("pinned")){
                $(this).find(".target-detail, .target-footer").show("fast");
            }
        },
        "mouseleave.displayDetails": function(){
            if(!$(this).hasClass("pinned")){
                $(this).find(".target-detail, .target-footer").hide("fast");
            }
        }
    },
        
    init: function (initOptions) {
        var _self = this;
        // console.debug("init started: Annotations");
        var df = new $.Deferred();
        if (typeof(initOptions) !== "undefined"){
            $.each(initOptions, function(idx, data) {
                Annotations.options[idx] = data;
            });
        }
        // register configuration-change-listener
        // console.debug($(Annotations.options.selectors["config-dropdown"]));
        // $(Annotations.options.selectors["config-dropdown"]).change(function(data) {
        //     Annotations.updateAnnotations($(this).find("option:selected").attr("value"));
        // });

        // Register listener for SVG Element Selection
        $(document).on("SVGFunctions.selectNode", function (data) {
            var selectedNode = $(data.eventData.node[0]);
            var svgElementId = selectedNode.attr("id");
            $(Annotations.options.selectors["anno-element-containers"] + "[anno-element='" + svgElementId + "']").addClass("annotation-element-container-selected");

            // if (typeof data !== "undefined") Annotations.showTargetsForSelection(data.eventData.node);
        });
        //... and deselection
        $(document).on("SVGFunctions.deselectNode", function (data) {
            // Annotations.hideAllTargets();
            var selectedNode = $(data.eventData.node[0]);
            var svgElementId = selectedNode.attr("id");
            $(Annotations.options.selectors["anno-element-containers"] + "[anno-element='" + svgElementId + "']").removeClass("annotation-element-container-selected");
            // Annotations.hideAllTargets();
            // selectedNode.removeClass("annotation-element-container-selected");
        });

        $("#annotation-load-resource-container").append("<div id='searchResultsContainer'><ul id='searchResults'></ul></div>");
        $("#searchResultsContainer").addClass("ui-corner-all ui-widget ui-widget-content");
        $("#searchResultsContainer").hide();
        
        $("#searchResults").on("mouseup", function (event) {
            var clickedItem = $(event.originalEvent.target).closest("li.searchResultItem");
            var value = clickedItem.attr("value");
            $(Annotations.options.selectors["target-resource"]).val(value);
            $('#annotation-target-open').trigger("mouseup");

            $("#searchResultsContainer").hide();
            $("#searchResults").hide();
        });
        $("#resource-search >> input[name='searchString']").on("paste keyup", function(event) {
            if (event.keyCode === 27){ //ESC
                $("#searchResultsContainer").hide();
                $("#searchResults").hide();
            } else {
                var input = $(this);
                var searchString = $(this).val();
                if (searchString.length >= Annotations.options.search.minChars){
                    clearTimeout(Annotations._timer);
                    Annotations._timer = setTimeout(function(){
                        $("#resource-search .hits-display").html('<img src="css/images/ajax-loader.gif" style="width:16px"/>');
                        console.debug(_self.options.searchResourcesService);
                        $.when(options.protocols.searchResources.services[_self.options.searchResourcesService].search(searchString)).then(function(searchResult) {
                            console.debug(searchResult);
                            $("#searchResults").empty();
                            $("#searchResultsContainer").show();
                            $("#searchResultsContainer").scrollTop(0);
                            $("#searchResults").attr("hits", searchResult.hits);
                            $("#resource-search .hits-display").html("(found " + searchResult.hits + ")");
                            $.each(searchResult.data, function () {
                                $("#searchResults").append("<li class='searchResultItem' value='" + this.value + "'>" +  this.label + "</li>");
                            });
                        });
                        $("#searchResults").show();
                    }, Annotations.options.search.searchTimeout);
                        
                        input.focus();
                }else{
                    clearTimeout(Annotations._timer);
                }
            }
        });

        // If more than the displayed hits exist, automatically load the next ones
        $("#searchResultsContainer").scroll(function(){
            if ($(this).innerHeight() === $(this).prop('scrollHeight') - $(this).scrollTop()){
                var searchString = $("#annotation-load-resource-container >> input[name='searchString']").val();
                var actualAmount = $("#searchResults > li").length;
                var hits = parseInt($("#searchResults").attr("hits"), 10);
                if(actualAmount < hits){
                    // console.debug("MORE TO COME! " + (actualAmount + 1) + " to " + (actualAmount + 1 + Annotations.options.search.maxResults) + " of " + hits);
                $.when(options.protocols.searchResources.services[_self.searchResourcesService].search(searchString, (actualAmount + 1), Annotations.options.search.maxResults)).then(function(searchResult) {
                        $.each(searchResult.data, function () {
                            $("#searchResults").append("<li class='searchResultItem' value='" + this.value + "'>" +  this.label + "</li>");
                        });
                    });
                }
                
            }
        });
        
        $(this.options.selectors["anno-existing"] + "," + this.options.selectors["target-div"]).on("click",function (event) {
            // console.debug(event.target);
            if($(event.target).hasClass("anno-pin")){
                if($(event.target).hasClass("ui-icon-pin-w")){
                    $(event.target).removeClass("ui-icon-pin-w").addClass("ui-icon-pin-s");
                    $(event.target).closest(".target-container").addClass("pinned");
                }else{
                    $(event.target).removeClass("ui-icon-pin-s").addClass("ui-icon-pin-w");
                    $(event.target).closest(".target-container").removeClass("pinned");
                }
            }
        });

        // load available configs
        options.protocols.loadConfigDefinitions.services[Annotations.options.configService].load().then(function(data){
            // add configs to dropdown
            $.each(data, function(){
                Annotations.configs[this.id] = this;
                $(Annotations.options.selectors['config-dropdown']).append('<option value="' + this.id + '">' + this.label + '</option>');
            });
            console.debug("configs loaded");
            return df.resolve();
            // trigger a selection change
            // $(Annotations.options.selectors["config-dropdown"]).trigger("change");
        });
    return df.promise();
    },
    
    loadTargets: function(resourceIDs, minimized) {
        var _self = this;
        options.protocols.getTargets.services[this.options.getTargetsService].get(resourceIDs).then(function(data) {
            var $targetData = $(data);
            var text = "";
            $targetData.children("div.resource").each(function(idx, resourceTargetData) {
                var $resourceTargetData = $(resourceTargetData);
                var resourceTargetId = $resourceTargetData.children("div.id").html();

                var resourceLabel = $resourceTargetData.children("div.label").html(); 
                var targetContainer = $(Annotations.options.selectors["target-div"]);
                var configId = $(Annotations.options.selectors["config-dropdown"]).find("option:selected").val();

                //"Reload" if resource is already loaded (means: delete the old container first)
                var $existingContainer = $(_self.options.selectors["target-div"]).children("div.resourceTargetContainer[data-resourceid='" + resourceTargetId + "']");
                if ($existingContainer.length !== 0){
                    $existingContainer.remove();
                }
                
                // Add RESOURCE CONTAINER
                var resourceTargetContainer = $('<div class="resourceTargetContainer"/>')
                    .attr("data-resourceId", resourceTargetId)
                    .attr("data-serviceId", _self.options.getTargetsService)
                    .attr("data-configId", configId);
                targetContainer.prepend(resourceTargetContainer);
                var targetContainerLabel = $('<div class="resourceTargetHeader"/>')
                    .html(resourceLabel);
                var toggleButton = $('<span class="ui-icon ui-icon-carat-2-n-s button-inline" />');
                targetContainerLabel.append(toggleButton);
                // register toggle button handler
                toggleButton.on("mouseup", function () {
                    $(this).closest("div.resourceTargetContainer").find("div.resourceTargets").toggle("slow");
                });

                resourceTargetContainer.append(targetContainerLabel);
                var resourceTargets = $('<div class="resourceTargets"/>');
                if (minimized) {
                    resourceTargets.hide();  
                }
                resourceTargetContainer.append(resourceTargets);
                
                // Add container for TARGET (ANNO) TYPES
                $resourceTargetData.find("div.targets > div.target:has(div.targetBlocks > div.targetBlock)").each(function() {
                    var annoTypeId = $(this).children("div.id").html();
                    var targetTypeLabel = $(this).children("div.label").html();
                    // Create a container for each Target Type
                    var resourceTargetTypeContainer = $('<div class="resourceTargetTypeContainer" data-annoTypeId="' + annoTypeId + '"/>');
                    var resourceTargetTypeHeader = $('<div/>').addClass('resourceTargetTypeHeader');
                    if(targetTypeLabel !== ""){
                        resourceTargetTypeHeader.html(targetTypeLabel);  
                    }
                    var toggleButton = $('<span class="ui-icon ui-icon-carat-2-n-s button-inline" />');
                    resourceTargetTypeHeader.append(toggleButton);
                    // console.debug(toggleButton);
                    toggleButton.on("mouseup", function () {
                        $(this).closest(".resourceTargetTypeContainer").find("div.target-container").toggle("slow");
                    });
                    resourceTargetTypeContainer.append(resourceTargetTypeHeader);

                    resourceTargets.append(resourceTargetTypeContainer);
                    //Put each target into the container
                    $(this).find("div.targetBlocks > div.targetBlock").each(function() {
                        Annotations.addTarget(resourceTargetTypeContainer, $(this));
                    });
                });
                // Drop a message, if resource was reloaded
                if ($existingContainer.length !== 0){
                    text = "resource " +resourceTargetId + " reloaded";
                    $('#annotation-targets').append(message(text, "notice", 3000));
                }
            });
            // log("loading targets for context <i>'" + annotation.label + "'</i> result: " + textStatus);
            log(text);
        });
    },

    updateAnnotations: function (configId) {
        // clear the anno-type dropdown
        $(Annotations.options.selectors["anno-dropdown"]).empty();
        // populate dropdown
        $.each(this.configs[configId].annotations, function(idx, data) {
            $(Annotations.options.selectors["anno-dropdown"]).append('<option value="' + idx + '">' + data.label + '</option>');
        });
        // update the tooltip
        $(Annotations.options.selectors["target-tooltip"]).attr("title", this.configs[configId].tooltip);
    },

    _makeTargetBlock: function(targetData) {
        var blockHtml = $('<div class="target-container ui-corner-all" />');
        blockHtml.attr("data-resourceId", targetData.parents("div.resourceTargets").find("div.id").html());
        blockHtml.attr("data-validDrop", targetData.parents("div.target").children("div.validDrop").html());
        blockHtml.attr("data-targetTypeId", targetData.parents("div.target").find("div.id").html());
        blockHtml.attr("data-annoId", targetData.attr("data-annoId"));
        // console.debug(targetData);
        blockHtml.attr("data-configId", targetData.parents("div.target").children("div.configId").html());
        // console.debug(targetData.parents("div.target").children("div.configId").html());
        blockHtml.attr("data-resourceSelector", targetData.find("div.resourceSelector").html());
        var labelData = $("<span/>").addClass("label-data").append(targetData.find("div.label").clone());
        var labelDiv = $("<div>").append('<span class="ui-icon ui-icon-pin-w anno-pin action-button-left" />');
        labelDiv.addClass("target-label");
        labelDiv.append(labelData);
        blockHtml.append(labelDiv);
        blockHtml.append(targetData.find("div.short").clone().addClass("target-short").css("border-bottom", "1px solid black"));
        blockHtml.append(targetData.find("div.detail").clone().addClass("target-detail"));
        blockHtml.append(targetData.find("div.footer").clone().addClass("target-footer"));
        return blockHtml;
    },
    
    addTarget: function (targetContainer, targetData) {
        // console.debug(targetContainer);
        var annotypeId = targetContainer.attr("data-annotypeId");
        var configId = targetContainer.closest("div.resourceTargetContainer").attr("data-configId");
        var blockHtml = this._makeTargetBlock(targetData);
        // add selection information to block
        blockHtml.attr("data-configId", configId);
        blockHtml.attr("data-annotypeid", annotypeId);
        targetContainer.append(blockHtml);
        
        blockHtml.find(".target-detail,.target-footer").hide();
        blockHtml.on(this._eventListener_toggle);

        //Make it draggable 
        blockHtml.draggable({
            revert: true,
            // scope: "targets",
            zIndex: 200,
            appendTo: "body",
            cursor: "grabbing", 
            cursorAt: { top: -20, left: -20 },
            helper: function(){
                var clone = $(this).clone().css("pointer-events","none").remove(".target-detail");
                return clone;
            },
            start: function(event, ui){
                Annotations.dropTargets = Annotations.getValidNodes(this);
                $(this).draggable("option", "revert", true);
                // console.debug(Annotations.dropTargets);

                $.each(Annotations.dropTargets, function (idx, data) {
                    var editorNodes = SVGFunctions.getElementNodesByNode($(data));
                    $(editorNodes.ftElement.span).droppable(Annotations._dropConfig);

                    // Only bind mouseevent on SVG Editor if node is "displayable"
                    if ($(this).is("rect, polyline, path")){ 
                        editorNodes.SVGElement.droppable(Annotations._dropConfig);
                        editorNodes.SVGElement.on("mouseenter.anno", function(){
                            $(SeadragonViewer.overlay.node()).find("*").trigger("mouseleave.anno");
                            $(this).removeClass("drop-valid").addClass("drop-hover");
                            $(this).on("mouseup.anno", function() {
                                $(this).removeClass("drop-hover");
                                event.type = "drop";
                                event.target = this;
                                $(this).droppable("option", "drop")(event, ui);
                            });
                        });
                        editorNodes.SVGElement.on("mouseleave.anno", function(){ 
                            $(this).off("mouseup.anno");
                            $(this).removeClass("drop-hover").addClass("drop-valid");
                        });
                    }
                    // console.debug($(this));
                    
                });
            },
            stop: function(){
                var ft_droppables = $(ElementsList.fancytree.rootNode.ul).find(".ui-droppable");
                ft_droppables.droppable("destroy");
                var svgdroppables = $(SVGFunctions.svgContainer.root()).find(".ui-droppable");
                svgdroppables.droppable("destroy");
                svgdroppables.off("mouseenter.anno mouseleave.anno");
                svgdroppables.removeClass("drop-valid");
            },
        });
    },

    nodeInNodelist: function(node, nodelist){
        return ($(nodelist).find(node).addBack(node).length > 0)?true:false;
    },

    hideAllTargets: function() {
        $(Annotations.options.selectors["target-div"]).hide(".target-container");
    },
    showTargetsForSelection: function(node){
        // hide all targets
        this.hideAllTargets();
        var validNodes = this.getValidNodes();

        var configId = $(Annotations.options.selectors["config-dropdown"]).find("option:selected").val();
        var annotationTypeIdx = $(Annotations.options.selectors["anno-dropdown"]).find("option:selected").val();
        if(Annotations.nodeInNodelist(node, validNodes)){
            $(Annotations.options.selectors["target-div"]).show(".target-container[data-configId='" + configId+ "'][data-annoIdx='" + annotationTypeIdx + "']");
        }
    },
    
    getValidNodes: function(targetBlock) {
        var selector = $(targetBlock).attr("data-validDrop");
        var validNodes = $(SeadragonViewer.overlay.node()).xpath(selector, function (prefix) {
            if(prefix === "svg"){
                return "http://www.w3.org/2000/svg";
            }
        });
        return validNodes;
    },
    _dropConfig: {
        accept: ".target-container",
        hoverClass: "drop-hover",
        tolerance: "pointer",
        activate: function () {
            $(this).addClass("drop-valid");
        },
        deactivate: function () {
            $(this).removeClass("drop-valid");
        },
        drop: function(event, ui) {
            $(ui.helper.context).draggable("option", "revert", false);
            var nodes = SVGFunctions.getElementNodesByNode($(event.target));
            Annotations.newAnnotation(nodes.SVGElement, ui.helper);
            return true;
        },
    },
    // addOverlayAnnotation: function(svgnode, annotation) {
    //     // count the annotations already attached to the svg element
    //     var annoVPCoords = svgnode.context.getBoundingClientRect();
        
    //     var anchor = SeadragonViewer.instance.viewport.imageToViewportCoordinates(new OpenSeadragon.Point(SeadragonViewer.instance.source.width + 50, SVGFunctions.svgBBoxToImagePixels(annoVPCoords).y));
        
    //     var annotationHTML = annotation.clone();
    //     annotationHTML.addClass("annotation-inline");
    //     annotationHTML.attr("svg-element-id", $(svgnode[0]).attr("id"));
    //     annotationHTML.find(".target-detail, .target-footer").hide();
    //     // console.debug(svgContainerVPCoords);
    //     annotationHTML.on("mouseenter", function(){
    //         $(svgnode[0]).addClass("drop-hover");
    //         $(this).css("z-index", parseInt($(this).css("z-index"), 10) + 1); 
    //         $(this).find(".target-detail, .target-footer").show();
    //     });
    //     annotationHTML.on("mouseleave", function(){
    //         $(svgnode[0]).removeClass("drop-hover");
    //         $(this).css("z-index", parseInt($(this).css("z-index"), 10) - 1);
    //         $(this).find(".target-detail, .target-footer").hide();
    //     });
    //     annotationHTML.on("mousedown", function (event) {
    //         console.debug("mousedown");
    //         SeadragonViewer.allowDrag = false;
    //         $(document).mouseup(function (event) {
    //             console.debug("mouseup");
    //             SeadragonViewer.allowDrag = true;
    //         });
    //     });

    //     annotationHTML.draggable({
    //         scope: "inlineAnnotations",
    //         start: function (event, ui) {
    //                 // SeadragonViewer.instance.setMouseNavEnabled(false);
    //                 console.debug("dragstart");
    //                 // console.debug(SeadragonViewer.instance.mouseNavEnabled);
    //             },
    //         stop: function (event, ui) {
    //                 // SeadragonViewer.instance.setMouseNavEnabled(true);
    //                 // console.debug(SeadragonViewer.instance.mouseNavEnabled);
    //                 console.debug("dragstop");
    //             },
    //         });
    //     let anno = SeadragonViewer.instance.addOverlay(
    //         annotationHTML[0],
    //         anchor,
    //         'TOP_LEFT');
    //     // $p.find(".target-label");
        
    //     // console.debug(annotationHTML);
    //     if(!(this._anchorPositionValid(annotationHTML[0], 20))){
    //         console.debug(annotationHTML[0]);
    //         annotationHTML.css("left", parseInt(annotationHTML.css("left"), 10) + 20);
    //         annotationHTML.css("top", parseInt(annotationHTML.css("top"), 10) + 20);
    //     }
            
    // },

    // // Checks the anchor position to prevent complete overlaying of two boxes
    // // anchorPos: OpenSeadragon Point
    // // toleance: the tolerance in pixels
    // // returns true if anchorPos is not within topleft point of existing annotation boxes
    // _anchorPositionValid: function(annoNode, tolerance) {
    //     console.debug("---------------------------------");
    //     var position = SVGFunctions.svgBBoxToImagePixels(annoNode.getBoundingClientRect());
    //     // console.debug(position);
    //     var result = true;
    //     $.each($(".annotation-inline"), function(idx, data) {
    //         if(this != annoNode[0]) {
    //             var bbox = this.getBoundingClientRect();
    //             var topLeft = SVGFunctions.svgBBoxToImagePixels(bbox);
    //             // console.debug(topLeft);
    //             // console.debug(position.x - topLeft.x);
    //             // console.debug(position.y - topLeft.y);
    //             // console.debug(Math.abs(position.x - topLeft.x) < tolerance);
    //             // console.debug(Math.abs(position.y - topLeft.y) < tolerance);
    //             if ((Math.abs(position.x - topLeft.x) < tolerance) && (Math.abs(position.y - topLeft.y) < tolerance)){
    //                 result = false;
    //                 return;
    //             }     
    //         }            
    //     });
    //     return result;
    // },

    newAnnotation: function(svgnode, annotation) {
        var container = this.addAnnotation(svgnode, annotation);
        // console.debug(container);
        Annotations.setUpdated(container);
    },
    getAnnotations: function(svgUUID) {
        console.debug("getAnnotations");
        if(svgUUID){
            var _self = this;
            options.protocols.getAnnotations.services[this.options.annoGetService].get(svgUUID).then(function(data) {
//                console.debug($(data));
                // first get the unique IDs and load it (minimized) into the target pool
                var ids =  [];
                $(data).find("div.resource > div.id").each(function() {
                    ids.push(this.textContent);
                });
                $.arrayDistinct(ids);
                ids.forEach(function(id){
                    Annotations.loadTargets(id, true);
                });
    
                // iterate over each resource in the response and insert the annotations
                $(data).children("div.resource").each(function() {
                    // var resourceId = $(this).children("div.id").html();
                    $(this).find("div.targets > div.target > div.targetBlocks > div.targetBlock").each(function() {
                        var svgSelector = $(this).attr("data-targetSelector");
                        var targetHtml = _self._makeTargetBlock($(this));
                        var SVGElement = SVGFunctions.applySelector(svgSelector);
                        _self.addAnnotation(SVGElement, targetHtml);
                        
                    });
                });
                
                // console.debug($(data).children("div.annotations").children("div"));
                // $(data).children("div.annotations").children("div").each(function() {
                //     var data = $(this);
                //     console.debug(data);
                //     var svgSelector = data.attr("data-svgXpath");
                //     console.debug(data.firstChild);
                //     var html = self._makeTargetBlock(data);
                //     var SVGElement = SVGFunctions.applySelector(svgSelector);
                //     // get the SVG Node
                //     // var svgNode = SVGFunctions.applySelector(data.svgSelector);
                //     self.addAnnotation(SVGElement, html);
                    
                // });
                // console.debug(textStatus);
            });
        } else {
            return false;
        }
        // SVGFunctions.applySelector("/svg:svg[1]/svg:rect[1]")
    },

    addAnnotation: function(svgnode, annotation) {
        var _self = this;
        var annoContainerId = this._newAnnoContainerId();
        var svgElementId = $(svgnode[0]).attr("id");
        var nodes = SVGFunctions.getElementNodesByNode($(svgnode[0]));

/*        console.debug("addAnnotation");
        console.debug(annotation);
*/
        var annotationHTML = annotation.clone();
        // console.debug(annotationHTML);
        annotationHTML.off();
        annotationHTML.removeAttr("style");
        annotationHTML.attr("data-annocontainerid", annoContainerId);
        annotationHTML.attr("svg-document-id", $($(SeadragonViewer.overlay.node()).children("svg")[0]).attr("id"));
        annotationHTML.attr("svg-element-id", svgElementId);
        annotationHTML.attr('svg-element-xpath', '//*[@id=' + svgElementId + ']');

        // delete Button
        var deleteButton = $('<span class="ui-icon ui-icon-trash anno-delete action-button-right" />');
        deleteButton.on("mouseup", function() {
            if(confirm("delete annotation?")) {
                Annotations.deleteAnnotation($(this).closest(".target-container"));
            }
        });
        annotationHTML.find(".target-label").prepend(deleteButton);
        
        annotationHTML.find(".target-detail, .target-footer").hide();
        // console.debug(svgContainerVPCoords);
        var annoElementContainer = $(this.options.selectors["anno-existing"]).find("div[anno-element='" + svgElementId + "']");

        annotationHTML.on(this._eventListener_toggle);

        if (annoElementContainer.length === 0){
            annoElementContainer = $('<div class="annotation-element-container" anno-element="' + svgElementId + '"></div>');
            annoElementContainer.on("mouseenter.existingAnnoHighlight", function(){
                // console.debug(nodes);
                $(svgnode[0]).addClass("drop-hover");
                $(nodes.ftElement.span).addClass("drop-hover");
            });
            annoElementContainer.on("mouseleave.existingAnnoHighlight", function(){
                $(svgnode[0]).removeClass("drop-hover");
                $(nodes.ftElement.span).removeClass("drop-hover");
            });

            $(Annotations.options.selectors["anno-existing"]).append(annoElementContainer);
        } else if(annoElementContainer.css("display") === "none") {
            annoElementContainer.show();
        }
        // console.debug(annotationHTML);
        annoElementContainer.append(annotationHTML);
        annotationHTML.find("textarea,input").on("change keyup paste", function() {
            Annotations.setUpdated(annotationHTML);
        });

        if(typeof(options.protocols.getTargets.services[_self.options.getTargetsService].getCallbacks) === "function"){
            /*
            var annoConfigId = annotationHTML.attr("data-configid");
            var annoTypeId = annotationHTML.attr("data-annotypeid");
            options.protocols.getTargets.services[_self.options.getTargetsService].getCallbacks(annoConfigId, annoTypeId).done(function(data){
                eval(data.firstChild.innerHTML); // jshint ignore:line
                // execute add Callback
                // console.debug(_self.Callbacks.add);
                if(typeof(_self.Callbacks.add) === "function"){
                    _self.Callbacks.add(nodes);
                }
            });*/
        }
        return annotationHTML;
    },
    deleteAnnotation: function(annoContainerElement){
        // $(Annotations.options.selectors["anno-existing"])
        var annoElementContainer = annoContainerElement.closest(".annotation-element-container");
        // ToDo: delete stored annotation and remove the ContainerElement only if successful
        annoContainerElement.hide();
        annoContainerElement.attr("data-delete", "true");
        // remove the Container if empty
        var visibleAnnotations = annoElementContainer.children(".target-container").filter(function() {
                return $(this).css('display') !== 'none';
            });
        if(visibleAnnotations.length === 0){
            annoElementContainer.hide();
        }
    },
    saveAnnotations: function() {
        var container = $('<div class="annotations"/>');
        $(Annotations.options.selectors["anno-existing"]).find(".target-container"). each(function(){ 
            container.append($(this).clone());
        });
        // console.debug(container);
        options.protocols.saveAnnotation.services[Annotations.options.annoSaveService].save(container).done(function(data){
            console.debug(data.firstChild);
        //     // log("Annotation saved successfully.", "success");
        });
    },
    setUpdated: function (annoHTMLElement) {
        if(annoHTMLElement.find(".target-label > .anno-updated").length === 0) {
            var updateNotifier = $('<span class="ui-icon ui-icon-notice anno-updated action-button-left" />');
            annoHTMLElement.find(".target-label").prepend(updateNotifier);
        }
    }
};


var Dialogs = {
    init: function(initialVisibility){
        var def = new $.Deferred();
        $( "#dialog-result" ).dialog(
            {
                autoOpen: false,
                modal: true,
                buttons: [
                    {
                        text: "Ok",
                        click: function() {
                            $( this ).dialog( "close" );
                        }
                    }
                ]
            });

        $( "#dialog-open-image" ).dialog(
            {
                autoOpen: false,
                height: 300,
                width: 400,
                modal: true,
                buttons: [
                    {
                        text: "Cancel",
                        click: function() {
                            $( this ).dialog( "close" );
                        }
                    },
                    {
                        text: "Ok",
                        click: function() {
                            if(confirm("open new?")){
/*                                console.debug($('#dialog-open-image').find("textarea[name=source-input]"));
                                console.debug($('#dialog-open-image').find("textarea[name=source-input]").val());
*/
                                var binaryImageSourceIRI = $('#dialog-open-image').find("textarea[name=source-input]").val();
                                Menu.Open.Image.selectedProt.open(binaryImageSourceIRI);
                                SVGFunctions.newSVG(binaryImageSourceIRI);
                                $( this ).dialog( "close" );
                            }
                        }
                    }
                ]
            });
        // init Open Image Dialog
        Menu.Open.Image.init();


        $( "#dialog-open-canvas" ).dialog(
            {
                autoOpen: false,
                height: 300,
                width: 400,
                modal: true,
                buttons: [
                    {
                        text: "Cancel",
                        click: function() {
                            $( this ).dialog( "close" );
                        }
                    },
                    {
                        text: "Ok",
                        click: function() {
                            var IRI = $(this).find("input[name='IRI']").val();
                            SeadragonViewer.loadSVG(IRI);
                            $( this ).dialog( "close" );
                        }
                    }
                ]
            });

        $( "#dialog-new-canvas" ).dialog(
            {
                autoOpen: false,
                resizable: false,
                modal: true,
                buttons: {
                    "Create new canvas": function() {
                        SVGFunctions.newSVG();
                        $( this ).dialog( "close" );
                    },
                    Cancel: function() {
                        $( this ).dialog( "close" );
                    }
                }
            }
        );
        $( "#dialog-newGroup").dialog(
            {
                autoOpen: false,
                height: 200,
                modal:true,
                buttons: [
                    {
                        text: "Cancel",
                            click: function () {
                                $( this ).dialog( "close" );
                            }
                    },
                    {
                        text: "Create",
                        click: function() {
                            $.event.trigger({
                                type: "newGroup",
                                title: $.trim($(this).find("input[name='title']").val())
                            });
                            $( this ).dialog( "close" );
                        }
                    }
                ]
            });
        $( "#dialog-renameElement").dialog(
            {
                autoOpen: false,
                // height: 200,
                modal:true,
                buttons: [
                    {
                        text: "Cancel",
                            click: function () {
                                $( this ).dialog( "close" );
                            }
                    },
                    {
                        text: "Rename",
                        click: function() {
                            $.event.trigger({
                                type: "renameElement",
                                title: $.trim($(this).find("input[name='title']").val())
                            });
                            $( this ).dialog( "close" );
                        }
                    }
                ]
            });
        $( "#dialog-showIIIFInfo").dialog(
            {
                autoOpen: false,
                height: 200,
                modal:false
            });
        
        // $("#annotation-target-resource").val("i_af81ff5f-4052-5956-8a40-fcc114448b95");
        $("#annotation-target-open").on("mouseup keypress", function(event) {
            if(event.type !== "keypress" || (event.which === 13 || event.which === 32)){
                var resource = $("#annotation-target-resource").val();
                Annotations.loadTargets(resource);
            }
        });
        $("#annotation-target-resource").on("keypress", function(event) {
            if(event.which === 13){
              $('#annotation-target-open').trigger("mouseup");
            }
        });

            
        // Main Dialogs
        $( "#svg" ).resizable();

        $( "#svg-elements" ).dialog(
            { 
                // height: 'auto',
                dialogClass: "main-dialogs",
                autoOpen: initialVisibility["svg-elements"],
                closeOnEscape: false,
                title: "SVG Elements",
                // position: { my: "left top", at: "left bottom", of: '#navbar-collapse-1' },
                position: { my: "left top", at: "left bottom", of: '#menu-container' },
                height: $(window).height() - $('#menu-container').height(),
                maxHeight: $(window).height() - $('#menu-container').height()
            });
        // Set corresponding menu checkbox checked?
        $('.menuitem > ul > li[data-dialog="svg-elements"] > input[type="checkbox"].displayStatus').prop("checked", initialVisibility["svg-elements"]);
        
        $( "#annotations-pool" ).dialog(
            { 
                // height: 'auto',
                dialogClass: "main-dialogs",
                closeOnEscape: false,
                autoOpen: initialVisibility["annotations-pool"],
                title: "Annotations Pool",
                // position: { my: "right top", at: "right bottom", of: '#navbar-collapse-1' },
                position: { my: "right top", at: "right bottom", of: '#menu-container' },
                height: $(window).height() - $('#menu-container').height(),
                maxHeight: $(window).height() - $('#menu-container').height()
            });
        // Set corresponding menu checkbox checked?
        $('.menuitem > ul > li[data-dialog="annotations-pool"] > input[type="checkbox"].displayStatus').prop("checked", initialVisibility["annotations-pool"]);

        $( "#annotations-display" ).dialog(
            { 
                height: 200,
                closeOnEscape: false,
                dialogClass: "main-dialogs",
                autoOpen: initialVisibility["annotations-display"],
                title: "existing annotations",
                // position: { my: "right top", at: "right bottom", of: '#navbar-collapse-1' },
                position: { my: "left botton", at: "right bottom", of: "#svg-elements"},
                width: $(window).width() - $("#annotations-pool").dialog("option", "width") - $("#svg-elements").dialog("option", "width"),
                maxHeight: $(window).height() - $('#menu-container').height()
            });
        // Set corresponding menu checkbox checked?
        $('.menuitem > ul > li[data-dialog="annotations-display"]> input[type="checkbox"].displayStatus').prop("checked", initialVisibility["annotations-display"]);

        $( "#log-console" ).dialog(
            { 
                height: 200,
                closeOnEscape: false,
                dialogClass: "main-dialogs log",
                autoOpen: initialVisibility["log-console"],
                title: "Log",
                position: { my: "left botton", at: "right bottom", of: "#svg-elements"},
                width: $(window).width() - $("#annotations-pool").dialog("option", "width") - $("#svg-elements").dialog("option", "width"),
                maxHeight: 200
            });
    
        // Set corresponding menu checkbox checked?
        $('.menuitem > ul > li[data-dialog="log-console"]> input[type="checkbox"].displayStatus').prop("checked", initialVisibility["log-console"]);

        // the save and leave dialog
        $("#dialog-leave-site").dialog({
            autoOpen:false,
            resizable: false,
            height: "auto",
            width: 400,
            modal: true,
            buttons: {
                "save and leave": function() {
                    Dialogs.saveAndLeave();
                },
                "continue working": function() {
                    $( this ).dialog( "close" );
                }
            }
        });

        $("#dialog-result").dialog({
            autoOpen:false,
            resizable: false,
            height: "auto",
            width: 400,
            modal: true,
            hide: { effect: "fadeOut", duration: 150 },
            show: { effect: "fadeIn", duration: 150 }
        });
        return def.resolve();
    },

    showResultDialog: function(type, shortMessage, detailMessage, autoCloseAfterMs) {
        $("#dialog-result").find("span.text_short").removeClass("success error notice");
        $("#dialog-result").find("span.text_short").addClass(type);
        $("#dialog-result").find("span.text_short").html(shortMessage);
        $("#dialog-result").find("span.text_detail").html(detailMessage);
        switch(type){
            case "success":
                $("#dialog-result").find("span.ui-icon").removeClass().addClass("ui-icon ui-icon-check");
                $("#dialog-result").dialog("option", "title", "success");
                break;
            case "error":
                $("#dialog-result").find("span.ui-icon").removeClass().addClass("ui-icon ui-icon-closethick");
                $("#dialog-result").dialog("option", "title", "Action failed");
                break;
/*            case "notice": */
            default:
                $("#dialog-result").find("span.ui-icon").removeClass().addClass("ui-icon ui-icon-info");
                $("#dialog-result").dialog("option", "title", "Notice");
        }
        if(autoCloseAfterMs && !isNaN(autoCloseAfterMs)){
            $("#dialog-result").dialog("option", "buttons", {});
            setTimeout(function() {
                $("#dialog-result").dialog("close");
            }, autoCloseAfterMs);
        }else{
            $("#dialog-result").dialog("option", "buttons", {
                Ok: function() {
                    $(this).dialog("close");
                }
            });

        }
        $("#dialog-result").dialog("open");
    },

    saveAndLeave: function() {
        $.when(SVGFunctions.saveSVG(), Annotations.saveAnnotations()).then(function() {
          //saving successful
          Dialogs.showResultDialog("success", "saving progress successful", "", 2000);
          
        }, function() {
          //saving failed
          Dialogs.showResultDialog("fail", "saving failed", "");
        });
        $("#dialog-leave-site").dialog( "close" );
    }
};
var ElementsList =  {
    listDiv: null,
    fancytree: null,
    _containerElements : ["g", "svg"],
    _iconPath: "css/images/",
    
    init: function() {
        var df = $.Deferred();
        var _self = this;
        _self.listDiv = $("#svg-elements-list-ft");
        _self.listDiv.fancytree({
            extensions: ["edit", "dnd"],
            debugLevel:2, 
            selectMode: 3,
            source: [],
            select: this.updateElementVisibility,
            // click: this._onActivateListItem,
            activate: this._onActivateListItem,
            checkbox:true,
            edit: {
                triggerStart: ["f2", "dblclick", "shift+click", "mac+enter"],
                save: _self._ft_edit_save
            },
            removeNode: this.deleteElement,
            dnd: {
                autoExpandMS: 400,
                focusOnClick: false,
                draggable: { // modify default jQuery draggable options
                    zIndex: 1000,
                    scroll: false,
                    containment: "parent",
                    revert: "invalid"
                },
                preventRecursiveMoves: true, // Prevent dropping nodes on own descendants
                preventVoidMoves: true, // Prevent dropping nodes 'before self', etc.
                // smartRevert: true,    // set draggable.revert = true if drop was rejected
                // revert: "invalid",

                // Events that make tree nodes draggable
                dragStart: function(){
                    return true;
                },
                dragStop: null,       // Callback(sourceNode, data)
                initHelper: null,     // Callback(sourceNode, data)
                updateHelper: null,   // Callback(sourceNode, data)
                
                // Events that make tree nodes accept draggables
                dragEnter: function(){
                    // return ["before", "after"];
                   return true;
                },
                dragExpand: null,     // Callback(targetNode, data), return false to prevent autoExpand
                dragOver: null,       // Callback(targetNode, data)
                dragLeave: null,       // Callback(targetNode, data)                
                dragDrop: _self._ft_dropped,
                // updateHelper: function(node, data) {
                //     console.debug("initHelper");
                // }
            }
        });
        
        _self.fancytree = _self.listDiv.fancytree("getTree");
        
        _self._registerItemHover();
        console.debug("elementsList initialized");
        // console.debug(_self.fancytree);
        return df.resolve();
        // return df.promise();
    },
    
    _ft_dropped: function(targetNode, data) {
        console.debug("insert " + data.otherNode.key + " " + data.hitMode + " " + targetNode.key);
        if(data.otherNode.key !== targetNode.key){
            var detached = $('#' + data.otherNode.key).detach();
            if (data.hitMode === "over"){
                $("#" + targetNode.key).append(detached);
            } else if(data.hitMode === "before"){
                detached.insertBefore($("#" + targetNode.key));
            } else {
                detached.insertAfter($("#" + targetNode.key));
            }
            data.otherNode.moveTo(targetNode, data.hitMode);
        }
    },
    
    _ft_edit_save: function(event, data){
        // console.debug(data.node);
        SVGFunctions.setElementTitle($(data.node.span), data.value);
    },
    
    setTitle:function(key, title){
        this.fancytree.getNodeByKey(key).setTitle(title);
    },
    _registerItemHover: function() {
        $("#svg-elements-list-ft").on("mouseenter", ".fancytree-node", function(event) {
            // console.debug("mouseenter");
            var hoveredNode = $.ui.fancytree.getNode(event.currentTarget);
            var id = hoveredNode.key;
            var SVGElement = $("#" + id);
            
            // console.debug(id);
            SVGElement.addClass("highlight").attr("vector-effect", "non-scaling-stroke");
            // ToDo: move this to Annotations module
            $.each($(Annotations.options.selectors["anno-element-containers"] + "[anno-element='" + id + "']"), function() {
                $(this).addClass("annotation-element-container-highlight");
            });
            
        });
        
        // leave
        
        $("#svg-elements-list-ft").on("mouseleave", ".fancytree-node", function(event) {
            var hoveredNode = $.ui.fancytree.getNode(event.currentTarget);
            var id = hoveredNode.key;
            var SVGElement = $("#" + id);
            SVGElement.removeClass("highlight");
            // Only remove non-scaling-stroke effect if element is not selected
            if(!SVGElement.hasClass("selected")) {
                SVGElement.removeAttr("vector-effect");
            }

            // ToDo: move this to Annotations module
            $.each($(Annotations.options.selectors["anno-element-containers"] + "[anno-element='" + id + "']"), function() {
                $(this).removeClass("annotation-element-container-highlight");
            });


            // console.debug("mouseenter");
            // console.debug(event);
        });
    },
    
    loadXML:function(xmlData){
        // console.debug(xmlData);
        var parsedData = this.parseFancytreeXml(xmlData);
        // console.debug(parsedData);

        this.fancytree.reload(parsedData);
    },
    
    // _toggleSVGElementDisplay: function(event, data) {
        
    // },

    updateElementVisibility: function(){
        var selectedNodes = ElementsList.fancytree.rootNode.findAll(function(node) { return node.partsel; });
        var unselectedNodes = ElementsList.fancytree.rootNode.findAll(function(node) { 
            // do not hide the root element!
            if(node !== ElementsList.fancytree.getFirstChild()){
                return !node.partsel;
            }
        });
        //Build the selector for svg elements to show
        // console.debug(unselectedNodes);
        var selectorsShow = $.map(selectedNodes, function(node){
            return "#" + node.key;
        });
        var selectorsHide = $.map(unselectedNodes, function(node){
            return "#" + node.key;
        });
    
        var showElements = $(selectorsShow.join(","));
        var hideElements = $(selectorsHide.join(","));
        // console.debug(showElements);
        // console.debug(hideElements);
        showElements.toggle(true);
        hideElements.toggle(false);
    },
    _onActivateListItem: function(event, data) {
        var svgNode = $('#' + data.node.key);
        SVGFunctions.selectNode(svgNode[0]);
    },
    
    makeSVGListElementJSON: function(node) {
        var _self = this;

        var $node = $(node);
        var nodeType = node.nodeName;

        var id = $node.attr("id");
        var title = ($node.children("title").text() !== "" ? $node.children("title").text() : "ID " + id);
        var isContainer = _self._containerElements.indexOf(nodeType) !== -1?true:false;

        var extraClasses = null;
        if(isContainer) {
            extraClasses = "elementContainer";
        }
        
        var icon = null;
        
        switch(nodeType){
            case "rect":
                icon = _self._iconPath + "ft_rect.png";
                break;
            case "path":
                icon = _self._iconPath + "ft_path.png";
                break;
            case "g":
                icon = _self._iconPath + "ft_group.png";
                break;

        }
        
        return {
                title: title,
                expanded: true,
                folder: isContainer,
                key: id,
                lazy: false,
                selected: true,
                extraClasses: extraClasses,
                icon: icon
            };
    },
    
    addElementToContainer: function(containerElementId, svgNode){
        console.debug(svgNode);
        var containerFTNode = ElementsList.fancytree.getNodeByKey(containerElementId);
        var json = this.makeSVGListElementJSON(svgNode);
        // console.debug(json);
        var newNode = containerFTNode.addNode(json);
        this.updateElementVisibility();
        return newNode;
    },
    deleteElement: function(event, data) {
        // remove the SVG element
        $("#" + data.node.key).remove();
    },

    parseFancytreeXml: function(xml) {
        // console.debug(xml);
        var _self = this;
        var children = [];
        xml.each(function() {
            var elementJSON = _self.makeSVGListElementJSON(this);
            var node = $(this);
            var subnodes = node.children(":not(title)");
            //make JSON
            elementJSON.children = (subnodes.length > 0)? _self.parseFancytreeXml(subnodes) : null;

            children.push(elementJSON);
        });
        // console.debug(children);
        return children;
    }
};
var MenuContext = {
    colorpicker: {
        options : 
            {
                allowEmpty:true,
                showSelectionPalette: false,
                palette:[[]],
                preferredFormat: "rgb",
                showPalette: true
            }
    },
    instance : null,
    // activeElement : null,
    // apply init every type the list reloads
    init: function () {
        this.registerContextmenus(options);
        // initialize the colorpickers
        $.each($("#contextmenu-container").find("input.colorpicker"), function(idx, node) {
            $.when($(node).spectrum(MenuContext.colorpicker.options)).then(function() {
                // console.debug("picker initialized");
                // Connect the changing events
                $(node).on("change.spectrum", function(event, color) {
                    // console.debug(color);
                    var elementId = $(this).closest("ul").attr("data-callerId");
                    SVGEditor.setFillColor(elementId, color);
                });
            });
        });
        console.debug("contextmenu init done");
    },
    registerContextmenus: function () {
        this._Menu();
    },
    _Menu : function () {
        $(document).contextmenu({
            delegate: ("#svg-elements-list , #binary-container >>> svg svg , .fancytree-node"),
            select: function(event, ui) {
                // console.debug("select " + ui.cmd + " on " + ui.target);
                $.event.trigger({
                    type: "svg.contextmenu",
                    action: ui.cmd,
                    sourceNode: ui.target
                });
                
            },
            beforeOpen: this._modifyMenu,
            // open: function (event) {
            //     activeElement = $(event.currentTarget);
            //     SVG.toggleListElementHighlight(activeElement, true);
            // },
            // close: function(event){
            //     SVG.toggleListElementHighlight(activeElement, false);
            //     activeElement = null;
            // }
        });
    },
    _modifyMenu: function(event, ui){
        var targetNode = ui.target;
        console.debug(targetNode);
        var contextmenuElementId;
        var elementTitle = SVGFunctions.getElementTitle(targetNode);
        var nodes = SVGFunctions.getElementNodesByNode(targetNode);
        switch(event.currentTarget.tagName.toLowerCase()){
            case "svg":
                contextmenuElementId = "menu-context-" + targetNode[0].tagName;
                break;
            case "span":
                var elementId = $.ui.fancytree.getNode(event.currentTarget).key;
                var SVGNode = $("#" + elementId)[0];
                ElementsList.fancytree.activateKey(elementId);
                contextmenuElementId = "menu-context-" + SVGNode.tagName;
                break;
            default:
                return;
        }
        $("#" + contextmenuElementId + " .menuHeader").html("Element ID: "  + elementTitle);
        $(document).contextmenu("replaceMenu", "#" + contextmenuElementId);
        
        //if selected element has a colorpicker, set the colorpicker to actual color
        var elementFillColor = SVGEditor.getFillColor(nodes.SVGElement.attr("id"));
        
        var menu = $(document).contextmenu("getMenu");
        menu.attr("data-callerID", nodes.SVGElement.attr("id"));
        var colorpicker = menu.find(".fillColor > .colorpicker");
        colorpicker.spectrum("set", elementFillColor);
        // prevent root element to get deleted
        if($("#" + nodes.SVGElement.attr("id") ).parent().hasClass("hasSVG")){
            $(document).contextmenu("enableEntry", "deleteElement", false);
            $(document).contextmenu("enableEntry", "cloneElement", false);
        } 

    }
};

var Menu = {
    init: function(options) {
        $(".menu").each(function(index, element) {
            $(element).menu(options);
            // $(element).position({my: "left top", at: "left bottom", of: $(element).parent() });
            $(element).css("display", "none");
        });
        this.registerItemHandlers();
        this.registerDialogStatusListeners();
        // register menuitem eventhandler
        $("#menu-file").on("menuselect", function( event, ui ) {
            // console.debug(ui.item.attr("id"));
            switch (ui.item.attr("id")){
                case "menu-file-open-image":
                    $("#dialog-open-image").dialog("open");
                    break;
                    
                case "menu-file-open-canvas":
                    $("#dialog-open-canvas").dialog("open");
                    break;

                case "menu-file-new-canvas":
                    $('#dialog-new-canvas').dialog('open');
                    break;

                case "menu-file-save":
                            
                    $.when(SVGFunctions.saveSVG(), Annotations.saveAnnotations()).then(
                        // Successful?
                        function(data, textStatus) {
                            // console.debug(serviceHeaders);
                            var detailMessage = "Canvas saved: <i>" + textStatus + "</i>";
                            var shortMessage = "Saving canvas was successful.";
                            Dialogs.showResultDialog("success", shortMessage, detailMessage);
                            log("<b>Canvas successfully saved: </b>" +  textStatus, "success");
    
                        },
                        function(data, textStatus) {
                            var shortMessage = "Saving failed!";
                            var detailMessage = "Saving canvas and annotations failed: <span style='font-decoration:italic'>" + textStatus + "</span>";
                            Dialogs.showResultDialog("error", shortMessage, detailMessage);
                            log(detailMessage, "error");
                        });
                    break;
        }
        });
        
        //Display Menu Events
        $("#menu-display").on("menuselect", function( event, ui ) {
            // console.debug(ui.item);
            this.toggleDialog(ui.item);
        });

    },
    
    registerItemHandlers: function(){
        $('.menuitem').each(function (index, element) {
            var targetMenuNode = $(element).find("ul.menu");
            $(element).bind("mouseenter", function () {
                targetMenuNode.show();
            });
            $(element).bind("mouseleave", function () {
                targetMenuNode.hide();
            });
        });
    },

    toggleDialog: function(menuitem) {
        var dialogObject = $('#' + menuitem.attr("data-dialog"));
        var isOpen = dialogObject.dialog("isOpen");
        if(isOpen){
            dialogObject.dialog("close");
        }else{
            dialogObject.dialog("open");
        }
    },
    
    // toggleMenuCheckbox: function(node, checked) {
    //     $(node).find('input').prop('checked', checked);
    // },
    loadTemplates: function(templatesDefinitions) {
        var def = $.Deferred();
        var templateLoadingStates = [];
        console.debug("loading menu templates");
        $(templatesDefinitions).each(function(idx, data) {
            templateLoadingStates[idx] = false;
            $.ajax({
                async: true,
                cache:false,
                url: data.template,
                dataType: 'html'
            }).done(function(result) {
                $(data.target).append(result);
                templateLoadingStates[idx] = true;
//                console.debug(templateLoadingStates);
                console.debug(data.template + " loaded -> " + data.target);
                if(templateLoadingStates.indexOf(false) === -1){
                    console.debug("all menu templates loaded.");
                    return def.resolve();
                }
            });
        });
        return def.promise();
    },
    registerDialogStatusListeners: function(){
        // Register Checkbox Updating 
        $('input[type="checkbox"].displayStatus').each(function (idx, checkbox){
            // get the connected dialog
            var dialog = $('#' + $(this).attr('data-dialog'));
            dialog.on("dialogclose", function() {
                $(checkbox).prop("checked", false);
            });
            dialog.on("dialogopen", function() {
                $(checkbox).prop("checked", true);
            });
        });
    },
    Open: {
        Image: {
            selectedProtocol: null,
            // init: fill the default values
            init: function() {
                var sourceDropdown = $('#dialog-open-image').find('[name="source-name"]');
                sourceDropdown.empty();
                $.each(options.protocols.getIIIFInfoURL.services, function(idx) {
                    sourceDropdown.append('<option name="' + idx + '"' + (idx===options.protocols.getIIIFInfoURL.default?' selected="selected"':'') + '>' + idx + '</option>');
                });
                // register event listener when changing the source dropdown
                sourceDropdown.on("change", function (event) {
                    var selected = $(event.target).find("option:selected");
                    Menu.Open.Image.updateDialog(selected.val());
                });
                sourceDropdown.trigger("change");
            },
            updateDialog: function(selectedOpenOptionName) {
                var dialog = $('#dialog-open-image');
                this.selectedProt = options.protocols.getIIIFInfoURL.services[selectedOpenOptionName];
                // console.debug(this.selectedProt);
                // set the dialog div texts according to selected protocol
                dialog.find("textarea").attr("placeholder", this.selectedProt.inputPlaceholder);
                dialog.find("textarea").val(this.selectedProt.inputDefaultValue);
                dialog.find(".source-input-hint").html(this.selectedProt.hint);
                
            }
        }
    }
};
/* exported ProtocolResolver */
var ProtocolResolver = {
    resolveToIRI: function(string){
        // get protocol prefix
        var prefix = string.substr(0,string.indexOf(':'));
        var value = string.substr(string.indexOf(':') + 1, string.length);
        switch (prefix){
            case "":
                return null;
            default:
                return options.protocols[prefix].replace(/\$\$(.+?)\$\$/, value);
        }
    }
};
var SeadragonViewer = {
    allowDrag: true,
    self: this,
    imageCoords: {x: 0, y: 0},
    onViewerClick: function(eventData) {
        if(eventData.quick){
/*            var clientRect = SeadragonViewer.overlay.node().getClientRects()[0];*/
            var clientRect = SeadragonViewer.overlay.node().getBoundingClientRect();
            console.debug(eventData);
            console.debug(clientRect);
            var viewportPoint = {
                x: eventData.originalEvent.clientX - clientRect.left,
                y: eventData.originalEvent.clientY - clientRect.top
            };
            console.debug(viewportPoint);
            var imagePoint = SeadragonViewer.instance.viewport.windowToImageCoordinates(new OpenSeadragon.Point((viewportPoint.x + SVGEditor.container[0].offsetLeft), (viewportPoint.y + SVGEditor.container[0].offsetTop)));
            $.event.trigger({
                type: "Seadragon.mouseClick",
                point: imagePoint,
                event: eventData
            });
        } 
        // Disable click zoom on the viewer using event.preventDefaultAction
        eventData.preventDefaultAction = true;
        eventData.stopBubbling = true;
    },

    init: function(options) {
        console.debug("OSDInit");
        this.instance = new OpenSeadragon(options);
        this.instance.gestureSettingsMouse.clickToZoom = false;
        this.instance.addHandler("canvas-click", this.onViewerClick);

        this.instance.addHandler("open-failed", function () {
            console.debug("OPEN FAILED");
        });
    },

    initSVGOverlay: function() {
        this.overlay = this.instance.svgOverlay();
        $(this.overlay.node()).svg();
    },
    
    loadBinary: function(iiifSource) {
        console.debug("loading binary: " + iiifSource);
        binaryImageSourceIRI = iiifSource;
        // binaryImageSourceIRI
        SeadragonViewer.instance.addTiledImage({tileSource: iiifSource});
    },
    pixelPointToPercentage: function(point) {
        if (this.instance.source){
            var imgWidth = this.instance.source.width;
            var imgHeight = this.instance.source.height;
            var x = Math.max(Math.min(point.x / (imgWidth / 100), 100), 0);
            var y =  Math.max(Math.min(point.y / (imgHeight / 100), 100), 0);
            // console.debug(imgWidth)
            return [x, y];
        }else{
            return null;
        }
    },
};

/* exported Serializer */
var Serializer = {
    _json2html_recurse: function (data) {
        var htmlRetStr = "<ul class='recurseObj' >"; 
        for (var key in data) {
            if(typeof(data[key]) !== 'function'){
                if (typeof(data[key]) === 'object' && data[key] !== null) {
                    htmlRetStr += "<li class='keyObj' ><strong>" + key + ":</strong><ul class='recurseSubObj' >";
                    htmlRetStr += this._json2html_recurse( data[key] );
                    htmlRetStr += '</ul  ></li   >';
                } else {
                    htmlRetStr += ("<li class='keyStr' ><strong>" + key + ': </strong>&quot;' + data[key] + '&quot;</li  >' );
                }
            }
        }
        htmlRetStr += '</ul >';    
        return( htmlRetStr );
    },
    
    json2html: function(jsonObj) {
        var htmlStr = '<div class="serializer json">' + this._json2html_recurse(jsonObj);
        return(htmlStr);
    }
};
SVGEditor.Path = {
    editorElement: null,
    activeGrabber: null,
    hoveredGrabber: null,
    activeGrabberLabel: null,
    activeGrabberAffectedLines:{
        fromPoint: null,
        toPoint: null
    },
    activePath: null,
    pathPoints: [],
    pathString: null,
    pathClone: null,
    pathClosed: false,
    editGroup: null,
    editPathPointGrabbersGroup: null,
    options: {
        grabberWidth: 10
    },
    // initialTransform:{
    //     translate: {
    //         x: null,
    //         y: null
    //     },
    //     zoom: null,
    //     scale: null,
    //     rotation: null
    // },
    _init: function() {
        var def = new $.Deferred();
        var _self = this;
        log("SVGPathEditor initialized");
        $(document).on("svg.transform", function(event) {
            _self._transform(event);
        });
        
        _self._registerDraggers();
        return def.resolve();
        // return def.promise();
    },

    _registerDraggers: function() {
        var _self = this;
        console.debug("PathEdit: _registerDraggers()");
        
        $("#" + SVGFunctions.svgEditOverlayId).on("mouseenter", ".pathEditorRect" , function(event) {
            _self.hoveredGrabber = event.target;
        });
        $("#" + SVGFunctions.svgEditOverlayId).on("mouseleave", ".pathEditorRect" , function() {
            _self.hoveredGrabber = null;
        });
        
        
        $(document).on("keyup", function(event){
            //Delete point if mouse is positioned over a grabber
            if(event.keyCode === 46 && _self.hoveredGrabber) {
                var pointIdx = parseInt($(_self.hoveredGrabber).attr("point-idx"), 10);
                _self.removePoint(pointIdx);
                _self.hoveredGrabber = null;

            }
        });
        $("#" + SVGFunctions.svgEditOverlayId).on("mousedown", ".pathEditorRect", function (data) {
            _self.activeGrabber = $(this);
            var pointId = $(this).attr("point-idx");
            _self.activeGrabberLabel = $(_self.editPathPointGrabbersGroup).find("text[point-idx=" + pointId + "]");

            //set the affected lines (lines wich are connected to the dragged point)
            _self.activeGrabberAffectedLines.fromPoint = $(_self.editGroup).find(".pathEditLine[from-point-idx=" + pointId + "]");
            _self.activeGrabberAffectedLines.toPoint = $(_self.editGroup).find(".pathEditLine[to-point-idx=" + pointId + "]");

            $(document).trigger("SVGEditor.dragStart", data);
        });

        
        // Register the click events for the connection lines
        $("#" + SVGFunctions.svgEditOverlayId).on("click", ".pathEditLine", function(event) {
            // insert a point on the clicked position 
            var pointBefore = parseInt($(this).attr("from-point-idx"), 10);
            var pointAfter = parseInt($(this).attr("to-point-idx"), 10);
            
            var newPoint = SVGEditor.mousePosToImageCoords({x: event.clientX, y: event.clientY});
            _self._insertPointBetween(newPoint, pointBefore, pointAfter);
        });
        
    },
    _registerDragHandler: function() {
        var _self = this;
        $(document).on("SVGEditor.drag", function(event) {
            var newPoint = {x: event.event.clientX, y: event.event.clientY};
            _self._updateGrabbedPathPointCoords(newPoint);
        });
    },
    
    removePoint: function(pointIdx){
        console.debug("remove idx:" + pointIdx);
        this.pathPoints.splice(pointIdx, 1);
        // If its the first Element, Change the drawing method from "lineTo" to "move"
        if (pointIdx === 0){
            this.pathPoints[0].type = "M";
        }

        this._updatePathElements();
        this._drawGrabbers();
        this._redrawScene();
    },
    
    draw: function () {
        console.debug("*********** Path.draw *************");
        var _self = this;
        var fillColor = SVGEditor.elementColorpicker.spectrum("get");
        // set the default alpha
        fillColor.setAlpha(SVGEditor.defaultAlpha);

        $("#binary-container").css("cursor", "crosshair");
        SVGEditor.container.show();

        this._registerDragHandler();

        $(document).on("Seadragon.mouseClick", function(event) {
            var newPoint = SVGEditor.mousePosToImageCoords({x: event.event.originalEvent.clientX, y: event.event.originalEvent.clientY});

            var newPointIdx = _self.pathPoints.length;
            // if its the first point of a new path, send the singal to add the path to the list
            if(_self.pathPoints.length === 0){
                console.debug("new path triggered");
                $.event.trigger({
                    type: "SVGEditor.Path.new",
                    point: newPoint,
                    fillColor: fillColor
                });
            }else{
                _self._insertPointBetween(newPoint, newPointIdx);
            }
        });
    },

    edit: function(elementId) {
        var _self = this;
        // in case there still is a path selected, deselect it
        if(_self.activePath) {
            _self.stopEditing();
        }
        
        // console.debug("*********** Path.edit *************");

        this._registerDragHandler();

        _self.activePath = SVGFunctions.getElementNodesById(elementId);
        _self.pathString = _self.activePath.SVGElement.attr("d");
        _self.pathPoints = _self.parsePathString(_self.pathString);

        // draw grabbers
        _self._drawGrabbers();

        SVGEditor.container.show();
        _self._redrawScene();
    },
    
    _drawGrabbers: function () {
        var _self = this;
        var color = "red";

        $(this.editGroup).remove();
        $(this.editPathPointGrabbersGroup).remove();

        _self.editGroup = SVGFunctions.svgEditorObj.group("pathEditGroup");
        _self.editPathPointGrabbersGroup = SVGFunctions.svgEditorObj.group("editPathPointGrabbersGroup");

        // create the overlay
        _self.pathClone = SVGFunctions.svgEditorObj.path(_self.editGroup, _self.pathString, {
            fill: color, 
            fillOpacity: '0.3', 
            stroke: color, 
            strokeWidth: 2, 
            "stroke-dasharray": '10,10',
            "vector-effect": "non-scaling-stroke",
            "stroke-location": "center"
            // transform: 'translate(' + _self.options.grabberWidth / 2 + ',' + _self.options.grabberWidth / 2 + ')'
        });
        
        // create the grabber elements 
        this.pathPoints.forEach(function(pointObj, idx) {
            // Lines between points (i.e. for adding a point between them)
            // _self._drawGrabberLine(idx, pointObj.nextIdx);
            var nextIdx = ((idx + 1) < (_self.pathPoints.length)?(idx + 1):0);
            _self._drawGrabberLine(idx, nextIdx);
        
            //draw the point grabber rectangles
            SVGFunctions.svgEditorObj.rect(_self.editPathPointGrabbersGroup, pointObj.x, pointObj.y, _self.options.grabberWidth, _self.options.grabberWidth, {
                class: "pathEditorRect grabber", 
                "point-idx": idx
            });
            SVGFunctions.svgEditorObj.text(_self.editPathPointGrabbersGroup, pointObj.x, pointObj.y, 'p' + idx, {
                class: "pathEditorRectLabel",
                "point-idx": idx,
                transform: "translate(-5,-5)",
                "text-anchor": "end",
                style: "font-size:1em"
            });
            
        });
    },
    
    _drawGrabberLine: function(fromIdx, toIdx){
        var _self = this;
        // console.debug(_self.pathPoints);
        // console.debug("line from " + fromIdx + " to " + toIdx);
        return SVGFunctions.svgEditorObj.line(_self.editGroup, _self.pathPoints[fromIdx].x, _self.pathPoints[fromIdx].y, _self.pathPoints[toIdx].x, _self.pathPoints[toIdx].y, {
            stroke:"#00aa00", 
            "stroke-opacity":"0.0", 
            strokeWidth:3, 
            class: "pathEditLine",
            "from-point-idx": fromIdx,
            "to-point-idx": toIdx,
            "vector-effect": "non-scaling-stroke",
            "stroke-location": "center"
        });
    },
    
    _redrawScene: function () {
        $(this.pathClone).attr("d", this.activePath.SVGElement.attr("d"));
    // Simulate a translate event for redrawing
        var fakeEvent = {
            transformData: SeadragonViewer.overlay.getTransformData()
        };
        this._transform(fakeEvent);
    },
    
    // _unregisterEditEvents: function(argument) {
    //     $(document).off("Seadragon.mouseClick");
    // },
    
    stopEditing: function () {
        // console.debug("stop PATH Editing");
        // unregister event handlers
        // $(document).off("SVGEditor.drag");

        // this._unregisterEditEvents();
        // hide edit overlay
        SVGEditor.container.hide();
        $(this.editGroup).remove();
        $(this.editPathPointGrabbersGroup).remove();
        this.activePath = null;
        this.pathPoints = [];
        this.pathClone = null;
        this.pathString = null;
        this.editGroup = null;
        this.editPathPointGrabbersGroup = null;
        $(document).trigger("SVGEditor.dragRelease");

    },
    
    stopDrawing: function () {
        $(document).off("Seadragon.mouseClick");
        this.stopEditing();
    },


    // Parse the "@d" string to get the points
    parsePathString: function(dString) {
        // console.debug(dString.substr(-1));
        this.pathClosed = (dString.substr(-1) === "Z")?true:false;
        var stringRest = dString.substr(0, dString.length -1).trimRight();
        var splittedValues = stringRest.split(" ");
        // console.debug(splittedValues);

        var points = [];
        // iterate over x and y pairs (and store type (move, lineTo...)
        
        for (var i = 0; i < splittedValues.length; i = i + 2){
            var nextIdx = (i / 2 + 1);
            // if its the last point, connect it to the first one 
            if (nextIdx >= (splittedValues.length / 2)) {
                nextIdx = 0;
            }
            // console.debug(splittedValues[i].substr(1) + " | " + splittedValues[i + 1]);
            points.push({
                "x": parseInt(splittedValues[i].substr(1), 10), 
                "y": parseInt(splittedValues[i + 1], 10),
                "type": splittedValues[i].substr(0, 1)
            });
        }
        // console.debug(points);
        return points;
    },
    
    _transform: function (event) {
        if (this.activePath){
            // console.debug(event);
            /*var containerRect = SVGEditor.container[0].getBoundingClientRect();*/
            
            $(this.editGroup).attr("transform", "translate(" + event.transformData.translate.x + "," + event.transformData.translate.y + ") scale(" + event.transformData.scale + ")");

            $(this.editPathPointGrabbersGroup).attr("transform", "translate(" + (event.transformData.translate.x - this.options.grabberWidth / 2) + "," + (event.transformData.translate.y - this.options.grabberWidth / 2) + ") scale(" + event.transformData.scale + ")");

            // Transform the grabbers
            $(SVGFunctions.svgEditorObj.root()).find(".pathEditorRect").each(function() {
                var boxScaled = SVGEditor.boxSize * 1 / event.transformData.scale;
                // console.debug(event);
                $(this).attr("width", boxScaled);
                $(this).attr("height", boxScaled);
                $(this).attr("vector-effect", "non-scaling-stroke");
            });
            
            // transform the label size
            $(SVGFunctions.svgEditorObj.root()).find(".pathEditorRectLabel").each(function() {
                $(this).css("font-size", (14 * 1 / event.transformData.scale) + "px" );
            });

        }
    },
    
    _composePathString: function() {
        var stringComponents = [];
        this.pathPoints.forEach(function(point) {
            stringComponents.push(point.type + Math.ceil(point.x) + " " + Math.ceil(point.y));
        });
        // for (var i = 0; i < this.pathPoints.length; i++){
        //     var thisPoint = this.pathPoints[nextIdx];
        //     nextIdx = thisPoint.nextIdx;
        // }
        var pathString = stringComponents.join(" ");
        if (this.pathClosed) {
            pathString += " Z";
        }
        return pathString;
    },
    
    _updateGrabbedPathPointCoords: function(editorPoint){

        var pointId = $(this.activeGrabber).attr("point-idx");
        var newPoint = SVGEditor.mousePosToImageCoords(editorPoint);

        // Update the point in the points object
        this.pathPoints[pointId].x = newPoint.x;
        this.pathPoints[pointId].y = newPoint.y;
        
        // Move the grabber
        $(this.activeGrabber).attr("x", newPoint.x);
        $(this.activeGrabber).attr("y", newPoint.y);

        // Move the Grabber Label
        this.activeGrabberLabel.attr("x", newPoint.x);
        this.activeGrabberLabel.attr("y", newPoint.y);

        // translate the lines connected to this point
        this.activeGrabberAffectedLines.fromPoint.attr("x1", newPoint.x);
        this.activeGrabberAffectedLines.fromPoint.attr("y1", newPoint.y);
  
        /*var lineToPoint = $(this.editGroup).find(".pathEditLine[toPointIdx=" + pointId + "]");*/
        this.activeGrabberAffectedLines.toPoint.attr("x2", newPoint.x);
        this.activeGrabberAffectedLines.toPoint.attr("y2", newPoint.y);
        

        // Update the changed Elements
        this._updatePathElements();
    },
    
    _updatePathElements: function() {
        var pathString = this._composePathString();
        // Update the clone
        $(this.pathClone).attr("d", pathString);
        
        // Update the edited SVG Element
        this.activePath.SVGElement.attr("d", pathString);
        this._redrawScene();
    },

    _insertPointBetween: function(newPoint, pointBeforeIdx, pointAfterIdx){
        console.debug("newPoint (" + newPoint.x + "/" + newPoint.y + ") between " + pointBeforeIdx + " and " + pointAfterIdx);
        
        // remove the line beween the two points between which the new one should get inserted
        // var lineBetween = $(this.editGroup).find(".pathEditLine[from-point-idx=" + pointBeforeIdx + "][to-point-idx=" + pointAfterIdx + "]");
        // lineBetween.remove();
        // console.debug(lineBetween);
        
        // insert the new Point
        var newPointObj = {
            "x": newPoint.x,
            "y": newPoint.y,
            "type": "L"
        };
        
        if((pointBeforeIdx + 1) > this.pathPoints.length){
            this.pathPoints.push(newPointObj);
        }else{
            this.pathPoints.splice(pointBeforeIdx + 1, 0, newPointObj);
        }

        // Redraw the grabbers
        this._drawGrabbers();
        this._updatePathElements();
    },
    
    _testDraw: function(){
        // select the SVG container
        SVGFunctions.selectNode(SVGFunctions.getElementNodesByNode($('#svg-elements-list').find(".svg-element-title-id").first()).listElement[0]);
        // activate "new Path"
        SVGFunctions._activateAction("newPath", true);
        
        // click on the Points
        var points = [
            {clientX:400, clientY:400},
            {clientX:400, clientY:800},
            {clientX:800, clientY:800}
        ];
        
        points.forEach(function(point) {
            var fakeEvent = {
                type: "Seadragon.mouseClick",
                event:{
                    originalEvent: point
                }
            };
            $(document).trigger(fakeEvent);
        });
        
        console.debug(this.pathPoints);
    }
};
SVGEditor.Rect = {
    editGroup: null,
    editorElement: null,
    activeGrabber: null,
    activeRect: null,
    initialTransform:{
        translate: {
            x: null,
            y: null
        },
        zoom: null,
        scale: null,
        rotation: null
    },

    _init: function() {
        var def = new $.Deferred();
        return def.resolve();
    },
    
    _init_rect: function() {
        var _self = this;
        var highlight = $("#highlight");
        _self.editorElement = highlight;
        
        // set the width of the grab boxes
        $("#edge-top").attr("height", SVGEditor.boxSize);
        $("#edge-bottom").attr("height", SVGEditor.boxSize);
        $("#edge-left").attr("width", SVGEditor.boxSize);
        $("#edge-right").attr("width", SVGEditor.boxSize);

        $("#corners > rect").attr("width", SVGEditor.boxSize);
        $("#corners > rect").attr("height", SVGEditor.boxSize);
        $("#others > rect").attr("width", SVGEditor.boxSize);
        $("#others > rect").attr("height", SVGEditor.boxSize);
        
        // set grabber cursors using css
        $("#corner-topleft").css("cursor", "nw-resize");
        $("#corner-topright").css("cursor", "ne-resize");
        $("#corner-bottomleft").css("cursor", "sw-resize");
        $("#corner-bottomright").css("cursor", "se-resize");
        $("#edge-left, #edge-right").css("cursor", "ew-resize");
        $("#edge-top, #edge-bottom").css("cursor", "ns-resize");

        $("#others-move").css("cursor", "move");

        $("#edges, #corners, #others").on("mousedown", function(event) {
            switch (event.which) {
                case 1:
                    event.preventDefault();
                    // console.debug("send SVGEditor.dragStart");
                    _self.activeGrabber = $(event.target).attr("id");
                    $.event.trigger({
                        type: "SVGEditor.dragStart",
                        event: event
                    });
                    break;
            }
        });

    },
    
    _drawGrabbers: function() {
        $("#rectEditGroup").remove();
        
        this.editorElement = SVGFunctions.svgEditorObj.group("rectEditGroup", {
            "stroke-width": "1",
            "fill-opacity": 0,
            "fill": "green"
        });
        
        // add the clone
        SVGFunctions.svgEditorObj.rect(this.editorElement, 0, 0, 0, 0, {"stroke": "red", "stroke-width": 1, "fill-opacity": 0.1, "id": "highlight", "style": "pointer-events: none"});

        var editRectGrabbersEdges = SVGFunctions.svgEditorObj.group(this.editorElement, "edges", {"stroke-opacity": 0, "style": "pointer-events: all"});
        var editRectGrabbersCorners = SVGFunctions.svgEditorObj.group(this.editorElement, "corners", {"stroke": "red", "stroke-opacity": 1, "style": "pointer-events: all"});
        var editRectGrabbersOthers = SVGFunctions.svgEditorObj.group(this.editorElement, "others", {"stroke": "orange", "stroke-opacity": 1, "style": "pointer-events: all"});

        // add the edge grabbers
        // edgeTop
        SVGFunctions.svgEditorObj.rect(editRectGrabbersEdges, 0, 0, 0, 0, {"stroke": "blue", "id": "edge-top"});
        // edgeBottom 
        SVGFunctions.svgEditorObj.rect(editRectGrabbersEdges, 0, 0, 0, 0, {"stroke": "yellow", "id": "edge-bottom"});
        // edgeLeft
        SVGFunctions.svgEditorObj.rect(editRectGrabbersEdges, 0, 0, 0, 0, {"stroke": "pink", "id": "edge-left"});
        // edgeRight
        SVGFunctions.svgEditorObj.rect(editRectGrabbersEdges, 0, 0, 0, 0, {"stroke": "green", "id": "edge-right"});

        // add the corner grabbers
        // cornerTopLeft 
        SVGFunctions.svgEditorObj.rect(editRectGrabbersCorners, 0, 0, 0, 0, {"id": "corner-topleft"});
        // cornerBottomLeft
        SVGFunctions.svgEditorObj.rect(editRectGrabbersCorners, 0, 0, 0, 0, {"id": "corner-bottomleft"});
        // cornerBottomRight
        SVGFunctions.svgEditorObj.rect(editRectGrabbersCorners, 0, 0, 0, 0, {"id": "corner-bottomright"});
        // cornerTopRight
        SVGFunctions.svgEditorObj.rect(editRectGrabbersCorners, 0, 0, 0, 0, {"id": "corner-topright"});

        // add the other grabbers (i.e. "move")
        SVGFunctions.svgEditorObj.rect(editRectGrabbersOthers, 0, 0, 0, 0, {"id": "others-move"});
        this._init_rect();
        this.registerRectEditEvents();
    },


    draw: function () {
        var _self = this;
        _self._drawGrabbers();
        SVGEditor.container.show();
        var fillColor = SVGEditor.elementColorpicker.spectrum("get");
        // set the default alpha
        fillColor.setAlpha(SVGEditor.defaultAlpha);

        $("#binary-container").css("cursor", "crosshair");
        $(document).on("Seadragon.mouseClick", function(event) {
            // console.debug("new rectangle triggered");
            console.debug(event);
            $.event.trigger({
                type: "SVGEditor.Rect.new",
                event: event,
                fillColor: fillColor
            });
        });
    },

    edit: function(rectElementId) {
        var _self = this;
        console.debug("*********** Rect.edit *************");
        _self._drawGrabbers();

        var rectNodes = SVGFunctions.getElementNodesById(rectElementId);
        var rectElement = rectNodes.SVGElement;

        _self.unregisterRectEditEvents();
        _self.registerRectEditEvents();

        SVGEditor.container.show();

        _self.activeRect = rectElement;

        var rectPos = _self.activeRect[0].getBoundingClientRect();
        var containerRect = SVGEditor.container[0].getBoundingClientRect();
        var x = rectPos.left - containerRect.left;
        var y = rectPos.top - containerRect.top;
        var width = rectPos.width;
        var height = rectPos.height;
        // console.debug( x + " " + y+ " " + width+ " " + height);
        _self.initialTransform =  SeadragonViewer.overlay.getTransformData();
        // Connect to Seadragon transform event
        $(document).on("svg.transform", function(event) {
            _self._transform(event);
        });
        
        _self.change(_self.editorElement, x, y, width, height);
    },
    
    stopEditing: function () {
        // console.debug("stop Rect Editing");
        // unregister event handlers
        this.unregisterRectEditEvents();

        // this._resetTransformData();
        $("#rectEditGroup").remove();
        SVGEditor.container.hide();
        this.activeRect = null;
    },
    
    change: function(node, x, y, width, height) {
        node.attr("width", width);
        node.attr("height", height);
        node.attr("x", x);
        node.attr("y", y);

        $.event.trigger({
            type: "SVGEditor.Rect.change",
            rectID: this.activeRect.attr("id"),
            width: width,
            height: height,
            x: x,
            y: y
        });
    },
    
    /**
     * Updates the edited SVG rect element (parameters represent pixel coordinates)
     * @param {Number} x - new x coord of the rect's origin
     * @param {Number} y - new y coord of the rect's origin
     * @param {Number} width - new width of the rect
     * @param {Number} height - new height of the rect
    */
    // ToDo: since x and y is taken from screen position, x and y parameters are not used. Probably it would be better to do the calculation with container offset and the rect's bounding box in the calling function and submit them as x and y coordinates
/*    updateSVGRectElement: function(x, y, width, height) {*/
    updateSVGRectElement: function() {
        var containerOffset = {
            x: $('#binary-container')[0].offsetLeft - $('#binary-container')[0].getBoundingClientRect().left,
            y: $('#binary-container')[0].offsetTop - $('#binary-container')[0].getBoundingClientRect().top
        };
        
        // Get the window coordinates for top left (x, y)
        var topLeftWindowPointRect = $("#corner-topleft")[0].getBoundingClientRect();
        var topLeftWindowPoint = new OpenSeadragon.Point(topLeftWindowPointRect.left + topLeftWindowPointRect.width/2, topLeftWindowPointRect.top + topLeftWindowPointRect.height/2);
        
        // Get the window coordinates for lower right
        var bottomRightWindowPointRect = $("#corner-bottomright")[0].getBoundingClientRect();
        var bottomRightWindowPoint = new OpenSeadragon.Point(bottomRightWindowPointRect.left + bottomRightWindowPointRect.width/2 , bottomRightWindowPointRect.top + bottomRightWindowPointRect.height/2);
        
        var delta = bottomRightWindowPoint.minus(topLeftWindowPoint);
        
        var imageWH = new OpenSeadragon.Point(delta.x / SeadragonViewer.overlay._scale , delta.y / SeadragonViewer.overlay._scale);
        var imageXY = SeadragonViewer.instance.viewport.windowToImageCoordinates(new OpenSeadragon.Point(topLeftWindowPoint.x + containerOffset.x, topLeftWindowPoint.y + containerOffset.y));

        this.activeRect.attr("x", imageXY.x);
        this.activeRect.attr("y", imageXY.y);
        this.activeRect.attr("width", imageWH.x);
        this.activeRect.attr("height", imageWH.y);
    },
    
    unregisterRectEditEvents: function() {
        // $(document).off("svg.transform");
        // $(document).off("mousedown");
        $(document).off("SVGEditor.drag");
        // $(document).off("SVGEditor.mousedown");
        // $(document).off("keyup");
    },
    
    registerRectEditEvents: function() {
        // console.debug("*********** Rect.registerRectEditEvents *************");
        var _self = this;
        // if position or size changes, move the grabbers
        $(document).on('SVGEditor.Rect.change', function(event) {

            $("#edges").attr("transform", "translate (" + event.x + "," + event.y + ")");
            $("#corners").attr("transform", "translate (" + event.x + "," + event.y + ")");
            $("#others").attr("transform", "translate (" + event.x + "," + event.y + ")");
            
            // modify edges
            // left edge
            $("#edge-left").attr("transform", "translate(" + -(SVGEditor.boxSize / 2) + "," + -(SVGEditor.boxSize / 2) + ")");
            $("#edge-left").attr("height",  parseFloat(event.height) + SVGEditor.boxSize);

            // right edge
            $("#edge-right").attr("x",  parseFloat(event.width));
            $("#edge-right").attr("transform", "translate(" + -(SVGEditor.boxSize / 2) + "," + -(SVGEditor.boxSize / 2) + ")");
            $("#edge-right").attr("height",  parseFloat(event.height) + SVGEditor.boxSize);

            // top edge
            $("#edge-top").attr("transform", "translate(" + -(SVGEditor.boxSize / 2) + "," + -(SVGEditor.boxSize / 2) + ")");
            $("#edge-top").attr("width",  parseFloat(event.width) + SVGEditor.boxSize);

            // bottom edge
            $("#edge-bottom").attr("y",  parseFloat(event.height));
            $("#edge-bottom").attr("transform", "translate(" + -(SVGEditor.boxSize / 2) + "," + -(SVGEditor.boxSize / 2) + ")");
            $("#edge-bottom").attr("width",  parseFloat(event.width) + SVGEditor.boxSize);
            
            // modify corners
            // top-left corner
            $("#corner-topleft").attr("transform", "translate(" + -(SVGEditor.boxSize / 2) + "," + -(SVGEditor.boxSize / 2) + ")");

            // top-right corner
            $("#corner-topright").attr("x",  parseFloat(event.width));
            $("#corner-topright").attr("transform", "translate(" + -(SVGEditor.boxSize / 2) + "," + -(SVGEditor.boxSize / 2) + ")");
            
            // bottom-left corner
            $("#corner-bottomleft").attr("y",  parseFloat(event.height));
            $("#corner-bottomleft").attr("transform", "translate(" + -(SVGEditor.boxSize / 2) + "," + -(SVGEditor.boxSize / 2) + ")");
            
            // bottom-right corner
            $("#corner-bottomright").attr("x",  parseFloat(event.width));
            $("#corner-bottomright").attr("y",  parseFloat(event.height));
            $("#corner-bottomright").attr("transform", "translate(" + -(SVGEditor.boxSize / 2) + "," + -(SVGEditor.boxSize / 2) + ")");

            //Modify other grabbers
            $("#others-move").attr("x",  parseFloat(event.width) / 2);
            $("#others-move").attr("y",  parseFloat(event.height) / 2);
            $("#others-move").attr("transform", "translate(" + -(SVGEditor.boxSize / 2) + "," + -(SVGEditor.boxSize / 2) + ")");

            // console.debug("changed");
        });

        // Register mousemove event, do changes, unregister mousemove event on mouseup
        $(document).on("SVGEditor.drag", function (data) {
            _self.grabberMove(data);
        });
    },
    
    grabberMove: function(mouseMoveEvent) {
        var _self = this;
        var grabber = _self.activeGrabber.split("-");
        var x = parseFloat(_self.editorElement.attr("x"));
        var y = parseFloat(_self.editorElement.attr("y"));
        var width = parseFloat(_self.editorElement.attr("width"));
        var height = parseFloat(_self.editorElement.attr("height"));

        // calculate relMousePos: coords relative to SVGEditItem 
        var clientRect = SVGEditor.container[0].getClientRects()[0];
        var mousePos = {
                x: mouseMoveEvent.event.clientX - clientRect.left,
                y: mouseMoveEvent.event.clientY - clientRect.top
        };
        
        // console.debug(mousePos);
        //Switch on grabber type
        switch(grabber[0]){
            case "corner":
                // Switch on corner
                switch(grabber[1]){
                    case "topleft":
                        width -= mousePos.x - x;
                        height -= mousePos.y - y;
                        x = mousePos.x;
                        y = mousePos.y;
                        if(width - (mousePos.x - x) <= 0) {
                            _self.activeGrabber = "corner-topright";
                        }
                        if(height - (mousePos.y - y) <= 0) {
                            _self.activeGrabber = "corner-bottomleft";
                        }
                        break;
                    case "topright":
                        width = mousePos.x - x;
                        height -= mousePos.y - y;
                        y = mousePos.y;
                        if(width + (mousePos.x - x) <= 0) {
                            _self.activeGrabber = "corner-topleft";
                        }
                        if(height - (mousePos.y - y) <= 0) {
                            _self.activeGrabber = "corner-bottomright";
                        }
                        break;
                    case "bottomright":
                        width = mousePos.x - x;
                        height = mousePos.y - y;
                        if(width < 0){
                            _self.activeGrabber = "corner-bottomleft";
                        }
                        if(height + (mousePos.y - y) <= 0) {
                            _self.activeGrabber = "corner-topright";
                        }
                        break;
                    case "bottomleft":
                        // y += offset.y;
                        width -= mousePos.x - x;
                        height = mousePos.y - y;
                        x = mousePos.x;
                        if(width - (mousePos.x - x) <= 0) {
                            _self.activeGrabber = "corner-bottomright";
                        }
                        if(height + (mousePos.y - y) <= 0) {
                            _self.activeGrabber = "corner-topleft";
                        }
                }
                break;
                
            case "edge":
                // Switch on corner
                switch(grabber[1]){
                    case "left":
                        width -= mousePos.x - x;
                        x = mousePos.x;
                        if(width < 0) {
                            _self.activeGrabber = "edge-right";
                        }
                        break;
                    case "top":
                        height -= (mousePos.y - y);
                        y = mousePos.y;
                        if(height < 0) {
                            _self.activeGrabber = "edge-bottom";
                        }
                        break;
                    case "bottom":
                        height = mousePos.y - y;
                        if(height < 0) {
                            _self.activeGrabber = "edge-top";
                        }
                        break;
                    case "right":
                        width = mousePos.x - x;
                        if(width < 0) {
                            _self.activeGrabber = "edge-left";
                        }
                        break;
                }
                break;
                
            case "others":
                // Switch on corner
                switch(grabber[1]){
                    case "move":
                        x += mousePos.x - x - width/2;
                        y += mousePos.y - y - height/2;
                        break;
                }
                break;
        }
        _self.change(_self.editorElement, x, y, width, height);

        _self.updateSVGRectElement(x, y , width, height);
    },

    _transform: function () {
        if (this.activeRect){
            var originalRectClientRects = this.activeRect[0].getBoundingClientRect();
            var containerRect = SVGEditor.container[0].getBoundingClientRect();
    
            var x = originalRectClientRects.left - containerRect.left;
            var y = originalRectClientRects.top - containerRect.top;
            var width = originalRectClientRects.width;
            var height = originalRectClientRects.height;
            this.change(this.editorElement, x, y, width, height);
        }
    }
};
var SVGFunctions = {
    _self: this,
    svgListContainerId: 'svg-elements-list',
    svgEditOverlayId: 'svg-edit-overlay',
    svgContainer: null,
    svgEditorObj: null,
    selectedElementId: null,
    clickSelectNodes: ["rect", "path"],
    
    svgElementSelectionStrokeColor: "#ff0000",
    svgElementHighlightStrokeColor: "#ffffff",
    
    activeElement: false,
    
    init: function(svgContainer) {
        var def = new $.Deferred();
        var _self = this;
        
        var svgEditorNode = $("#" + this.svgEditOverlayId).svg();
        this.svgEditorObj = svgEditorNode.svg("get");
//        console.debug(this.svgEditorObj);

        // svgEditorNode
        $(this.svgEditorObj.root()).attr("id", "svg-edit-overlay-item");
        $(this.svgEditorObj.root()).attr("width", "100%");
        $(this.svgEditorObj.root()).attr("height", "100%");
        
        this.svgContainer = svgContainer;
        // register event handlers
        this.registerEventHandlers();
        // initalize contexmenus
        MenuContext.init();
        
        this._initMenuButtons();
        
        this._registerEditorHandlers();

        // $(document).on("SVGEditor.escape", function(event) {
        //   _self._activateAction("select", true);
        // });

        $.when(SVGEditor.init($("#svg-edit-overlay")), ElementsList.init()).then(function(){
            // Activate "select" action as default
            _self._activateAction("select", true);
            return def.resolve();
        });
        
        $(document).on("SVGEditor.dragStart", function() {
            _self._unregisterSVGEventHandlers();
        });
        $(document).on("SVGEditor.dragRelease", function() {
            _self._registerSVGEventHandlers();
        });

        return def.promise();
    },
    
    _initMenuButtons: function() {
        var _self = this;
        // Stop current action if a (enabled!) button is clicked
        $("#svg-edit-buttons").on("mouseup", "span.button:not(.button-disabled)", function() {
            // only do something if mode is not already activated
            if(!$(this).hasClass("button-activated")){
                // which action should be activated?
                var thisAction = $(this).attr("data-action");
                // get the last action
                var lastAction = $("#svg-edit-buttons > span.button.button-activated").attr("data-action");
                // console.debug("deactivate Action: " + lastAction);
                _self._activateAction(lastAction, false);
                // console.debug("activate Action: " + thisAction);
                _self._activateAction(thisAction, true);
            }
        });

    },
    
    // Register Editor Handlers
    _registerEditorHandlers: function () {
        var _self = this;

        // watch for "new rect" Signal:
        // if SVGEditor has drawn a new rect, add it to the list
        $(document).on("SVGEditor.Rect.new", function (data) {
            //var targetElementId = _self.selectedElementId;
            console.debug("new Rect catched");
            console.debug(data.event.point);
            _self._addRectangle(data.event.point.x, data.event.point.y, 1, 1, data.fillColor);
        });
        
        $(document).on("SVGEditor.Path.new", function (event) {
            //var targetElementId = _self.selectedElementId;
            console.debug(event);
            _self._addPath(event.point.x, event.point.y, event.fillColor);
        });
    },


    // Register Eventhandlers for SVG Elements
    _registerSVGEventHandlers: function() {
//        console.debug("register SVG event handlers");
        var _self = this;

        $(document).on("Seadragon.mouseClick", function(event) {
            switch(event.event.originalEvent.which){
                case 1:
                    var target = event.event.originalEvent.target;
                    if(_self.clickSelectNodes.indexOf(target.nodeName) !== -1){
                        // activate the Fancytree element
                        _self.selectNode(target);
                        // selectNodeElementsList.fancytree.activateKey($(target).attr("id"));
                    }
                    break;
            }
        });
        
        // console.debug(svgElement);
        $(this.svgContainer.root()).on("mouseenter", "rect,path", function() {
            var nodes = _self.getElementNodesByNode($(this));
            // Only enable highlighting if not already selected
            if(ElementsList.fancytree.getActiveNode() && nodes.SVGElement.attr("id") !== ElementsList.fancytree.getActiveNode().key){
                $(this).addClass("highlight");
                $(this).attr("vector-effect", "non-scaling-stroke");
                $(nodes.ftElement.span).find(".fancytree-title").addClass("fancytree-title-hovered");
            }
            $.each($(Annotations.options.selectors["anno-element-containers"] + "[anno-element='" + $(this).attr("id") + "']"), function() {
                $(this).addClass("annotation-element-container-highlight");
            });
        });
        
        $(this.svgContainer.root()).on("mouseleave", "rect,path", function() {
            var nodes = _self.getElementNodesByNode($(this));
            $(this).removeClass("highlight");
            if(!$(this).hasClass("selected")){
                $(this).removeAttr("vector-effect");
            }
            $(nodes.ftElement.span).find(".fancytree-title").removeClass("fancytree-title-hovered");
            $.each($(Annotations.options.selectors["anno-element-containers"] + "[anno-element='" + $(this).attr("id") + "']"), function() {
                $(this).removeClass("annotation-element-container-highlight");
            });
        });

    },
    
    _unregisterSVGEventHandlers: function() {
        // $(this.svgContainer.root()).off("click");
        $(document).off("Seadragon.mouseClick");
        $(this.svgContainer.root()).off("mouseenter");
        $(this.svgContainer.root()).off("mouseleave");
    },


    _newId: function() {
        var max = 0;
        $(SeadragonViewer.overlay.node()).children().find("[id]").each(function() {
            if(!isNaN(this.id)) {
                max = Math.max(this.id, max);
            }
        });
        if(isNaN(max)){
            return 1;
        } 
        else{
            return max + 1;
        } 
    },

    selectNode: function(node){
        var nodes = this.getElementNodesByNode($(node));
        var elementId = nodes.SVGElement.attr("id");
        
        var lastSelectedElementId = this.selectedElementId;
        // Unselect element which was selected before
        if (lastSelectedElementId !== elementId){
            console.debug("Unselect " + lastSelectedElementId + " Select " + elementId);
            this.selectedElementId = elementId;

            // Unselect last element
            // if (lastSelectedElementId !== null){
                // console.debug("DEselecting node with id: " + lastSelectedElementId);
                // lastSelectedNode = this.getElementNodesById(lastSelectedElementId);
                // lastSelectedNode.listElement.toggleClass("selected", false);
            // }
            this._unregisterSVGEventHandlers();

            ElementsList.fancytree.activateKey(elementId);
            // nodes.listElement.toggleClass("selected", true);
            //Stop the last SVGEditor Action
            // SVGEditor.stopAction();

            this._activateAction("select", true);
            
            var nodeType = nodes.SVGElement[0].nodeName;
            
            switch(nodeType){
                case "rect":
                case "path":
                    this.enableAction("newGroup", false);
                    this.enableAction("newRect", false);
                    this.enableAction("newPath", false);
                    SVGEditor.startAction(nodeType, "edit", {id: elementId});
                    break;
                case "g":
                    this.enableAction("newGroup", true);
                    this.enableAction("newRect", true);
                    this.enableAction("newPath", true);
                    break;
                case "svg":
                    this.enableAction("newGroup", true);
                    this.enableAction("newRect", true);
                    this.enableAction("newPath", true);
                    break;
                // default:
            }
        }
        
    },
    
    newSVG: function() {
        if(this.drawingMode) {
            this.quitDrawingMode();
        }
        $.get(binaryImageSourceIRI, function (data) {
            options.protocols.newUUID().then(function(id) {
                log("new SVG: " + id + ".svg");
                var SVGOverlayNode = $(SeadragonViewer.overlay.node());
                SVGOverlayNode.empty();
                SVGOverlayNode.html('<svg id="' + id + '" xml:id="' + id + '" version="1.1" height="' + data.height + '" width="' + data.width + '" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" />');
                svgNode = $(SeadragonViewer.overlay.node());
                ElementsList.loadXML(SVGOverlayNode.children().first());
                SVGFunctions.SVGloadingDone();
                IDs.svg = id;
                IDs.canvasAnnotation = null;
                // options.protocols.newSVG.services[options.protocols.newSVG.default].new();
            });
        });
        
    },
    load: function(id) {
        var df = $.Deferred();
        if(id){
            $.when(options.protocols.loadSVG.services[parsedURL.queryParams.openSVGMethod].open(IDs.svg)).then(function(SVGdata){
                var svgNode = $(SeadragonViewer.overlay.node()).html(SVGdata);
                $.event.trigger({
                    type: "Seadragon.svgLoaded",
                    svgNode: svgNode.children("svg").first()
                });
                ElementsList.loadXML($(SeadragonViewer.overlay.node()).children().first());
                SVGFunctions.SVGloadingDone();
                return df.resolve();
            },
            function(error) {
                console.debug("LOADING SVG FAILED");
                console.debug(error);
            });
        }else{
            SVGFunctions.newSVG();
            return df.resolve();
        }
        return df.promise();
    },
    saveSVG: function () {
        $(this.svgContainer.root()).find("*").removeAttr("vector-effect");
        $(this.svgContainer.root()).find("*").removeClass("selected");
        
        return options.protocols.saveSVG.services[options.protocols.saveSVG.default].save();
    },
    
    registerEventHandlers: function () {
        // Context menu sends action
        $(document).on("svg.contextmenu", function(data) {
            switch(data.action){
                case "editElement":
                    console.debug("editElement");
                    var targetNodes = SVGFunctions.getElementNodesByNode(data.sourceNode);
                    var id = targetNodes.SVGElement.attr("id");
                    // console.debug(targetNodes);
                    var nodeType = targetNodes.SVGElement.prop("tagName");
                    // ToDo: reset clear all edit handlers
                    switch(nodeType){
                        case "rect":
                            SVGEditor.edit(id);
                            break;
                        default:
                            console.debug("no edit for nodetype '" + nodeType + "' yet.");
                    }
                    break;
                case "deleteElement":
                    SVGFunctions._deleteElement(data.sourceNode);
                    break;
                case "renameElement":
                    
                    var origTitleSpan = $(SVGFunctions.getElementTitle(data.sourceNode));
                    var origTitle = "";
                    // if theres a title use the original title, else (only id) leave the input field empty
                    if (origTitleSpan.hasClass("svg-element-title")){
                        // console.debug(origTitleSpan);
                        origTitle = origTitleSpan.html();
                    }
                    $("#dialog-renameElement").find("input[name='title']").val(origTitle);
                    $("#dialog-renameElement").dialog("open");
                    $(document).on("renameElement", function (dialogData) {
                        // console.debug(data);
                        // console.debug(dialogData);
                        SVGFunctions.setElementTitle(data.sourceNode, dialogData.title);
                        $(document).off("renameElement");
                    });
                    break;
                case "newGroup":
                    $("#dialog-newGroup").find("input[name='title']").val("");
                    $("#dialog-newGroup").dialog("open");
                    var targetNodeId = ElementsList.fancytree.getActiveNode().key;
                    $(document).on("newGroup", function (dialogData) {
                        // console.debug(targetNodeId);
                        SVGFunctions._newGroup(targetNodeId, dialogData.title);
                        $(document).off("newGroup");
                    });
                    break;
                case "sendToOCR":
                    var node = SVGFunctions.getElementNodesByNode(data.sourceNode);
                    var svgElement = node.SVGElement[0];
                    // console.debug(svgElement);
                    var boundingRect = svgElement.getBoundingClientRect();
                    // console.debug(boundingRect);
                    var iiifRegion = SVGFunctions.svgBBoxToImagePixels(boundingRect);
                    // console.debug(iiifRegion);
                    var tileSource = SeadragonViewer.instance.viewport.viewer.source;
                    var qualityString = SeadragonViewer.instance.viewport.viewer.source.qualities[0];
                    // IF IIIF service supports conversion into grey, convert
                    if (tileSource.qualities.indexOf("gray") !== -1){
                        qualityString = "gray";
                    }
                    var iiifURI = tileSource['@id'] + "/" +
                        Math.ceil(iiifRegion.x) + "," +
                        Math.ceil(iiifRegion.y) + "," +
                        Math.abs(Math.ceil(iiifRegion.width)) + "," +
                        Math.abs(Math.ceil(iiifRegion.height)) +
                        "/full/0/" +
                        qualityString + ".jpg";
                    var ocrService = options.protocols.ocr.services[options.protocols.ocr.default];
                    log("sending region to OCR Server ...");
                    ocrService.send(iiifURI).then(function(data) {
                        var resultTextarea = $('<textarea style="width:100%;height:100%;">' + data + '</textarea>');
                        $("#dialog-result").find(".text_short").html("OCR result:");
                        $("#dialog-result").find(".text_detail").html(resultTextarea);
                        $("#dialog-result").dialog("open");
                        log("OCR Server returned an answer", "success");
                    });
                    break;
            }
        });

    },

    changeSVGElementStroke: function(svgElement, color) {
        svgElement.css("stroke", color);
        svgElement.attr("stroke", color);
    },
    
    _newGroup: function(parentId, title) {
        var uuid = this._newId();
        var targetNode = this.svgContainer.getElementById(parentId);
        var newGroup = this.svgContainer.group(targetNode, uuid);
        this.svgContainer.title(newGroup, title);
        // console.debug("parentId: " + parentId)
        ElementsList.addElementToContainer(parentId, newGroup);
        // this.addListElement("g", uuid, $("#svg-elements-list div." + parentId + ".childList"));
        return newGroup;
    },

    // _renameElement: function(node) {
    //     var nodes = this.getElementNodesByNode(node);
    //     // console.debug(nodes);
    //     // nodes.listElement
    // },
    _deleteElement: function(node) {
        var id = this.getElementIdByNode(node);
        // remove node from fancytree (callback deletes the SVG element)
        ElementsList.fancytree.getNodeByKey(id).remove();
        SVGFunctions._activateAction("select", "true");
        log("<b>deleted</b> element with id <b>" + id + "</b>", "info");
    },
    
    getElementIdByNode: function(node) {
        console.debug(node);
        var nodes = this.getElementNodesByNode(node);
        return nodes.SVGElement.attr("id");
    },
    
    getElementNodesByNode: function(node) {
//        console.debug(node);
        var elementId = null;
        if(typeof(node[0]) !== "undefined"){
            // // if node is part of the svg dom, return the svg:element/@id attribute. Else get the closest .svg-list-item ancestor
            if ($.svg.isSVGElem(node[0])){
                elementId = node.attr("id");
            // node part of fancytree?
            }
            else if (node.attr("class").indexOf("fancytree-") !== -1){
                console.debug("fancytree node. ID/Key " + elementId);
                console.debug(node);
                var ftNode = $.ui.fancytree.getNode(node[0]);
                elementId = ftNode.key;
            }else{
                elementId = node.parents(".svg-list-item").andSelf().first().attr("elementid");
            }
            return this.getElementNodesById(elementId);
        }
        else {
            return null;
        }
    },
    
    getElementNodesById: function(elementId) {
        // remove element from SVG and from list
        // var listElement = $("#" + this.svgListContainerId).find("div[elementid='" + elementId + "']");
        var SVGElement = $(this.svgContainer.getElementById(elementId));
        return {
            // listElement: listElement,
            SVGElement: SVGElement,
            ftElement: ElementsList.fancytree.getNodeByKey(elementId)
        };
    },
    
    getSVGElementById: function(id){
        return this.svgContainer.getElementById(id);
    },
    
    getElementTitle: function(node) {
        if(node[0]){
            var elementNodes = this.getElementNodesByNode(node);
            var elementId = elementNodes.SVGElement.attr("id");
            // return @id if no title node given
            var titleNode = elementNodes.SVGElement.children("title").first();
            var title = titleNode[0]?"<span class='svg-element-title'>" + titleNode.text() + "</span>":"<span class='svg-element-title-id'>ID: " + elementId + "</span>";
            return title;
        }
        else {
            return null;
        }
    },
    
    setElementTitle: function(node, title) {
        console.debug("setting Element Title");
        var elementNodes = this.getElementNodesByNode($(node));
        console.debug(elementNodes);
        // var formerTitle = elementNodes.SVGElement.children("title").first().val();
        // //remove the former node
        elementNodes.SVGElement.children("title").remove();
        elementNodes.SVGElement.prepend("<title>" + title + "</title>");
        //Update the FT node
        // console.debug(elementNodes.SVGElement.attr("id"));
        ElementsList.setTitle(elementNodes.SVGElement.attr("id"), title);
        // var listNodeSpan = SVGFunctions.getElementTitle(elementNodes.SVGElement);
        // elementNodes.listElement.children("span").remove();
        // if(title !== "") elementNodes.listElement.append(listNodeSpan);
        log("Renamed Node to '" + title + "'", "info");
    },
    
    // // Calculate coords from transformed window rect (x, y, width, height) to image rect
    // windowRectToImageRect: function(windowRect) {
    //     console.debug("winRectTo");
    //     var windowCoordPoint = new OpenSeadragon.Point(windowRect.x, windowRect.y);
    //     var windowWidthHeight = {width: windowRect.width, height: windowRect.height};
    //     var imageCoordPoint = SeadragonViewer.instance.viewport.windowToImageCoordinates(windowCoordPoint);
    //     var imageWidthHeight = SeadragonViewer.instance.viewport.windowToImageCoordinates(new OpenSeadragon.Point(windowWidthHeight.width, windowWidthHeight.height));
    //     return{
    //         x: imageCoordPoint.x,
    //         y: imageCoordPoint.y,
    //         width: imageWidthHeight.x,
    //         height: imageWidthHeight.y
    //     };
    // },
    
    // get absolute x and y of an svg element (relative to svg root)
    getAbsPos: function(elementId) {
        var element = this.getSVGElementById(elementId);
        var root = SeadragonViewer.overlay.node();
        var parents = $(element).parentsUntil(root);
        parents.each(function(index, data){
            console.debug(data);
        });
    },

    _addPath: function(x, y, fillColor){
        var targetElementId = ElementsList.fancytree.getActiveNode().key;
        var svgObj = this.svgContainer;
                
        var targetNode = svgObj.getElementById(targetElementId);
        var uuid = this._newId();
        
        console.debug("M" + x + " " + y + " Z");
        console.debug(fillColor);
        
        var path = svgObj.path(targetNode, "M" + x + " " + y + " Z", {
                                            fill: fillColor, 
                                            stroke: this.svgElementSelectionStrokeColor, 
                                            strokeWidth: 2
                });
        svgObj.change(path, {id: uuid});
        ElementsList.addElementToContainer(targetElementId, path);

        // SVGFunctions.addListElement("path", uuid, $("#svg-elements-list div." + targetElementId + ".childList"));
        SVGEditor.Path.edit(uuid);

    },
    _addRectangle: function(x, y, w, h, fillColor){
        var svgObj = this.svgContainer;
        var targetNode = svgObj.getElementById(ElementsList.fancytree.getActiveNode().key);

        var rect = svgObj.rect(targetNode, x, y, 1, 1,  {
                                            fill: fillColor, 
                                            stroke: this.svgElementSelectionStrokeColor, 
                                            strokeWidth: 2
                });
                
        var uuid = this._newId();
        this.activeSVGElement = $(rect);
        svgObj.change(rect, {id: uuid});
        console.debug("new Rect created: " + uuid);

        ElementsList.addElementToContainer(ElementsList.fancytree.getActiveNode().key, rect);
        // SVGFunctions.addListElement("rect", uuid, $("#svg-elements-list div." + targetElementId + ".childList"));
        SVGEditor.Rect.edit(uuid);
        // Trigger 
        // emulate left click on bottom right dragger
        // event.type = "mousedown";
        var fakeEvent = jQuery.Event("mousedown",
            {
                target: "rect#corner-bottomright",
                which: 1
            });
        $("rect#corner-bottomright").trigger(fakeEvent);

    },

    _activateActionButton: function(actionName) {
        var actionButton = $("#svg-edit-buttons > span.button[data-action=" + actionName + "]");
        // console.debug(actionButton);
        // console.debug("actionName: " + actionName + " buttonActivated: " + actionButton.hasClass("button-activated"));
        if(actionButton.length > 0 && !(actionButton.hasClass("button-activated"))){
            // deactivate the last activated
            $("#svg-edit-buttons > span.button.button-activated").removeClass("button-activated");
            actionButton.addClass("button-activated", true);
        }
    },
    
    _activateAction: function(actionName, activate) {
//        console.debug("_activateAction: " + actionName + " (" + activate + ")");
        if (activate){ 
            this._activateActionButton(actionName);
        } 
        switch(actionName){
            case "select":
                if(activate){
                    SVGEditor.stopAction();
                    //be sure, all events are detached
                    this._unregisterSVGEventHandlers();
                    //attach the list and svg events
                    this._registerSVGEventHandlers();
                }else{
                    SVGEditor.stopAction();
                    this._unregisterSVGEventHandlers();
                }
                break;
            case "newRect":
            // if drawingMode was activated, deactivate
                if(activate){
                    SVGEditor.stopAction();
                    this._unregisterSVGEventHandlers();
                    SVGEditor.startAction("rect", "draw");
                }else{
                    SVGEditor.stopAction();
                    this._registerSVGEventHandlers();
                }
                break;
            case "newPath":
            // if drawingMode was activated, deactivate
                if(activate){
                    SVGEditor.stopAction();
                    this._unregisterSVGEventHandlers();
                    SVGEditor.startAction("path", "draw");
                }else{
                    SVGEditor.stopAction();
                    this._registerSVGEventHandlers();
                }
                break;
            case "newGroup":
                if(activate){
                    SVGEditor.stopAction();
                    // console.debug($(".svg-list-item.selected"));
                    $.event.trigger({
                        type: "svg.contextmenu",
                        action: "newGroup",
                        sourceNode: $(".svg-list-item.selected")
                    });
                }
                break;
        }
    },
    
    enableAction: function(actionName, enable) {
        var _self = this;
        // $("#svg-edit-buttons > span.button").removeClass("button-activated");
        $(_self.svgContainer.root()).css("cursor", ""); //reset cursor

        var button = $("#svg-edit-buttons > span[data-action=" + actionName + "]");
        // console.debug(button);
        // console.debug('$("#svg-edit-buttons > span[data-action=' + actionName + ']")');
        button.toggleClass("button-disabled", !enable);
    },

    // recursivelyAddElements: function(svgsource, targetDiv){
    //     var _self = this;
    //     svgsource.children().each(function( i, data) {
    //         var color = SVGEditor.getFillColor($(this).attr("id"));
    //         $.event.trigger({type: "SVGEditor.colorpicker.addColor", color:color});

    //         var elementId = $(this).attr('id');
    
    //         var resultDiv = SVGFunctions.addListElement(this.tagName, elementId, targetDiv);
    //         // _self._addDroppableToListElement(resultDiv);
    //         SVGFunctions.recursivelyAddElements($(this), resultDiv);
    //     });
    // },
    
    // addListElement: function(type, elementId, targetDiv) {
    //     var svgElement = $(this.svgContainer.getElementById(elementId));
    //     var title = this.getElementTitle(svgElement);
    //     var append = "";
    //     var children = "";
    //     switch(type){
    //         case "g":
    //             append = $('<div class="svg-list-item svg-group" elementId="' + elementId + '" contextmenu-element-id="menu-context-group">&#x251C;&nbsp;' + title + '</div>');
    //             children = $('<div class="' + elementId + ' childList" />');
    //             break;
    //         case "rect":
    //             append = $('<div class="svg-list-item svg-rect" elementId="' + elementId + '" contextmenu-element-id="menu-context-rect">&#x251C;&nbsp;(rect) ' + title + '</div>');
    //             break;
    //         case "path":
    //             append = $('<div class="svg-list-item svg-path" elementId="' + elementId + '" contextmenu-element-id="menu-context-path">&#x251C;&nbsp;(path) ' + title + '</div>');
    //             break;
    //         case "svg":
    //             append = $('<div class="svg-list-item svg-svg" elementId="' + elementId + '" contextmenu-element-id="menu-context-svg">&#x251C;&nbsp;(SVG) ' + title + '</div>');
    //             children = $('<div class="' + elementId + ' childList" />');
    //             break;
    //         // default:
    //         //     this.registerSVGElementHandles(append, svgElement);
    //     }
        
    //     if (append){
    //         // if(type != "svg")
    //         targetDiv.append(append);
    //     }
        
    //     if (children) targetDiv.append(children);
    //     return children;
    // },
    
/*    _addDroppableToListElement: function(listElementNode) {
        // console.debug(listElementNode);
        // listElementNode.append($('<div style="border:1px solid black; width: 100%;height:10px" class="listDropTarget" data-doppableFor="' + elementId + '"/>'));
    },
*/    
    // _makeElementDraggable: function(elementNode) {
    //     elementNode.draggable({
    //         revert: true,
    //     // // scope: "targets",
    //         zIndex: 200,
    //         // appendTo: "body",
    //         cursor: "grabbing", 
    //         cursorAt: { top: 0, left: 0 },
    //     // helper: function(){
    //     //     var clone = $(this).clone().css("pointer-events","none").remove(".target-detail");
    //     //     return clone;
    //     });
    // },
    
    
    // resetElementList: function() {
    //     $('#svg-elements-list').empty();
    // },
    
    SVGloadingDone: function(){
        // this.resetElementList();
        // this.recursivelyAddElements($(this.svgContainer.root()) , $('#svg-elements-list'));
    },
    svgBBoxToImagePixels: function (BboxRect) {
        var containerOffset = {
            x: $('#binary-container')[0].offsetLeft - $('#binary-container')[0].getBoundingClientRect().left,
            y: $('#binary-container')[0].offsetTop - $('#binary-container')[0].getBoundingClientRect().top
        };
        var topleft = new OpenSeadragon.Point(BboxRect.left + containerOffset.x, BboxRect.top + containerOffset.y);
        var bottomright = new OpenSeadragon.Point(BboxRect.left + BboxRect.width + containerOffset.x, BboxRect.top + BboxRect.height + containerOffset.y);
        var imageXY = SeadragonViewer.instance.viewport.windowToImageCoordinates(topleft);
        var imageWH = SeadragonViewer.instance.viewport.windowToImageCoordinates(bottomright).minus(imageXY);
        
        return new OpenSeadragon.Rect(imageXY.x, imageXY.y, imageWH.x, imageWH.y);
    },
    xpath: function (element) {
        var containerXpath = XMLFunctions.xpath($(SeadragonViewer.overlay.node()).children("svg").get(0));
        var elementXpath = XMLFunctions.xpath(element);
        // console.debug(elementXpath.substr(containerXpath.length));
        return elementXpath.substr(containerXpath.length);
    },
    applySelector: function(selector){
        selector = (selector.substring(0,1) === ".")?selector:"." + selector;
        //prefix each part of the selector
        // ToDo: chech for existing prefix
        selector = selector.replace(/(\/+)/g, "$1svg:");
        return $($(SeadragonViewer.overlay.node()).children("svg").get(0)).xpath(selector, function(prefix) {
                if (prefix === "svg"){
                    return "http://www.w3.org/2000/svg";
                }
            });
    },
    
    // moveElement: function(element, target) {
    //     var group = this._newGroup("uuid-7d4759dd-af6f-4399-8962-6652a6586db2", "testgruppe");
    //     console.debug(group);
        
        
    //     validTargetNodeNames = ["svg", "g"];
    //     var targetNodes = this.getElementNodesByNode(target);
    //     // console.debug(targetNodes);
    //     // check if target exists and if it's valid 
    //     if (targetNodes && validTargetNodeNames.indexOf(targetNodes.SVGElement[0].nodeName) != -1) {
    //         var elementNodes = this.getElementNodesByNode(element);
    //         var tempSVGElement = elementNodes.SVGElement.clone(true);
    //         // var tempListElement = elementNodes.listElement.clone(true);
    //         elementNodes.SVGElement.remove();
    //         // elementNodes.listElement.remove();
    //         targetNodes.SVGElement.append(tempSVGElement);
            
    //         // Append to ChildList div
    //         var listElementId = targetNodes.listElement.attr("elementid");
    //         var childList = targetNodes.listElement.parent().find("." + listElementId + ".childList");
    //         console.debug(targetNodes.listElement.parent().find("." + listElementId + ".childList"));
            
    //         childList.append(tempListElement);
    //     } else {
    //         return false;
    //     }
    // },
/*    _test_addNewRectangle: function() {
        var fillColor = SVGEditor.elementColorpicker.spectrum("get");
        // set the default alpha
        fillColor.setAlpha(SVGEditor.defaultAlpha);
        ElementsList.fancytree.activateKey("1");
        console.debug(this._addRectangle(500, 500, 300, 300, fillColor, "test!"));
    }*/
};
var tabFunctions = {
    instance: null,
    init: function(options) {
        this._getProtocols();
        $('#loadXML\\.submit').on("click", function (argument) {
            tabFunctions.loadXML();
        });
        tabFunctions.instance = $("#tabs").tabs({});
        // DEBUG
        $('#loadXML\\.uri').val("/exist/rest/db/data/commons/Naddara/uuid-34a1979d-ce93-4620-a6b9-7dae7b4ea12c.xml");
    },
    _getProtocols: function (){
        // append protocols to selector
        $.each(options.protocols.loadXML, function(idx, data) {
            $('#loadXML\\.protocol').append('<option name="' + idx + '"' + (data.default?' selected="selected"':"") + '>' + data.title + '</option>');
        });
    },
    loadXML: function () {
        var uri = $('#loadXML\\.uri').val();
        var protocolIdx = $('#loadXML\\.protocol').find("option:selected").attr("name");
        // get the protocol
        var protocol = options.protocols.loadXML[protocolIdx];
        
        // try to load the xml
        $.when(XMLFunctions.loadXML(protocolIdx, uri)).then(function(data) {
            console.debug(data);
            // loading Successful, add tab
            var tabs = $('div#tabs ul > li');
            var tabIndexes = [];
                $.each(tabs, function (argument) {
                    tabIndexes.push(parseInt($(this).index(), 10));
                });
            
            // var newTabId = "xmltab-" + (Math.max(...tabIndexes) + 1);
            var newTabId = "xmltab-" + (Math.max.apply(null, tabIndexes) + 1);
            var tabHTML = $("<li><a href='#" + newTabId + "'><span>" + data.title + "<span class='ui-icon ui-icon-circle-close ui-tab-close-button' alt='close'></span></span></a></li>").insertBefore(tabs.last());
            tabHTML.find(".ui-icon.ui-icon-circle-close").on("click", function(event) {
                tabFunctions.closeTab($(event.target).closest("li"));
            });
            //add XML data
            var xmlDataNode = $("div#tabs").append('<div class="xml-data-node" id=' + newTabId + ' data-source-uri="' + data.uri + '"></div>');
            // register new XMLDisplay
            var display = new XMLDisplay($('#' + newTabId));
            display.setXMLData(data.xmlData.html());
            $("div#tabs").tabs("refresh");
        }, function(data) {
            log("Loading XML failed: " + data.status + ": " + data.statusText, "error");
        });
    },
    closeTab: function(tabListItem) {
        // remove the xml data display
        $("#" + tabListItem.attr("aria-controls")).remove();
        tabListItem.remove();
        $('#tabs').tabs( "refresh" );
    }
};
/* exported XMLDisplay */
function XMLDisplay(targetNode) {
    var self = this;
    this.targetNode = targetNode;
    this.reset = function() {
        // body...
    };
    this.setXMLData = function(xmlData) {
        self.targetNode.empty();
        self.targetNode.html(xmlData);
        self._registerListener(self.targetNode.find(".node"));
        // self._registerOpenCloseListener(self.targetNode.find(".openclose"));
    };
    
    this._registerListener = function(elements) {
        // console.debug(elements);
        elements.hover(function() {
            $(this).css('cursor','pointer');
        }, function() {
            $(this).css('cursor','auto');
        });
        
        // console.debug(element);
        elements.on("click", function(event) {
            console.debug(event);
            var eventData = {
                xpath: $(event.target).closest('.xml-data-node').attr('data-source-uri') + "?" + encodeURIComponent($(event.target).attr("data-xpath")),
                namespace: $(event.target).attr("data-namespace"),
                source: $(event.target).closest("div.xml-data-node")
            };

            $.event.trigger({
                type: "XMLFunctions.selectNode",
                event: event,
                eventData: eventData
            });

            console.debug(eventData);
        });
    };
    this._registerOpenCloseListener = function(elements){
        elements.hover(function() {
            $(this).css('cursor','pointer');
        }, function() {
            $(this).css('cursor','auto');
        });

        elements.on("click", function(event) {
            $(event.target.nextSibling).toggle();
        });
    };
}

var XMLFunctions = {
    options: {
        showEmptyAttributes: false
    },
    nl2br: function (string) {
        return string.replace(/\n/g, "<br />");
    },
    xpath: function(el) {
        if (typeof el === "string") {
            return document.evaluate(el, document, null, 0, null);
        }
        if (!el || el.nodeType !== 1) {
            return '';
        }
        // if (el.id) return "//*[@id='" + el.id + "']";
        // else if (el.attributes.ID) return "//*[@ID='" + el.attributes.ID.value + "']";
        // else if (el.attributes["xml:id"]) return "//*[@xml:id='" + el.attributes["xml:id"].value + "']"; 
        var sames = [].filter.call(el.parentNode.children, function (x) { 
            return x.tagName === el.tagName;
        });
        return XMLFunctions.xpath(el.parentNode) + '/' + el.tagName + '['+([].indexOf.call(sames, el)+1)+']';
    },

    loadXML: function(protocol, uri) {
        var df = $.Deferred();
        $.when(options.protocols.loadXML[protocol].load(uri)).then(function(returnData, textStatus) {
            var xmlAsHtml = XMLFunctions.XMLtoHTML(returnData.xmlData);
            var data = {
                uri: returnData.uri,
                title: returnData.title,
                xmlData: xmlAsHtml
            };
            return df.resolve(data, textStatus);
        },function (data, textStatus) {
            return df.reject(data, textStatus);
        });
        
        return df.promise();
    },

    XMLtoHTML: function(nodeList){
        // var openClose = '<span class="openclose">+</span>';
        var html = $('<div style="margin-left:30px"></div>');
        $.each(nodeList, function(idx, data) {
            switch(this.nodeType){
                // ElementNode
                case 1:
                    // console.debug(this.nodeName);
                    var attributes = this.attributes;
                    var attributesHtml = $("<span/>");
                    $.each(attributes, function (idx, attributeData) {
                        if(attributeData.value || XMLFunctions.options.showEmptyAttributes) {
                            attributesHtml.append("&nbsp;<span class='attribute-name'>" + attributeData.nodeName + "</span>=\"<span class='attribute-value'>" + attributeData.value + "</span>\"");
                        }
                    });
                    var open = '<div class="node" data-namespace="' + this.namespaceURI +'" data-xpath="' + XMLFunctions.xpath(this) + '">&lt;' +
                                    this.nodeName  + attributesHtml.html() + '&gt;</div>';
                    var close = '<div class="node-close">&lt;/' + data.nodeName + '&gt;</div>';
                    html.append(open);
                    // html.prepend(openClose);
                    if(this.childNodes.length !== 0 ) {
                        html.append(XMLFunctions.XMLtoHTML(this.childNodes));
                    }
                    html.append(close);

                    break;
                // textNode
                case 3:
                    html.append(XMLFunctions.nl2br($.trim(this.textContent)));
                    break;
            }
        });
        return html;
    },
    XMLtoJSON: function(node){
        // console.debug($(node).children);
        // var json = {
        //     id: xmlnode 
        // }
        // Generate the json objects
        var childNodes = [];
        console.debug(childNodes);
        $.each($(node).children(), function() {
            childNodes.push(XMLFunctions.XMLtoJSON($(this)));
            // console.debug($(data));
        });

        return {
            text: $(node)[0].nodeName,
            children: childNodes
        };
    },
    getNamespaceDeclarations: function(elements){
        var xmlnsAttr = [];
        elements.each(function() {
            var attributes = this.attributes;
            $(attributes).each(function(){
                if (this.name.startsWith("xmlns")){
                    xmlnsAttr.push(this);
                }
            });
        });
        return xmlnsAttr;
    }
};