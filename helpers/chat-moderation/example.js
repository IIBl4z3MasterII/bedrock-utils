import { world } from "@minecraft/server";
import { ChatModeration } from "./index";

export function exampleChatModeration() {
  world.beforeEvents.chatSend.subscribe((ev) => {
    const msg = ev.message;
    if (ChatModeration.isExcessiveCaps(msg, 5)) {
      ev.cancel = true;
      ev.sender.sendMessage(`§cDon't use so many capital letters!§7Corrected message:`);
      world.sendMessage(`<${ev.sender.name}> ${msg.toLowerCase()}`);
    }
  });
}
