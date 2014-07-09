
// --- Functions

var attr=function(d,b,e,a){if(a){d.removeAttribute(b)}else{if(typeof b==="object"){for(var c in b){d.setAttribute(c,b[c])}}else{if(e){d.setAttribute(b,e)}else{return d.getAttribute(b)}}}return d};
var cssClass=function(d,c,a){var b=d.className.indexOf(c)!==-1;if(typeof a!=="boolean"){return b}if(b&&a){return d}d.className=a?d.className+" "+c:d.className.replace(c,"").replace(/^\s+|\s+$/g,"");return d};
var add=function(c,a){var b=typeof c!=="object"?document.createElement(c):c;if(a&&a.nodeType){a.appendChild(b)}return b};
var get=function(a,d,c,b){GM_xmlhttpRequest({method:"GET",url:a,headers:{Cookie:document.cookie},onload:function(e){if(e.readyState===4){if(e.status!==200){alert("Data fetch failed. Please try again.");return false}if(typeof d==="function"){if(!c){d(e.responseText)}else{d.call(c,e.responseText)}}}}})};
var supportsInnerText=typeof Element.prototype!=="undefined",innerText=function(a){if(!a){return""}return supportsInnerText?a.innerText:a.textContent};
var parseTemplate=function(a,d){try{var c="var p=[],print=function(){p.push.apply(p,arguments);};with(obj){p.push('"+a.replace(/[\r\t\n]/g," ").replace(/'(?=[^#]*#>)/g,"\t").split("'").join("\\'").split("\t").join("'").replace(/<#=(.+?)#>/g,"',$1,'").split("<#").join("');").split("#>").join("p.push('")+"');}return p.join('');";fn=new Function("obj",c);return fn(d)}catch(b){GM_log("parseTemplate: "+b)}return"ERROR"};

