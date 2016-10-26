/* exported XMLDisplay */
function XMLDisplay(targetNode) {
    var self = this;
    this.targetNode = targetNode;
    this.reset = function() {
        // body...
    };
    this.setXMLData = function(xmlData) {
        self.targetNode.empty();
        self.targetNode.html(xmlData);
        self._registerListener(self.targetNode.find(".node"));
        // self._registerOpenCloseListener(self.targetNode.find(".openclose"));
    };
    
    this._registerListener = function(elements) {
        // console.debug(elements);
        elements.hover(function() {
            $(this).css('cursor','pointer');
        }, function() {
            $(this).css('cursor','auto');
        });
        
        // console.debug(element);
        elements.on("click", function(event) {
            console.debug(event);
            var eventData = {
                xpath: $(event.target).closest('.xml-data-node').attr('data-source-uri') + "?" + encodeURIComponent($(event.target).attr("data-xpath")),
                namespace: $(event.target).attr("data-namespace"),
                source: $(event.target).closest("div.xml-data-node")
            };

            $.event.trigger({
                type: "XMLFunctions.selectNode",
                event: event,
                eventData: eventData
            });

            console.debug(eventData);
        });
    };
    this._registerOpenCloseListener = function(elements){
        elements.hover(function() {
            $(this).css('cursor','pointer');
        }, function() {
            $(this).css('cursor','auto');
        });

        elements.on("click", function(event) {
            $(event.target.nextSibling).toggle();
        });
    };
}

var XMLFunctions = {
    options: {
        showEmptyAttributes: false
    },
    nl2br: function (string) {
        return string.replace(/\n/g, "<br />");
    },
    xpath: function(el) {
        if (typeof el === "string") {
            return document.evaluate(el, document, null, 0, null);
        }
        if (!el || el.nodeType !== 1) {
            return '';
        }
        // if (el.id) return "//*[@id='" + el.id + "']";
        // else if (el.attributes.ID) return "//*[@ID='" + el.attributes.ID.value + "']";
        // else if (el.attributes["xml:id"]) return "//*[@xml:id='" + el.attributes["xml:id"].value + "']"; 
        var sames = [].filter.call(el.parentNode.children, function (x) { 
            return x.tagName === el.tagName;
        });
        return XMLFunctions.xpath(el.parentNode) + '/' + el.tagName + '['+([].indexOf.call(sames, el)+1)+']';
    },

    loadXML: function(protocol, uri) {
        var df = $.Deferred();
        $.when(options.protocols.loadXML[protocol].load(uri)).then(function(returnData, textStatus) {
            var xmlAsHtml = XMLFunctions.XMLtoHTML(returnData.xmlData);
            var data = {
                uri: returnData.uri,
                title: returnData.title,
                xmlData: xmlAsHtml
            };
            return df.resolve(data, textStatus);
        },function (data, textStatus) {
            return df.reject(data, textStatus);
        });
        
        return df.promise();
    },

    XMLtoHTML: function(nodeList){
        // var openClose = '<span class="openclose">+</span>';
        var html = $('<div style="margin-left:30px"></div>');
        $.each(nodeList, function(idx, data) {
            switch(this.nodeType){
                // ElementNode
                case 1:
                    // console.debug(this.nodeName);
                    var attributes = this.attributes;
                    var attributesHtml = $("<span/>");
                    $.each(attributes, function (idx, attributeData) {
                        if(attributeData.value || XMLFunctions.options.showEmptyAttributes) {
                            attributesHtml.append("&nbsp;<span class='attribute-name'>" + attributeData.nodeName + "</span>=\"<span class='attribute-value'>" + attributeData.value + "</span>\"");
                        }
                    });
                    var open = '<div class="node" data-namespace="' + this.namespaceURI +'" data-xpath="' + XMLFunctions.xpath(this) + '">&lt;' +
                                    this.nodeName  + attributesHtml.html() + '&gt;</div>';
                    var close = '<div class="node-close">&lt;/' + data.nodeName + '&gt;</div>';
                    html.append(open);
                    // html.prepend(openClose);
                    if(this.childNodes.length !== 0 ) {
                        html.append(XMLFunctions.XMLtoHTML(this.childNodes));
                    }
                    html.append(close);

                    break;
                // textNode
                case 3:
                    html.append(XMLFunctions.nl2br($.trim(this.textContent)));
                    break;
            }
        });
        return html;
    },
    XMLtoJSON: function(node){
        // console.debug($(node).children);
        // var json = {
        //     id: xmlnode 
        // }
        // Generate the json objects
        var childNodes = [];
        console.debug(childNodes);
        $.each($(node).children(), function() {
            childNodes.push(XMLFunctions.XMLtoJSON($(this)));
            // console.debug($(data));
        });

        return {
            text: $(node)[0].nodeName,
            children: childNodes
        };
    },
    getNamespaceDeclarations: function(elements){
        var xmlnsAttr = [];
        elements.each(function() {
            var attributes = this.attributes;
            $(attributes).each(function(){
                if (this.name.startsWith("xmlns")){
                    xmlnsAttr.push(this);
                }
            });
        });
        return xmlnsAttr;
    }
};