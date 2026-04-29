/* 

██████╗ ██╗██╗  ██╗███████╗██████╗     ███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗ 
██╔══██╗██║██║  ██║╚══███╔╝╚════██╗    ████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗
██████╔╝██║███████║  ███╔╝  █████╔╝    ██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝
██╔══██╗██║╚════██║ ███╔╝   ╚═══██╗    ██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗
██████╔╝███████╗██║███████╗██████╔╝    ██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║
╚═════╝ ╚══════╝╚═╝╚══════╝╚═════╝     ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
                                                                                           
          MobStacker  •  By: @bl4z3master


*/

import {
  system,
  world,
  Effect,
  EffectTypes,
  Player,
  ItemStack,
  BlockPermutation,
  EntityHealthComponent,
  EntityInventoryComponent,
  EntityDamageCause,
} from "@minecraft/server";
import { MissionSystem } from "./mission-system";

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
  OVERWORLD: ["breeze", "witch"],
  BOSS: ["warden"],
});

const CONFIG = Object.freeze({
  MAX_STACK_SIZE: 50,
  NAME_TAG_FORMAT: "§c[ §7x{count} {name} §c]\n§a{health}§7/§a{maxHealth}",
  STACK_RADIUS: 5,
  UPDATE_INTERVAL: 15,
});

const MOB_EFFECTS = Object.freeze({
  speed: { maxLevel: 2 },
  strength: { maxLevel: 3 },
  resistance: { maxLevel: 2 },
  regeneration: { maxLevel: 2 },
  absorption: { maxLevel: 4 },
  fire_resistance: { maxLevel: 1 },
  jump_boost: { maxLevel: 2 },
  health_boost: { maxLevel: 2 },
  night_vision: { maxLevel: 1 },
  water_breathing: { maxLevel: 1 },
});

const PLAYER_EFFECTS = Object.freeze({
  slowness: { maxLevel: 2 },
  mining_fatigue: { maxLevel: 2 },
  weakness: { maxLevel: 2 },
  poison: { maxLevel: 1 },
  wither: { maxLevel: 1 },
  blindness: { maxLevel: 1 },
  hunger: { maxLevel: 2 },
  nausea: { maxLevel: 1 },
  levitation: { maxLevel: 1 },
  darkness: { maxLevel: 1 },
  slow_falling: { maxLevel: 1 },
  speed: { maxLevel: 2 },
  strength: { maxLevel: 3 },
  resistance: { maxLevel: 2 },
  regeneration: { maxLevel: 2 },
  absorption: { maxLevel: 4 },
  fire_resistance: { maxLevel: 1 },
  jump_boost: { maxLevel: 2 },
  health_boost: { maxLevel: 2 },
  invisibility: { maxLevel: 1 },
});

class HostileMobStacker {
    static #instance = null;
    #lastDamageSource = new Map();
    #lastUsedMessages = new Set();

  constructor() {
    this.hostileMobTypes = new Set(Object.values(HOSTILE_MOBS).flat());
    this.playerEffectTimers = new Map();
    this.setupEventListeners();
    this.startActionBarUpdates();
    this.missionSystem = new MissionSystem();
    this.setupMissionCommands();
    this.setupEntityDeathListener();
    this.entityKillCounts = new Map();
    this.killedEntities = new Set();
    this.setupCreeperExplosionListener();
    this.setupPhantomAttackListener();
this.#initializeConstants();
        this.#initializeWorld();
        this.#setupEvents();
    }

    #initializeConstants() {
        this.CONSTANTS = Object.freeze({
            CLEANUP_DELAY: 100,
            DAMAGE_WINDOW: 1000,
            MAX_STORED_MESSAGES: 5,
            PROPERTIES: {
                GLOBAL_COUNT: "globalTotemCount",
                PLAYER_COUNT: "totemUsageCount"
            },
            MESSAGE: {
                PREFIX: "§7[§6Tótem§7] ",
                SUFFIX: count => `\n§7Total del servidor: §e${count} §7tótems usados`
            }
        });
    }

    #initializeWorld() {
        const globalCount = world.getDynamicProperty(this.CONSTANTS.PROPERTIES.GLOBAL_COUNT);
        if (globalCount === undefined) {
            world.setDynamicProperty(this.CONSTANTS.PROPERTIES.GLOBAL_COUNT, 0);
        }
    }

    #getDamageCauseText(cause) {
        const causes = {
            [EntityDamageCause.anvil]: "aplastamiento por yunque",
            [EntityDamageCause.blockExplosion]: "una poderosa explosión",
            [EntityDamageCause.charging]: "una brutal embestida",
            [EntityDamageCause.contact]: "contacto con bloques dañinos",
            [EntityDamageCause.drowning]: "ahogamiento en las profundidades",
            [EntityDamageCause.entityAttack]: "un ataque mortal",
            [EntityDamageCause.entityExplosion]: "una devastadora explosión",
            [EntityDamageCause.fall]: "una caída mortal",
            [EntityDamageCause.fallingBlock]: "aplastamiento por bloques",
            [EntityDamageCause.fire]: "las llamas ardientes",
            [EntityDamageCause.fireworks]: "una explosión de fuegos artificiales",
            [EntityDamageCause.flyIntoWall]: "un impacto brutal contra la pared",
            [EntityDamageCause.freezing]: "congelamiento extremo",
            [EntityDamageCause.lava]: "un baño en lava",
            [EntityDamageCause.lightning]: "un poderoso rayo",
            [EntityDamageCause.magic]: "magia oscura",
            [EntityDamageCause.magma]: "el ardiente magma",
            [EntityDamageCause.override]: "una fuerza sobrenatural",
            [EntityDamageCause.piston]: "la fuerza de un pistón",
            [EntityDamageCause.projectile]: "un proyectil letal",
            [EntityDamageCause.stalactite]: "una afilada estalactita",
            [EntityDamageCause.stalagmite]: "una puntiaguda estalagmita",
            [EntityDamageCause.starve]: "la inanición",
            [EntityDamageCause.suffocation]: "la asfixia",
            [EntityDamageCause.suicide]: "un intento de suicidio",
            [EntityDamageCause.temperature]: "temperaturas extremas",
            [EntityDamageCause.thorns]: "espinas venenosas",
            [EntityDamageCause.void]: "el vacío infinito",
            [EntityDamageCause.wither]: "el efecto del wither"
        };
        return causes[cause] ?? "poderes misteriosos";
    }

    #getRandomMessage(playerName, cause, count, globalCount) {
        const messages = [
            `§e${playerName} §fha desafiado a la muerte por §c${cause} §fy ha sobrevivido §e(${count} tótems)`,
            `§e${playerName} §fha escapado de §c${cause} §fgracias al poder del tótem §e(${count} veces)`,
            `§e${playerName} §fha burlado a la muerte causada por §c${cause} §e(${count} tótems usados)`,
            `§e${playerName} §fha resistido §c${cause} §fcon la ayuda de un tótem §e(Total: ${count})`,
            `§fEl tótem ha salvado a §e${playerName} §fde §c${cause} §e(${count} resurrecciones)`,
            `§e${playerName} §fha sobrevivido milagrosamente a §c${cause} §e(${count} tótems consumidos)`,
            `§fLa magia ancestral protegió a §e${playerName} §fde §c${cause} §e(${count} tótems)`,
            `§e${playerName} §fha engañado a la muerte provocada por §c${cause} §e(${count} veces)`,
            `§fUn tótem más consumido por §e${playerName} §fpara salvarse de §c${cause} §e(${count} total)`,
            `§fLos dioses antiguos protegieron a §e${playerName} §fde §c${cause} §e(${count} tótems)`,
            `§e${playerName} §fha sido bendecido con otra vida tras §c${cause} §e(${count} resurrecciones)`,
            `§fLa muerte intentó llevarse a §e${playerName} §fpor §c${cause}§f, pero fracasó §e(${count} veces)`,
            `§e${playerName} §fha sido salvado por la magia del tótem de §c${cause} §e(${count} salvaciones)`,
            `§fEl poder ancestral ayudó a §e${playerName} §fa sobrevivir §c${cause} §e(${count} tótems)`,
            `§e${playerName} §fha recibido el favor de los tótems contra §c${cause} §e(${count} bendiciones)`,
            `§fLa muerte tendrá que esperar para llevarse a §e${playerName} §ftras §c${cause} §e(${count} tótems)`,
            `§e${playerName} §fha sido rescatado de §c${cause} §fpor la magia antigua §e(${count} rescates)`,
            `§fLos espíritus del tótem salvaron a §e${playerName} §fde §c${cause} §e(${count} veces)`,
            `§e${playerName} §fha desafiado el destino contra §c${cause} §e(${count} desafíos superados)`,
            `§fLa muerte no pudo reclamar a §e${playerName} §ftras §c${cause} §e(${count} victorias)`
        ];

        let availableMessages = messages.filter(msg => !this.#lastUsedMessages.has(msg));
        
        if (availableMessages.length === 0) {
            this.#lastUsedMessages.clear();
            availableMessages = messages;
        }

        const selectedMessage = availableMessages[Math.floor(Math.random() * availableMessages.length)];
        
        this.#updateLastUsedMessages(selectedMessage);

        return this.CONSTANTS.MESSAGE.PREFIX + 
               selectedMessage + 
               this.CONSTANTS.MESSAGE.SUFFIX(globalCount);
    }

    #updateLastUsedMessages(message) {
        this.#lastUsedMessages.add(message);
        if (this.#lastUsedMessages.size > this.CONSTANTS.MAX_STORED_MESSAGES) {
            this.#lastUsedMessages.delete(this.#lastUsedMessages.values().next().value);
        }
    }

    #cleanupPlayerData(playerId) {
        system.runTimeout(() => {
            this.#lastDamageSource.delete(playerId);
        }, this.CONSTANTS.CLEANUP_DELAY);
    }

    #handlePlayerDamage = (event) => {
        if (!(event.hurtEntity instanceof Player)) return;
        
        const player = event.hurtEntity;
        this.#lastDamageSource.set(player.id, {
            cause: event.damageSource.cause,
            amount: event.damage,
            time: Date.now()
        });
    }

    #handleHealthChange = (event) => {
        if (!(event.entity instanceof Player)) return;
        
        const player = event.entity;
        if (event.oldValue <= 0 && event.newValue > 0) {
            this.#processTotemUse(player);
        }
    }

    #processTotemUse(player) {
        const damageInfo = this.#lastDamageSource.get(player.id);
        if (!damageInfo || Date.now() - damageInfo.time > this.CONSTANTS.DAMAGE_WINDOW) return;

        const playerCount = this.#updatePlayerCount(player);
        const globalCount = this.#updateGlobalCount();

        const cause = this.#getDamageCauseText(damageInfo.cause);
        const message = this.#getRandomMessage(player.name, cause, playerCount, globalCount);
        world.sendMessage(message);

        this.#cleanupPlayerData(player.id);
    }

    #updatePlayerCount(player) {
        const currentCount = player.getDynamicProperty(this.CONSTANTS.PROPERTIES.PLAYER_COUNT) ?? 0;
        const newCount = currentCount + 1;
        player.setDynamicProperty(this.CONSTANTS.PROPERTIES.PLAYER_COUNT, newCount);
        return newCount;
    }

    #updateGlobalCount() {
        const currentCount = world.getDynamicProperty(this.CONSTANTS.PROPERTIES.GLOBAL_COUNT) ?? 0;
        const newCount = currentCount + 1;
        world.setDynamicProperty(this.CONSTANTS.PROPERTIES.GLOBAL_COUNT, newCount);
        return newCount;
    }

    #setupEvents() {
        world.afterEvents.entityHurt.subscribe(this.#handlePlayerDamage);
        world.afterEvents.entityHealthChanged.subscribe(this.#handleHealthChange);
    }

  setupPhantomAttackListener() {
    world.afterEvents.entityHurt.subscribe((event) => {
      const { hurtEntity, damageSource } = event;

      if (
        hurtEntity instanceof Player &&
        damageSource.damagingEntity?.typeId === "minecraft:phantom"
      ) {
        const inventory = hurtEntity.getComponent(
          EntityInventoryComponent.componentId
        ).container;
        const slots = inventory.size;

        for (let i = 0; i < slots; i++) {
          const item = inventory.getItem(i);

          if (
            item &&
            item.typeId === "minecraft:amethyst_shard" &&
            item.nameTag === "§c[§fAnti Phantom§c]" &&
            item.getLore().includes("Este item te protege de")
          ) {
            if (item.amount > 1) {
              item.amount -= 1;
              inventory.setItem(i, item); 
            } else {
              inventory.setItem(i); 
            }

            hurtEntity.sendMessage(
              "§eSe usó el item Anti Phantom, te salvaste de que tu inventario sea alterado."
            );

            return;
          }
        }

        this.shufflePlayerInventory(hurtEntity);
      }
    });
  }

  shufflePlayerInventory(player) {
    const inventory = player.getComponent(EntityInventoryComponent.componentId);
    if (!inventory) return;

    const container = inventory.container;
    const slots = container.size;
    const items = new Array(slots).fill(null);  

    for (let i = 0; i < slots; i++) {
        const item = container.getItem(i);
        if (item) {
            items[i] = item;
        }
    }

    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }

    for (let i = 0; i < slots; i++) {
        container.setItem(i, items[i] ? items[i] : null);  
    }

    player.sendMessage("§e¡El phantom ha mezclado tu inventario!");
}



  setupCreeperExplosionListener() {
    world.afterEvents.explosion.subscribe((event) => {
      if (event.source && event.source.typeId === "minecraft:creeper") {
        this.handleCreeperExplosion(event);
      }
    });
  }

  handleCreeperExplosion(event) {
    const impactedBlocks = event.getImpactedBlocks();
    if (impactedBlocks.length === 0) return;

    const explosionCenter = this.calculateExplosionCenter(impactedBlocks);
    const impactedPlayers = this.getImpactedPlayers(explosionCenter);

    for (const player of impactedPlayers) {
      if (Math.random() < 0.5) {
        // 50% chance
        this.applyCameraEffect(player);
        player.sendMessage("§gFuiste §fCegado §gpor el creeper §c¡CUIDADO!");
      }
    }
  }

  calculateExplosionCenter(impactedBlocks) {
    const count = impactedBlocks.length;
    if (count === 0) return { x: 0, y: 0, z: 0 }; 

    let sumX = 0,
      sumY = 0,
      sumZ = 0;
    for (const { x, y, z } of impactedBlocks) {
      sumX += x;
      sumY += y;
      sumZ += z;
    }
    return {
      x: sumX / count,
      y: sumY / count,
      z: sumZ / count,
    };
  }

  getImpactedPlayers(explosionCenter) {
    const impactedPlayers = [];
    const explosionRadius = 5;

    const playersInRange = world.getAllPlayers().filter(player => {
        const distance = this.getDistance(explosionCenter, player.location);
        return distance <= explosionRadius;
    });

    return playersInRange;
}

  getDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  applyCameraEffect(player) {
    const fadeSettings = {
      fadeColor: { red: 1, green: 1, blue: 1 }, 
      fadeTime: { fadeInTime: 0, holdTime: 2, fadeOutTime: 1 },
    };
    player.camera.fade(fadeSettings);
  }

  setupMissionCommands() {
    const commands = {
      "!mission": (player) => this.missionSystem.assignRandomMission(player),
      "!abandon": (player) => this.missionSystem.abandonMission(player),
      "!help": (player) => {
        player.sendMessage("§aComandos disponibles:");
        player.sendMessage("§e!mission §7- Asigna una nueva misión aleatoria");
        player.sendMessage("§e!abandon §7- Abandona la misión actual");
        player.sendMessage("§e!frase §7- Recibe una frase aleatoria");
      },
      "!frase": (player) => this.sendRandomFrase(player),
    };

    world.beforeEvents.chatSend.subscribe((eventData) => {
      const player = eventData.sender;
      const message = eventData.message.toLowerCase();
      if (message.startsWith("!")) {
        eventData.cancel = true;
        const command = commands[message];
        if (command) {
          command(player);
        } else {
          player.sendMessage(
            "§cComando desconocido. Usa §e!help§c para ver los comandos disponibles."
          );
        }
      }
    });
  }

  setupEntityDeathListener() {
    world.afterEvents.entityDie.subscribe((event) => {
        const deadEntity = event.deadEntity;
        const damageSource = event.damageSource;

        if (deadEntity && damageSource) {
            const mobType = deadEntity.typeId.split(":")[1];
            const player = damageSource.damagingEntity;

            if (player instanceof Player) {
                this.handleEntityKilled(player, mobType);

                // Probabilidad del 20% de recibir "§c[§fAnti Phantom§c]"
                if (Math.random() < 0.2) {
                    const inventory = player.getComponent(EntityInventoryComponent.componentId).container;
                    let addedToExistingStack = false;
                    
                    for (let i = 0; i < inventory.size; i++) {
                        const item = inventory.getItem(i);

                        if (item && item.typeId === "minecraft:amethyst_shard" && 
                            item.nameTag === "§c[§fAnti Phantom§c]" && 
                            item.getLore().includes("Este item te protege de")) {

                            if (item.amount < 64) {
                                item.amount += 1;
                                inventory.setItem(i, item);
                                addedToExistingStack = true;
                                break;
                            }
                        }
                    }

                    if (!addedToExistingStack) {
                        const amethystShard = new ItemStack("minecraft:amethyst_shard", 1);
                        amethystShard.nameTag = "§c[§fAnti Phantom§c]";
                        amethystShard.setLore([
                            "Este item te protege de",
                            "que el phantom altere tu",
                            "inventario."
                        ]);

                        inventory.addItem(amethystShard);
                    }

                    player.sendMessage("§a¡Has recibido un Anti Phantom!");
                }
            }
        }
    });
}

  handleEntityKilled(player, entityType) {
    /*console.warn(`[MobStacker] Entity killed: ${entityType} by ${player.name}`);*/

    if (!this.entityKillCounts.has(player.id)) {
      this.entityKillCounts.set(player.id, new Map());
    }

    const playerKillCounts = this.entityKillCounts.get(player.id);
    playerKillCounts.set(
      entityType,
      (playerKillCounts.get(entityType) || 0) + 1
    );

    this.missionSystem.updateMissionProgress(player, entityType);
  }

  updateMissionProgress(player, entityType) {
    const mission = this.missionSystem.activeMissions.get(player.id);
    if (!mission) return;

    const targetIndex = mission.targets.findIndex(
      (target) => target.entityType === entityType
    );
    if (targetIndex !== -1) {
      mission.progress[targetIndex]++;
      player.sendMessage(
        `§7Progreso de la misión: ${this.getProgressMessage(mission)}`
      );
      if (this.isMissionComplete(mission)) {
        this.completeMission(player);
      }
    }
  }

  sendRandomFrase(player) {
    const frases = [
      "§aNo te rindas, ¡tú puedes hacerlo!",
      "§cEl fracaso es el mejor maestro, ¡aprenderás de él!",
      "§eEl éxito está más cerca de lo que crees",
      "§6¡Eres más fuerte de lo que piensas!",
      "§dLa perseverancia es la clave del éxito",
      "§9¡Mantén la calma y sigue adelante!",
      "§2¡Tú tienes el poder de cambiarlo todo!",
      "§5¡Nunca subestimes tu propio potencial!",
      "§c¡La victoria está al alcance de tu mano!",
      "§b¡Sigue adelante, que la gloria te espera!",
    ];

    let frase;
    do {
      const randomIndex = Math.floor(Math.random() * frases.length);
      frase = frases[randomIndex];
    } while (player.getDynamicProperty("lastFrase") === frase);

    player.sendMessage(frase);
    player.setDynamicProperty("lastFrase", frase);
  }

  setupEventListeners() {
    system.runInterval(this.updateStacks.bind(this), CONFIG.UPDATE_INTERVAL);
    world.afterEvents.entityHurt.subscribe(this.handleEntityHurt.bind(this)); 
    world.afterEvents.entitySpawn.subscribe(this.handleEntitySpawn.bind(this));
    world.beforeEvents.playerBreakBlock.subscribe(
      this.handlePlayerBreakBlock.bind(this)
    );
    world.beforeEvents.playerPlaceBlock.subscribe(
      this.handlePlayerPlaceBlock.bind(this)
    );
  }

  handlePlayerBreakBlock(event) {
    if (event.player.getDynamicProperty("disable_block_break")) {
      event.cancel = true;
    }
  }

  handlePlayerPlaceBlock(event) {
    if (event.player.getDynamicProperty("disable_block_place")) {
      event.cancel = true;
    }
  }

  updateStacks() {
    const dimensions = ["overworld", "nether", "the_end"];
    
    dimensions.forEach((dimension, index) => {
        if (system.currentTick % (index + 1) === 0) {  
            const allEntities = world.getDimension(dimension).getEntities();
            allEntities.forEach((entity) => {
                if (entity.isValid()) {
                    this.updateEntityNameTag(entity);
                }
            });

            this.hostileMobTypes.forEach((mobType) => {
                const entities = world.getDimension(dimension)
                    .getEntities({ type: `minecraft:${mobType}` })
                    .filter(e => e.isValid());
                if (entities.length > 1) {
                    this.processEntities(entities, mobType);
                }
            });
        }
    });
}


  processEntities(entities, mobType) {
    const stacks = this.groupEntitiesByLocation(entities);
    stacks.forEach((stack) => {
      if (stack.length > 1) this.mergeStack(stack, mobType);
    });
  }

  groupEntitiesByLocation(entities) {
    const stacks = new Map();
    entities.forEach((entity) => {
      if (!entity.isValid()) return;

      // Si tiene un nameTag personalizado, no lo incluimos en ningún stack
      if (entity.nameTag && !entity.nameTag.includes("§c[ §7x")) {
        const uniqueKey = `custom_${entity.id}`;
        stacks.set(uniqueKey, [entity]);
        return;
      }

      const isMegaWarden = entity.getDynamicProperty("stacker:is_mega_warden");

      if (isMegaWarden) {
        const uniqueKey = `mega_${entity.id}`;
        stacks.set(uniqueKey, [entity]);
      } else {
        const key = this.getLocationKey(entity.location);
        if (!stacks.has(key)) stacks.set(key, []);
        stacks.get(key).push(entity);
      }
    });
    return stacks;
  }

  mergeStack(stack, mobType) {
    stack.sort((a, b) => {
      const aIsMega = a.getDynamicProperty("stacker:is_mega_warden");
      const bIsMega = b.getDynamicProperty("stacker:is_mega_warden");
      if (aIsMega && !bIsMega) return -1;
      if (!aIsMega && bIsMega) return 1;
      return (
        (b.getDynamicProperty("stacker:stack_size") || 1) -
        (a.getDynamicProperty("stacker:stack_size") || 1)
      );
    });

    const mainEntity = stack[0];
    if (mainEntity.getDynamicProperty("stacker:is_mega_warden")) {

      this.updateEntityStack(mainEntity, 1, "Mega Warden");
      return;
    }

    let totalSize = mainEntity.getDynamicProperty("stacker:stack_size") || 1;

    for (let i = 1; i < stack.length; i++) {
      const entity = stack[i];

      if (entity.getDynamicProperty("stacker:is_mega_warden")) {
        continue;
      }

      const size = entity.getDynamicProperty("stacker:stack_size") || 1;
      if (totalSize + size > CONFIG.MAX_STACK_SIZE) break;

      totalSize += size;
      entity.remove();
    }

    this.updateEntityStack(mainEntity, totalSize, mobType);
  }

  getLocationKey(location) {
    return `${Math.floor(location.x / CONFIG.STACK_RADIUS)},${Math.floor(
      location.z / CONFIG.STACK_RADIUS
    )}`;
  }

  updateEntityStack(entity, size, mobType) {
    entity.setDynamicProperty("stacker:stack_size", size);

    const healthComponent = entity.getComponent(
      EntityHealthComponent.componentId
    );
    if (healthComponent) {
      const currentHealth = healthComponent.currentValue;
      const maxHealth = healthComponent.effectiveMax;

      entity.setDynamicProperty("stacker:current_health", currentHealth);
      entity.setDynamicProperty("stacker:max_health", maxHealth);

      if (entity.getDynamicProperty("stacker:is_mega_warden")) {
        entity.nameTag = "§c[ §7Mega Warden §c]";
      } else {
        this.updateEntityNameTag(entity);
      }

      if (
        (size > 5 || mobType === "warden") &&
        !entity.getDynamicProperty("stacker:is_mega_warden")
      ) {
        this.applyRandomEffects(entity, mobType);
        entity.setDynamicProperty("stacker:can_apply_effect", true);
      } else {
        entity.setDynamicProperty("stacker:can_apply_effect", false);
      }
    }
  }

  updateEntityNameTag(entity) {
    if (entity instanceof Player) return;

    const healthComponent = entity.getComponent(
      EntityHealthComponent.componentId
    );
    if (!healthComponent) return;

    if (entity.nameTag && !entity.nameTag.includes("§c[ §7x")) {
      return;
    }

    const currentHealth = Math.round(healthComponent.currentValue);
    const maxHealth = Math.round(healthComponent.effectiveMax);
    const mobType = entity.typeId.split(":")[1];
    const count = entity.getDynamicProperty("stacker:is_mega_warden")
      ? 1
      : entity.getDynamicProperty("stacker:stack_size") || 1;

    if (entity.getDynamicProperty("stacker:is_mega_warden")) {
      entity.nameTag = "§c[ §7Mega Warden §c]";
    } else {
      const nameTag = CONFIG.NAME_TAG_FORMAT.replace("{count}", count)
        .replace("{name}", mobType)
        .replace("{health}", currentHealth)
        .replace("{maxHealth}", maxHealth);

      entity.nameTag = nameTag;
    }
  }

  updateNameTag(entity, size, mobType) {
    if (entity instanceof Player) return;

    const healthComponent = entity.getComponent(
      EntityHealthComponent.componentId
    );
    if (!healthComponent) return;

    if (entity.nameTag && !entity.nameTag.includes("§c[ §7x")) {
      return;
    }

    const currentHealth = Math.round(healthComponent.currentValue);
    const maxHealth = Math.round(healthComponent.effectiveMax);

    let nameTag;
    if (entity.getDynamicProperty("stacker:is_mega_warden")) {
      nameTag = `§c[ §7Mega Warden §c]\n§a${currentHealth}§7/§a${maxHealth}`;
    } else {
      nameTag = CONFIG.NAME_TAG_FORMAT.replace("{count}", size)
        .replace("{name}", mobType)
        .replace("{health}", currentHealth)
        .replace("{maxHealth}", maxHealth);
    }

    entity.nameTag = nameTag;
  }

  updateEntityHealth(entity) {
    const healthComponent = entity.getComponent(
      EntityHealthComponent.componentId
    );
    if (!healthComponent) return;

    const currentHealth = healthComponent.currentValue;
    const maxHealth = healthComponent.effectiveMax;

    entity.setDynamicProperty("stacker:current_health", currentHealth);
    entity.setDynamicProperty("stacker:max_health", maxHealth);

    const stackSize = entity.getDynamicProperty("stacker:stack_size") || 1;
    const mobType = entity.typeId.split(":")[1];
    this.updateNameTag(
      entity,
      stackSize,
      mobType === "warden" && entity.nameTag.includes("Mega Warden")
        ? "Mega Warden"
        : mobType
    );
  }

  applyRandomEffects(entity, mobType) {
    const isWarden = mobType === "warden";
    const stackSize = entity.getDynamicProperty("stacker:stack_size") || 1;

    if (!isWarden && stackSize <= 5) return;

    const chance = Math.random();
    let numEffects = (isWarden && chance < 0.3) 
        ? Math.floor(Math.random() * 3) + 4
        : this.getNumEffects(chance);

    const shuffledEffects = this.shuffleArray(Object.keys(MOB_EFFECTS));
    shuffledEffects.slice(0, numEffects).forEach(effect => this.applyEffect(entity, effect));
}


  getNumEffects(chance) {
    if (chance < 0.75) return 1;
    if (chance < 0.9) return 2;
    if (chance < 0.98) return 3;
    return Object.keys(MOB_EFFECTS).length;
  }

  applyEffect(entity, effectName) {
    const duration = 6000;
    const maxLevel = MOB_EFFECTS[effectName].maxLevel;
    const amplifier = Math.floor(Math.random() * maxLevel);
    entity.addEffect(effectName, duration, { amplifier });
  }

  handleEntitySpawn(event) {
    const entity = event.entity;
    if (entity.typeId === "minecraft:warden") {
      if (Math.random() < 0.3) {
        // 30% chance
        this.createMegaWarden(entity);
      }
    }
  }

  createMegaWarden(entity) {
    const healthComponent = entity.getComponent(
      EntityHealthComponent.componentId
    );
    if (!healthComponent) return;

    const baseHealth = healthComponent.defaultValue;
    const megaWardenHealth = baseHealth * 2;

    healthComponent.setCurrentValue(megaWardenHealth);
    healthComponent.resetToDefaultValue();

    entity.setDynamicProperty("stacker:base_health", baseHealth);
    entity.setDynamicProperty("stacker:current_health", megaWardenHealth);
    entity.setDynamicProperty("stacker:max_health", megaWardenHealth);
    entity.setDynamicProperty("stacker:is_mega_warden", true);

    const numEffects = Math.floor(Math.random() * 3) + 4; // 4 to 6 effects
    const appliedEffects = this.applyRandomEffectsToMegaWarden(
      entity,
      numEffects
    );

    this.updateMegaWardenNameTag(entity);
    this.announceMegaWarden(entity, appliedEffects); 

    this.startPlayerDetection(entity);
  }

  applyRandomEffectsToMegaWarden(entity, numEffects) {
    const shuffledEffects = this.shuffleArray(Object.keys(MOB_EFFECTS));
    const appliedEffects = [];
    for (let i = 0; i < numEffects; i++) {
      const effectName = shuffledEffects[i];
      const duration = 6000; // 5 minutes
      const maxLevel = MOB_EFFECTS[effectName].maxLevel;
      const amplifier = Math.floor(Math.random() * maxLevel);
      entity.addEffect(effectName, duration, { amplifier });
      appliedEffects.push({ name: effectName, level: amplifier + 1 });
    }
    return appliedEffects;
  }

  updateMegaWardenNameTag(entity) {
    const healthComponent = entity.getComponent(
      EntityHealthComponent.componentId
    );
    if (!healthComponent) return;

    const currentHealth = Math.round(healthComponent.currentValue);
    const maxHealth = Math.round(healthComponent.effectiveMax);

    entity.nameTag = `§c[ §7Mega Warden §c]\n§a${currentHealth}§7/§a${maxHealth}`;
  }

  announceMegaWarden(entity, appliedEffects = []) {
    const { x, y, z } = entity.location;
    const threats = [
      "Prepárate, porque de esta no sales vivo aunque le reces a dios",
      "Tu fin está cerca, mortal. Ni siquiera intentes huir",
      "La oscuridad te consume. No hay escape de mi ira",
      "Tus esfuerzos son inútiles. Tu destino está sellado",
      "Tu alma está condenada, no hay redención para ti",
      "No hay esperanza para ti, sólo la oscuridad y la muerte",
      "Tus gritos de ayuda no serán escuchados. La muerte te espera",
      "No puedes escapar de mi maldición. Tu fin es inevitable",
    ];

    const randomThreat = threats[Math.floor(Math.random() * threats.length)];

    let message = `§c[Mega Warden]§r ${randomThreat}, si quieres enfrentarme ven a las siguientes coordenadas [§c${Math.floor(
      x
    )}, ${Math.floor(y)}, ${Math.floor(z)}§r].\n`;

    if (appliedEffects && appliedEffects.length > 0) {
      message += "§7Estos son los efectos que tengo:\n";
      appliedEffects.forEach((effect) => {
        message += `§7- §c${effect.name} §7nivel §c${effect.level}\n`;
      });
    }

    world.sendMessage(message);
  }

  startPlayerDetection(entity) {
    const horizontalDetectionRadius = 10;
    const verticalDetectionRange = 30;
    const detectionInterval = 200;
    const messageInterval = 1200;
    const significantHeightDifference = 3; 

    let lastMessageTime = 0;

    const detectionProcess = system.runInterval(() => {
      if (!entity.isValid()) {
        system.clearRun(detectionProcess);
        return;
      }

      const { x, y, z } = entity.location;

      const nearbyPlayers = entity.dimension.getPlayers({
        location: { x, y, z },
        maxDistance: Math.max(
          horizontalDetectionRadius,
          verticalDetectionRange
        ),
      });

      const currentTime = Date.now();
      for (const player of nearbyPlayers) {
        const verticalDistance = player.location.y - y;
        const horizontalDistance = Math.sqrt(
          Math.pow(player.location.x - x, 2) +
            Math.pow(player.location.z - z, 2)
        );

        if (
          horizontalDistance <= horizontalDetectionRadius &&
          Math.abs(verticalDistance) <= verticalDetectionRange &&
          currentTime - lastMessageTime >= messageInterval
        ) {
          let position;
          if (verticalDistance < -1) {
            position = "below";
          } else if (verticalDistance >= significantHeightDifference) {
            position = "above";
          } else {
            position = "same";
          }

          this.handlePlayerDetection(
            entity,
            player,
            position,
            verticalDistance
          );

          lastMessageTime = currentTime;
          break;
        }
      }
    }, detectionInterval);
  }

  handlePlayerDetection(entity, player, position, verticalDistance) {
    if (position === "above") {
      const safeY = this.findSafeYPosition(
        entity.dimension,
        entity.location.x,
        entity.location.y,
        entity.location.z
      );

      if (safeY !== null) {
        const teleportLocation = {
          x: entity.location.x + (Math.random() * 2 - 1),
          y: safeY,
          z: entity.location.z + (Math.random() * 2 - 1),
        };

        player.teleport(teleportLocation);
        this.sendPositionalMessage(player, position);
      }
    } else if (position === "below") {
      const safeY = this.findSafeYPosition(
        entity.dimension,
        entity.location.x,
        entity.location.y,
        entity.location.z
      );

      if (safeY !== null) {
        const teleportLocation = {
          x: entity.location.x + (Math.random() * 2 - 1),
          y: safeY,
          z: entity.location.z + (Math.random() * 2 - 1),
        };

        player.teleport(teleportLocation);
        this.sendPositionalMessage(player, position);
      }
    } else {
      const dx = entity.location.x - player.location.x;
      const dz = entity.location.z - player.location.z;
      const magnitude = Math.sqrt(dx * dx + dz * dz);
      const normalizedDx = dx / magnitude;
      const normalizedDz = dz / magnitude;
      const pushForce = 0.5;
      player.applyKnockback(normalizedDx, normalizedDz, pushForce, 0.2);

      this.sendMegaWardenMessage(entity, player);
    }

    console.warn(
      `Mega Warden detected ${
        player.name
      } at vertical distance: ${verticalDistance.toFixed(
        2
      )}, position: ${position}`
    );
  }

  findSafeYPosition(dimension, x, y, z) {
    const checkRange = 5;

    for (let offsetY = 0; offsetY <= checkRange; offsetY++) {

      if (this.isPositionSafe(dimension, x, y + offsetY, z)) {
        return y + offsetY;
      }

      if (this.isPositionSafe(dimension, x, y - offsetY, z)) {
        return y - offsetY;
      }
    }

    return null;
  }

  isPositionSafe(dimension, x, y, z) {
    try {
      const blockBelow = dimension.getBlock({ x, y: y - 1, z });
      const blockAt = dimension.getBlock({ x, y, z });
      const blockAbove = dimension.getBlock({ x, y: y + 1, z });

      return blockBelow?.isSolid && !blockAt?.isSolid && !blockAbove?.isSolid;
    } catch (error) {
      console.warn(
        `Error al verificar la seguridad de la posición (${x}, ${y}, ${z}): ${error}`
      );
      return false;
    }
  }

  sendPositionalMessage(player, position) {
    const messages = {
      above: [
        "§c[Mega Warden]§r ¿Crees que las alturas te protegerán? ¡Ingenuo!",
        "§c[Mega Warden]§r Baja, amiguito. No te haré nada... mucho :)))",
        "§c[Mega Warden]§r ¿Te sientes seguro allá arriba? Qué equivocado estás.",
        "§c[Mega Warden]§r Las nubes no te salvarán de mi ira. ¡Desciende y enfréntame!",
        "§c[Mega Warden]§r ¿Jugando a ser pájaro? Déjame enseñarte cómo se vuela... hacia abajo.",
        "§c[Mega Warden]§r Las alturas no son refugio. ¡Desciende o te haré bajar!",
        "§c[Mega Warden]§r ¿Intentando volar lejos de tu destino? No escaparás.",
        "§c[Mega Warden]§r Nada puede esconderte allá arriba, la oscuridad te alcanzará.",
        "§c[Mega Warden]§r ¿Te crees a salvo entre las nubes? Pronto verás cuán frágil eres.",
      ],
      below: [
        "§c[Mega Warden]§r ¿Acaso eres una rata de alcantarilla? ¡Sal de ahí!",
        "§c[Mega Warden]§r Las profundidades no te ocultarán de mí. ¡Sube y acepta tu destino!",
        "§c[Mega Warden]§r ¿Excavando tu propia tumba? Déjame ayudarte con eso.",
        "§c[Mega Warden]§r Los gusanos son mis aperitivos. ¿Quieres ser el próximo?",
        "§c[Mega Warden]§r ¿Buscando diamantes? Solo encontrarás tu perdición aquí abajo.",
        "§c[Mega Warden]§r Las sombras no son tu refugio, sino tu condena.",
        "§c[Mega Warden]§r Crees que el subsuelo es tu salvación, pero será tu tumba.",
        "§c[Mega Warden]§r Ahí abajo no hay escapatoria. ¡Sube a enfrentarme!",
        "§c[Mega Warden]§r Incluso en las entrañas de la tierra, puedo sentir tu miedo.",
      ],
    };

    const lastMessage =
      player.getDynamicProperty(`lastMegaWardenMessage_${position}`) || "";

    const availableMessages = messages[position].filter(
      (msg) => msg !== lastMessage
    );

    const randomMessage =
      availableMessages[Math.floor(Math.random() * availableMessages.length)];

    player.sendMessage(randomMessage);

    player.setDynamicProperty(
      `lastMegaWardenMessage_${position}`,
      randomMessage
    );

    player.setDynamicProperty("justReceivedPositionalMessage", true);
  }

  sendMegaWardenMessage(entity, player) {
    const messages = [
      "§c[Mega Warden]§r ¿Te escondes? Eres un mero mortal sin poder suficiente para vencerme que opta por huir.",
      "§c[Mega Warden]§r Tu intento de esconderte es inútil. Puedo sentir tu miedo.",
      "§c[Mega Warden]§r ¿Crees que puedes escapar de mí? Qué ingenuidad.",
      "§c[Mega Warden]§r Tu cobardía solo alimenta mi poder. Enfréntame si te atreves.",
      "§c[Mega Warden]§r Cada segundo que te escondes, me hago más fuerte. ¿Es eso lo que quieres?",
      "§c[Mega Warden]§r Tu miedo es palpable. Ven y enfréntame, si es que tienes el valor.",
      "§c[Mega Warden]§r ¿Acaso crees que puedes evitar tu destino? Yo soy inevitable.",
      "§c[Mega Warden]§r La oscuridad te rodea. No hay escapatoria de mi dominio.",
      "§c[Mega Warden]§r Tus escondites son inútiles, nada escapa de mi furia.",
      "§c[Mega Warden]§r Sigues corriendo, pero tu destino está escrito: ¡la derrota!",
      "§c[Mega Warden]§r Puedo oler tu miedo a kilómetros, no te escondas más.",
      "§c[Mega Warden]§r ¿Piensas que las sombras te protegen? Yo soy la sombra.",
      "§c[Mega Warden]§r No importa cuánto te escondas, el destino siempre te encontrará.",
      "§c[Mega Warden]§r Cada paso que das hacia la oscuridad, me acerco más a tu fin.",
      "§c[Mega Warden]§r La desesperación es tu única compañía. Ven y enfréntame si puedes.",
    ];

    const lastMessage =
      player.getDynamicProperty("lastMegaWardenMessage") || "";

    const availableMessages = messages.filter((msg) => msg !== lastMessage);

    const randomMessage =
      availableMessages[Math.floor(Math.random() * availableMessages.length)];

    player.sendMessage(randomMessage);

    player.setDynamicProperty("lastMegaWardenMessage", randomMessage);
  }

  handleEntityDeath(deadEntity, damageSource) {
    if (!deadEntity || !deadEntity.isValid()) {
      return;
    }

    const entityId = deadEntity.id;
    if (this.killedEntities.has(entityId)) {
      return; 
    }
    this.killedEntities.add(entityId);

    const mobType = deadEntity.typeId.split(":")[1];

    if (
      deadEntity.typeId.endsWith("warden") &&
      deadEntity.getDynamicProperty("stacker:is_mega_warden")
    ) {
      const player = damageSource.damagingEntity;
      if (player && player instanceof Player) {
        world.sendMessage(
          "§b¡Felicidades, el jugador §c" +
            player.name +
            "§b! Mató al §cMega Warden§b!"
        );
        this.giveRewardToPlayer(player);
        this.handleEntityKilled(player, mobType);
      }
    }

    if (!this.isValidMob(deadEntity) || damageSource.cause === "void") return;

    const stackSize = deadEntity.getDynamicProperty("stacker:stack_size") || 1;
    if (stackSize > 1) {
      this.spawnRemainingStack(deadEntity, stackSize - 1);
    }

    const healthComponent = deadEntity.getComponent(
      EntityHealthComponent.componentId
    );
    if (healthComponent) {
      healthComponent.setCurrentValue(0);
    }

    deadEntity.nameTag = "§c[ §7DEAD §c]";

    deadEntity.addEffect("invisibility", 999999, { amplifier: 0 });

    system.runTimeout(() => {
      if (deadEntity.isValid()) {
        deadEntity.kill();
      }
      this.killedEntities.delete(entityId); 
    }, 5);

    const player = damageSource.damagingEntity;
    if (player && player instanceof Player) {
      this.handleEntityKilled(player, mobType);
    }
  }

  handleEntityHurt(event) {
    const { hurtEntity, damage, damageSource } = event;

    if (this.isValidMob(hurtEntity)) {
      const healthComponent = hurtEntity.getComponent(
        EntityHealthComponent.componentId
      );
      if (!healthComponent) return;

      let currentHealth = healthComponent.currentValue;
      const maxHealth = healthComponent.effectiveMax;

      currentHealth = Math.max(0, currentHealth - damage);

      const healingEffects = hurtEntity
        .getEffects()
        .filter(
          (effect) =>
            effect.typeId === "minecraft:regeneration" ||
            effect.typeId === "minecraft:instant_health"
        );

      if (healingEffects.length > 0) {
        const healAmount = healingEffects.reduce(
          (total, effect) => total + (effect.amplifier + 1),
          0
        );
        currentHealth = Math.min(maxHealth, currentHealth + healAmount);
      }

      healthComponent.setCurrentValue(currentHealth);
      hurtEntity.setDynamicProperty("stacker:current_health", currentHealth);

      if (hurtEntity.getDynamicProperty("stacker:is_mega_warden")) {
        this.updateMegaWardenNameTag(hurtEntity);
      } else {
        this.updateEntityNameTag(hurtEntity);
      }

      if (currentHealth <= 0) {
        this.handleEntityDeath(hurtEntity, damageSource);
      }
    }

    if (
      !(hurtEntity instanceof Player) ||
      !damageSource ||
      !damageSource.damagingEntity
    )
      return;

    const attacker = damageSource.damagingEntity;
    if (!this.isValidMob(attacker)) return;

    const stackSize = attacker.getDynamicProperty("stacker:stack_size") || 1;
    const isWarden = attacker.typeId.endsWith("warden");
    const isMegaWarden = attacker.getDynamicProperty("stacker:is_mega_warden");
    const isSpider = attacker.typeId.endsWith("spider");

    if (isMegaWarden) {
      if (Math.random() < 0.2) {
        this.applySpecialEffectToPlayer(hurtEntity);
      }
    } else if (
      (stackSize > 5 || isWarden) &&
      attacker.getDynamicProperty("stacker:can_apply_effect")
    ) {
      if (Math.random() < 0.1) {
        this.applyRandomEffectToPlayer(hurtEntity);
        attacker.setDynamicProperty("stacker:can_apply_effect", false);
      }
    }

    if (isSpider && Math.random() < 0.4) {
      this.applySpiderWebEffect(hurtEntity, attacker);
    }
  }

  applySpiderWebEffect(player, spider) {
    const playerPos = player.location;
    const dimension = player.dimension;

    let webPlaced = false;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const blockPos = {
          x: Math.floor(playerPos.x) + dx,
          y: Math.floor(playerPos.y),
          z: Math.floor(playerPos.z) + dz,
        };

        const block = dimension.getBlock(blockPos);

        if (block && block.typeId === "minecraft:air") {

          block.setPermutation(BlockPermutation.resolve("minecraft:web"));
          webPlaced = true;
        }
      }
    }

    if (webPlaced) {

      player.addEffect("weakness", 200, { amplifier: 2 }); // 10 segundos de debilidad 3

      spider.addEffect("strength", 200, { amplifier: 2 }); // 10 segundos de fuerza 3

      player.sendMessage("§e¡Has sido atrapado en una red de araña!");
    }
  }

  applyRandomEffectToPlayer(player) {
    const effectNames = Object.keys(PLAYER_EFFECTS);
    const randomEffect =
      effectNames[Math.floor(Math.random() * effectNames.length)];

    const durationInSeconds = Math.floor(Math.random() * 10) * 5 + 5;
    const duration = durationInSeconds * 20;

    const maxLevel = PLAYER_EFFECTS[randomEffect].maxLevel;
    const amplifier = Math.floor(Math.random() * maxLevel);

    player.addEffect(randomEffect, duration, { amplifier });
    player.sendMessage(
      `§g¡Has recibido el efecto ${randomEffect} nivel ${
        amplifier + 1
      } por ${durationInSeconds} segundos!`
    );
  }

  applySpecialEffectToPlayer(player) {
    if (!player || !player.isValid()) {
      return;
    }

    const effects = ["block_break", "block_place"];
    const randomEffect = effects[Math.floor(Math.random() * effects.length)];
    const duration = (Math.floor(Math.random() * 6) * 5 + 5) * 20;

    let currentTimer = this.playerEffectTimers.get(player.id);
    if (!currentTimer) {
      currentTimer = { block_break: 0, block_place: 0 };
    }

    currentTimer[randomEffect] += duration;

    player.setDynamicProperty(`disable_${randomEffect}`, true);
    player.sendMessage(
      `§c¡El Mega Warden ha ${
        currentTimer[randomEffect] === duration
          ? "desactivado"
          : "extendido la desactivación de"
      } tu habilidad de ${
        randomEffect === "block_break" ? "romper" : "colocar"
      } bloques por ${duration / 20} segundos adicionales! (Total: ${
        currentTimer[randomEffect] / 20
      } segundos)`
    );

    this.playerEffectTimers.set(player.id, currentTimer);
  }

  updatePlayerActionBar(player) {
    if (!this.playerEffectTimers) {
      this.playerEffectTimers = new Map();
    }

    /*if (this.randomTeleport.teleportingPlayers.has(player.id)) {
        return; // no actualiza el actionbar default
    }*/

    const timers = this.playerEffectTimers.get(player.id) || {
      block_break: 0,
      block_place: 0,
    };

    const breakStatus =
      timers.block_break > 0
        ? `§cRomper: ${Math.ceil(timers.block_break / 20)}s`
        : "§aRomper: Activo";
    const placeStatus =
      timers.block_place > 0
        ? `§cColocar: ${Math.ceil(timers.block_place / 20)}s`
        : "§aColocar: Activo";

    player.onScreenDisplay.setActionBar(`${breakStatus} | ${placeStatus}`);

    if (timers.block_break > 0) timers.block_break -= 20;
    if (timers.block_place > 0) timers.block_place -= 20;

    if (timers.block_break <= 0) {
      player.setDynamicProperty("disable_block_break", false);
      timers.block_break = 0;
    }
    if (timers.block_place <= 0) {
      player.setDynamicProperty("disable_block_place", false);
      timers.block_place = 0;
    }

    if (timers.block_break <= 0 && timers.block_place <= 0) {
      this.playerEffectTimers.delete(player.id);
    } else {
      this.playerEffectTimers.set(player.id, timers);
    }
  }

  startActionBarUpdates() {
    system.runInterval(() => {
      for (const player of world.getAllPlayers()) {
        this.updatePlayerActionBar(player);
      }
    }, 20);
  }

  giveRewardToPlayer(player) {
    if (player && player.isValid()) {
      const rewardItems = [
        { item: "minecraft:totem_of_undying", minCount: 1, maxCount: 1 },
        { item: "minecraft:enchanted_golden_apple", minCount: 2, maxCount: 5 },
        { item: "minecraft:diamond", minCount: 5, maxCount: 25, step: 5 },
        {
          item: "minecraft:experience_bottle",
          minCount: 5,
          maxCount: 35,
          step: 5,
        },
      ];

      const numItems = Math.floor(Math.random() * 2) + 1; // Genera 1 o 2 premios randoms
      const rewardedItems = new Set();

      for (let i = 0; i < numItems; i++) {
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * rewardItems.length);
        } while (rewardedItems.has(randomIndex));
        rewardedItems.add(randomIndex);

        const randomReward = rewardItems[randomIndex];
        let count;
        if (randomReward.step) {
          count =
            randomReward.minCount +
            Math.floor(
              Math.random() *
                ((randomReward.maxCount - randomReward.minCount) /
                  randomReward.step +
                  1)
            ) *
              randomReward.step;
        } else {
          count =
            Math.floor(
              Math.random() *
                (randomReward.maxCount - randomReward.minCount + 1)
            ) + randomReward.minCount;
        }

        if (isNaN(count) || count <= 0) {
          continue;
        }

        const rewardItem = new ItemStack(randomReward.item, count);
        const inventory = player.getComponent("inventory").container;
        const leftover = inventory.addItem(rewardItem);
        if (leftover) {
          if (leftover.length === 0) {
            player.sendMessage(
              `§g¡Has recibido §d${count}x §3${rewardItem.typeId.replace(
                "minecraft:",
                ""
              )} §gpor derrotar al §cMega Warden!`
            );
          } else {
            player.sendMessage(
              `§cNo tienes suficiente espacio en tu inventario para recibir la recompensa.`
            );
          }
        } else {
          player.sendMessage(
            `§g¡Has recibido §d${count}x §3${rewardItem.typeId.replace(
              "minecraft:",
              ""
            )} §gpor derrotar al §cMega Warden!`
          );
        }
      }
    }
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  isValidMob(entity) {
    return (
      entity?.isValid() && this.hostileMobTypes.has(entity.typeId.split(":")[1])
    );
  }

  spawnRemainingStack(deadEntity, newStackSize) {
    const mobType = deadEntity.typeId.split(":")[1];
    const newEntity = deadEntity.dimension?.spawnEntity(
      deadEntity.typeId,
      deadEntity.location
    );

    if (newEntity) {
      newEntity.setRotation(deadEntity.getRotation());
      this.updateEntityStack(newEntity, newStackSize, mobType);
    }
  }
}

new HostileMobStacker();
