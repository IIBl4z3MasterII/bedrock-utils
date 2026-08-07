import { world, system, ItemStack } from "@minecraft/server";
import { EnchantHelper } from "./index";

world.beforeEvents.chatSend.subscribe((ev) => {
  const msg = ev.message;
  const player = ev.sender;

  if (msg === "!enchant") {
    ev.cancel = true;
    system.run(() => {
      const container = player.getComponent("minecraft:inventory")?.container;
      if (!container) return;
      const selected = container.getItem(player.selectedSlotIndex);
      if (!selected) {
        player.sendMessage("§cYou don\'t have an item in your hand");
        return;
      }
      try {
        EnchantHelper.enchant(selected, "sharpness", 5);
        EnchantHelper.enchant(selected, "unbreaking", 3);
        container.setItem(player.selectedSlotIndex, selected);
        player.sendMessage("§aItem enchanted with Sharpness V and Unbreaking III");
      } catch (e) {
        player.sendMessage(`§c${e.message}`);
      }
    });
  }

  if (msg === "!enchant" || msg.startsWith("!enchant")) {
    ev.cancel = true;
    const parts = msg.split(" ").filter(Boolean);
    if (parts.length === 1) {
      if (msg !== "!enchant") {
        player.sendMessage("§cOne:§e!enchant§7(sin args = Sharpness V + Unbreaking III)");
        player.sendMessage("§cOne:§e!enchant <id> <level>");
      }
      return;
    }
    if (parts.length === 3) {
      const [, enchId, levelStr] = parts;
      const level = parseInt(levelStr);
      if (isNaN(level) || level < 1) {
        player.sendMessage("§cUse: !enchant <id> <level>");
        return;
      }
      system.run(() => {
        const container = player.getComponent("minecraft:inventory")?.container;
        if (!container) return;
        const selected = container.getItem(player.selectedSlotIndex);
        if (!selected) {
          player.sendMessage("§cYou don\'t have an item in your hand");
          return;
        }
        try {
          EnchantHelper.enchant(selected, enchId, level);
          container.setItem(player.selectedSlotIndex, selected);
          player.sendMessage(`§aItem enchanted with${enchId} ${level}`);
        } catch (e) {
          player.sendMessage(`§c${e.message}`);
        }
      });
    } else {
      player.sendMessage("§cOne:§e!enchant <id> <level>");
    }
  }
});
