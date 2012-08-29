// ==UserScript==
// @name           Favorite Menu
// @description    Script allows to alter main menu by injecting customizable entries
// @version        1.0 
// @namespace      Never
// @include        http*://*.world-of-dungeons.net*
// ==/UserScript==

(function() {

// --- Selector

function $(y,c,H){var a=c||document;if(!y||typeof y!=="string"||!(a.nodeType===9||a.nodeType===1)){return null}var b=y.split(/\s+/),f=[a],o=H||false;for(var A=0,z=b.length;A<z;A++){var F=[],E=b[A].match(/^([\.#]?[a-z0-9\-_]+\w*)/i),u=E?E[1]:"",n=b[A].replace(u,""),C=/(\[([a-z]+)([\*\^\$]?=)"(\w+)"\])/gi,d=[];while((e=C.exec(n))){if(e.index===C.lastIndex){C.lastIndex++}d.push({attribute:e[2],condition:e[3],value:e[4]})}var x,q,p,w,h;switch(u[0]){case"#":F=[document.getElementById(u.substring(1))];if(!F[0]){return null}break;case".":for(x=0,q=f.length;x<q;x++){h=f[x].getElementsByClassName(u.substring(1));for(w=0,p=h.length;w<p;F.push(h[w++])){}}break;default:for(x=0,q=f.length;x<q;x++){h=f[x].getElementsByTagName(u);for(w=0,p=h.length;w<p;F.push(h[w++])){}}break}if(d.length>0){f=[];for(var D=0,I=F.length;D<I;D++){var G=F[D],m=false;for(var t=0,B=d.length;t<B;t++){var e=d[t],r=G.getAttribute(e.attribute);if(r){switch(e.condition){case"*=":m=r.indexOf(e.value)>-1;break;case"^=":m=r.indexOf(e.value)===0;break;case"$=":m=r.indexOf(e.value,r.length-e.value.length)>-1;break;default:m=r===e.value;break}}if(m===false){break}}if(m===true){f.push(G)}}}else{f=F}}if(f.length===0||f[0]===a){return null}return !o&&f.length===1?f[0]:f};

// --- Functions

var attr=function(d,b,e,a){if(a){d.removeAttribute(b)}else{if(typeof b==="object"){for(var c in b){d.setAttribute(c,b[c])}}else{if(e){d.setAttribute(b,e)}else{return d.getAttribute(b)}}}return d};
var cssClass=function(d,c,a){var b=d.className.indexOf(c)!==-1;if(typeof a!=="boolean"){return b}if(b&&a){return d}d.className=a?d.className+" "+c:d.className.replace(c,"").replace(/^\s+|\s+$/g,"");return d};
var add=function(c,a){var b=typeof c!=="object"?document.createElement(c):c;if(a&&a.nodeType){a.appendChild(b)}return b};

// --- Main

var MY_MENU_NAME        = 'Favorites';

// For available menu keys look bellow the layout configuration

var MY_MENU_LAYOUT = {
   'my_heroes': [
        'My Heroes', {
            'hero_attributes'       : 'Attributes',
            'hero_skills'           : 'Skills',
            'hero_gear'             : 'Equipment',
            'hero_storage'          : 'Storage',
            'hero_cellar'           : 'Cellar',
            'hero_skillconf'        : 'Settings',
            'arena'                 : 'Arena',
            'hero_profiles'         : 'Profile'
        }
    ],
    'group': [
        'My Group', {
            'dungeon'               : 'Dungeon',
            'reports'               : 'Reports',
            'hero_group_cellar'     : 'GS',
            'hero_group_treasure'   : 'TV',
            'group_cashbox'         : 'Funds'
        }
    ],
    'trade_exchange': [
        'Trade', {
            'trade_market'          : 'Marketplace',
            'trade_auction'         : 'Auctions',
            'trade_bids'            : 'Offers'
        }
    ],
    'recruite_ranking': [
        'Leaderboard', {
            'duells_ranking_groups' : 'Groups',
            'duells_ranking_clans'  : 'Clans'
        }
    ]
};

/* available menu keys

'my_heroes'                 : 'My Heroes',
'hero_attributes'           : 'Attributes',
'hero_skills'               : 'Skills',
'hero_gear'                 : 'Equipment',
'hero_storage'              : 'Storage',
'hero_cellar'               : 'Cellar',
'hero_group_cellar'         : 'Group Storage',
'hero_group_treasure'       : 'Treasure Vault',
'group_cashbox'             : 'Group funds',
'hero_skillconf'            : 'Settings',
'hero_profiles'             : 'My hero',
'all_profiles'              : 'All heroes',
'hero_title'                : 'Title',
'group'                     : 'My Group',
'groupsearch'               : 'Group search',
'dungeon'                   : 'Dungeon',
'quests'                    : 'Quests',
'reports'                   : 'Reports',
'halloffame'                : 'Hall of Fame',
'forums_group'              : 'Group-Forum',
'group_chat'                : 'Chat',
'grouplist'                 : 'All Groups',
'clan'                      : 'My Clan',
'forums_clan'               : 'Clan-Forum',
'all_clans'                 : 'All Clans',
'pm'                        : 'Messages',
'forums_all'                : 'Forum',
'forums_search'             : 'Search',
'chat'                      : 'Chat',
'forums_polls'              : 'Polls',
'ticker'                    : 'The town crier',
'arena'                     : 'Arena',
'duells'                    : 'Duel',
'duells_search'             : 'Search for Opponents',
'duells_forum_tournament'   : 'Duel-, Tournament- and League-Forums',
'duell_chat'                : 'Duel chat',
'duells_results'            : 'Results',
'duells_ranking_heroes'     : 'Heroes',
'duells_ranking_groups'     : 'Groups',
'duells_ranking_clans'      : 'Clans',
'trade_market'              : 'Marketplace',
'hero_market'               : 'My Sales',
'forum_trade'               : 'Buy and Sell Forums',
'trade_chat'                : 'Trade Chat',
'trade_exchange'            : 'Trade',
'trade_auction'             : 'Auctions',
'trade_bids'                : 'Offers',
'bazar'                     : 'Shops',
'trade_beg'                 : 'Beggars and Charity',
'trade_ranking'             : 'Merchant Ranks',
'get_diamonds'              : 'Sapphire market',
'my_murequest'              : 'IP Sharing',
'my_account'                : 'Settings',
'newsletter'                : 'Newsletter',
'recruit_benefits'          : 'Advantages',
'recruite_invite'           : 'Tell your friend by email',
'recruite_forums'           : 'Fame for posting in forums',
'recruite_hp'               : 'For your web site',
'logos'                     : 'WoD-Logos',
'recruite_fame'             : 'My Recruits',
'recruite_ranking'          : 'Leaderboard',
'vote'                      : 'Vote now',
'forum_help'                : 'Forums for advice and help',
'hero_classes'              : 'Classes and Races',
'hero_titles'               : 'Title List',
'level_costs'               : 'Training Costs',
'master_ranks'              : 'Master Ranks',
'help_smilies'              : 'Smileys',
'stats_finance'             : 'Finances',
'dungeonlist'               : 'List of dungeons',

*/

var verticalMenu = $('.menu-vertical .menu-0-body');

if (verticalMenu) {

    var skin = $('link[href*="skin"]').href.match(/skin[0-9\-]+/i),
        font_render_url = 'http://fonts.neise-games.de/java_font_renderer/render?skin=' + skin,
        my_menu = add('div'),
        caption = add('a', my_menu),
        supports_img = skin && skin != 'skin-1';

    attr(my_menu, {'class': 'menu-1', id: 'menu_my_menu'});
    attr(caption, {'class': 'menu-1-caption alink selected', 'onclick': "return menuOnClick(this,'','','');"});

    if (supports_img) {
        attr(add('img', caption), {'class': 'font_menu-1', 'alt': MY_MENU_NAME, 'src' : font_render_url + '&profil=font_menu-1&text=' + MY_MENU_NAME});
        attr(add('img', caption), {'class': 'font_menu-1-hovered', 'alt': MY_MENU_NAME, 'src' : font_render_url + '&profil=font_menu-1-hovered&text=' + MY_MENU_NAME});
        attr(add('img', caption), {'class': 'font_menu-1-selected', 'alt': MY_MENU_NAME, 'src' : font_render_url + '&profil=font_menu-1-selected&text=' + MY_MENU_NAME});
    }
    else {
        if (caption.innerText) {
           caption.innerText = MY_MENU_NAME;
        }
        else {
           caption.textContent = MY_MENU_NAME;
        }
    }

   attr(add('span', caption), 'class', 'menu-1-arrow open');

   var menu0 = add('div', my_menu),
       menu_body = add('div', menu0),
       menu1 = $('.menu-1', verticalMenu),
       links = $('.menu-2 a', verticalMenu),
       menu_items = {},
       open_links = {};

   attr(menu0, {'class': 'menu-1-body', 'style' : 'display: block'});
   attr(menu_body, 'class', 'menu-2');

   for (var i = 0, cnt = menu1.length; i < cnt; i++) {
       var open_menu = menu1[i];
       if (cssClass(open_menu, 'open')) {
           var tmp = $('a', open_menu);
           for (var j = 0, c2 = tmp.length; j < c2; j++) {
               var name = attr(tmp[j], 'onclick').match(/'([a-z_ ]+)',''\);$/i);
               if (name) open_links[name[1]] = open_menu;
           }
       }
   }

   // var keys = '';

   for (var i = 0, cnt = links.length; i < cnt; i++) {
       var link = links[i],
           name = attr(link, 'onclick').match(/'([a-z_ ]+)',''\);$/i);
       if (name) {
           menu_items[name[1]] = link.cloneNode(true);
           // keys += "'" + name[1] + "' : '" + link.innerText.replace(/^\s+|\s+$/g,"") + "',\n";
       }
   }

   for(var key in MY_MENU_LAYOUT) {
       var link = menu_items[key],
           submenu = false;
       if (!link) {
           link = add('a');
           attr(link, {'href':'#', 'class': 'menu-2-caption'});
       }
       attr(link, 'onclick', null, true);
       var menu_item = MY_MENU_LAYOUT[key];
       if (typeof menu_item === 'string') {
           link.innerHTML = menu_item;
           var open_menu = open_links[key];
           if (open_menu) {
               var arrow = $('.menu-1-arrow', open_menu);
               cssClass(open_menu, 'open', false);
               if (arrow) {
                   cssClass(arrow, 'open', false);
                   cssClass(arrow, 'closed', true);
               }
           }
       }
       else {
           if (link.innerText) {
               link.innerText = menu_item[0];
           }
           else {
               link.textContent = menu_item[0];
           }
           var submenu_items = menu_item[1];
           submenu = add('div');
           attr(submenu, {'class': 'menu-2-body', 'style': 'padding-top: 0px'});
           for (var subkey in submenu_items) {
               var sublink = menu_items[subkey];
               if (sublink) {
                   attr(sublink, 'onclick', null, true);
                   var menu3 = add('div', submenu),
                       menu3_cap = add(sublink, menu3);
                   attr(menu3, 'class', 'menu-3');
                   cssClass(menu3_cap, 'menu-2-caption', false);
                   cssClass(menu3_cap, 'menu-3-caption', true);
                   menu3_cap.innerHTML = submenu_items[subkey];
                   var open_menu = open_links[subkey];
                   if (open_menu) {
                       var arrow = $('.menu-1-arrow', open_menu);
                       cssClass(open_menu, 'open', false);
                       if (arrow) {
                           cssClass(arrow, 'open', false);
                           cssClass(arrow, 'closed', true);
                       }
                   }
               }
           }
       }
       var new_menu = add('div', menu_body);
       attr(new_menu, 'class', 'menu-2 open');
       add(link, new_menu);
       if (submenu) add(submenu, new_menu);
   }

   var menu_between = add('div');
   attr(menu_between, 'class', 'menu-between');
   verticalMenu.insertBefore(menu_between, verticalMenu.firstChild);
   verticalMenu.insertBefore(my_menu, verticalMenu.firstChild);
}



})();
