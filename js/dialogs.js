var Dialogs = {
    init: function(initialVisibility){
        var def = new $.Deferred();
        $( "#dialog-result" ).dialog(
            {
                autoOpen: false,
                modal: true,
                buttons: [
                    {
                        text: "Ok",
                        click: function() {
                            $( this ).dialog( "close" );
                        }
                    }
                ]
            });

        $( "#dialog-open-image" ).dialog(
            {
                autoOpen: false,
                height: 300,
                width: 400,
                modal: true,
                buttons: [
                    {
                        text: "Cancel",
                        click: function() {
                            $( this ).dialog( "close" );
                        }
                    },
                    {
                        text: "Ok",
                        click: function() {
                            if(confirm("open new?")){
/*                                console.debug($('#dialog-open-image').find("textarea[name=source-input]"));
                                console.debug($('#dialog-open-image').find("textarea[name=source-input]").val());
*/
                                var binaryImageSourceIRI = $('#dialog-open-image').find("textarea[name=source-input]").val();
                                Menu.Open.Image.selectedProt.open(binaryImageSourceIRI);
                                SVGFunctions.newSVG(binaryImageSourceIRI);
                                $( this ).dialog( "close" );
                            }
                        }
                    }
                ]
            });
        // init Open Image Dialog
        Menu.Open.Image.init();


        $( "#dialog-open-canvas" ).dialog(
            {
                autoOpen: false,
                height: 300,
                width: 400,
                modal: true,
                buttons: [
                    {
                        text: "Cancel",
                        click: function() {
                            $( this ).dialog( "close" );
                        }
                    },
                    {
                        text: "Ok",
                        click: function() {
                            var IRI = $(this).find("input[name='IRI']").val();
                            SeadragonViewer.loadSVG(IRI);
                            $( this ).dialog( "close" );
                        }
                    }
                ]
            });

        $( "#dialog-new-canvas" ).dialog(
            {
                autoOpen: false,
                resizable: false,
                modal: true,
                buttons: {
                    "Create new canvas": function() {
                        SVGFunctions.newSVG();
                        $( this ).dialog( "close" );
                    },
                    Cancel: function() {
                        $( this ).dialog( "close" );
                    }
                }
            }
        );
        $( "#dialog-newGroup").dialog(
            {
                autoOpen: false,
                height: 200,
                modal:true,
                buttons: [
                    {
                        text: "Cancel",
                            click: function () {
                                $( this ).dialog( "close" );
                            }
                    },
                    {
                        text: "Create",
                        click: function() {
                            $.event.trigger({
                                type: "newGroup",
                                title: $.trim($(this).find("input[name='title']").val())
                            });
                            $( this ).dialog( "close" );
                        }
                    }
                ]
            });
        $( "#dialog-renameElement").dialog(
            {
                autoOpen: false,
                // height: 200,
                modal:true,
                buttons: [
                    {
                        text: "Cancel",
                            click: function () {
                                $( this ).dialog( "close" );
                            }
                    },
                    {
                        text: "Rename",
                        click: function() {
                            $.event.trigger({
                                type: "renameElement",
                                title: $.trim($(this).find("input[name='title']").val())
                            });
                            $( this ).dialog( "close" );
                        }
                    }
                ]
            });
        $( "#dialog-showIIIFInfo").dialog(
            {
                autoOpen: false,
                height: 200,
                modal:false
            });
        
        // $("#annotation-target-resource").val("i_af81ff5f-4052-5956-8a40-fcc114448b95");
        $("#annotation-target-open").on("mouseup keypress", function(event) {
            if(event.type !== "keypress" || (event.which === 13 || event.which === 32)){
                var resource = $("#annotation-target-resource").val();
                Annotations.loadTargets(resource);
            }
        });
        $("#annotation-target-resource").on("keypress", function(event) {
            if(event.which === 13){
              $('#annotation-target-open').trigger("mouseup");
            }
        });

            
        // Main Dialogs
        $( "#svg" ).resizable();

        $( "#svg-elements" ).dialog(
            { 
                // height: 'auto',
                dialogClass: "main-dialogs",
                autoOpen: initialVisibility["svg-elements"],
                closeOnEscape: false,
                title: "SVG Elements",
                // position: { my: "left top", at: "left bottom", of: '#navbar-collapse-1' },
                position: { my: "left top", at: "left bottom", of: '#menu-container' },
                height: $(window).height() - $('#menu-container').height(),
                maxHeight: $(window).height() - $('#menu-container').height()
            });
        // Set corresponding menu checkbox checked?
        $('.menuitem > ul > li[data-dialog="svg-elements"] > input[type="checkbox"].displayStatus').prop("checked", initialVisibility["svg-elements"]);
        
        $( "#annotations-pool" ).dialog(
            { 
                // height: 'auto',
                dialogClass: "main-dialogs",
                closeOnEscape: false,
                autoOpen: initialVisibility["annotations-pool"],
                title: "Annotations Pool",
                // position: { my: "right top", at: "right bottom", of: '#navbar-collapse-1' },
                position: { my: "right top", at: "right bottom", of: '#menu-container' },
                height: $(window).height() - $('#menu-container').height(),
                maxHeight: $(window).height() - $('#menu-container').height()
            });
        // Set corresponding menu checkbox checked?
        $('.menuitem > ul > li[data-dialog="annotations-pool"] > input[type="checkbox"].displayStatus').prop("checked", initialVisibility["annotations-pool"]);

        $( "#annotations-display" ).dialog(
            { 
                height: 200,
                closeOnEscape: false,
                dialogClass: "main-dialogs",
                autoOpen: initialVisibility["annotations-display"],
                title: "existing annotations",
                // position: { my: "right top", at: "right bottom", of: '#navbar-collapse-1' },
                position: { my: "left botton", at: "right bottom", of: "#svg-elements"},
                width: $(window).width() - $("#annotations-pool").dialog("option", "width") - $("#svg-elements").dialog("option", "width"),
                maxHeight: $(window).height() - $('#menu-container').height()
            });
        // Set corresponding menu checkbox checked?
        $('.menuitem > ul > li[data-dialog="annotations-display"]> input[type="checkbox"].displayStatus').prop("checked", initialVisibility["annotations-display"]);

        $( "#log-console" ).dialog(
            { 
                height: 200,
                closeOnEscape: false,
                dialogClass: "main-dialogs log",
                autoOpen: initialVisibility["log-console"],
                title: "Log",
                position: { my: "left botton", at: "right bottom", of: "#svg-elements"},
                width: $(window).width() - $("#annotations-pool").dialog("option", "width") - $("#svg-elements").dialog("option", "width"),
                maxHeight: 200
            });
    
        // Set corresponding menu checkbox checked?
        $('.menuitem > ul > li[data-dialog="log-console"]> input[type="checkbox"].displayStatus').prop("checked", initialVisibility["log-console"]);

        // the save and leave dialog
        $("#dialog-leave-site").dialog({
            autoOpen:false,
            resizable: false,
            height: "auto",
            width: 400,
            modal: true,
            buttons: {
                "save and leave": function() {
                    Dialogs.saveAndLeave();
                },
                "continue working": function() {
                    $( this ).dialog( "close" );
                }
            }
        });

        $("#dialog-result").dialog({
            autoOpen:false,
            resizable: false,
            height: "auto",
            width: 400,
            modal: true,
            hide: { effect: "fadeOut", duration: 150 },
            show: { effect: "fadeIn", duration: 150 }
        });
        return def.resolve();
    },

    showResultDialog: function(type, shortMessage, detailMessage, autoCloseAfterMs) {
        $("#dialog-result").find("span.text_short").removeClass("success error notice");
        $("#dialog-result").find("span.text_short").addClass(type);
        $("#dialog-result").find("span.text_short").html(shortMessage);
        $("#dialog-result").find("span.text_detail").html(detailMessage);
        switch(type){
            case "success":
                $("#dialog-result").find("span.ui-icon").removeClass().addClass("ui-icon ui-icon-check");
                $("#dialog-result").dialog("option", "title", "success");
                break;
            case "error":
                $("#dialog-result").find("span.ui-icon").removeClass().addClass("ui-icon ui-icon-closethick");
                $("#dialog-result").dialog("option", "title", "Action failed");
                break;
/*            case "notice": */
            default:
                $("#dialog-result").find("span.ui-icon").removeClass().addClass("ui-icon ui-icon-info");
                $("#dialog-result").dialog("option", "title", "Notice");
        }
        if(autoCloseAfterMs && !isNaN(autoCloseAfterMs)){
            $("#dialog-result").dialog("option", "buttons", {});
            setTimeout(function() {
                $("#dialog-result").dialog("close");
            }, autoCloseAfterMs);
        }else{
            $("#dialog-result").dialog("option", "buttons", {
                Ok: function() {
                    $(this).dialog("close");
                }
            });

        }
        $("#dialog-result").dialog("open");
    },

    saveAndLeave: function() {
        $.when(SVGFunctions.saveSVG(), Annotations.saveAnnotations()).then(function() {
          //saving successful
          Dialogs.showResultDialog("success", "saving progress successful", "", 2000);
          
        }, function() {
          //saving failed
          Dialogs.showResultDialog("fail", "saving failed", "");
        });
        $("#dialog-leave-site").dialog( "close" );
    }
};