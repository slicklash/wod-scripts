// ==UserScript==
// @name           Tidy Trade
// @description    Sorts trade items and calculates the total sum of uses
// @version        1.1
// @namespace      Never
// @include        http*://*.world-of-dungeons.net/wod/spiel/trade/exchange_details*
// ==/UserScript==

(function() {

// --- Selector

function $(y,c,H){var a=c||document;if(!y||typeof y!=="string"||!(a.nodeType===9||a.nodeType===1)){return null}var b=y.split(/\s+/),f=[a],o=H||false;for(var A=0,z=b.length;A<z;A++){var F=[],E=b[A].match(/^([\.#]?[a-z0-9\-_]+\w*)/i),u=E?E[1]:"",n=b[A].replace(u,""),C=/(\[([a-z]+)([\*\^\$]?=)"(\w+)"\])/gi,d=[];while((e=C.exec(n))){if(e.index===C.lastIndex){C.lastIndex++}d.push({attribute:e[2],condition:e[3],value:e[4]})}var x,q,p,w,h;switch(u[0]){case"#":F=[document.getElementById(u.substring(1))];if(!F[0]){return null}break;case".":for(x=0,q=f.length;x<q;x++){h=f[x].getElementsByClassName(u.substring(1));for(w=0,p=h.length;w<p;F.push(h[w++])){}}break;default:for(x=0,q=f.length;x<q;x++){h=f[x].getElementsByTagName(u);for(w=0,p=h.length;w<p;F.push(h[w++])){}}break}if(d.length>0){f=[];for(var D=0,I=F.length;D<I;D++){var G=F[D],m=false;for(var t=0,B=d.length;t<B;t++){var e=d[t],r=G.getAttribute(e.attribute);if(r){switch(e.condition){case"*=":m=r.indexOf(e.value)>-1;break;case"^=":m=r.indexOf(e.value)===0;break;case"$=":m=r.indexOf(e.value,r.length-e.value.length)>-1;break;default:m=r===e.value;break}}if(m===false){break}}if(m===true){f.push(G)}}}else{f=F}}if(f.length===0||f[0]===a){return null}return !o&&f.length===1?f[0]:f};

// --- Prototypes

String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"")};

// --- Functions

var attr=function(d,b,e,a){if(a){d.removeAttribute(b)}else{if(typeof b==="object"){for(var c in b){d.setAttribute(c,b[c])}}else{if(e){d.setAttribute(b,e)}else{return d.getAttribute(b)}}}return d};
var cssClass=function(d,c,a){var b=d.className.indexOf(c)!==-1;if(typeof a!=="boolean"){return b}if(b&&a){return d}d.className=a?d.className+" "+c:d.className.replace(c,"").replace(/^\s+|\s+$/g,"");return d};
var add=function(c,a){var b=typeof c!=="object"?document.createElement(c):c;if(a&&a.nodeType){a.appendChild(b)}return b};
var innerText=function(a){if(!a){return""}return a.innerText?a.innerText:a.textContent};

// --- Main ---

var tidyTrade = function (table) {
    var rows = $('tr', table.cloneNode(true));

    if (rows && rows.constructor != Array) rows = [rows];
    if (!rows || rows.length < 1) return;

    var holder   = table.parentNode,
        position = table.nextSibling,
        newTable = add('table'),
        items    = [],
        sums     = {},
        re_uses  = /\(([0-9]+)\/[0-9]+\)/;

    for (var i = 0, cnt = rows.length; i < cnt; i++) {
        var cells     = rows[i].cells,
            condition = $('img', cells[1]),
            link      = $('a', cells[2]),
            control   = cells.length > 3 ? $('input', cells[3]) : null,
            name      = innerText(link),
            size      = innerText(cells[2]).replace(name, '').trim(),
            m_uses    = size.match(re_uses),
            uses      = m_uses ? Number(m_uses[1]) : 1,
            sum       = sums[name],
            item      = {
                'name'      : name,
                'condition' : condition,
                'size'      : size,
                'uses'      : uses,
                'link'      : link,
                'control'   : control
            };

        items.push(item);

        sums[name] = sum ? sum + uses : uses;
    }

    items.sort(function(x,y) { var diff = x.name.toLowerCase().localeCompare(y.name.toLowerCase()); return diff === 0 ? x.uses - y.uses : diff; });

    for (var i = 0, cnt = items.length; i < cnt; i++) {
        var item   = items[i],
            size   = '&nbsp;' + item.size,
            row    = add('tr', newTable),
            no     = attr(add('td', row), 'align', 'right').innerHTML = i + 1,
            c_cond = add(item.condition, attr(add('td', row), 'valign', 'top')),
            c_link = attr(add('td', row), {'valign': 'top', 'align': 'left'});

        if (item.control) add(item.control, add('td', row));

        add(item.link, c_link);
        add('span', c_link).innerHTML = size;

        if (sums[item.name] > 1) {
            var summ = add('span', c_link);
            attr(summ, 'style', 'color: #666').innerHTML = '&nbsp;<sup>&sum;=' + sums[item.name] + '</sup>';
            sums[item.name] = 0;
        }
    }

    holder.removeChild(table);
    holder.insertBefore(newTable, position);
}

var g_main = $('#main_content'),
    g_h1 = $('h1', g_main);

if (innerText(g_h1).indexOf('Trade with') > -1) {
    var tables = $('table', g_main),
        tb_sell = tables[1],
        tb_buy = tables[2];

    if (tb_sell) tidyTrade(tb_sell);
    if (tb_buy)  tidyTrade(tb_buy);
}


})();
