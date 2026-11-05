import { describe, expect, it } from "vitest";
import { hash } from "./hash";

const DUNGEON_NAMES = [
  "The Keilerei Pub",
  "Robbery in the forest",
  "Onward to Millsbrooke",
  "The Academy",
  "The first job",
  "Goblin caves under the pub",
  "The treasure map",
  "The warehouse at the port",
  "A stroll through the countryside",
  "Much ado about nothing",
  "A classical lair",
  "The Field of Crows",
  "Invasion of the crawlers",
  "The Herbal Vendor",
  "Kerrunch's orc cave",
  "The troll",
  "Eerie Woods",
  "Ancient bones",
  "The mausoleum",
  "Ghost in the arsenal",
  "Ancient fiends",
  "The wolf hunt",
  "The sacrifice",
  "The Ring",
  "The old tower on the mountain",
  "The cursed ruins",
  "Joshor in need",
  "Mages and monsters",
  "The harp",
  "Nebulat`s Halls of Horror for beginners",
  "The witch of Rialb",
  "Still waters run deep",
  "The fair of Ravenfort",
  "A quiet day in the pub...",
  "The dungeon master",
  "Shadows over Dresoria",
  "Casual visit to the zoo",
  "The secret of Semarkesh",
  "The dancing puppets cabaret",
  "Awakening",
  "The crown calls the crowns",
  "Manufacture in the abandoned valley",
  "Arduous journey or the 13th Warrior",
  "Beyond the grave",
  "Circus of lost children",
  "The Necromancer of Tabor-Tabor",
  "Inspection of the stockyard of the damned",
  "Hide and seek",
  "The old mine",
  "The tomb of heroes",
  "Unrest in the mountains",
  "The Guard",
  "Vacation in the mountains",
  "Nebulat`s Halls of Monsters (advanced)",
  "Retaliation at night",
  "The tear of Akbeth",
  "Dim prospects",
  "Hunt for the Swamp Dragons",
  "Dim Errand",
  "The blunderbuss factory",
  "The dwarven stairs",
  "The ambush on Millsbrooke",
  "The Tournament of Ravenfort",
  "Water of life for Ravenfort",
  "The purple bane",
  "The riddle of amber",
  "The manor",
  "Driving the orcs out of Millsbrooke",
  "The return of the necromancer of Tabor-Tabor",
  "Silverthorn",
  "The black stone",
  "Protecting the trade route",
  "The deranged alchemist",
  "The Heart of Shadows",
  "Mo-MoraghZep",
  "Festival of the Lanterns revival",
  "A trip to Keras",
  "The Ice Queen",
  "The dungeon master too",
  "A night at the library",
  "Old debt",
  "A clash of clans",
  "Swamp things",
  "Small, but tall!",
  "The escort",
  "Escape from Ak-Sidal",
  "Return to the observatory",
  "Valley of Bones",
  "Nebulat`s Halls of Horror for veterans",
  "The End",
  "The Stonehenge in the Moor",
  "Holy Halls",
  "Genealogy",
  "The Forsaken Library",
  "Duel in the grass",
  "A hard days night",
  "The journey to Barrak Tor",
  "The fifth gate",
  "Duchess wedding",
  "Hydra and mosquitoes",
  "The bloody hand",
  "The Engineer University",
  "The first gate",
  "The Big Bad Book of Fairy Tales",
  "Cold earth",
  "The Oracle of Zab´yennah!",
  "Nebulat`s Halls of Horror for warmasters",
  "Stoneguard Keep",
  "A day in Urivor",
  "Unholy Sacrament",
  "Doors of Barrak Tor",
  "Shadows of the Past",
  "The fight in Arnolia Berunc",
  "Labyrinth of the mentalist",
  "The Path of Blood",
  "The siege of Wolferod",
  "Expedition to the Fire Archipelago",
  "Labyrinth of the mentalist II",
  "Atreanijsh",
  "Fortune and Fate",
  "Clouds over Tilien",
  "The fourth gate",
  "Join the Army",
  "Whispering winds in A minor",
  "The second gate",
  "No rest for the damned",
] as const;

describe("hash", () => {
  it("returns a hexadecimal string", () => {
    expect(hash("test")).toMatch(/^[0-9a-f]+$/);
  });

  it("is deterministic - same input produces same output", () => {
    const a = hash("The Keilerei Pub");
    const b = hash("The Keilerei Pub");
    expect(a).toBe(b);
  });

  it("produces different output for different input", () => {
    const a = hash("The Keilerei Pub");
    const b = hash("The Academy");
    expect(a).not.toBe(b);
  });

  it("produces no collisions across all known dungeon names", () => {
    const hashes = new Map<string, string>();

    for (const name of DUNGEON_NAMES) {
      const h = hash(name);
      if (hashes.has(h)) {
        throw new Error(`Collision detected: "${name}" and "${hashes.get(h)}" both hash to ${h}`);
      }
      hashes.set(h, name);
    }

    expect(hashes.size).toBe(DUNGEON_NAMES.length);
  });

  it("pads short inputs to 11 characters before hashing", () => {
    // "abc" padded to "abc00000000" should produce consistent result
    expect(hash("abc")).toBe(hash("abc00000000"));
  });
});
