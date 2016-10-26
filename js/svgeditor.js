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
