import { world, system, ItemStack } from "@minecraft/server";
import { InventoryHelper } from "./index";

function normalizeId(id) {
  return id.includes(":") ? id : `minecraft:${id}`;
}

world.beforeEvents.chatSend.subscribe((ev) => {
  const msg = ev.message;
  const player = ev.sender;

  if (msg === "!give" || msg.startsWith("!give")) {
    ev.cancel = true;
    const parts = msg.split(" ").filter(Boolean);
    if (parts.length < 2) {
      player.sendMessage("§cOne:§e!give <id> [amount]§7ej: !give diamond 10");
      return;
    }
    const raw = parts[1];
    const amount = parseInt(parts[2]) || 1;
    const id = normalizeId(raw);
    system.run(() => {
      InventoryHelper.giveItem(player, new ItemStack(id, Math.min(amount, 9999)));
      player.sendMessage(`§a+${amount}x §e${id}`);
    });
  }

  if (msg === "!count" || msg.startsWith("!count")) {
    ev.cancel = true;
    const parts = msg.split(" ").filter(Boolean);
    if (parts.length < 2) {
      player.sendMessage("§cOne:§e!count <id>§7ej: !count diamond");
      return;
    }
    const raw = parts[1];
    const id = normalizeId(raw);
    system.run(() => {
      const total = InventoryHelper.countItem(player, id);
      player.sendMessage(`§e${id}§7: §f${total}in your inventory`);
    });
  }

  if (msg === "!remove" || msg.startsWith("!remove")) {
    ev.cancel = true;
    const parts = msg.split(" ").filter(Boolean);
    if (parts.length < 2) {
      player.sendMessage("§cOne:§e!remove <id> [quantity]§7ej: !remove diamond 5");
      return;
    }
    const raw = parts[1];
    const amount = parseInt(parts[2]) || 1;
    const id = normalizeId(raw);
    system.run(() => {
      if (InventoryHelper.removeItem(player, id, amount)) {
        player.sendMessage(`§c-${amount}x §e${id}`);
      } else {
        player.sendMessage(`§cYou don't have enough§e${id}`);
      }
    });
  }
});
