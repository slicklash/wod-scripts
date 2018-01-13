
const crafting = [];
const appointments = [];

export function initTabs() {

    // --- Adventures

    if (document.querySelector('.paginator_row')) {

        const appList = ['The Adventurers\' Guild', 'Passingtime', 'Rescuing Father Wuel', 'The Fortunes of Madame', 'Ingenuity Test'];

        const isAppointment = title => appList.some(x => title.indexOf(x) > -1);
        const invertClass = className => className === 'row0' ? 'row1' : 'row0';
        const titleOf = node => (node.querySelector('h3') || { innerHTML: '' }).innerHTML;

        const adventures: any[] = Array.from(document.querySelectorAll('.row0, .row1'));
        let craftClass = 'row1';
        let appClass = 'row1';

        const guild = adventures.filter(x => titleOf(x) === appList[0]).pop();
        if (guild) {
            guild.parentNode.insertBefore(guild, guild.parentNode.childNodes[0]);
            adventures.splice(adventures.indexOf(guild), 1);
            adventures.splice(0, 0, guild);
        }

        for (const adventure of adventures) {

            const className = adventure.className;
            const title = titleOf(adventure);

            if (!title) continue;

            if (isAppointment(title)) {

                if (appClass === className) {
                    appClass = invertClass(appClass);
                    adventure.className = appClass;
                } else {
                    appClass = className;
                }

                appointments.push(adventure);
                adventure.style.display = 'none';
            } else {

                if (craftClass === className) {
                    craftClass = invertClass(craftClass);
                    adventure.className = craftClass;
                } else {
                    craftClass = className;
                }

                crafting.push(adventure);
            }

            hideDescription(adventure);
        }

        const tabCrafting = makeTab('Crafting', true);
        const tabAppointments = makeTab('Appointments', false);

        const menu = document.createElement('ul');
        menu.innerHTML = '<li class="label">Adventures</li>';

        menu.appendChild(tabCrafting);
        menu.appendChild(tabAppointments);

        const bar = document.createElement('div');
        bar.className = 'bar';

        const content = document.createElement('div');
        content.className = 'content';

        const div = document.createElement('div');
        div.className += 'tab';
        div.appendChild(menu);
        div.appendChild(bar);
        div.appendChild(content);

        const h1 = document.getElementsByTagName('h1')[0];
        const p = h1.parentNode;
        p.replaceChild(div, h1);
    }
}

function hideDescription(row) {

    const td = row.querySelector('td');
    const descriptionNodes = Array.from(td.childNodes).filter(x => (<any> x).nodeName !== 'TABLE');
    const div = document.createElement('div');
    const header = td.children[0];

    div.style.display = 'none';
    td.insertBefore(div, header.nextSibling);
    descriptionNodes.forEach(x => div.appendChild(<any> x));

    header.style.cursor = 'pointer';

    const title = header.querySelector('h3');
    title.style.display = 'inline';

    const im = document.createElement('img');
    im.src = '/wod/css/icons/common/more_text.png';
    im.style.paddingLeft = '10px';

    title.parentNode.appendChild(im);
    title.parentElement.style.paddingBottom = '5px';
    td.style.paddingBottom = '5px';

    header.addEventListener('click', () => {
        if (div.style.display) {
            div.style.display = '';
            im.src = im.src.replace('more', 'less');
        } else {
            div.style.display = 'none';
            im.src = im.src.replace('less', 'more');
        }
    });
}

function makeTab(title, selected) {
    const action = document.createElement('a');
    action.setAttribute('href', '#');
    action.innerHTML = title;
    action.addEventListener('click', selectTab);

    const tab = document.createElement('li');
    tab.className = selected ? 'selected' : 'not_selected';
    tab.appendChild(action);
    return tab;
}

function selectTab(e) {

    const max = Math.max(crafting.length, appointments.length);
    const isApp = e.target.innerHTML === 'Appointments';
    const selectedTab = e.target.parentNode;
    const options = isApp ? { otherTab: selectedTab.previousSibling, displayApp: '', displayCraft: 'none' } : { otherTab: selectedTab.nextSibling, displayApp: 'none', displayCraft: '' };

    selectedTab.className = 'selected';
    options.otherTab.className = 'not_selected';

    for (let i = 0; i < max; i++) {
        if (i < crafting.length) crafting[i].style.display = options.displayCraft;
        if (i < appointments.length) appointments[i].style.display = options.displayApp;
    }
}
