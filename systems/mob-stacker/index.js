import {
  system, world, Effect, EffectTypes, Player, ItemStack,
  BlockPermutation, EntityHealthComponent, EntityInventoryComponent, EntityDamageCause,
} from "@minecraft/server";
import { MissionSystem } from "./mission-system.js";

const HOSTILE_MOBS = Object.freeze({
  UNDEAD: ["zombie", "husk", "drowned", "skeleton", "stray", "wither_skeleton", "zombified_piglin", "zoglin"],
  ARTHROPODS: ["spider", "cave_spider", "silverfish", "endermite"],
  ILLAGERS: ["pillager", "vindicator", "ravager", "vex"],
  NETHER: ["blaze", "magma_cube", "piglin", "piglin_brute", "hoglin"],
  OVERWORLD: ["breeze", "witch"],
  BOSS: ["warden"],
});

const CONFIG = Object.freeze({
  MAX_STACK_SIZE: 50,
  NAME_TAG_FORMAT: "§c[ §7x{count} {name} §c]\n§a{health}§7/§a{maxHealth}",
  STACK_RADIUS: 5,
  UPDATE_INTERVAL: 15,
});

const allMobs = Object.values(HOSTILE_MOBS).flat();
const mobStackMap = new Map();
const bossStackMap = new Map();
const stackVisuals = new Map();

function getEntityIdentifier(entity) {
  return entity?.typeId?.replace("minecraft:", "");
}

function isStackable(entity) {
  if (!entity?.isValid) return false;
  const id = getEntityIdentifier(entity);
  if (!id) return false;
  if (allMobs.includes(id)) return true;
  return Object.keys(HOSTILE_MOBS).some(cat => HOSTILE_MOBS[cat].includes(id));
}

function getOrCreateStack(entity) {
  const id = getEntityIdentifier(entity);
  if (!id) return null;
  if (bossStackMap.has(id)) return bossStackMap.get(id);
  if (!mobStackMap.has(id)) mobStackMap.set(id, []);
  return mobStackMap.get(id);
}

function findClosestStack(entity, stack) {
  const loc = entity.location;
  let closest = null;
  let closestDist = CONFIG.STACK_RADIUS;
  for (const entry of stack) {
    if (!entry.isValid) continue;
    const d = distance(loc, entry.location);
    if (d < closestDist) { closest = entry; closestDist = d; }
  }
  return closest;
}

function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z); }

function tryMergeStacks(entity, targetStack) {
  if (!entity?.isValid || !targetStack) return false;
  const target = findClosestStack(entity, targetStack);
  if (!target || target === entity) return false;
  applyVisualMerge(target, entity);
  entity.kill();
  return true;
}

function applyVisualMerge(target, consumed) {
  const id = getEntityIdentifier(target);
  const stack = getOrCreateStack(target);
  if (!stack) return;
  let total = 0;
  for (const entry of stack) { if (entry.isValid) total++; }
  const healthComp = target.getComponent("minecraft:health");
  if (!healthComp) return;
  const maxHp = healthComp.effectiveMaxHealth;
  const currentHp = Math.min(healthComp.currentValue + (consumed?.getComponent?.("minecraft:health")?.currentValue || 0), maxHp * total);
  healthComp.setCurrentValue(currentHp);
  const displayName = target.nameTag || target.typeId.replace("minecraft:", "");
  target.nameTag = CONFIG.NAME_TAG_FORMAT.replace("{count}", total).replace("{name}", displayName).replace("{health}", Math.floor(currentHp)).replace("{maxHealth}", Math.floor(maxHp));
  target.setScale(1 + Math.min(total * 0.05, 0.5));
}

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
  if (!entity?.isValid) return;
  if (entity.typeId === "minecraft:player") return;
  if (!isStackable(entity)) return;
  const id = getEntityIdentifier(entity);
  const stack = getOrCreateStack(entity);
  if (!stack) return;
  if (tryMergeStacks(entity, stack)) return;
  stack.push(entity);
  if (entity.hasComponent("minecraft:health")) {
    const existing = findClosestStack(entity, stack);
    if (existing && existing !== entity) {
      applyVisualMerge(existing, entity);
      entity.kill();
    }
  }
});

const missionSystem = new MissionSystem();

function updateStackVisuals() {
  for (const [id, stack] of mobStackMap) {
    for (let i = stack.length - 1; i >= 0; i--) {
      const entry = stack[i];
      if (!entry?.isValid) { stack.splice(i, 1); continue; }
      if (i > 0 && entry.isValid) {
        const target = stack[0];
        if (target?.isValid) { applyVisualMerge(target, entry); entry.kill(); }
      }
    }
    if (stack.length > 0) {
      const primary = stack[0];
      if (primary?.isValid) {
        const healthComp = primary.getComponent("minecraft:health");
        if (healthComp) {
          const totalHp = Math.min(healthComp.currentValue, healthComp.effectiveMaxHealth * Math.min(stack.length, CONFIG.MAX_STACK_SIZE));
          const displayName = primary.nameTag || id;
          primary.nameTag = CONFIG.NAME_TAG_FORMAT.replace("{count}", Math.min(stack.length, CONFIG.MAX_STACK_SIZE)).replace("{name}", displayName).replace("{health}", Math.floor(totalHp)).replace("{maxHealth}", Math.floor(healthComp.effectiveMaxHealth));
          primary.setScale(1 + Math.min(stack.length * 0.05, 0.5));
        }
      }
    }
  }
}

system.runInterval(updateStackVisuals, CONFIG.UPDATE_INTERVAL);

world.afterEvents.entityHurt.subscribe(({ hurtEntity, damageSource }) => {
  if (!hurtEntity?.isValid) return;
  const id = getEntityIdentifier(hurtEntity);
  const stack = mobStackMap.get(id);
  if (!stack || stack.length <= 1) return;
  const primary = stack[0];
  if (!primary?.isValid) return;
  const damager = damageSource?.damagingEntity;
  if (damager?.typeId === "minecraft:player") {
    missionSystem?.trackKill?.(damager, id);
  }
});

world.afterEvents.entityDie.subscribe(({ deadEntity, damageSource }) => {
  if (!deadEntity?.isValid) return;
  const id = getEntityIdentifier(deadEntity);
  const stack = mobStackMap.get(id);
  if (!stack) return;
  const idx = stack.indexOf(deadEntity);
  if (idx !== -1) stack.splice(idx, 1);
  if (stack.length > 0 && stack[0]?.isValid) {
    const primary = stack[0];
    const healthComp = primary.getComponent("minecraft:health");
    if (healthComp) {
      const displayName = primary.nameTag || id;
      primary.nameTag = CONFIG.NAME_TAG_FORMAT.replace("{count}", Math.min(stack.length, CONFIG.MAX_STACK_SIZE)).replace("{name}", displayName).replace("{health}", Math.floor(healthComp.currentValue)).replace("{maxHealth}", Math.floor(healthComp.effectiveMaxHealth));
    }
  }
  const killer = damageSource?.damagingEntity;
  if (killer?.typeId === "minecraft:player") {
    missionSystem?.trackKill?.(killer, id);
    if (id === "warden" || id === "ender_dragon") {
      missionSystem?.trackBossKill?.(killer, id);
    }
  }
});

export { missionSystem };
