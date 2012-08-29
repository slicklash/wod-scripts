
// --- Prototypes

String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"")};
String.prototype.pad=function(a,e,d){var c=this,b=e||" ";if(d===true){while(c.length<a){c=b+c}}else{while(c.length<a){c+=b}}return c};
String.prototype.parseEffectiveValue=function(a){var b=this.replace(/[a-z:,\s\n]+/gi,"").match(/([0-9]+)(\[([0-9\-]+)\])?/);if(b===null){return[0,0]}return b[3]?[Number(b[1]),Number(b[3])]:[Number(b[1]),Number(b[1])]};
