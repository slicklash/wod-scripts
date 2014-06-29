
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
            'hero_profiles'         : 'Profile',
            'hero_events'           : 'Adventures'
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

var verticalMenu = $('.menu-vertical .menu-0-body');

if (verticalMenu) {

    var skin = $('link[href*="skin"]').href.match(/skin[0-9\-]+/i),
        font_render_url = 'http://fonts.neise-games.de/java_font_renderer/render?skin=' + skin,
        my_menu = add('div'),
        caption = add('a', my_menu),
        supports_img = skin && skin !== 'skin-1';

    attr(my_menu, {'class': 'menu-1', id: 'menu_my_menu'});
    attr(caption, {'class': 'menu-1-caption alink selected', 'onclick': "return menuOnClick(this,'','','');"});

    if (supports_img) {
        attr(add('img', caption), {'class': 'font_menu-1', 'alt': MY_MENU_NAME, 'src' : font_render_url + '&profil=font_menu-1&text=' + MY_MENU_NAME});
        attr(add('img', caption), {'class': 'font_menu-1-hovered', 'alt': MY_MENU_NAME, 'src' : font_render_url + '&profil=font_menu-1-hovered&text=' + MY_MENU_NAME});
        attr(add('img', caption), {'class': 'font_menu-1-selected', 'alt': MY_MENU_NAME, 'src' : font_render_url + '&profil=font_menu-1-selected&text=' + MY_MENU_NAME});
    }
    else {
        innerText(caption, MY_MENU_NAME);
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

   var match_name;

   for (var i = 0, cnt = menu1.length; i < cnt; i++) {
       var open_menu = menu1[i];
       if (cssClass(open_menu, 'open')) {
           var tmp = $('a', open_menu);
           for (var j = 0, c2 = tmp.length; j < c2; j++) {
               match_name = attr(tmp[j], 'onclick').match(/'([a-z_ ]+)',''\);$/i);
               if (match_name) open_links[match_name[1]] = open_menu;
           }
       }
   }

   // var keys = '';

   for (var i = 0, cnt = links.length; i < cnt; i++) {
       var link = links[i];
       match_name = attr(link, 'onclick').match(/'([a-z_ ]+)',''\);$/i);
       if (match_name) {
           menu_items[match_name[1]] = link.cloneNode(true);
           // keys += "'" + match_name[1] + "' : '" + link.innerText.replace(/^\s+|\s+$/g,"") + "',\n";
       }
   }

   for(var key in MY_MENU_LAYOUT) {
       if (MY_MENU_LAYOUT.hasOwnProperty(key)){
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
               innerText(link, menu_item[0]);
               var submenu_items = menu_item[1];
               submenu = add('div');
               attr(submenu, {'class': 'menu-2-body', 'style': 'padding-top: 0px'});
               for (var subkey in submenu_items) {
                   if (submenu_items.hasOwnProperty(subkey)) {
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
           }
           var new_menu = add('div', menu_body);
           attr(new_menu, 'class', 'menu-2 open');
           add(link, new_menu);
           if (submenu) add(submenu, new_menu);
       }
   }

   var menu_between = add('div');
   attr(menu_between, 'class', 'menu-between');
   verticalMenu.insertBefore(menu_between, verticalMenu.firstChild);
   verticalMenu.insertBefore(my_menu, verticalMenu.firstChild);
}


