// --- Main

var VERSION = '1.0.8';

/***
 * TODO:
 *   - parse race
 *   - parse skill modifiers
 *   - parse equipment
 *   - parse subclass
 *   - parse talents
 */

var g_form_skills = $('#main_content form'),
    g_button_export,
    g_check_gear,
    g_img_wait,
    g_hero,
    g_jobs;

var exportSkills = function() {

    attr(g_button_export, 'disabled', 'true');
    cssClass(g_button_export, 'button clickable', false);
    cssClass(g_button_export, 'button_disabled', true);
    attr(g_img_wait, 'style', null, true);

    get(location.href.replace('skills.php', 'attributes.php'), function(attrHtml) {
        var skill_rows = $('.row0', g_form_skills, true).concat($('.row1', g_form_skills)),
            attr_html = add('div');

        attr_html.innerHTML = attrHtml;

        g_hero = new Hero();
        g_jobs = 0;
        g_hero.parse($('form', attr_html)[1]);

        var skills = [];

        for (var i = 0, cnt = skill_rows.length; i < cnt; i++) {
            var skill = new HeroSkill().parse(skill_rows[i]);
            if (skill.rank > 0) {
                skill.hero = g_hero;
                skill.onDone = showResult;
                g_jobs++;
                get(skill.url, skill.fetchInfo, skill, true);
                skills.push(skill);
            }
        }

        skills.sort(function(x,y) { return y.effective_rank - x.effective_rank; });

        g_hero.skills = skills;
    });
};

var showResult = function(skill) {
    if (skill) g_jobs--;
    if (g_jobs <= 0) {

        var h1 = $('h1', g_form_skills),
            txt_export = $('#profile-export-result', h1),
            date = new Date(),
            stamp = [date.getDate().toString().pad(2, '0', true), (date.getMonth() + 1).toString().pad(2, '0', true), date.getFullYear().toString().substring(2)].join('.'),
            url = '[url=https://raw.github.com/slicklash/wod-scripts/master/release/profile_export.user.js]Profile Export[/url]',
            bbcode = g_hero.generateBBCode().trim() + '\n[size=9]\nGenerated: ' + stamp + ' - ' + url + ' ' + VERSION + '[/size]';

        if (!txt_export) txt_export = add('textarea', h1.parentNode);
        attr(txt_export, {'rows': '4', 'cols': '50', 'id': 'profile-export-result'});
        txt_export.innerHTML = bbcode;
        attr(g_img_wait, 'style', 'display: none');
    }
};

if (g_form_skills && g_form_skills.action && g_form_skills.action.match(/hero\/skills\.php/i)) {
    var buttons = $('tbody .button', g_form_skills),
        button = buttons[buttons.length - 1];

    if (button.value === 'Show Details') {
        g_button_export = add('input');
        g_check_gear = add('input');
        label_gear = add('label');
        label_gear.innerHTML = 'Equipment';
        attr(g_button_export, {'type': 'button', 'class': 'button clickable', 'value': 'Export', 'style': 'margin-left: 4px'});
        attr(g_check_gear, {'type': 'checkbox', 'id': 'export-gear', 'style': 'margin-left: 4px'});
        attr(label_gear, {'for': 'export-gear'});
        g_button_export.addEventListener('click', exportSkills, false);
        button.parentNode.insertBefore(label_gear, button.nextSibling);
        button.parentNode.insertBefore(g_check_gear, label_gear);
        button.parentNode.insertBefore(g_button_export, g_check_gear);
        button.parentNode.insertBefore(add('br'), label_gear.nextSibling);

        g_img_wait = attr(add('img', add('div')), {'src': location.protocol + '//' + location.host + '/wod/css/img/ajax-loader.gif', 'style': 'display: none'});
        button.parentNode.insertBefore(g_img_wait, button.parentNode.firstChild);
    }
}
