// ==UserScript==
// @name           Numismatist
// @description    TODO
// @version        1.0.0
// @author         Never
// @include        http*://*.world-of-dungeons.*wod/spiel/help/dungeonlist.php*
// @include        http*://*.world-of-dungeons.*wod/spiel/hero/title_list.php?menukey=hero_titles*
// @include        http*://*.world-of-dungeons.*wod/spiel/hero/advance.php?menukey=level_costs*
// @run-at         document-start
// @grant          GM_xmlhttpRequest
// ==/UserScript==

(function() {
'use strict';
function parseHTML(str, returnBody) {
    var e = document.implementation.createHTMLDocument();
    e.body.innerHTML = str;
    return returnBody ? e.body : e.body.children.length === 1 ? e.body.children[0] : e.body.children;
}
function add(tag, parentNode) {
    var elem = typeof tag === 'string' ? document.createElement(tag) : tag;
    if (parentNode && parentNode.nodeType) {
        parentNode.appendChild(elem);
    }
    return elem;
}
function attr(elem, nameOrMap, value, remove) {
    if (remove) {
        elem.removeAttribute(nameOrMap);
    }
    else if (typeof nameOrMap === 'object') {
        Object.keys(nameOrMap).forEach(function (key) { elem.setAttribute(key, nameOrMap[key]); });
    }
    else if (value) {
        elem.setAttribute(nameOrMap, value);
    }
    else {
        return elem.getAttribute(nameOrMap);
    }
    return elem;
}
function httpFetch(url, method, data) {
    if (method === void 0) { method = 'GET'; }
    if (data === void 0) { data = undefined; }
    return new Promise(function (resolve, reject) {
        var request = {
            method: method,
            url: url,
            headers: { Cookie: document.cookie },
            onload: function (request) {
                if (request.readyState !== 4)
                    return;
                if (request.status >= 200 && request.status < 300)
                    resolve({
                        data: request.responseText
                    });
                else
                    reject({
                        data: request.responseText
                    });
            }
        };
        if (typeof data === 'object') {
            request.data = JSON.stringify(data);
            request.headers = { 'Content-Type': 'application/json' };
        }
        GM_xmlhttpRequest(request);
    });
}
function log() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    var log = document.getElementById('_log-window');
    if (!log) {
        var center = document.getElementById('gadgettable-center-gadgets');
        log = document.createElement('textarea');
        log.setAttribute('style', 'height: 200px; width:1000px');
        log.setAttribute('id', '_log-window');
        center.parentNode.insertBefore(log, center);
    }
    log.textContent += args.join(' ') + '\n';
}
function main(main_content) {
    var isDungeonList = location.pathname.includes('dungeonlist');
    var idGroup = document.forms.the_form.gruppe_id.value;
    var p = getGroupHeroes(idGroup).then(getHeroProfiles.bind(null, isDungeonList));
    if (isDungeonList) {
        p.then(showDungeonMedalInfo);
    }
    else if (location.pathname.includes('title_list')) {
        p.then(showFameMedalInfo);
    }
    else {
        p.then(showLevelUpMedalInfo);
    }
}
function getGroupHeroes(idGroup) {
    return new Promise(function (resolve, reject) {
        httpFetch("/wod/spiel/dungeon/group.php?id=" + idGroup).catch(reject).then(function (resp) {
            var groupHeroes = Array.from((parseHTML(resp.data, true)).querySelectorAll('.main_content tbody .content_table_mainline a'))
                .map(function (x) { return { name: x.textContent, profileUrl: x.getAttribute('href') }; });
            resolve(groupHeroes);
        });
    });
}
function getHeroProfiles(includeMedals, groupHeroes) {
    return Promise.all(groupHeroes.map(function (hero) { return parseProfile(includeMedals, hero); }));
}
function parseProfile(includeMedals, hero) {
    return new Promise(function (resolve, reject) {
        httpFetch(hero.profileUrl).catch(reject).then(function (resp) {
            var html = parseHTML(resp.data, true);
            var profile = { name: hero.name, profileUrl: hero.profileUrl, isMentor: true };
            var rows = (Array.from(html.querySelectorAll('.content_table tr')));
            rows.forEach(function (x) {
                if (x.cells[0].textContent.trim() === 'class') {
                    profile.isMentor = x.cells[1].textContent.trim().includes('Mentor');
                }
                else if (x.cells[0].textContent.trim() === 'fame') {
                    profile.fame = Number(x.cells[1].textContent.replace(/ /g, ''));
                }
                else if (x.cells[0].textContent.trim().includes('gained')) {
                    profile.exp = Number(x.cells[1].textContent.replace(/ /g, ''));
                }
            });
            if (!includeMedals || profile.isMentor) {
                resolve(profile);
                return;
            }
            var medalsUrl = Array.from(html.querySelectorAll('#smarttabs__details_inner a'))
                .map(function (x) { return x.getAttribute('href'); })
                .find(function (x) { return x && x.includes('goallist'); });
            httpFetch(medalsUrl).catch(reject).then(function (resp2) {
                profile.medals = Array.from((parseHTML(resp2.data, true)).querySelectorAll('.details.earned .label'))
                    .map(function (x) { return x.innerHTML; });
                resolve(profile);
            });
        });
    });
}
function showLevelUpMedalInfo(profiles) {
    var rows = Array.from(document.querySelectorAll('.content_table tr'));
    var nonMentors = profiles.filter(function (x) { return !x.isMentor; });
    rows.forEach(function (tr, i) {
        var td = tr.cells[0];
        td.setAttribute('style', 'min-width: 50px');
        if (i > 2) {
            var requiredExp_1 = parseInt(tr.cells[2].textContent.replace(/\s/g, ''));
            var notObtained = nonMentors.filter(function (x) { return x.exp < requiredExp_1; }).map(function (x) { return (x.name + " (" + (requiredExp_1 - x.exp).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ") + ")"); }).sort();
            if (notObtained.length) {
                addMedalIcon(false, td, 'left');
                tr.setAttribute('title', "Exp deficit (" + notObtained.length + "):\n\n" + notObtained.join('\n'));
            }
            else {
                addMedalIcon(true, td, 'left');
            }
        }
    });
}
function showFameMedalInfo(profiles) {
    var rows = Array.from(document.querySelectorAll('.content_table tr'));
    var medals = ['pin', 'oak leaf', 'shamrock', 'laurel'];
    var nonMentors = profiles.filter(function (x) { return !x.isMentor; });
    rows.forEach(function (tr, i) {
        var td = add('td');
        td.setAttribute('style', 'min-width: 210px');
        if (i > 0) {
            var name_1 = "" + (i > 4 ? 'large ' : '') + medals[(i - 1) % medals.length] + (i > 12 ? ' of honor' : i > 8 ? ' and ribbon' : '');
            var a = add('a', td);
            a.href = "/wod/spiel/hero/item.php?name=" + name_1.replace(/ /g, '+') + "&is_popup=1";
            a.target = '_blank';
            a.textContent = name_1;
            var requiredFame_1 = parseInt(tr.cells[0].textContent.replace(/\d+. title/, ''));
            var notObtained = nonMentors.filter(function (x) { return x.fame < requiredFame_1; }).map(function (x) { return (x.name + " (" + (requiredFame_1 - x.fame).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ") + ")"); }).sort();
            if (notObtained.length) {
                addMedalIcon(false, td);
                tr.setAttribute('title', "Fame deficit (" + notObtained.length + "):\n\n" + notObtained.join('\n'));
            }
            else {
                addMedalIcon(true, td);
            }
        }
        else {
            td.innerHTML = '<strong>medal</strong>';
        }
        tr.insertBefore(td, tr.cells[1]);
    });
}
function showDungeonMedalInfo(profiles) {
    var map = profiles.reduce(function (acc, x) {
        x.medals.forEach(function (m) {
            var key = m.toLowerCase();
            if (!Array.isArray(acc[key]))
                acc[key] = [];
            acc[key].push(x.name);
        });
        return acc;
    }, {});
    var dungeons = Array.from(document.querySelectorAll('#main_content .content_table tbody tr td:nth-child(2)'));
    var nonMentors = profiles.filter(function (x) { return !x.isMentor; });
    dungeons.forEach(function (td) {
        var key = td.textContent.trim().toLowerCase();
        var heroes = map[key] || [];
        var allHeroes = profiles.length && heroes.length === nonMentors.length;
        if (!allHeroes) {
            var notObtained = profiles.filter(function (x) { return heroes.indexOf(x.name) < 0; }).map(function (x) { return x.name; }).sort();
            td.setAttribute('title', "Missing medal (" + notObtained.length + "):\n\n" + notObtained.join('\n'));
        }
        addMedalIcon(allHeroes, td);
    });
}
function addMedalIcon(isAchieved, elem, position) {
    if (position === void 0) { position = 'right'; }
    var img = add('img', elem);
    img.src = "/wod/css/icons/common/" + (isAchieved ? 'medal_big' : 'medal_big_gray') + ".png";
    attr(img, 'style', 'width: 24px; float: ' + position);
}
if (!window.__karma__)
    document.addEventListener('DOMContentLoaded', function () { return main(); });

})();
