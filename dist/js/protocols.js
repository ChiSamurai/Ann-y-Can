
/* to try the example call
    http://localhost/annycan/index.html?openBinaryMethod=default&openSVGMethod=default&binary=havard#14034074&svg=svg_1
*/

//only declared to hold the example resources
var _exampleResources = {
    annotations: null,
    targets:null
};

$(document).on("Annycan.initComplete",  function() {
    console.debug("Ann-y-Can ready");
    //Load the example targets
    $('#annotation-target-open').trigger("mouseup");
});

// Load the example resources
$(document).ready(function() {
    $.ajax({
        url: "example/targets.xml",
        processData: false,
        method: "GET",
        dataType: "text",
        cache: false,
        "Content-Type": "application/xml"

    }).done(function(xmldata){
        _exampleResources.targets = xmldata;
    });
});

// The above code is only for the static example (i.e. preloading data)

var options = {
    protocols: {
        init: function () {
/*            var _this = this;*/
            var resourceIDs = parsedURL.queryParams.resourceIDs?parsedURL.queryParams.resourceIDs:null;
            IDs.binaryImage = parsedURL.queryParams.binary;
            IDs.canvasAnnotation = parsedURL.queryParams.annotationUUID;
            IDs.svg = parsedURL.queryParams.svg;
            IDs.annotationsResources = resourceIDs?resourceIDs.split(","):null;
        },
        newUUID: function (seed) { // jshint ignore:line
            var df = new $.Deferred();
            //create and return Deferred Object if using ajax call
            return df.resolve(generateUUID()); //use the internal uuid generator
        },
        ocr: {
            default: "default",
            _getFromURI: function(uri) {
                var df = new $.Deferred();
                var xhr = new XMLHttpRequest();
                xhr.open('GET', uri, true);
                xhr.responseType = 'blob';
                xhr.onreadystatechange = function() {
                    if(this.readyState === 4){
                        if (this.status === 200) {
                            // log("successfully fetched binary data for OCR", "success");
                            console.debug("successfully fetched binary data");
                            return df.resolve(this.response);
                        }else{
                            // log("failed to fetch binary data for OCR", "error");
                            console.debug("ERROR: failed to fetch binary data for OCR");
                            return df.reject(this.response);
                        }
                    }
                };
                xhr.onerror = function(){
                    // console.debug("ERROR:");
                    // console.debug(e);
                    return df.reject(this.responseText);
                };
                xhr.send();
                return df.promise();
            },
            services:{
                default:{
                    label: "ocr.space",
                    _apiKey: "", // to use ocr.space get your api key at https://ocr.space
                    serviceURI: "https://api.ocr.space/parse/image",
                    send: function (uri) {
                        var _self = this;
                        var df = new $.Deferred();

                        /* ***************************************
                        ocr.space supports a uri as a parameter as well as the binary included in form data
                           *************************************** */
/*
                        // SUBMITTING THE URL TO THE OCR SERVICE 
                        var form = new FormData();
                        form.append("apikey", _self._apiKey);
                        form.append("language", "eng");
                        form.append("isOverlayRequired", "false");
                        form.append("url", uri);

                        $.ajax({
                            async: true,
                            crossDomain: true,
                            url: _self.serviceURI,
                            method: "POST",
                            headers: {
                                "cache-control": "no-cache"
                            },
                            processData: false,
                            contentType: false,
                            type: "json",
                            data: form
                        })
                        .done(function(data){
                            console.debug("successfully ocr'ed");
                            df.resolve(data.ParsedResults[0].ParsedText);
                        }).fail(function(data, textStatus) {
                            console.debug("error");
                            df.reject(textStatus);
                        });

*/

                        // FETCHING THE BINARY IMAGE FIRST AN THEN SEND IT TO THE OCR SERVICE
                        options.protocols.ocr._getFromURI(uri).then(function(binaryData){
                            var form = new FormData();
                            form.append("apikey", _self._apiKey);
                            form.append("language", "eng");
                            form.append("isOverlayRequired", "false");
                            form.append("file", binaryData, "test.jpg");

                            $.ajax({
                              async: true,
                              crossDomain: true,
                              url: _self.serviceURI,
                              method: "POST",
                              headers: {
                                "cache-control": "no-cache"
                              },
                              processData: false,
                              contentType: false,
                              type: "json",
                              data: form
                            })
                            .done(function(data){
                                console.debug("successfully ocr'ed");
                                df.resolve(data.ParsedResults[0].ParsedText);
                              // console.debug(data);
                            }).fail(function(data) {
                                df.reject(data);
                            });
                        });

                        return df.promise();
                    }
                }
            }
        },
        getIIIFInfoURL:{
            default: "default",
            services: {
                default: {
                    label: "Havard Example",
                    hint: "Paste havard id",
                    inputPlaceholder: "havard#14034074",
                    inputDefaultValue: "",
                    get: function(iiifURI){
                        // in this example we're working with havard api identifiers. Just for shortening the example url You may as well just use the whole IIIF URI
                        var iiifId = iiifURI.slice(iiifURI.indexOf("#") + 1);
                        IDs.binaryImage = iiifId;
                        var iiifServiceURI = "https://ids.lib.harvard.edu/ids/iiif";
                        return iiifServiceURI + "/" + iiifId + "/info.json";
                    }
                },
            }
        },
        loadSVG:{
            "default": "default",
            "services": {
                "default": {
                    open: function (svgUUID) {
                        IDs.svg = svgUUID;
                        var uri = "example/" + svgUUID + ".svg";
                        return $.ajax({
                                url: uri,
                                processData: false,
                                method: "GET",
                                dataType: "text",
                                "Content-Type": "application/xml"
                            })
                            .done(function(data){
                                log("SVG successfully loaded", "success");
                                return data;
                            }).fail(function(data, textStatus) {
                                SVGFunctions.newSVG();
                                log("loading SVG failed: " + textStatus, "error");
                                return false;
                            });
                    }
                }
            }
        },
        saveSVG:{ 
            /**
             * Saves the SVG 
             */

            default: "default",
            services:{
                default:{
                    save: function() {
                        var df = new $.Deferred();
                        //create and return Deferred Object if using ajax call

                        /* PUT YOUR SVG SAVE MECHANISM HERE */
                        /* You will get the SVG data using the following line */
 
                        // var SVGdata = $(SeadragonViewer.overlay.node()).html();
                        IDs.svg = SeadragonViewer.overlay.node().firstChild.attributes['xml:id'].value;
 
                        /* 
                            SVGData:
                            - contains the whole SVG overlay. Each element has an @id attribute to address it.
                            IDs.svg:
                            - the xml:id to address the SVG itself

                            Process the data if needed and send it to your api for storing
                        */

                        // SVG is stored, so store the link between SVG and IIIF image as well
                        options.protocols.saveCanvasAnnotation.services.default.save();
                        return df.resolve();
                    }
                }
            }
        },
        saveCanvasAnnotation:{
            default: "default",
            services:{
                default:{
                    // returns Canvas UUID
                    save: function() {
                        var df = new $.Deferred();
                        // create and return Deferred Object if using ajax call
                        // store the identifier for the link between SVG and IIIF image (i.e. key for an assoc array or id for an API; resolved through "load")
                        var annotationId = IDs.canvasAnnotation;
                        
                        /* 
                            annotationId means you are editing an existing annotation you may submit this to your api if updating is needed or just return the 
                            
                        */
                        return df.resolve(annotationId);
                    }
                }
            }
        },
        loadConfigDefinitions:{
            default: "default",
            services:{
                default:{
                    load: function(){
                        var df = $.Deferred();

                        var result = 
                            [
                              {
                                "tooltip": "n/a",
                                "label": "Project A",
                                "id": "project_a",
                                "description": "This is the configuration for the first project",
                              },
                              {
                                "tooltip": "n/a",
                                "label": "Project B",
                                "id": "project_b",
                                "description": "This is the configuration for the second project",
                              }

                            ];
                        return df.resolve(result, "config Found");
                    }
                }
            }
        },
        getTargets:{
            default: "default",
            services: {
                default:  {
                    getAnnoConfigId: function() {
                        return $(Annotations.options.selectors['config-dropdown']).val();
                    },
                    get: function(resourceIDs) {
                        var df = $.Deferred();
                        var $resource = $(_exampleResources.targets).find(".resource > .id:contains('" + resourceIDs + "')").parent();
                        return df.resolve($resource.parent(), "resource found");
                    }
                }
            }
        },
        saveAnnotation:{
            default: "default",
            services: {
                default:  {
                    title: "default",
                    save: function(annoData) {
                        var df = new $.Deferred();
                        //Put your code for saving the annotations here
                        console.debug(annoData);
                        return df.resolve();
                    }
                }
            }
        },

        //Load the Annotations for this 
        getAnnotations:{
            default: "default",
            services: {
                default:  {
                    title: "default",
                    get: function(resourceIRI) {
                        console.debug(resourceIRI);
                        var df = new $.Deferred();
                        //The followwing code loads the xml file containing the example annotations for this canvas
                        $.ajax({
                            url: "example/annotations.xml",
                            processData: false,
                            method: "GET",
                            dataType: "text",
                            cache: false,
                            "Content-Type": "application/xml"

                        }).done(function(xmldata){
                            _exampleResources.annotations = xmldata;
                            return df.resolve(xmldata);
                        });
                        return df.promise();
                    }
                }
            }

        },
        searchResources:{
            default: "default",
            services: {
                default:  {
                    title: "search preloaded Resources",
                    maxResults: 20,
                    search: function(searchString, start, max) {
                        console.log("Searching for '" + searchString + "' getting max " + max + " results starting from " + start);
/*                        var _this = this;*/
                        var df = new $.Deferred();
/*                        var maxResults = (max?max:this.maxResults); // jshint ignore:line

                        var df = $.Deferred();
                        // Search is triggered, returns first 20 results
                        if(!start || start === 0){
                            var foundResources = $(_exampleResources.targets).find(".resource > .label:contains('" + searchString + "')").parent();

                            var resultsArray = [];
                            var hits = foundResources.length;
                            $.each(foundResources, function(idx, hit) {
                                var $hit = $(hit);
                                var resultElement = {
                                  label: $hit.children(".label").html(),
                                  value: $hit.children(".id").text()
                                };
                                resultsArray.push(resultElement );
                            });
                            var returnObject = {
                                hits: hits, 
                                data: resultsArray
                            };
                            return df.resolve(returnObject);
                        }else{
                            // Retreive the next results, starting with $start, limit to $maxResults
                            return df.resolve();
                        }
                        return df.promise();*/
                        return df.resolve();
                    }
                }
            }
        },
    }
};
