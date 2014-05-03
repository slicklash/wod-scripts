
// --- Selector

function $(selector: string, parentNode?, resultAsArray?: boolean) {
    var context = parentNode || document;

    if (!selector || typeof selector !== 'string' || !(context.nodeType === 9 || context.nodeType === 1)) {
        return null;
    }

    var selectors = selector.split(/\s+/),
        result = [context],
        returnArray = resultAsArray || false;

    for (var i = 0, cnt = selectors.length; i < cnt; i++) {

        var new_result = [],
            m_elem = selectors[i].match(/^([\.#]?[a-z0-9\-_]+\w*)/i), 
            sel = m_elem ? m_elem[1] : '',
            s = selectors[i].replace(sel, ''),
            re_attr = /(\[([a-z]+)([\*\^\$]?=)"(\w+)"\])/gi, 
            filters = [];

        while ((filter = re_attr.exec(s))) {

            if (filter.index === re_attr.lastIndex) {
                re_attr.lastIndex++;
            }

            filters.push({ 'attribute': filter[2], 'condition': filter[3], 'value': filter[4] });
        }

        var j, c2, c3, k, v;

        switch(sel[0]) {
            case '#':
                new_result = [document.getElementById(sel.substring(1))];
                if (!new_result[0]) {
                    return null;
                }
                break;
            case '.':
                for (j = 0, c2 = result.length; j < c2; j++) {
                    v = result[j].getElementsByClassName(sel.substring(1));
                    for (k = 0, c3 = v.length; k < c3; new_result.push(v[k++])) ;
                }
                break;
            default:
                for (j = 0, c2 = result.length; j < c2; j++) {
                    v = result[j].getElementsByTagName(sel);
                    for (k = 0, c3 = v.length; k < c3; new_result.push(v[k++])) ;
                }
                break;
        }

        if (filters.length > 0) {
            result = [];
            for (var g = 0, cntg = new_result.length; g < cntg; g++) {

                var elem = new_result[g],
                    ok = false;

                for (var l = 0, cntl = filters.length; l < cntl; l++) {

                    var filter = filters[l],
                        attr = elem.getAttribute(filter.attribute);

                    if (attr) {

                        switch(filter.condition) {
                            case '*=':
                                ok = attr.indexOf(filter.value) > -1;  
                                break;
                            case '^=':
                                ok = attr.indexOf(filter.value) === 0; 
                                break;
                            case '$=':
                                ok = attr.indexOf(filter.value, attr.length - filter.value.length) > -1; 
                                break;
                            default  :
                                ok = attr === filter.value; 
                                break;
                        }
                    }

                    if (ok === false) {
                        break;
                    }
                }

                if (ok === true) {
                    result.push(elem);
                }
            }
        }
        else {
            result = new_result;
        }
    }

    if (result.length === 0 || result[0] === context) {
        return null;
    }

    return !returnArray && result.length === 1 ? result[0] : result;
}
