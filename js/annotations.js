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

