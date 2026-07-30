import { world } from "@minecraft/server";
import { ChatModeration } from "./index";

export function exampleChatModeration() {
  world.beforeEvents.chatSend.subscribe((ev) => {
    const msg = ev.message;
    if (ChatModeration.isExcessiveCaps(msg, 5)) {
      ev.cancel = true;
      ev.sender.sendMessage(`§cNo uses tantas mayúsculas! §7Mensaje corregido:`);
      world.sendMessage(`<${ev.sender.name}> ${msg.toLowerCase()}`);
    }
  });
}
