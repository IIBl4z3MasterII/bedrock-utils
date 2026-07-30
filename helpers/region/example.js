import { world, system } from "@minecraft/server";
import { Region } from "./index";
import { ParticleHelper } from "../particle-helper/index.js";

const posBuffer = new Map();
const previewIntervals = new Map();

function getColumnRegion(p1, p2, dimId, dim) {
  const hr = dim.heightRange;
  return new Region(
    { x: Math.min(p1.x, p2.x), y: hr.min, z: Math.min(p1.z, p2.z) },
    { x: Math.max(p1.x, p2.x), y: hr.max, z: Math.max(p1.z, p2.z) },
    dimId
  );
}

function showPreview(player, p1, p2, dim) {
  const pid = player.id;
  if (previewIntervals.has(pid)) {
    try { system.clearRun(previewIntervals.get(pid)); } catch {}
  }
  const hr = dim.heightRange;
  const from = { x: Math.min(p1.x, p2.x), y: hr.min, z: Math.min(p1.z, p2.z) };
  const to = { x: Math.max(p1.x, p2.x), y: hr.max, z: Math.max(p1.z, p2.z) };
  const intervalId = system.runInterval(() => {
    if (!player.isValid) { try { system.clearRun(intervalId); } catch {} previewIntervals.delete(pid); return; }
    ParticleHelper.cubeOutline(dim, "minecraft:endrod", from, to, { step: 3, player });
    ParticleHelper.spawn(dim, "minecraft:villager_happy", { x: p1.x, y: player.location.y, z: p1.z });
    ParticleHelper.spawn(dim, "minecraft:endrod", { x: p2.x, y: player.location.y, z: p2.z });
  }, 15);
  previewIntervals.set(pid, intervalId);
}

function stopPreview(pid) {
  const id = previewIntervals.get(pid);
  if (id !== undefined) {
    try { system.clearRun(id); } catch {}
    previewIntervals.delete(pid);
  }
}

world.beforeEvents.chatSend.subscribe((ev) => {
  const msg = ev.message;
  const player = ev.sender;
  const pid = player.id;

  if (msg === "!r pos1") {
    ev.cancel = true;
    system.run(() => {
      const buf = posBuffer.get(pid) || {};
      buf.pos1 = { ...player.location };
      buf.dimId = player.dimension.id;
      buf.dim = player.dimension;
      posBuffer.set(pid, buf);
      player.sendMessage(`§aPos1 §8→ §e${buf.pos1.x.toFixed(1)} ${buf.pos1.z.toFixed(1)}`);
      if (buf.pos2) showPreview(player, buf.pos1, buf.pos2, buf.dim);
    });
  }

  if (msg === "!r pos2") {
    ev.cancel = true;
    system.run(() => {
      const buf = posBuffer.get(pid) || {};
      buf.pos2 = { ...player.location };
      buf.dimId = player.dimension.id;
      buf.dim = player.dimension;
      posBuffer.set(pid, buf);
      player.sendMessage(`§aPos2 §8→ §e${buf.pos2.x.toFixed(1)} ${buf.pos2.z.toFixed(1)}`);
      if (buf.pos1) showPreview(player, buf.pos1, buf.pos2, buf.dim);
    });
  }

  if (msg === "!r here") {
    ev.cancel = true;
    system.run(() => {
      const buf = posBuffer.get(pid);
      if (!buf?.pos1 || !buf?.pos2) {
        player.sendMessage("§7Marca !r pos1 y !r pos2 primero");
        return;
      }
      const region = getColumnRegion(buf.pos1, buf.pos2, buf.dimId, buf.dim);
      if (region.contains(player.location, player.dimension.id)) {
        player.sendMessage(`§aEstás dentro de la selección §8(${region.getVolume()} bloques)`);
      } else {
        player.sendMessage("§cEstás fuera de la selección");
      }
    });
  }

  if (msg === "!r info") {
    ev.cancel = true;
    system.run(() => {
      const buf = posBuffer.get(pid);
      if (!buf?.pos1 || !buf?.pos2) {
        player.sendMessage("§7Marca !r pos1 y !r pos2 primero");
        return;
      }
      const region = getColumnRegion(buf.pos1, buf.pos2, buf.dimId, buf.dim);
      const c = region.getCenter();
      player.sendMessage([
        `§6╔═══ Selección ╗`,
        `§7Esquinas: §e${region.getCorners().map(p => `(${p.x.toFixed(0)} ${p.y.toFixed(0)} ${p.z.toFixed(0)})`).join(" ")}`,
        `§7Centro: §e${c.x.toFixed(1)} ${c.y.toFixed(1)} ${c.z.toFixed(1)}`,
        `§7Volumen: §e${region.getVolume()}`,
        `§6╚═══════════════╝`,
      ].join("\n"));
    });
  }

  if (msg === "!r posclear") {
    ev.cancel = true;
    stopPreview(pid);
    posBuffer.delete(pid);
    system.run(() => player.sendMessage("§7Selección eliminada"));
  }
});
