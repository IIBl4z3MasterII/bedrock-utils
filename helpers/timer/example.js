import { world, system } from "@minecraft/server";
import { Timer } from "./index";

const playerTimers = new Map();

world.beforeEvents.chatSend.subscribe((ev) => {
  const msg = ev.message;
  const player = ev.sender;
  const pid = player.id;

  if (msg === "!timer" || msg.startsWith("!timer")) {
    ev.cancel = true;
    const arg = msg.slice(7).trim().toLowerCase();
    if (!arg) {
      player.sendMessage("§cOne:§e!timer <seconds>§7| pause | resume | cancel");
      return;
    }

    if (arg === "pause") {
      system.run(() => {
        const t = playerTimers.get(pid);
        if (!t) { player.sendMessage("§cThere is no active timer"); return; }
        t.pause();
        player.sendMessage("§7Timer paused");
      });
      return;
    }

    if (arg === "resume") {
      system.run(() => {
        const t = playerTimers.get(pid);
        if (!t) { player.sendMessage("§cThere is no active timer"); return; }
        t.resume();
        player.sendMessage("§aTimer resumed");
      });
      return;
    }

    if (arg === "cancel") {
      ev.cancel = true;
      system.run(() => {
        const t = playerTimers.get(pid);
        if (!t) { player.sendMessage("§cThere is no active timer"); return; }
        t.cancel();
        playerTimers.delete(pid);
        player.sendMessage("§7Timer canceled");
      });
      return;
    }

    const seconds = parseInt(arg);
    if (isNaN(seconds) || seconds < 1) {
      player.sendMessage("§cUse: !timer <seconds> | pause | resume | cancel");
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
          player.sendMessage("§a⏰ Time over!");
          playerTimers.delete(pid);
        },
      });
      t.start();
      playerTimers.set(pid, t);
      player.sendMessage(`§aTimer§e${seconds}§aseconds started`);
    });
  }
});
