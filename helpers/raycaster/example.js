import { world, system } from "@minecraft/server";
import { Raycaster } from "./index";

const lookTrackers = new Map();

world.beforeEvents.chatSend.subscribe((ev) => {
  const msg = ev.message;
  const player = ev.sender;
  const pid = player.id;

  if (msg === "!look") {
    ev.cancel = true;
    system.run(() => {
      const entity = Raycaster.getEntityLookingAt(player, 20);
      if (entity) {
        player.sendMessage(`§aEntidad: §e${entity.typeId} §7(${entity.id})`);
        const dist = Math.round(Math.sqrt(
          (entity.location.x - player.location.x) ** 2 +
          (entity.location.y - player.location.y) ** 2 +
          (entity.location.z - player.location.z) ** 2
        ));
        player.sendMessage(`§7Distancia: §e${dist}§7m`);
      } else {
        player.sendMessage("§cNo miras a ninguna entidad");
      }

      const block = Raycaster.getBlockLookingAt(player, 30);
      if (block) {
        player.sendMessage(`§aBloque: §e${block.typeId} §aen §e${Math.floor(block.x)} ${Math.floor(block.y)} ${Math.floor(block.z)}`);
      }
    });
  }

  if (msg === "!entity") {
    ev.cancel = true;
    system.run(() => {
      const entity = Raycaster.getEntityLookingAt(player, 20);
      if (entity) {
        const hp = Math.round(entity.getComponent("minecraft:health")?.currentValue ?? 0);
        player.sendMessage(`§e${entity.typeId} §7- Health: §e${hp}`);
      } else {
        player.sendMessage("§cNo miras a ninguna entidad");
      }
    });
  }

  if (msg === "!block") {
    ev.cancel = true;
    system.run(() => {
      const block = Raycaster.getBlockLookingAt(player, 30);
      if (block) {
        player.sendMessage(`§e${block.typeId} §aen §e${Math.floor(block.x)} ${Math.floor(block.y)} ${Math.floor(block.z)}`);
      } else {
        player.sendMessage("§cNo miras a ningún bloque");
      }
    });
  }

  if (msg === "!startlook") {
    ev.cancel = true;
    system.run(() => {
      if (lookTrackers.has(pid)) {
        player.sendMessage("§cYa hay un tracker activo, usa !stoplook");
        return;
      }
      const intervalId = system.runInterval(() => {
        if (!player.isValid) { try { system.clearRun(intervalId); } catch {} lookTrackers.delete(pid); return; }
        const entity = Raycaster.getEntityLookingAt(player, 20);
        const block = Raycaster.getBlockLookingAt(player, 30);
        let text = "";
        if (entity) {
          const dist = Math.round(Math.sqrt(
            (entity.location.x - player.location.x) ** 2 +
            (entity.location.y - player.location.y) ** 2 +
            (entity.location.z - player.location.z) ** 2
          ));
          text += `§e${entity.typeId} §7(${dist}m)`;
        }
        if (block) {
          if (text) text += " §8| ";
          text += `§a${block.typeId.replace("minecraft:", "")} §7${Math.floor(block.x)} ${Math.floor(block.y)} ${Math.floor(block.z)}`;
        }
        if (!text) text = "§7No miras a nada";
        player.onScreenDisplay.setActionBar(text);
      }, 5);
      lookTrackers.set(pid, intervalId);
      player.sendMessage("§aTracker activado, escribe !stoplook para detener");
    });
  }

  if (msg === "!stoplook") {
    ev.cancel = true;
    system.run(() => {
      const id = lookTrackers.get(pid);
      if (id !== undefined) {
        try { system.clearRun(id); } catch {}
        lookTrackers.delete(pid);
        player.onScreenDisplay.setActionBar("");
        player.sendMessage("§7Tracker detenido");
      } else {
        player.sendMessage("§cNo hay tracker activo");
      }
    });
  }
});

