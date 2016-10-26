/*exported message,log,generateUUID,Percent*/

//JQuery Patch (clone textarea has no value)
// Source: https://github.com/spencertipping/jquery.fix.clone

/* jshint ignore:start */  
(function (original) {
  jQuery.fn.clone = function () {
    var result           = original.apply(this, arguments),
        my_textareas     = this.find('textarea').add(this.filter('textarea')),
        result_textareas = result.find('textarea').add(result.filter('textarea')),
        my_selects       = this.find('select').add(this.filter('select')),
        result_selects   = result.find('select').add(result.filter('select'));

    for (var i = 0, l = my_textareas.length; i < l; ++i){
      $(result_textareas[i]).val($(my_textareas[i]).val());
    }
    for (var i = 0, l = my_selects.length; i < l; ++i) {
      for (var j = 0, m = my_selects[i].options.length; j < m; ++j) {
        if (my_selects[i].options[j].selected === true) {
          result_selects[i].options[j].selected = true;
        }
      }
    }
    return result;
  };
}) (jQuery.fn.clone);
/* jshint ignore:end*/ 

(function ($){
    $.arrayDistinct = function(array) {
       var result = [];
       $.each(array, function(i,v){
           if ($.inArray(v, result) === -1){
            result.push(v);
          }
       });
       return result;
    };
})(jQuery);

//JQuery addon: parseURLString
(function ($){
    $.ParseURLString = function(url){
      var protocol = url.substring(0, url.indexOf('://'));
      var rest = url.substring(url.indexOf('://') + 3);
      var hostWPort = rest.substring(0, rest.indexOf("/"));
      var host = hostWPort.substring(0, hostWPort.indexOf(":"));
      var port = hostWPort.substring(hostWPort.indexOf(":") + 1);
    
      rest = rest.substring(rest.indexOf('/') + 1);
      var urlPath = rest.substring(0, rest.indexOf('?'));
      var urlPathComponents = urlPath.split("/");
      
      rest = rest.substring(rest.indexOf('?') + 1);
      var queryParams = [];
      $(rest.split("&")).each(function(idx, data){
        var ampindex = data.indexOf("=");
        queryParams[data.slice(0,ampindex)] = (ampindex > -1?data.slice(ampindex+1):null);
      });
      return {
        protocol: protocol,
        hostWPort: hostWPort,
        host: host,
        port: port || "80",
        urlPath : urlPath,
        urlPathComponents: urlPathComponents,
        queryParams: queryParams
      };
    };
})(jQuery);

function message(messageText, type, autoHideAfterMs) {
      var $messageNode = $('<div class="message ' + type + '">' + messageText + '</div>');
      if(autoHideAfterMs){
        setTimeout(function(){
          $messageNode.fadeOut("slow", function(){
            $(this).remove();
          });
        }, autoHideAfterMs);
      }
      return $messageNode;
}

function log(message, type) {
    $('#log-console').prepend('<div class="' + type + '">' + message + '</div>');
}

function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c === 'x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

var Percent = {
    mult: function(a, b) {
        var percA = false;
        var percB = false;
        var floatA = 0;
        var floatB = 0;
        var multA = a;
        var multB = b;
        if(!$.isNumeric(a) && a.substr((a.length - 1), 1) === "%"){
            floatA = parseFloat(a.substr(0, a.length - 1), 10);
            percA = true;
        }else{
            floatA = parseFloat(a, 10);
        }

        if(!$.isNumeric(b) && b.substr((b.length - 1), 1) === "%"){
            floatB = parseFloat(b.substr(0, b.length - 1), 10);
            percB = true;
        }else{
            floatB = parseFloat(b, 10);
        }

        if(percA) {
          multA = floatA/100;
        }
        if(percB){
          multB = floatB/100;
        }
        console.debug(multA * multB);
        console.debug("multA:" + multA + " multB:" + multB);
        console.debug("floatA:" + floatA + " percA:" + percA);
        console.debug("floatB:" + floatB + " percB:" + percB);
        return multA * multB;
    }
};

