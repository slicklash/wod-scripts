
// --- World 

function World() {
    this.classes = [];
    this.races = [];
}

World.prototype.parse = function (classRaceHtml) {
    var tmp = add('div');
    tmp.innerHTML = classRaceHtml;

    var form = $('form', tmp)[1],
    rows = $('.content_table tbody tr', form);

    if (!rows && rows.length === 0) 
        return;

    for (var i = 1, cnt = rows.length; i < cnt; i++) {
        var cells     = rows[i].cells,
            name      = innerText(cells[1]).trim(),
            isRace    = attr($('img', cells[2]), 'src').indexOf('yes.png') > -1;

        if (isRace) {
            this.races.push(name);
        }
        else {
            this.classes.push(name);
        }
    }
};
