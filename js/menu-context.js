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