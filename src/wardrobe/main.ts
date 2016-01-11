/// <reference path="../common/functions/functions.dom.ts" />
/// <reference path="../common/prototypes/prototypes.string.ts" />
/// <reference path="../common/selector.ts" />

// --- Main

var container = add('div');

add('hr', container);

var labelCurrent = add('h1', container);
labelCurrent.innerHTML = 'Profile: default';

var select = add('select', container);
select.innerHTML = '<option>default</option>';

add('br', container);
add('br', container);

var buttonSave = add('input', container);
attr(buttonSave, {'type': 'button', 'value': 'Save', 'class': 'button clickable'});

var buttonSaveAs = add('input', container);
attr(buttonSaveAs, {'type': 'button', 'value': 'Save as', 'class': 'button clickable'});

var buttonLoad = add('input', container);
attr(buttonLoad, {'type': 'button', 'value': 'Load', 'class': 'button clickable'});

var buttonDelete = add('input', container);
attr(buttonDelete, {'type': 'button', 'value': 'Delete', 'class': 'button clickable'});

add('hr', container);

var configValidator = $('#htmlComponentCombatConfigValidator');
configValidator.parentNode.insertBefore(container, configValidator.nextSibling);

var form = document.forms['the_form'];
if (form && form.action.indexOf('&view=gear') === -1) {
    form.action += '&view=gear';
}

var onLoad = function() {
    var loadForm = add('form', document.body);
    loadForm.action = form.action;
    loadForm.method = 'POST';
    loadForm.name = 'the_form';

    var items = [
        {'location': 'LocationEquip[go_kopf][0]', 'value': '20323058'},
        {'location': 'LocationEquip[go_ohren][0]', 'value': '12681335'},
        {'location': 'LocationEquip[go_tasche][16]', 'value': '17387957'}
    ];

    var item;

    for (var i = 0; i < items.length; i++) {
        item = items[i];
        var val = add('input', loadForm);
        attr(val, {'type': 'hidden', 'name': item.location, 'value': item.value});
    }

    var post_id = add('input', loadForm);
    attr(post_id, {'type': 'hidden', 'name': 'wod_post_id', 'value': form.wod_post_id.value});

    var ok = add('input', loadForm);
    attr(ok, {'type': 'hidden', 'name': 'ok', 'value': 'Commit Changes'});

    loadForm.submit();
    // console.log(loadForm);
};

buttonLoad.addEventListener('click', onLoad, false);

// head <input type="hidden" name="LocationDefault[go_kopf][0] " value="13541180">
// ears <input type="hidden" name="LocationDefault[go_ohren][0] " value="12681335">
// face <input type="hidden" name="LocationDefault[go_brille][0] " value="17294509">
// neck <input type="hidden" name="LocationDefault[go_hals][0] " value="13669692">
// torso <input type="hidden" name="LocationDefault[go_torso][0] " value="13173809">
// belt <input type="hidden" name="LocationDefault[go_schaerpe][0] " value="17317205">
// cloak <input type="hidden" name="LocationDefault[go_umhang][0] " value="14844468">
// arms <input type="hidden" name="LocationDefault[go_arme][0] " value="20320845">
// gloves <input type="hidden" name="LocationDefault[go_hand][0] " value="12793912">
// both hands <input type="hidden" name="LocationDefault[go_beide_haende][0] " value="">
// right hand <input type="hidden" name="LocationDefault[go_waffen_hand][0] " value="14835977">
// left hand <input type="hidden" name="LocationDefault[go_schild_hand][0] " value="16063163">
// legs <input type="hidden" name="LocationDefault[go_beine][0] " value="12754565">
// feet <input type="hidden" name="LocationDefault[go_fuss][0] " value="14230542">
// medal 1 <input type="hidden" name="LocationDefault[go_orden][0] " value="16461806">
// medal 2 <input type="hidden" name="LocationDefault[go_orden][1] " value="16461806">

// pocket 1 <input type="hidden" name="LocationDefault[go_tasche][0] " value="16137359">
// ring 1 <input type="hidden" name="LocationDefault[go_ring][0] " value="14298769"
