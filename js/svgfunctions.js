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
            _self._addRectangle(data.event.point.x, data.event.point.y, 1, 1, data.fillColor);
            console.debug(data.event);
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
                    var qualityString = "default";
                    // IF IIIF service supports conversion into grey, convert
                    if (tileSource.profile[1].qualities.indexOf("gray") !== -1){
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
                        $("#dialog-result").find(".text_details").html(resultTextarea);
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
        var svgObj = $(svgNode).svg('get');
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
        var svgObj = $(svgNode).svg('get');
        var targetNode = svgObj.getElementById(ElementsList.fancytree.getActiveNode().key);
        // console.debug(targetElementId);
        // console.debug(targetNode);

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