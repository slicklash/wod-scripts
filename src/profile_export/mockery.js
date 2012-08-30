
// --- Mockery

function Mockery() {
}

Mockery.mockWorldCaledonii = function() {
   var world = new World();
   world.classes = ["Alchemist", "Archer", "Barbarian", "Bard", "Drifter", "Gladiator", "Hunter", "Juggler", "Knight", "Mage", "Paladin", "Priest", "Scholar", "Shaman"];
   world.races = ["Dinturan", "Gnome", "Halfling", "Hill Dwarf", "Kerasi", "Mag-Mor Elf", "Mountain Dwarf", "Rashani", "Tiram-Ag Elf", "Woodlander"];
   return world;
};
