import {
  system,
  world,
  EntityHealthComponent,
} from "@minecraft/server";

function isMobEntityValid(entity) {
  if (!entity) return false;
  try {
    return !!(entity.typeId && entity.location);
  } catch {
    return false;
  }
}

const HOSTILE_MOBS = Object.freeze({
  UNDEAD: [
    "zombie",
    "husk",
    "drowned",
    "skeleton",
    "stray",
    "wither_skeleton",
    "zombie_pigman",
    "zoglin",
  ],
  ARTHROPODS: ["spider", "cave_spider", "silverfish", "endermite"],
  ILLAGERS: ["pillager", "vindicator", "ravager", "vex"],
  NETHER: ["blaze", "magma_cube", "piglin", "piglin_brute", "hoglin"],
  OVERWORLD: ["creeper", "slime", "witch"],
  BOSS: ["warden"],
});

const MOB_STACKER_CONFIG = Object.freeze({
  MAX_STACK_SIZE: 50,
  NAME_TAG_FORMAT: "§c[ §7x{count} {name}§c]\\n§a{health}§7/§a{maxHealth}",
  CUSTOM_NAME_FORMAT: "§6{name}\n§a{health}§7/§a{maxHealth}",
  STACK_RADIUS: 5,
  UPDATE_INTERVAL: 15,
  ENABLE_LOGS: false,
});

const NS = "mobstacker_";
const WORLD_ENABLED_KEY = `${NS}enabled`;

class MobStackerManager {
  constructor() {
    this.config = MOB_STACKER_CONFIG;
    this.mobTypes = new Set(Object.values(HOSTILE_MOBS).flat());
  }

  log(message, isError = false) {
    if (isError) console.error(`[MobStacker] ${message}`);
    else if (this.config.ENABLE_LOGS) console.warn(`[MobStacker] ${message}`);
  }

  getEntityProp(entity, key, defaultValue) {
    try {
      const v = entity.getDynamicProperty(`${NS}${key}`);
      return v === undefined ? defaultValue : v;
    } catch {
      return defaultValue;
    }
  }

  setEntityProp(entity, key, value) {
    try {
      entity.setDynamicProperty(`${NS}${key}`, value);
    } catch (error) {
      this.log(`Error setting${key}: ${error}`, true);
    }
  }

  isEnabled() {
    try {
      const v = world.getDynamicProperty(WORLD_ENABLED_KEY);
      return v === undefined ? true : v;
    } catch {
      return true;
    }
  }

  setEnabled(value) {
    try {
      world.setDynamicProperty(WORLD_ENABLED_KEY, value);
    } catch (error) {
      this.log(`Error setting enabled flag:${error}`, true);
    }
  }

  initialize() {
    if (this._initialized) return;
    this._initialized = true;
    if (this.isEnabled()) {
      this.setupEventListeners();
      this.log("MobStackersystem loaded successfully");
    }
  }

  setupEventListeners() {
    this._stackInterval = system.runInterval(() => this.updateStacks(), this.config.UPDATE_INTERVAL);
    world.afterEvents.entityHurt.subscribe(this.handleEntityHurt.bind(this));
    world.beforeEvents.explosion.subscribe(
      this.handleCreeperExplosion.bind(this),
    );
  }

  updateStacks() {
    if (!this.isEnabled()) return;

    try {
      const allEntities = world
        .getDimension("overworld")
        .getEntities({ families: ["monster", "undead"] })
        .filter((e) => isMobEntityValid(e) && this.mobTypes.has(e.typeId.split(":")[1]));

      const byType = new Map();
      for (const e of allEntities) {
        const t = e.typeId;
        if (!byType.has(t)) byType.set(t, []);
        byType.get(t).push(e);
      }

      for (const [typeId, entities] of byType) {
        if (entities.length > 1) {
          const mobType = typeId.split(":")[1];
          this.processEntities(entities, mobType);
        }
      }
    } catch (error) {
      this.log(`Error inupdateStacks: ${error}`, true);
    }
  }

  processEntities(entities, mobType) {
    const { stackableEntities, customNamedEntities } =
      this.separateEntities(entities);

    customNamedEntities.forEach((e) => {
      if (isMobEntityValid(e)) this.updateCustomNamedEntityHealth(e);
    });

    this.checkForNamedStacks(entities);

    if (stackableEntities.length > 1) {
      const stacks = this.groupEntitiesByLocation(stackableEntities);
      stacks.forEach((stack) => {
        if (stack.length > 1) this.mergeStack(stack, mobType);
      });
    }
  }

  separateEntities(entities) {
    const stackableEntities = [];
    const customNamedEntities = [];

    entities.forEach((entity) => {
      if (!isMobEntityValid(entity)) return;

      const nameTag = entity.nameTag;
      const stackSize = this.getEntityProp(entity, "stack_size", 1);
      const isStackEntity = nameTag && nameTag.includes("§c[ §7x");
      const hasCustomName = nameTag && nameTag.trim() !== "" && !isStackEntity;

      if (hasCustomName && stackSize > 1) {
        const mobType = entity.typeId.split(":")[1];
        this.updateNameTag(entity, stackSize, mobType);
        stackableEntities.push(entity);
      } else if (hasCustomName && stackSize === 1) {
        this.setEntityProp(entity, "custom_named", true);
        customNamedEntities.push(entity);
      } else if (isStackEntity || !nameTag || nameTag.trim() === "") {
        stackableEntities.push(entity);
      }
    });

    return { stackableEntities, customNamedEntities };
  }

  groupEntitiesByLocation(entities) {
    const stacks = new Map();
    entities.forEach((entity) => {
      if (!isMobEntityValid(entity) || !entity.location) return;
      const key = this.getLocationKey(entity.location);
      if (!stacks.has(key)) stacks.set(key, []);
      stacks.get(key).push(entity);
    });
    return Array.from(stacks.values());
  }

  getLocationKey(location) {
    return `${Math.floor(location.x / this.config.STACK_RADIUS)},${Math.floor(location.z / this.config.STACK_RADIUS)}`;
  }

  mergeStack(stack, mobType) {
    const validStack = stack.filter((e) => isMobEntityValid(e));
    if (validStack.length <= 1) return;

    validStack.sort(
      (a, b) =>
        this.getEntityProp(b, "stack_size", 1) -
        this.getEntityProp(a, "stack_size", 1),
    );

    const mainEntity = validStack[0];
    if (!isMobEntityValid(mainEntity)) return;

    let totalSize = this.getEntityProp(mainEntity, "stack_size", 1);

    for (let i = 1; i < validStack.length; i++) {
      const entity = validStack[i];
      if (!isMobEntityValid(entity)) continue;

      const size = this.getEntityProp(entity, "stack_size", 1);
      if (totalSize + size > this.config.MAX_STACK_SIZE) break;

      totalSize += size;
      try {
        entity.remove();
      } catch (error) {
        this.log(`Error removing entity in merge:${error}`, true);
      }
    }

    this.updateEntityStack(mainEntity, totalSize, mobType);
  }

  updateEntityStack(entity, size, mobType) {
    if (!isMobEntityValid(entity)) return;

    this.setEntityProp(entity, "stack_size", size);

    const healthComponent = entity.getComponent(
      EntityHealthComponent.componentId,
    );
    if (healthComponent) {
      this.setEntityProp(entity, "current_health", healthComponent.currentValue);
      this.setEntityProp(entity, "max_health", healthComponent.effectiveMax);
      this.updateNameTag(entity, size, mobType);
    }
  }

  updateNameTag(entity, size, mobType) {
    if (!isMobEntityValid(entity)) return;

    const healthComponent = entity.getComponent(
      EntityHealthComponent.componentId,
    );
    if (!healthComponent) return;

    const currentHealth = Math.round(healthComponent.currentValue);
    const maxHealth = Math.round(healthComponent.effectiveMax);

    const nameTag = this.config.NAME_TAG_FORMAT.replace("{count}", size)
      .replace("{name}", mobType)
      .replace("{health}", currentHealth)
      .replace("{maxHealth}", maxHealth);

    try {
      entity.nameTag = nameTag;
    } catch (error) {
      this.log(`Error settingnameTag: ${error}`, true);
    }
  }

  updateCustomNamedEntityHealth(entity) {
    if (!isMobEntityValid(entity)) return;

    const healthComponent = entity.getComponent(
      EntityHealthComponent.componentId,
    );
    if (!healthComponent) return;

    let customName = entity.nameTag;
    if (customName.includes("\n")) customName = customName.split("\n")[0];

    const currentHealth = Math.round(healthComponent.currentValue);
    const maxHealth = Math.round(healthComponent.effectiveMax);

    entity.nameTag = this.config.CUSTOM_NAME_FORMAT.replace(
      "{name}",
      customName,
    )
      .replace("{health}", currentHealth)
      .replace("{maxHealth}", maxHealth);
  }

  checkForNamedStacks(entities) {
    entities.forEach((entity) => {
      if (!isMobEntityValid(entity)) return;

      const stackSize = this.getEntityProp(entity, "stack_size", 1);
      const nameTag = entity.nameTag;

      if (
        stackSize > 1 &&
        nameTag &&
        !nameTag.includes("§c[ §7x") &&
        nameTag.trim() !== ""
      ) {
        this.updateNameTag(entity, stackSize, entity.typeId.split(":")[1]);
      }
    });
  }

  handleEntityHurt(event) {
    const { hurtEntity, damage } = event;
    if (!isMobEntityValid(hurtEntity) || !this.isValidMob(hurtEntity)) return;

    try {
      const isCustomNamed = this.getEntityProp(hurtEntity, "custom_named", false);
      const stackSize = this.getEntityProp(hurtEntity, "stack_size", 1);

      const healthComponent = hurtEntity.getComponent(
        EntityHealthComponent.componentId,
      );
      if (!healthComponent) return;

      const currentHealth = Math.max(0, healthComponent.currentValue - damage);
      healthComponent.setCurrentValue(currentHealth);
      this.setEntityProp(hurtEntity, "current_health", currentHealth);

      if (isCustomNamed && stackSize === 1) {
        this.updateCustomNamedEntityHealth(hurtEntity);
      } else {
        this.updateNameTag(
          hurtEntity,
          stackSize,
          hurtEntity.typeId.split(":")[1],
        );
      }

      if (currentHealth <= 0) this.handleEntityDeath(hurtEntity);
    } catch (error) {
      this.log(`Error inhandleEntityHurt: ${error}`, true);
    }
  }

  handleEntityDeath(deadEntity) {
    if (!isMobEntityValid(deadEntity) || !this.isValidMob(deadEntity)) return;

    try {
      const isCustomNamed = this.getEntityProp(deadEntity, "custom_named", false);
      const stackSize = this.getEntityProp(deadEntity, "stack_size", 1);

      if (!isCustomNamed && stackSize > 1) {
        this.spawnRemainingStack(deadEntity, stackSize - 1);
      }

      const healthComponent = deadEntity.getComponent(
        EntityHealthComponent.componentId,
      );
      if (healthComponent) healthComponent.setCurrentValue(0);

      try {
        deadEntity.nameTag = "§c[ §7DEAD §c]";
        deadEntity.kill();
      } catch (error) {
        this.log(`Error killing entity:${error}`, true);
      }
    } catch (error) {
      this.log(`Error inhandleEntityDeath: ${error}`, true);
    }
  }

  handleCreeperExplosion(event) {
    const source = event.source;
    if (!isMobEntityValid(source) || source.typeId !== "minecraft:creeper")
      return;

    try {
      const isCustomNamed = this.getEntityProp(source, "custom_named", false);
      if (isCustomNamed) return;

      const stackSize = this.getEntityProp(source, "stack_size", 1);

      if (stackSize > 1) {
        const { location, dimension } = source;
        system.runTimeout(() => {
          if (!dimension) return;
          try {
            const newCreeper = dimension.spawnEntity(
              "minecraft:creeper",
              location,
            );
            if (newCreeper && isMobEntityValid(newCreeper)) {
              this.updateEntityStack(newCreeper, stackSize - 1, "creeper");
            }
          } catch (error) {
            this.log(
              `Error spawning creeper after explosion:${error}`,
              true,
            );
          }
        }, 5);
      }
    } catch (error) {
      this.log(`Error inhandleCreeperExplosion: ${error}`, true);
    }
  }

  spawnRemainingStack(deadEntity, newStackSize) {
    if (!isMobEntityValid(deadEntity)) return;

    try {
      const mobType = deadEntity.typeId.split(":")[1];
      const newEntity = deadEntity.dimension?.spawnEntity(
        deadEntity.typeId,
        deadEntity.location,
      );

      if (newEntity && isMobEntityValid(newEntity)) {
        newEntity.setRotation(deadEntity.getRotation());
        this.updateEntityStack(newEntity, newStackSize, mobType);
      }
    } catch (error) {
      this.log(`Error spawning remaining stack:${error}`, true);
    }
  }

  isValidMob(entity) {
    if (!isMobEntityValid(entity)) return false;
    try {
      return entity.typeId && this.mobTypes.has(entity.typeId.split(":")[1]);
    } catch {
      return false;
    }
  }

  toggleSystem() {
    const newValue = !this.isEnabled();
    this.setEnabled(newValue);
    this.log(`MobStacker ${newValue ? "enabled" : "disabled"}`);
    return newValue;
  }

  getStats() {
    return {
      enabled: this.isEnabled(),
      maxStackSize: this.config.MAX_STACK_SIZE,
      supportedMobs: this.mobTypes.size,
      updateInterval: this.config.UPDATE_INTERVAL,
    };
  }

  shutdown() {
    if (this._stackInterval) { system.clearRun(this._stackInterval); this._stackInterval = null; }
    this._initialized = false;
  }
}

const mobStackerManager = new MobStackerManager();
system.run(() => mobStackerManager.initialize());

export { MobStackerManager, mobStackerManager };