type MenuLayout = Record<string, [string, Record<string, string>?]>;

export const MENU_NAME = "Favorites";

export const MENU_LAYOUT: MenuLayout = {
  my_heroes: [
    "My Heroes",
    {
      hero_attributes: "Attributes",
      hero_skills: "Skills",
      hero_gear: "Equipment",
      hero_storage: "Storage",
      hero_cellar: "Cellar",
      hero_skillconf: "Settings",
      arena: "Arena",
      hero_profiles: "Profile",
      hero_events: "Adventures",
    },
  ],
  group: [
    "My Group",
    {
      dungeon: "Dungeon",
      reports: "Reports",
      hero_group_cellar: "GS",
      hero_group_treasure: "TV",
      group_cashbox: "Funds",
    },
  ],
  trade_exchange: [
    "Trade",
    {
      trade_market: "Marketplace",
      trade_auction: "Auctions",
      trade_bids: "Offers",
    },
  ],
  recruite_ranking: [
    "Leaderboard",
    {
      duells_ranking_groups: "Groups",
      duells_ranking_clans: "Clans",
    },
  ],
};
