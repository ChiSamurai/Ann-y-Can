/* exported ProtocolResolver */
var ProtocolResolver = {
    resolveToIRI: function(string){
        // get protocol prefix
        var prefix = string.substr(0,string.indexOf(':'));
        var value = string.substr(string.indexOf(':') + 1, string.length);
        switch (prefix){
            case "":
                return null;
            default:
                return options.protocols[prefix].replace(/\$\$(.+?)\$\$/, value);
        }
    }
};