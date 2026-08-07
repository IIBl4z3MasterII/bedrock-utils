import { world, system } from "@minecraft/server";
import { Coordinates } from "./index";

function spawnSafe(dimension, particleId, pos) {
  const hr = dimension.heightRange;
  const y = Math.max(hr.min + 1, Math.min(hr.max - 1, pos.y));
  dimension.spawnParticle(particleId, { x: pos.x, y, z: pos.z });
}

world.beforeEvents.chatSend.subscribe((ev) => {
  const msg = ev.message;
  const player = ev.sender;

  if (msg === "!pos") {
    ev.cancel = true;
    system.run(() => {
      const arriba = Coordinates.relative(player, 0, 3, 0);
      spawnSafe(player.dimension, "minecraft:endrod", arriba);

      const frente = Coordinates.local(player, 0, 0, 5, "eyes");
      spawnSafe(player.dimension, "minecraft:villager_happy", frente);

      player.sendMessage(`§7↑ 3 above:§e${arriba.x.toFixed(1)} ${arriba.y.toFixed(1)} ${arriba.z.toFixed(1)}`);
      player.sendMessage(`§7→ 5 in front:§e${frente.x.toFixed(1)} ${frente.y.toFixed(1)} ${frente.z.toFixed(1)}`);
    });
  }

  if (msg === "!local" || msg.startsWith("!local")) {
    ev.cancel = true;
    const args = msg.split(" ").slice(1).map(Number);
    if (args.length !== 3 || args.some(isNaN)) {
      player.sendMessage("§cOne:§e!local <right> <up> <forward>§7(offsets -16 a 16)");
      return;
    }
    const [x, y, z] = args;
    const clamped = (v) => Math.max(-16, Math.min(16, v));
    system.run(() => {
      const pos = Coordinates.local(player, clamped(x), clamped(y), clamped(z), "eyes");
      spawnSafe(player.dimension, "minecraft:endrod", pos);
      player.sendMessage(`§7Local(${x},${y},${z}): §e${pos.x.toFixed(1)} ${pos.y.toFixed(1)} ${pos.z.toFixed(1)}`);
    });
  }
});
