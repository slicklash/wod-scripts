// ==UserScript==
// @name           Hero List
// @description    Scripts adds functionality to order your heroes
// @version        1.1
// @namespace      Never
// @include        http*://*.world-of-dungeons.*/wod/spiel/settings/heroes.php*
// ==/UserScript==

(function() {

// --- Selector

function $(y,c,H){var a=c||document;if(!y||typeof y!=="string"||!(a.nodeType===9||a.nodeType===1)){return null}var b=y.split(/\s+/),f=[a],o=H||false;for(var A=0,z=b.length;A<z;A++){var F=[],E=b[A].match(/^([\.#]?[a-z0-9\-_]+\w*)/i),u=E?E[1]:"",n=b[A].replace(u,""),C=/(\[([a-z]+)([\*\^\$]?=)"(\w+)"\])/gi,d=[];while((e=C.exec(n))){if(e.index===C.lastIndex){C.lastIndex++}d.push({attribute:e[2],condition:e[3],value:e[4]})}var x,q,p,w,h;switch(u[0]){case"#":F=[document.getElementById(u.substring(1))];if(!F[0]){return null}break;case".":for(x=0,q=f.length;x<q;x++){h=f[x].getElementsByClassName(u.substring(1));for(w=0,p=h.length;w<p;F.push(h[w++])){}}break;default:for(x=0,q=f.length;x<q;x++){h=f[x].getElementsByTagName(u);for(w=0,p=h.length;w<p;F.push(h[w++])){}}break}if(d.length>0){f=[];for(var D=0,I=F.length;D<I;D++){var G=F[D],m=false;for(var t=0,B=d.length;t<B;t++){var e=d[t],r=G.getAttribute(e.attribute);if(r){switch(e.condition){case"*=":m=r.indexOf(e.value)>-1;break;case"^=":m=r.indexOf(e.value)===0;break;case"$=":m=r.indexOf(e.value,r.length-e.value.length)>-1;break;default:m=r===e.value;break}}if(m===false){break}}if(m===true){f.push(G)}}}else{f=F}}if(f.length===0||f[0]===a){return null}return !o&&f.length===1?f[0]:f};

// --- Functions

var attr=function(d,b,e,a){if(a){d.removeAttribute(b)}else{if(typeof b==="object"){for(var c in b){d.setAttribute(c,b[c])}}else{if(e){d.setAttribute(b,e)}else{return d.getAttribute(b)}}}return d};
var add=function(c,a){var b=typeof c!=="object"?document.createElement(c):c;if(a&&a.nodeType){a.appendChild(b)}return b};
var innerText=function(a){if(!a){return""}return a.innerText?a.innerText:a.textContent};

// --- Main

var g_heroes = $('#main_content form table'),
    g_rows = g_heroes ? $('tr', g_heroes) : null;

    if (g_rows && g_rows.constructor != Array) g_rows = [g_rows];

var saveWeights = function () {

    if (!g_rows || g_rows.length < 1) return;

    for (var i = 1, cnt = g_rows.length; i < cnt; i++) {
        var cells     = g_rows[i].cells,
            hid       = Number($('input', cells[0]).value),
            weight    = Number($('input', cells[5]).value);

        if (isNaN(weight)) weight = 0;

        GM_setValue(hid, weight);
    }

    var form = document.forms['the_form'];

    if (form) form.submit();
}

var orderHeroes = function (weights) {

    if (!g_rows || g_rows.length < 1) return;

    var heroes = [],
        holder    = g_heroes.parentNode,
        position  = g_heroes.nextSibling,
        newTable  = add('table'),
        newTbody  = add('tbody', newTable);

    attr(newTable, 'class', 'content_table');

    var headerWeight = add('th'),
        label = add('span', headerWeight),
        buttonSave = add('input', headerWeight);

    label.innerHTML = 'weight<br/>';
    attr(buttonSave, {'type': 'button', 'value': 'Save', 'class': 'button clickable'});
    buttonSave.addEventListener('click', saveWeights, false);

    g_rows[0].appendChild(headerWeight);

    newTbody.appendChild(g_rows[0]);

    for (var i = 1, cnt = g_rows.length; i < cnt; i++) {
        var cells     = g_rows[i].cells,
            hid       = Number($('input', cells[0]).value),
            level     = Number(innerText(cells[2])),
            hero      = {
                'weight'    : level == 0 ? 100 : level,
                'row'       : g_rows[i]
            };

        var val = GM_getValue(hid);

        if (typeof(val) != 'undefined') hero.weight = Number(val);

        heroes.push(hero);
    }

    heroes.sort(function(x, y) { return x.weight - y.weight; });

    for (var i = 0, cnt = heroes.length; i < cnt; i++) {
        var hero = heroes[i],
            row = hero.row,
            colWeight = add('td', row),
            txt = add('input');

        attr(row, 'class', 'row' + i % 2);
        attr(colWeight, 'align', 'center');
        attr(txt, {'type': 'text', 'style': 'width: 30px', 'value': hero.weight });

        add(txt, colWeight);
        add(heroes[i].row, newTbody);
    }

    holder.insertBefore(newTable, position);
    holder.removeChild(g_heroes);
}

if (g_rows) orderHeroes();


})();
