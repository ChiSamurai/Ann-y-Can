var SeadragonViewer = {
    allowDrag: true,
    self: this,
    imageCoords: {x: 0, y: 0},
    /*    
    onViewerMove: function(event) {
        // Fire movement event (only if source is loaded)


        if(SeadragonViewer.instance.source){
            var imgWidth = SeadragonViewer.instance.source.width;
            var imgHeight = SeadragonViewer.instance.source.height;

            var viewportPoint = SeadragonViewer.instance.viewport.pointFromPixel(event.position);
            var imagePoint = SeadragonViewer.instance.viewport.viewportToImageCoordinates(viewportPoint.x, viewportPoint.y);
            // Only accept values between 0 and imgWidth
            if (imagePoint.x < 0) imagePoint.x = 0;
            else if (imagePoint.x > imgWidth) imagePoint.x = imgWidth; 
            else imagePoint.x = Math.ceil(imagePoint.x);
    
            // Only accept values between 0 and imgHeight
            if (imagePoint.y < 0)  imagePoint.y = 0;
            else if (imagePoint.y > imgHeight) imagePoint.y = imgHeight; 
            else imagePoint.y = Math.ceil(imagePoint.y);
    
            // $( SeadragonViewer ).trigger("click", imagePoint);
            SeadragonViewer.imageCoords.x = imagePoint.x;
            SeadragonViewer.imageCoords.y = imagePoint.y;
            $.event.trigger({
                type: "mouseMovement",
                point: imagePoint
            });
        }
    },
*/
/*
    onViewerDrag: function (event) {
        if(!(SeadragonViewer.allowDrag)){
            event.preventDefaultAction = true;
            event.stopBubbling = true;
        }
    },
*/
    onViewerClick: function(eventData) {
        //console.debug(eventData);
        if(eventData.quick){
//            var offsetCoordinates = new OpenSeadragon.Point(eventData.position.x, eventData.position.y);
//            var viewportCoordinates = SeadragonViewer.instance.viewport.windowToImageCoordinates(offsetCoordinates);
            var clientRect = SeadragonViewer.overlay.node().getClientRects()[0];
            var viewportPoint = {
                x: eventData.originalEvent.clientX - clientRect.left,
                y: eventData.originalEvent.clientY - clientRect.top
            };
            var imagePoint = SeadragonViewer.instance.viewport.windowToImageCoordinates(new OpenSeadragon.Point((viewportPoint.x + SVGEditor.container[0].offsetLeft), (viewportPoint.y + SVGEditor.container[0].offsetTop)));

            // var imageCoords = SVGEditor.mousePosToImageCoords({x: eventData.originalEvent.clientX, y: eventData.originalEvent.clientY});
            // console.debug(imageCoords);
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

/*    viewportToImageCoords: function(viewportCoords) {
        if(SeadragonViewer.instance.source){
            var windowPoint = new OpenSeadragon.Point(200, 200);
            var imagePoint = SeadragonViewer.instance.viewport.windowToImageCoordinates(windowPoint);
            var percentagePoint = SeadragonViewer.pixelPointToPercentage(imagePoint);
            return {
                pixelCoords: imagePoint,
                percentageCoords : percentagePoint
            };
        }
    },
*/
    init: function(options) {
        console.debug("OSDInit");
        this.instance = new OpenSeadragon(options);
        this.instance.gestureSettingsMouse.clickToZoom = false;
        this.instance.addHandler("canvas-click", this.onViewerClick);

        this.instance.addHandler("open-failed", function () {
            console.debug("OPEN FAILED");
        });
//        this.instance.addHandler("pan", this.onViewerMove);
        
/*
        this.instance.addViewerInputHook({hooks: [
            {tracker: 'viewer', handler: 'clickHandler', hookHandler: SeadragonViewer.onViewerClick},
            {tracker: 'viewer', handler: 'moveHandler', hookHandler: SeadragonViewer.onViewerMove},
            {tracker: 'viewer', handler: 'dragHandler', hookHandler: SeadragonViewer.onViewerDrag}
        ]});
*/
        //this.imagingHelper = this.instance.activateImagingHelper();
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

//        SeadragonViewer.instance.open(binaryImageSourceIRI);
    },
    
    // loadSVG: function(SVGIRI) {
    //     $(SeadragonViewer.overlay.node()).load(SVGIRI, function(){
    //         // console.debug("complete");
    //         // console.debug($("#svg-elements-list"));
    //         svgNode = $(SeadragonViewer.overlay.node());
    //         $.event.trigger({
    //             type: "Seadragon.svgLoaded",
    //             svgNode: svgNode.children("svg").first()
    //         });
    //         SVGFunctions.SVGloadingDone();
    //     });
    // },

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
