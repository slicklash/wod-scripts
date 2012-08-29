// ==UserScript==
// @name           Storage Management
// @description    Adds additional functionality for storage management
// @version        1.0 
// @namespace      Never
// @include        http*://*.world-of-dungeons.*/wod/spiel/hero/items.php*
// ==/UserScript==

(function() {

// --- Selector

function $(y,c,H){var a=c||document;if(!y||typeof y!=="string"||!(a.nodeType===9||a.nodeType===1)){return null}var b=y.split(/\s+/),f=[a],o=H||false;for(var A=0,z=b.length;A<z;A++){var F=[],E=b[A].match(/^([\.#]?[a-z0-9\-_]+\w*)/i),u=E?E[1]:"",n=b[A].replace(u,""),C=/(\[([a-z]+)([\*\^\$]?=)"(\w+)"\])/gi,d=[];while((e=C.exec(n))){if(e.index===C.lastIndex){C.lastIndex++}d.push({attribute:e[2],condition:e[3],value:e[4]})}var x,q,p,w,h;switch(u[0]){case"#":F=[document.getElementById(u.substring(1))];if(!F[0]){return null}break;case".":for(x=0,q=f.length;x<q;x++){h=f[x].getElementsByClassName(u.substring(1));for(w=0,p=h.length;w<p;F.push(h[w++])){}}break;default:for(x=0,q=f.length;x<q;x++){h=f[x].getElementsByTagName(u);for(w=0,p=h.length;w<p;F.push(h[w++])){}}break}if(d.length>0){f=[];for(var D=0,I=F.length;D<I;D++){var G=F[D],m=false;for(var t=0,B=d.length;t<B;t++){var e=d[t],r=G.getAttribute(e.attribute);if(r){switch(e.condition){case"*=":m=r.indexOf(e.value)>-1;break;case"^=":m=r.indexOf(e.value)===0;break;case"$=":m=r.indexOf(e.value,r.length-e.value.length)>-1;break;default:m=r===e.value;break}}if(m===false){break}}if(m===true){f.push(G)}}}else{f=F}}if(f.length===0||f[0]===a){return null}return !o&&f.length===1?f[0]:f};

// --- Prototypes

String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"")};

// --- Functions

var attr=function(d,b,e,a){if(a){d.removeAttribute(b)}else{if(typeof b==="object"){for(var c in b){d.setAttribute(c,b[c])}}else{if(e){d.setAttribute(b,e)}else{return d.getAttribute(b)}}}return d};
var add=function(c,a){var b=typeof c!=="object"?document.createElement(c):c;if(a&&a.nodeType){a.appendChild(b)}return b};
var supportsInnerText=typeof Element.prototype!=="undefined",innerText=function(a){if(!a){return""}return supportsInnerText?a.innerText:a.textContent};

// --- Translations ---

if (location.href.indexOf('.net') > 0) {
    var _t = function(text) { return text; };
}
else {
    var _t = function(text) { return text === 'Commit' ? 'nderungen' : text; };
}

// --- Classes ---

function StorageObject() {
    this.name = '';
    this.consumable = false;
    this.usable = true;
    this.group = true;
    this.ctrlSelect = null;
    this.ctrlLocation = null;
    this.ctrlSell = null;
}

StorageObject.specialConsumables = {
    'ruby shard': 1,
    'small carnelian': 1,
    'small citrine fragment': 1,
    'small emerald fragment': 1,
    'small lapis lazuli fragment': 1,
    'small malachite fragment': 1,
    'small turquoise': 1
};

StorageObject.prototype.isConsumable = function() {
    if (this.consumable) return true;
    if (/^reagent:/.test(this.name)) return true;
    if (/^(lesser|greater) emblem of/i.test(this.name)) return true;
    if (StorageObject.specialConsumables[this.name]) return true;
    return false;
};

// --- Main ---

var g_main = $('#main_content'),
    buttons_commit = $('input[type="submit"][name="ok"][value*="' + _t('Commit') + '"]', g_main) || [];

if (buttons_commit.length > 0) {
    var scope = null;
    if (!scope) scope = $('input[type="submit"][name^="ITEMS_LAGER_DO_SORT"][class*="table_h"]', g_main);
    if (!scope) scope = $('input[type="submit"][name^="ITEMS_KELLER_DO_SORT"][class*="table_h"]', g_main);
    if (!scope) scope = $('input[type="submit"][name^="ITEMS_GROUPCELLAR_DO_SORT"][class*="table_h"]', g_main);

    try { scope = scope[0].parentNode.parentNode.parentNode.parentNode; } catch (ex) { scope = null; }
    if (!scope) return;

    var rows = $('tbody tr[class="row0"]', scope, true),
        rows = rows ? rows.concat($('tbody tr[class="row1"]', scope, true)) : null;
    if (!rows) return;

    var objects = [],
        re_uses  = /\(([0-9]+)\/[0-9]+\)/;

    for (var i = 0, cnt = rows.length; i < cnt; i++) {
        var cells       = rows[i].cells,
            link        = $('a', cells[1]),
            tooltip     = link ? attr(link, 'onmouseover') : false,
            classes     = link ? attr(link, 'class') : '',
            ctrl_select = cells.length > 2 ? $('input[type="checkbox"][name^="doEquip]', cells[2]) : null,
            ctrl_move   = cells.length > 2 ? $('select', cells[2]) : null,
            ctrl_sell   = cells.length > 3 ? $('input[type="checkbox"][name^="Sell"]', cells[3]) : null,
            ctrl_sell   = ctrl_sell === null ? (cells.length > 4 ? $('input[type="checkbox"]', cells[4]) : null) : ctrl_sell,
            name        = innerText(link).replace(/!$/,''),
            size        = innerText(cells[1]).replace(name, '').trim(),
            obj         = new StorageObject();

        obj.name = name;
        obj.consumable = re_uses.test(size);
        obj.usable = classes.indexOf('item_unusable') === -1;
        obj.group = tooltip ? tooltip.indexOf('group item') > -1 : false;
        obj.ctrlSelect = ctrl_select;
        obj.ctrlLocation = ctrl_move;
        obj.ctrlSell = ctrl_sell;

        objects.push(obj);
    }

    if (objects.length === 0) return;

    var labelMove = add('span'),
        labelSell = add('span'),
        buttonSplit = add('input'),
        buttonEquip = add('input'),
        selectMove = add('select'),
        selectSell = add('select');

    labelMove.innerHTML = '&nbsp;Select:&nbsp;';
    labelSell.innerHTML = '&nbsp;Sell:&nbsp;';
    attr(buttonSplit, {'type': 'button', 'class': 'button clickable', 'name': 'buttonSplit', 'value': 'Split', 'style': 'margin-left: 5px'});
    attr(buttonEquip, {'type': 'button', 'class': 'button clickable', 'name': 'buttonEquip', 'value': 'Equip', 'style': 'margin-left: 5px'});

    var moveOptions = ['none', 'none',
                       '---', 'All',
                       'all', 'all',
                       'all_nouse', 'unusable',
                       'all_group', 'group',
                       'all_nongroup', 'non-group',
                       '---', 'Consumables',
                       'con', 'all',
                       'con_nouse', 'unusable',
                       'con_group', 'group',
                       'con_nongroup', 'non-group',
                       '---', 'Items',
                       'itm', 'all',
                       'itm_nouse', 'unusable',
                       'itm_group', 'group',
                       'itm_nongroup', 'non-group'],
        sellOptions = ['none', 'none',
                       '---', 'All',
                       'all', 'all',
                       'all_nouse', 'unusable',
                       '---', 'Consumables',
                       'con', 'all',
                       'con_nouse', 'unusable',
                       '---', 'Items',
                       'itm', 'all',
                       'itm_nouse', 'unusable'],
        op_group = null;

    for (var i = 0, cnt = moveOptions.length; i < cnt; i = i + 2) {
        if (moveOptions[i] === '---') { 
            op_group = add('optgroup');
            attr(op_group, 'label', moveOptions[i + 1]); 
            selectMove.appendChild(op_group); continue;
        }
        var op = add('option');
        attr(op, 'value', moveOptions[i]).innerHTML = moveOptions[i + 1];
        if (op_group) op_group.appendChild(op); else selectMove.appendChild(op);
    }

    op_group = null;

    for (var i = 0, cnt = sellOptions.length; i < cnt; i = i + 2) {
        if (sellOptions[i] === '---') { 
            op_group = add('optgroup');
            attr(op_group, 'label', sellOptions[i + 1]); 
            selectSell.appendChild(op_group); continue;
        }
        var op = add('option');
        attr(op, 'value', sellOptions[i]).innerHTML = sellOptions[i + 1];
        if (op_group) op_group.appendChild(op); else selectSell.appendChild(op);
    }

    var onSelectionChange = function(eventArgs) {
        
        var i, cnt, obj;

        switch(eventArgs.target.value) {
            case 'none':
                for (i = 0, cnt = objects.length; i < cnt; i++) {
                    if (objects[i].ctrlSelect) objects[i].ctrlSelect.checked = false;
                }
                break;
            case 'all':
                for (i = 0, cnt = objects.length; i < cnt; i++) {
                    if (objects[i].ctrlSelect) objects[i].ctrlSelect.checked = true;
                }
                break;
            case 'all_nouse':
                for (i = 0, cnt = objects.length; i < cnt; i++) {
                    obj = objects[i];
                    if (obj.ctrlSelect && !obj.usable) obj.ctrlSelect.checked = true;
                }
                break;
            case 'all_group':
                for (i = 0, cnt = objects.length; i < cnt; i++) {
                    obj = objects[i];
                    if (obj.ctrlSelect && obj.group) obj.ctrlSelect.checked = true;
                }
                break;
            case 'all_nongroup':
                for (i = 0, cnt = objects.length; i < cnt; i++) {
                    obj = objects[i];
                    if (obj.ctrlSelect && !obj.group) obj.ctrlSelect.checked = true;
                }
                break;
            case 'con':
                for (i = 0, cnt = objects.length; i < cnt; i++) {
                    obj = objects[i];
                    if (obj.ctrlSelect && obj.isConsumable()) obj.ctrlSelect.checked = true;
                }
                break;
            case 'con_nouse':
                for (i = 0, cnt = objects.length; i < cnt; i++) {
                    obj = objects[i];
                    if (obj.ctrlSelect && obj.isConsumable() && !obj.usable) obj.ctrlSelect.checked = true;
                }
                break;
            case 'con_group':
                for (i = 0, cnt = objects.length; i < cnt; i++) {
                    obj = objects[i];
                    if (obj.ctrlSelect && obj.isConsumable() && obj.group) obj.ctrlSelect.checked = true;
                }
                break;
            case 'con_nongroup':
                for (i = 0, cnt = objects.length; i < cnt; i++) {
                    obj = objects[i];
                    if (obj.ctrlSelect && obj.isConsumable() && !obj.group) obj.ctrlSelect.checked = true;
                }
                break;
            case 'itm':
                for (i = 0, cnt = objects.length; i < cnt; i++) {
                    obj = objects[i];
                    if (obj.ctrlSelect && !obj.isConsumable()) obj.ctrlSelect.checked  = true;
                }
                break;
            case 'itm_nouse':
                for (i = 0, cnt = objects.length; i < cnt; i++) {
                    obj = objects[i];
                    if (obj.ctrlSelect && !obj.usable && !obj.isConsumable()) obj.ctrlSelect.checked = true;
                }
                break;
            case 'itm_group':
                for (i = 0, cnt = objects.length; i < cnt; i++) {
                    obj = objects[i];
                    if (obj.ctrlSelect && obj.group && !obj.isConsumable()) obj.ctrlSelect.checked = true;
                }
                break;
            case 'itm_nongroup':
                for (i = 0, cnt = objects.length; i < cnt; i++) {
                    obj = objects[i];
                    if (obj.ctrlSelect && !obj.group && !obj.isConsumable()) obj.ctrlSelect.checked = true;
                }
                break;
        }
   };

   var onSellChange = function(eventArgs) {
        
        var i, cnt, obj;

        switch(eventArgs.target.value) {
            case 'none':
                for (i = 0, cnt = objects.length; i < cnt; i++) {
                    if (objects[i].ctrlSell) objects[i].ctrlSell.checked = false;
                }
                break;
            case 'all':
                for (i = 0, cnt = objects.length; i < cnt; i++) {
                    if (objects[i].ctrlSell) objects[i].ctrlSell.checked = true;
                }
                break;
            case 'all_nouse':
                for (i = 0, cnt = objects.length; i < cnt; i++) {
                    obj = objects[i];
                    if (obj.ctrlSell && !obj.usable) obj.ctrlSell.checked = true;
                }
                break;
            case 'con':
                for (i = 0, cnt = objects.length; i < cnt; i++) {
                    obj = objects[i];
                    if (obj.ctrlSell && obj.isConsumable()) obj.ctrlSell.checked = true;
                }
                break;
            case 'con_nouse':
                for (i = 0, cnt = objects.length; i < cnt; i++) {
                    obj = objects[i];
                    if (obj.ctrlSell && obj.isConsumable() && !obj.usable) obj.ctrlSell.checked = true;
                }
                break;
            case 'itm':
                for (i = 0, cnt = objects.length; i < cnt; i++) {
                    obj = objects[i];
                    if (obj.ctrlSell && !obj.isConsumable()) obj.ctrlSell.checked  = true;
                }
                break;
            case 'itm_nouse':
                for (i = 0, cnt = objects.length; i < cnt; i++) {
                    obj = objects[i];
                    if (obj.ctrlSell && !obj.usable && !obj.isConsumable()) obj.ctrlSell.checked = true;
                }
                break;
        }
    };

    var go_gs = 'go_group_2',
        go_tv = 'go_group';

    if (objects.length > 0 && objects[0].ctrlLocation) {
        var ops = objects[0].ctrlLocation.options;
        for (var i = 0, cnt = ops.length; i < cnt; i++) {
            var op = ops[i].value;
            if (op === '-go_group_2') { go_gs = '-go_group_2'; break; }
            if (op === '-go_group')   { go_tv = '-go_group'; break; }
        }
    }

    var onSplit = function() {
        var ok = false, 
            tmp = [], i, cnt, obj;
        for (i = 0, cnt = objects.length; i < cnt; i++) {
            obj = objects[i];
            if (obj.ctrlLocation && obj.ctrlSelect) {
                if (obj.ctrlSelect.checked) {
                    obj.ctrlLocation.value = !obj.isConsumable() ? go_tv : go_gs;
                    ok = true;
                }
                else {
                    tmp.push(obj);
                }
            }
        }
        if (!ok) {
            for (i = 0, cnt = tmp.length; i < cnt; i++) {
                obj = tmp[i];
                obj.ctrlLocation.value = !obj.isConsumable() ? go_tv : go_gs;
            }
        }
    };

    var onEquip = function() {
        var ok = false, 
            tmp = [], i, cnt, obj;
        for (i = 0, cnt = objects.length; i < cnt; i++) {
            obj = objects[i];
            if (obj.usable && obj.ctrlLocation && obj.ctrlSelect) {
                if (obj.ctrlSelect.checked) {
                    obj.ctrlLocation.value = obj.ctrlLocation.options[0].value;
                    ok = true;
                }
                else {
                    tmp.push(obj);
                }
            }
        }
        if (!ok) {
            for (i = 0, cnt = tmp.length; i < cnt; i++) {
                obj = tmp[i];
                obj.ctrlLocation.value = obj.ctrlLocation.options[0].value;
            }
        }
    };

    var holder = buttons_commit[0].parentNode,
        buttonSplit2 = buttonSplit.cloneNode(true),
        buttonEquip2 = buttonEquip.cloneNode(true),
        labelSell2   = labelSell.cloneNode(true),
        labelMove2   = labelMove.cloneNode(true),
        selectSell2  = selectSell.cloneNode(true),
        selectMove2  = selectMove.cloneNode(true);

    selectMove.addEventListener('change', onSelectionChange, false);
    selectMove2.addEventListener('change', onSelectionChange, false);
    selectSell.addEventListener('change', onSellChange, false);
    selectSell2.addEventListener('change', onSellChange, false);
    buttonSplit.addEventListener('click', onSplit, false);
    buttonSplit2.addEventListener('click', onSplit, false);
    buttonEquip.addEventListener('click', onEquip, false);
    buttonEquip2.addEventListener('click', onEquip, false);

    holder.insertBefore(labelMove, buttons_commit[0].nextSibling);
    holder.insertBefore(selectMove, labelMove.nextSibling);
    holder.insertBefore(buttonSplit, selectMove.nextSibling);
    holder.insertBefore(buttonEquip, buttonSplit.nextSibling);
    holder.insertBefore(labelSell, buttonEquip.nextSibling);
    holder.insertBefore(selectSell, labelSell.nextSibling);

    holder = buttons_commit[1].parentNode;
    holder.insertBefore(labelMove2, buttons_commit[1].nextSibling);
    holder.insertBefore(selectMove2, labelMove2.nextSibling);
    holder.insertBefore(buttonSplit2, selectMove2.nextSibling);
    holder.insertBefore(buttonEquip2, buttonSplit2.nextSibling);
    holder.insertBefore(labelSell2, buttonEquip2.nextSibling);
    holder.insertBefore(selectSell2, labelSell2.nextSibling);}




})();
