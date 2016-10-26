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