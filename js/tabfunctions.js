var tabFunctions = {
    instance: null,
    init: function(options) {
        this._getProtocols();
        $('#loadXML\\.submit').on("click", function (argument) {
            tabFunctions.loadXML();
        });
        tabFunctions.instance = $("#tabs").tabs({});
        // DEBUG
        $('#loadXML\\.uri').val("/exist/rest/db/data/commons/Naddara/uuid-34a1979d-ce93-4620-a6b9-7dae7b4ea12c.xml");
    },
    _getProtocols: function (){
        // append protocols to selector
        $.each(options.protocols.loadXML, function(idx, data) {
            $('#loadXML\\.protocol').append('<option name="' + idx + '"' + (data.default?' selected="selected"':"") + '>' + data.title + '</option>');
        });
    },
    loadXML: function () {
        var uri = $('#loadXML\\.uri').val();
        var protocolIdx = $('#loadXML\\.protocol').find("option:selected").attr("name");
        // get the protocol
        var protocol = options.protocols.loadXML[protocolIdx];
        
        // try to load the xml
        $.when(XMLFunctions.loadXML(protocolIdx, uri)).then(function(data) {
            console.debug(data);
            // loading Successful, add tab
            var tabs = $('div#tabs ul > li');
            var tabIndexes = [];
                $.each(tabs, function (argument) {
                    tabIndexes.push(parseInt($(this).index(), 10));
                });
            
            // var newTabId = "xmltab-" + (Math.max(...tabIndexes) + 1);
            var newTabId = "xmltab-" + (Math.max.apply(null, tabIndexes) + 1);
            var tabHTML = $("<li><a href='#" + newTabId + "'><span>" + data.title + "<span class='ui-icon ui-icon-circle-close ui-tab-close-button' alt='close'></span></span></a></li>").insertBefore(tabs.last());
            tabHTML.find(".ui-icon.ui-icon-circle-close").on("click", function(event) {
                tabFunctions.closeTab($(event.target).closest("li"));
            });
            //add XML data
            var xmlDataNode = $("div#tabs").append('<div class="xml-data-node" id=' + newTabId + ' data-source-uri="' + data.uri + '"></div>');
            // register new XMLDisplay
            var display = new XMLDisplay($('#' + newTabId));
            display.setXMLData(data.xmlData.html());
            $("div#tabs").tabs("refresh");
        }, function(data) {
            log("Loading XML failed: " + data.status + ": " + data.statusText, "error");
        });
    },
    closeTab: function(tabListItem) {
        // remove the xml data display
        $("#" + tabListItem.attr("aria-controls")).remove();
        tabListItem.remove();
        $('#tabs').tabs( "refresh" );
    }
};