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