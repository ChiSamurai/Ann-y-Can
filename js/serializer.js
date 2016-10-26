/* exported Serializer */
var Serializer = {
    _json2html_recurse: function (data) {
        var htmlRetStr = "<ul class='recurseObj' >"; 
        for (var key in data) {
            if(typeof(data[key]) !== 'function'){
                if (typeof(data[key]) === 'object' && data[key] !== null) {
                    htmlRetStr += "<li class='keyObj' ><strong>" + key + ":</strong><ul class='recurseSubObj' >";
                    htmlRetStr += this._json2html_recurse( data[key] );
                    htmlRetStr += '</ul  ></li   >';
                } else {
                    htmlRetStr += ("<li class='keyStr' ><strong>" + key + ': </strong>&quot;' + data[key] + '&quot;</li  >' );
                }
            }
        }
        htmlRetStr += '</ul >';    
        return( htmlRetStr );
    },
    
    json2html: function(jsonObj) {
        var htmlStr = '<div class="serializer json">' + this._json2html_recurse(jsonObj);
        return(htmlStr);
    }
};