import { world, system } from "@minecraft/server";
import { ParticleHelper } from "./index";

const posData = new Map();

function showHelp(player) {
  player.sendMessage([
    "§6╔═══ Available commands ═══╗",
    "§e!pos1§7- Mark position 1",
    "§e!pos2§7- Mark position 2",
    "§e!view line§7- Line between pos1 and pos2",
    "§e!view cube§7- Cube between pos1 and pos2",
    "§e!view circle§7- Circle in pos1 towards pos2",
    "§e!view sphere§7- Sphere in pos1 towards pos2",
    "§e!stopview§7- Stop all particles",
    "§e!posclear§7- Delete positions",
    "§6╚══════════════════════════╝",
  ].join("\n"));
}

world.beforeEvents.chatSend.subscribe((ev) => {
  const msg = ev.message;
  const player = ev.sender;
  const pid = player.id;

  if (msg === "!pos1") {
    ev.cancel = true;
    system.run(() => {
      const data = posData.get(pid) || {};
      data.pos1 = { ...player.location };
      data.dim = player.dimension;
      posData.set(pid, data);
      ParticleHelper.spawn(player.dimension, "minecraft:villager_happy", data.pos1);
      player.sendMessage(`§aPos1 §8→ §e${data.pos1.x.toFixed(1)} ${data.pos1.y.toFixed(1)} ${data.pos1.z.toFixed(1)}`);
      if (data.pos2) showHelp(player);
    });
  }

  if (msg === "!pos2") {
    ev.cancel = true;
    system.run(() => {
      const data = posData.get(pid) || {};
      data.pos2 = { ...player.location };
      data.dim = player.dimension;
      posData.set(pid, data);
      ParticleHelper.spawn(player.dimension, "minecraft:endrod", data.pos2);
      player.sendMessage(`§aPos2 §8→ §e${data.pos2.x.toFixed(1)} ${data.pos2.y.toFixed(1)} ${data.pos2.z.toFixed(1)}`);
      if (data.pos1) showHelp(player);
    });
  }

  if (msg === "!view" || msg.startsWith("!view")) {
    ev.cancel = true;
    const type = msg.slice(6).trim().toLowerCase();
    if (!type) {
      player.sendMessage("§cOne:§e!view line | cube | circle | sphere");
      return;
    }
    system.run(() => {
      const data = posData.get(pid);
      if (!data?.pos1 || !data?.pos2) {
        player.sendMessage("§cFirst check !pos1 and !pos2");
        return;
      }

      if (!["line", "cube", "circle", "sphere"].includes(type)) {
        player.sendMessage("§cOne:§e!view line | cube | circle | sphere");
        return;
      }

      if (data.viewInterval) {
        try { system.clearRun(data.viewInterval); } catch {}
      }

      const dim = data.dim;
      const p1 = data.pos1;
      const p2 = data.pos2;
      const dx = p2.x - p1.x, dy = p2.y - p1.y, dz = p2.z - p1.z;
      const radius = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const particle = "minecraft:endrod";

      data.viewType = type;
      data.viewInterval = system.runInterval(() => {
        if (!player.isValid) { try { system.clearRun(data.viewInterval); } catch {} return; }
        switch (type) {
          case "line":
            ParticleHelper.line(dim, particle, p1, p2, 1.5, { player });
            break;
          case "cube":
            ParticleHelper.cubeOutline(dim, particle, p1, p2, { step: 2, player });
            break;
          case "circle":
            ParticleHelper.circle(dim, particle, p1, radius, { points: 48, player });
            break;
          case "sphere":
            ParticleHelper.sphere(dim, particle, p1, radius, { rings: 10, pointsPerRing: 20, player });
            break;
        }
      }, 10);

      player.sendMessage(`§aMostrando §e${type}§a, writes§e!stopview§ato stop`);
    });
  }

  if (msg === "!stopview") {
    ev.cancel = true;
    system.run(() => {
      const data = posData.get(pid);
      if (data?.viewInterval) {
        try { system.clearRun(data.viewInterval); } catch {}
        data.viewInterval = undefined;
        player.sendMessage("§7Stopped display");
      } else {
        player.sendMessage("§cNo active display");
      }
    });
  }

  if (msg === "!posclear") {
    ev.cancel = true;
    const data = posData.get(pid);
    if (data?.viewInterval) {
      try { system.clearRun(data.viewInterval); } catch {}
    }
    posData.delete(pid);
    system.run(() => player.sendMessage("§7Eliminated positions"));
  }
});
