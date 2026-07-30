import { world, system } from "@minecraft/server";
import { Timer } from "./index";

const playerTimers = new Map();

world.beforeEvents.chatSend.subscribe((ev) => {
  const msg = ev.message;
  const player = ev.sender;
  const pid = player.id;

  if (msg === "!timer" || msg.startsWith("!timer ")) {
    ev.cancel = true;
    const arg = msg.slice(7).trim().toLowerCase();
    if (!arg) {
      player.sendMessage("§cUsa: §e!timer <segundos> §7| pause | resume | cancel");
      return;
    }

    if (arg === "pause") {
      system.run(() => {
        const t = playerTimers.get(pid);
        if (!t) { player.sendMessage("§cNo hay timer activo"); return; }
        t.pause();
        player.sendMessage("§7Timer pausado");
      });
      return;
    }

    if (arg === "resume") {
      system.run(() => {
        const t = playerTimers.get(pid);
        if (!t) { player.sendMessage("§cNo hay timer activo"); return; }
        t.resume();
        player.sendMessage("§aTimer reanudado");
      });
      return;
    }

    if (arg === "cancel") {
      ev.cancel = true;
      system.run(() => {
        const t = playerTimers.get(pid);
        if (!t) { player.sendMessage("§cNo hay timer activo"); return; }
        t.cancel();
        playerTimers.delete(pid);
        player.sendMessage("§7Timer cancelado");
      });
      return;
    }

    const seconds = parseInt(arg);
    if (isNaN(seconds) || seconds < 1) {
      player.sendMessage("§cUsa: !timer <segundos> | pause | resume | cancel");
      return;
    }

    system.run(() => {
      if (playerTimers.has(pid)) {
        playerTimers.get(pid).cancel();
      }
      const t = new Timer(seconds, {
        onTick: (remaining) => {
          player.onScreenDisplay.setActionBar(`§e⏱ ${remaining}s`);
        },
        onFinish: () => {
          player.onScreenDisplay.setActionBar("");
          player.playSound("random.levelup", { pitch: 1, volume: 1 });
          player.sendMessage("§a⏰ Tiempo terminado!");
          playerTimers.delete(pid);
        },
      });
      t.start();
      playerTimers.set(pid, t);
      player.sendMessage(`§aTimer de §e${seconds}§a segundos iniciado`);
    });
  }
});
