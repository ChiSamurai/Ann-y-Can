
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