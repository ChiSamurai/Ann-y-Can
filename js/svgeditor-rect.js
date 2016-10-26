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