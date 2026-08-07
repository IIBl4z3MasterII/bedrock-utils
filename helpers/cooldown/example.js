import { system, world } from "@minecraft/server";
import { CooldownManager } from "./index";

const cd = new CooldownManager();

export function exampleCooldown(player) {
  const id = player.id;

  if (cd.isOnCooldown(id, "heal")) {
    player.sendMessage(`§cEspera §e${cd.getRemaining(id, "heal")}§cticks to use heal`);
    return;
  }

  cd.start(id, "heal", 100);
  player.sendMessage("§aHeal used! 100 tick cooldown started");
  player.addEffect("regeneration", 100, { amplifier: 2 });
}

world.beforeEvents.chatSend.subscribe((ev) => {
  if (ev.message === "!heal") {
    ev.cancel = true;
    system.run(() => exampleCooldown(ev.sender));
  }
});
