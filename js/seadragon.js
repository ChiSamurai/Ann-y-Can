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
