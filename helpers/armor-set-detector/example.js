import { world } from "@minecraft/server";
import { ArmorSetDetector, DEFAULT_ARMOR_MAPPING } from "../index.js";

// Extend the default mapping with a custom entry (emerald block -> full diamond set,
// since emerald armor doesn't exist in vanilla).
const mapping = {
  ...DEFAULT_ARMOR_MAPPING,
  "minecraft:emerald_block": { type: "diamond", fullSet: true, name: "emerald (diamond set)" }
};

// Scan the whole inventory every second (20 ticks).
const detector = new ArmorSetDetector(mapping, {
  intervalTicks: 20,
  searchHotbarOnly: false
});

detector.start();

// --- Slot / hotbar detection demo -----------------------------------------
// Log which hotbar slot currently holds a mapped block whenever a player joins.
world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (!initialSpawn) return;

  const hotbar = detector.getHotbarSlots(player);
  const match = hotbar.find((slot) => slot.item && mapping[slot.item.typeId]);

  if (match) {
    player.sendMessage(
      `§eDetected ${match.item.typeId} in hotbar slot ${match.slotIndex}.`
    );
  }
});

// Stop detection example (e.g. bound to a custom command or event elsewhere):
// detector.stop();
