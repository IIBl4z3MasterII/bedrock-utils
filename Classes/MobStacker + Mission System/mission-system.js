import { system, world, Player, ItemStack } from "@minecraft/server";

class MissionSystem {
  constructor() {

    this.achievements = {
      "Mission Master": {
        requirement: 50,
        description: "Complete 50 missions",
        reward: { xp: 1000, items: ["netherite_ingot"] }
      },
      "Speed Runner": {
        requirement: 25,
        description: "Complete 25 missions in half the time limit",
        reward: { xp: 800, items: ["diamond"] }
      },
      "Monster Hunter": {
        requirement: 1000,
        description: "Kill 1000 monsters in missions",
        reward: { xp: 1200, items: ["enchanted_golden_apple"] }
      },
      "Perfect Score": {
        requirement: 10,
        description: "Complete 10 missions without taking damage",
        reward: { xp: 1500, items: ["totem_of_undying"] }
      }
    };

    this.missionTemplates = [

      { name: "Pest Control", entityTypes: ["zombie"], difficulty: 1, rewards: { xp: 50, items: ["iron_sword", "golden_apple"] }, dimension: "overworld" },
      { name: "Spider Slayer", entityTypes: ["spider"], difficulty: 2, rewards: { xp: 100, items: ["bow", "arrow", "string"] }, dimension: "overworld" },
      { name: "Creeper Hunter", entityTypes: ["creeper"], difficulty: 3, rewards: { xp: 150, items: ["shield", "gunpowder"] }, dimension: "overworld" },
      { name: "Bone Collector", entityTypes: ["skeleton"], difficulty: 2, rewards: { xp: 100, items: ["bow", "arrow", "bone"] }, dimension: "overworld" },
      { name: "Witch Hunt", entityTypes: ["witch"], difficulty: 3, rewards: { xp: 150, items: ["potion", "redstone", "glowstone"] }, dimension: "overworld" },
      { name: "Slime Squasher", entityTypes: ["slime"], difficulty: 2, rewards: { xp: 120, items: ["slime_ball", "lead"] }, dimension: "overworld" },
      { name: "Ocean Hunter", entityTypes: ["drowned"], difficulty: 2, rewards: { xp: 130, items: ["trident", "nautilus_shell"] }, dimension: "overworld" },
      { name: "Guardian Challenge", entityTypes: ["guardian"], difficulty: 4, rewards: { xp: 200, items: ["prismarine_crystals", "fishing_rod"] }, dimension: "overworld" },
      { name: "Raid Champion", entityTypes: ["ravager", "pillager"], difficulty: 4, rewards: { xp: 300, items: ["emerald", "totem_of_undying"] }, dimension: "overworld" },
      { name: "Night Terror", entityTypes: ["phantom"], difficulty: 3, rewards: { xp: 180, items: ["phantom_membrane", "slow_falling_potion"] }, dimension: "overworld" },
      
      { name: "Blaze Hunter", entityTypes: ["blaze"], difficulty: 4, rewards: { xp: 250, items: ["blaze_rod", "fire_resistance_potion"] }, dimension: "nether" },
      { name: "Ghast Chaser", entityTypes: ["ghast"], difficulty: 4, rewards: { xp: 280, items: ["ghast_tear", "regeneration_potion"] }, dimension: "nether" },
      { name: "Gold Rush", entityTypes: ["piglin"], difficulty: 3, rewards: { xp: 200, items: ["gold_ingot", "golden_boots"] }, dimension: "nether" },
      { name: "Magma Master", entityTypes: ["magma_cube"], difficulty: 3, rewards: { xp: 180, items: ["magma_cream", "fire_resistance_potion"] }, dimension: "nether" },
      { name: "Nether Warrior", entityTypes: ["blaze", "ghast"], difficulty: 5, rewards: { xp: 400, items: ["netherite_scrap", "ancient_debris"] }, dimension: "nether" },
      { name: "Fortress Raider", entityTypes: ["wither_skeleton"], difficulty: 4, rewards: { xp: 350, items: ["skull", "golden_apple"] }, dimension: "nether" },
      
      { name: "Void Walker", entityTypes: ["enderman"], difficulty: 4, rewards: { xp: 300, items: ["ender_pearl", "chorus_fruit"] }, dimension: "the_end" },
      { name: "End Hunter", entityTypes: ["enderman", "shulker"], difficulty: 5, rewards: { xp: 450, items: ["shulker_shell", "purpur_block"] }, dimension: "the_end" },
      { name: "Crystal Guardian", entityTypes: ["endermite"], difficulty: 3, rewards: { xp: 200, items: ["end_crystal", "diamond"] }, dimension: "the_end" }
    ];

    this.missionStreak = {
      multipliers: {
        3: 1.2,
        5: 1.5,
        10: 2.0
      },
      maxStreak: 10 
    };

    this.bonusSystem = {
      combo: {
        multipliers: {
          3: 1.2,
          5: 1.5,
          10: 2.0
        },
        timeout: 10000,
        maxCombo: 10 
      }
    };

    this.dailyBonuses = {
      consecutiveDays: {
        2: { xp: 100, items: ["golden_apple"] },
        5: { xp: 300, items: ["diamond"] },
        7: { xp: 500, items: ["netherite_ingot"] },
        14: { xp: 1000, items: ["enchanted_golden_apple"] },
        30: { xp: 2000, items: ["netherite_block"] }
      },
      maxDays: 30
    };

    try {
      this.initializeSystems();
    } catch (error) {
      console.warn("Error initializing mission system:", error);
    }
  }

  initializeSystems() {
    try {
      this.missions = this.generateMissions();
      this.activeMissions = new Map();
      this.completedMissions = new Map();
      this.playerCooldowns = new Map();
      this.comboSystem = new Map();
      this.startMissionTimer();
      this.startComboSystem();
    } catch (error) {
      console.error("Error in initializeSystems:", error);
    }
  }


  assignRandomMission(player) {
    const cooldownTime = 300000; // 5 minutos de cooldown
    const currentTime = Date.now();
    const lastMissionTime = this.getPlayerProperty(player, "lastMissionTime", 0);

    if (currentTime - lastMissionTime < cooldownTime) {
      const remainingTime = cooldownTime - (currentTime - lastMissionTime);
      const { minutes, seconds } = this.formatTime(remainingTime);
      player.sendMessage(`§cDebes esperar ${minutes} minutos y ${seconds} segundos antes de aceptar otra misión.`);
      return;
    }

    if (this.getPlayerProperty(player, "activeMission")) {
      player.sendMessage("§cYa tienes una misión activa. Complétala o abandónala primero.");
      return;
    }

    const currentDimension = player.dimension.id.split(':')[1]; 

    const dimensionMissions = this.missions.filter(mission => mission.dimension === currentDimension);
    
    if (dimensionMissions.length === 0) {
      player.sendMessage(`§cNo hay misiones disponibles en esta dimensión (${this.getDimensionName(currentDimension)})`);
      return;
    }

    const completedMissions = this.getPlayerProperty(player, "completedMissions", []);
    const availableMissions = dimensionMissions.filter(mission => !completedMissions.includes(mission.name));

    if (availableMissions.length === 0) {
      this.setPlayerProperty(player, "completedMissions", []);
      player.sendMessage("§a¡Todas las misiones de esta dimensión completadas! Reiniciando el conjunto de misiones.");
      this.missions = this.generateMissions();
      this.assignRandomMission(player);
      return;
    }

    const randomMission = availableMissions[Math.floor(Math.random() * availableMissions.length)];
    const timeLimit = this.calculateTimeLimit(randomMission.difficulty);
    const assignedMission = {
      ...randomMission,
      progress: randomMission.targets.map(() => 0),
      startTime: currentTime,
      timeLimit,
    };

    this.setPlayerProperty(player, "activeMission", assignedMission);
    this.setPlayerProperty(player, "lastMissionTime", currentTime);

    player.sendMessage(`§aNueva misión asignada: §e${randomMission.name}`);
    player.sendMessage(`§7${randomMission.description}`);
    player.sendMessage(`§6Dificultad: ${this.getDifficultyLevel(randomMission.difficulty)}`);
    player.sendMessage(`§bTiempo límite: ${Math.floor(timeLimit / 60000)} minutos`);
    player.sendMessage(`§dDimensión: ${this.getDimensionName(currentDimension)}`);
  }

  getDimensionName(dimension) {
    const dimensionNames = {
      'overworld': '§aOverworld',
      'nether': '§cNether',
      'the_end': '§5The End'
    };
    return dimensionNames[dimension] || dimension;
  }

  startComboSystem() {
    system.runInterval(() => {
      for (const [playerId, comboData] of this.comboSystem) {
        if (Date.now() - comboData.lastKillTime > this.bonusSystem.combo.timeout) {
          if (comboData.current > 2) {
            const player = world.getPlayers().find(p => p.id === playerId);
            if (player) {
              player.sendMessage(`§6¡Combo terminado! §eAlcanzaste ${comboData.current} eliminaciones seguidas`);
            }
          }
          this.comboSystem.set(playerId, { current: 0, lastKillTime: 0 });
        }
      }
    }, 1000);
  }

  updateCombo(player, entityType) {
    const comboData = this.comboSystem.get(player.id) || { current: 0, lastKillTime: 0 };
    comboData.current++;
    comboData.lastKillTime = Date.now();
    this.comboSystem.set(player.id, comboData);

    for (const [count, multiplier] of Object.entries(this.bonusSystem.combo.multipliers)) {
      if (comboData.current === parseInt(count)) {
        player.sendMessage(`§6¡Combo x${multiplier}! §e${comboData.current} eliminaciones seguidas`);
        break;
      }
    }
  }

  updateMissionProgress(player, entityType) {
    try {
      const mission = this.getPlayerProperty(player, "activeMission");
      if (!mission) return;

      const currentDimension = player.dimension.id.split(':')[1];
      if (mission.dimension !== currentDimension) return;

      const now = Date.now();
      const lastKill = this.getPlayerProperty(player, "lastKillTime", 0);
      if (now - lastKill < 100) return;
      
      this.setPlayerProperty(player, "lastKillTime", now);

      if (!entityType || typeof entityType !== 'string') {
        console.warn("Invalid entity type:", entityType);
        return;
      }

      let targetIndex = -1;
      if (Array.isArray(mission.targets) && Array.isArray(mission.progress)) {
        for (let i = 0; i < mission.targets.length; i++) {
          if (mission.targets[i]?.entityType === entityType && 
              mission.progress[i] < mission.targets[i]?.count) {
            targetIndex = i;
            break;
          }
        }
      }

      if (targetIndex !== -1) {
        mission.progress[targetIndex]++;
        this.setPlayerProperty(player, "activeMission", mission);
        this.updateCombo(player, entityType);
        this.showProgressMessage(player, mission);

        if (this.isMissionComplete(mission)) {
          this.completeMission(player);
        }
      }
    } catch (error) {
      console.error("Error in updateMissionProgress:", error);
    }
  }
  
  showProgressMessage(player, mission) {
    const remainingTargets = mission.targets
      .map((target, index) => {
        const remaining = target.count - mission.progress[index];
        if (remaining > 0) {
          return `${remaining} ${this.getEntityName(target.entityType)}${remaining !== 1 ? 's' : ''}`;
        }
        return null;
      })
      .filter(target => target !== null);

    if (remainingTargets.length > 0) {
      player.sendMessage(`§7Progreso: ${this.getProgressMessage(mission)}\n§e¡Falta eliminar: ${remainingTargets.join(", ")}!`);
    }
  }

  startRandomEvents() {
    system.runInterval(() => {
      if (Math.random() < 0.1) { 
        this.triggerRandomEvent();
      }
    }, 6000); 
  }
  
  triggerRandomEvent() {
    const events = [
      {
        name: "Double Rewards",
        duration: 300000, // 5 minutos
        effect: (player) => {
          player.sendMessage("§6¡Evento especial! §eRecompensas dobles durante 5 minutos");
          this.setPlayerProperty(player, "rewardMultiplier", 2);
          system.runTimeout(() => {
            this.setPlayerProperty(player, "rewardMultiplier", 1);
            player.sendMessage("§6El evento de recompensas dobles ha terminado");
          }, 300000);
        }
      },
      {
        name: "Boss Rush",
        duration: 600000, // 10 minutos
        effect: (player) => {
          player.sendMessage("§6¡Evento especial! §eMisiones contra jefes disponibles con recompensas mejoradas");
          
        }
      },
      {
        name: "Speed Challenge",
        duration: 300000, 
        effect: (player) => {
          player.sendMessage("§6¡Evento especial! §eCompletar misiones en tiempo récord otorga recompensas extra");
          this.setPlayerProperty(player, "speedChallenge", true);
          system.runTimeout(() => {
            this.setPlayerProperty(player, "speedChallenge", false);
            player.sendMessage("§6El desafío de velocidad ha terminado");
          }, 300000);
        }
      }
    ];

    const randomEvent = events[Math.floor(Math.random() * events.length)];
    for (const player of world.getAllPlayers()) {
      randomEvent.effect(player);
    }
  }

  generateMissions() {
    return this.missionTemplates.map((template) => {
      const targets = template.entityTypes.map((entityType) => ({
        entityType,
        count: this.getRandomTarget(entityType, template.difficulty),
      }));
      return {
        ...template,
        description: this.generateDescription(targets),
        targets,
        type: "kill",
        bonusObjectives: this.generateBonusObjectives(template.difficulty),
      };
    });
  }

  generateBonusObjectives(difficulty) {
    const objectives = [];
    if (difficulty >= 3) {
      objectives.push({
        type: "time",
        description: "Completa la misión en la mitad del tiempo",
        reward: { xp: 100 * difficulty },
      });
      objectives.push({
        type: "noDamage",
        description: "Completa la misión sin recibir daño",
        reward: { xp: 150 * difficulty },
      });
    }
    if (difficulty >= 4) {
      objectives.push({
        type: "nightTime",
        description: "Completa la misión durante la noche",
        reward: { xp: 200 * difficulty },
      });
    }
    return objectives;
  }

  generateDescription(targets) {
    return targets
      .map(
        (target) =>
          `Elimina ${target.count} ${this.getEntityName(target.entityType)}${
            target.count !== 1 ? "s" : ""
          }`
      )
      .join(" y ");
  }

  getRandomTarget(entityType, difficulty) {
    if (entityType === "warden") return 1;

    const baseRanges = {
      ravager: [1, 2],
      ghast: [2, 5],
      enderman: [3, 8],
      blaze: [5, 10],
      witch: [2, 5],
      guardian: [3, 8],
      phantom: [3, 8],
      creeper: [3, 8],
      default: [5, 15],
    };

    const [min, max] = baseRanges[entityType] || baseRanges.default;
    const range = max - min + 1;
    const randomInRange = Math.floor(Math.random() * range) + min;
    const difficultyMultiplier = 1 + (difficulty - 1) * 0.2;

    return Math.round(randomInRange * difficultyMultiplier);
  }

  getEntityName(entityType) {
    const names = {
      zombie: "zombi",
      spider: "araña",
      creeper: "creeper",
      skeleton: "esqueleto",
      enderman: "enderman",
      witch: "bruja",
      blaze: "blaze",
      ghast: "ghast",
      slime: "slime",
      warden: "warden",
      piglin: "piglin",
      drowned: "ahogado",
      phantom: "fantasma",
      guardian: "guardián",
      ravager: "devastador",
      cave_spider: "araña de cueva",
      zombie_pigman: "piglin zombificado",
    };
    return names[entityType] || entityType;
  }

  formatTime(milliseconds) {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return { minutes, seconds };
  }

  calculateTimeLimit(difficulty) {
    const baseTime = 600000; // 10 minutos base
    return baseTime + (difficulty - 1) * 300000; // Añade 5 minutos por cada nivel de dificultad
  }

  getDifficultyLevel(difficulty) {
    const levels = ["Noob", "Pro", "Master", "Divine", "God"];
    return levels[difficulty - 1] || "Unknown";
  }

  isPlayerInvolvedInKill(player, event) {
    return (
      event.damageSource.damagingEntity === player ||
      (event.damageSource.cause === "entityAttack" &&
        event.damageSource.damagingEntity?.owner === player)
    );
  }

  getProgressMessage(mission) {
    return mission.targets
      .map((target, index) => {
        const current = mission.progress[index];
        const total = target.count;
        return `§e${current}/${total} ${this.getEntityName(target.entityType)}`;
      })
      .join(", ");
  }

  isMissionComplete(mission) {
    return mission.targets.every(
      (target, index) => mission.progress[index] >= target.count
    );
  }

  completeMission(player) {
    try {
      const mission = this.getPlayerProperty(player, "activeMission");
      if (!mission) return;

      if (!mission.difficulty || !mission.rewards) {
        console.warn("Invalid mission structure:", mission);
        return;
      }

      let xpReward = this.calculateXPReward(mission.difficulty);
      const itemRewards = Array.isArray(mission.rewards.items) ? [...mission.rewards.items] : [];

      const streak = Math.min(
        this.getPlayerProperty(player, "missionStreak", 0) + 1,
        this.missionStreak.maxStreak
      );
      this.setPlayerProperty(player, "missionStreak", streak);

      if (this.missionStreak?.multipliers) {
        Object.entries(this.missionStreak.multipliers)
          .sort(([a], [b]) => Number(b) - Number(a))
          .forEach(([streakCount, multiplier]) => {
            if (streak >= Number(streakCount)) {
              xpReward = Math.floor(xpReward * multiplier);
              player.sendMessage(`§6¡Racha de ${streak} misiones! §eMultiplicador x${multiplier}`);
            }
          });
      }

      this.processDailyBonus(player, xpReward, itemRewards);

      this.giveRewards(player, xpReward, itemRewards);
      this.updatePlayerStats(player, mission);
      this.checkAchievements(player);

      const completedMissions = this.getPlayerProperty(player, "completedMissions", []);
      if (!completedMissions.includes(mission.name)) {
        completedMissions.push(mission.name);
        this.setPlayerProperty(player, "completedMissions", completedMissions);
      }

      player.sendMessage(`§a¡Misión completada! §e${mission.name}`);
      player.sendMessage(`§aRecompensa: §e${xpReward} XP + ${itemRewards.join(", ")}`);
      
      this.setPlayerProperty(player, "activeMission", null);
    } catch (error) {
      console.error("Error in completeMission:", error);
      player.sendMessage("§cHubo un error al completar la misión. Por favor, contacta a un administrador.");
    }
  }
  
  processDailyBonus(player, xpReward, itemRewards) {
    try {
      const lastLogin = this.getPlayerProperty(player, "lastLoginDate");
      const today = new Date().toDateString();
      
      if (lastLogin !== today) {
        let consecutiveDays = this.getPlayerProperty(player, "consecutiveDays", 0) + 1;
        consecutiveDays = Math.min(consecutiveDays, this.dailyBonuses.maxDays);
        
        this.setPlayerProperty(player, "consecutiveDays", consecutiveDays);
        this.setPlayerProperty(player, "lastLoginDate", today);

        const bonus = this.dailyBonuses.consecutiveDays[consecutiveDays];
        if (bonus) {
          xpReward += bonus.xp;
          if (Array.isArray(bonus.items)) {
            itemRewards.push(...bonus.items);
          }
          player.sendMessage(`§6¡Bonus por ${consecutiveDays} días consecutivos! §e+${bonus.xp} XP`);
        }
      }
    } catch (error) {
      console.error("Error processing daily bonus:", error);
    }
  }

  updatePlayerStats(player, mission) {
    const stats = this.getPlayerProperty(player, "missionStats", {
      totalMissions: 0,
      fastMissions: 0,
      monstersKilled: 0,
      perfectMissions: 0,
    });

    stats.totalMissions++;
    const elapsedTime = Date.now() - mission.startTime;
    if (elapsedTime < mission.timeLimit / 2) stats.fastMissions++;
    if (!mission.damageTaken) stats.perfectMissions++;
    stats.monstersKilled += mission.targets.reduce((sum, target, index) => sum + mission.progress[index], 0);

    this.setPlayerProperty(player, "missionStats", stats);
  }

  giveItemToPlayer(player, itemId, itemName, count = 1) {
    const inventory = player.getComponent("inventory");
    const item = new ItemStack(itemId, count);
    item.nameTag = itemName;
    inventory.container.addItem(item);
    player.sendMessage(`§aHas obtenido: §r${itemName}`);
  }

  givePotionToPlayer(player, itemId, itemName, count, potionId) {
    player.runCommand(`give @s splash_potion 1 ${potionId}`);
    player.sendMessage(`§aHas obtenido: §r${itemName}`);
  }

async giveRewards(player, xpAmount, items) {
    try {

      player.addExperience(xpAmount);

      const mission = this.getPlayerProperty(player, "activeMission");
      const elapsedTime = Date.now() - mission.startTime;
      const timeRatio = elapsedTime / mission.timeLimit;
      
      let multiplierRange;
      if (timeRatio <= 0.4) {
        multiplierRange = { min: 6, max: 10 }; // Más items por ser rápido
      } else if (timeRatio <= 0.8) {
        multiplierRange = { min: 3, max: 6 }; // Cantidad moderada
      } else {
        multiplierRange = { min: 1, max: 3 }; // Menos items por tardar más
      }

      // Items que siempre se dan en 1 cantidad
      const singleQuantityItems = [
        'shield', 'totem_of_undying', 'trident',
        'bow', 'crossbow', 'potion', 
        'wooden_sword', 'stone_sword', 'iron_sword', 'golden_sword', 'diamond_sword', 'netherite_sword',
        'wooden_axe', 'stone_axe', 'iron_axe', 'golden_axe', 'diamond_axe', 'netherite_axe',
        'wooden_pickaxe', 'stone_pickaxe', 'iron_pickaxe', 'golden_pickaxe', 'diamond_pickaxe', 'netherite_pickaxe',
        'wooden_shovel', 'stone_shovel', 'iron_shovel', 'golden_shovel', 'diamond_shovel', 'netherite_shovel',
        'wooden_hoe', 'stone_hoe', 'iron_hoe', 'golden_hoe', 'diamond_hoe', 'netherite_hoe',
        'leather_helmet', 'chainmail_helmet', 'iron_helmet', 'golden_helmet', 'diamond_helmet', 'netherite_helmet',
        'leather_chestplate', 'chainmail_chestplate', 'iron_chestplate', 'golden_chestplate', 'diamond_chestplate', 'netherite_chestplate',
        'leather_leggings', 'chainmail_leggings', 'iron_leggings', 'golden_leggings', 'diamond_leggings', 'netherite_leggings',
        'leather_boots', 'chainmail_boots', 'iron_boots', 'golden_boots', 'diamond_boots', 'netherite_boots'
      ];

      const potionMapping = {
        'slow_falling_potion': {
          name: '§l§bPoción de Caída Lenta',
          id: 40
        },
        'fire_resistance_potion': {
          name: '§l§6Poción de Resistencia al Fuego',
          id: 12
        },
        'regeneration_potion': {
          name: '§l§dPoción de Regeneración',
          id: 28
        }
      };

      const itemMapping = {
        'netherite_ingot': {
          id: 'minecraft:netherite_ingot',
          name: '§l§8Lingote de Netherita'
        },
        'diamond': {
          id: 'minecraft:diamond',
          name: '§l§bDiamante'
        },
        'golden_apple': {
          id: 'minecraft:golden_apple',
          name: '§l§6Manzana Dorada'
        },
        'enchanted_golden_apple': {
          id: 'minecraft:enchanted_golden_apple',
          name: '§l§6Manzana Dorada Encantada'
        }
      };

      for (const item of items) {
        try {

          let quantity = 1;
          if (!singleQuantityItems.includes(item) && !potionMapping[item]) {
            quantity = Math.floor(Math.random() * (multiplierRange.max - multiplierRange.min + 1)) + multiplierRange.min;
          }

          if (potionMapping[item]) {
            const potion = potionMapping[item];
            this.givePotionToPlayer(
              player,
              'minecraft:splash_potion',
              potion.name,
              1, 
              potion.id
            );
          }

          else if (itemMapping[item]) {
            const mappedItem = itemMapping[item];
            this.giveItemToPlayer(
              player,
              mappedItem.id,
              mappedItem.name,
              quantity
            );
          }

          else {
            this.giveItemToPlayer(
              player,
              `minecraft:${item}`,
              `§l§f${item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
              quantity
            );
          }

          player.sendMessage(`§aHas obtenido: §ex${quantity} §r${item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`);
        } catch (error) {
          console.warn(`Error al dar item ${item}: ${error}`);
          player.sendMessage(`§cError al entregar el item: ${item}`);
        }
      }
    } catch (error) {
      console.error(`Error al dar recompensas: ${error}`);
      player.sendMessage("§cHubo un error al entregar algunas recompensas.");
    }
  }

  checkAchievements(player) {
    try {
      const stats = this.getPlayerProperty(player, "missionStats", {});
      const unlockedAchievements = this.getPlayerProperty(player, "achievements", []);

      if (!this.achievements || typeof this.achievements !== 'object') {
        console.warn("Achievements not properly initialized");
        return;
      }

      for (const [name, achievement] of Object.entries(this.achievements)) {
        if (!unlockedAchievements.includes(name) && achievement.requirement) {
          let completed = false;

          switch (name) {
            case "Mission Master":
              completed = stats.totalMissions >= achievement.requirement;
              break;
            case "Speed Runner":
              completed = stats.fastMissions >= achievement.requirement;
              break;
            case "Monster Hunter":
              completed = stats.monstersKilled >= achievement.requirement;
              break;
            case "Perfect Score":
              completed = stats.perfectMissions >= achievement.requirement;
              break;
            default:
              console.warn("Unknown achievement type:", name);
              continue;
          }

          if (completed) {
            unlockedAchievements.push(name);
            player.sendMessage(`§6¡Logro desbloqueado! §e${name}`);
            player.sendMessage(`§7${achievement.description}`);
            
            if (achievement.reward) {
              this.giveRewards(player, achievement.reward.xp || 0, achievement.reward.items || []);
            }
          }
        }
      }

      this.setPlayerProperty(player, "achievements", unlockedAchievements);
    } catch (error) {
      console.error("Error checking achievements:", error);
    }
  }

  calculateXPReward(difficulty) {
    const baseXP = 100; // Aumentado el XP base
    const multiplier = Math.pow(2.5, difficulty - 1); // Aumentado el multiplicador
    const randomFactor = 0.9 + Math.random() * 0.6; // Mayor variación aleatoria
    return Math.floor(baseXP * multiplier * randomFactor);
  }

  abandonMission(player) {
    if (this.getPlayerProperty(player, "activeMission")) {
      this.setPlayerProperty(player, "activeMission", null);
      player.sendMessage("§cHas abandonado tu misión actual.");
    } else {
      player.sendMessage("§cNo tienes una misión activa para abandonar.");
    }
  }

  startMissionTimer() {
    system.runInterval(() => {
      for (const player of world.getAllPlayers()) {
        const mission = this.getPlayerProperty(player, "activeMission");
        if (mission) {
          const elapsedTime = Date.now() - mission.startTime;
          const remainingTime = mission.timeLimit - elapsedTime;

          if (remainingTime <= 0) {
            player.sendMessage("§c¡Tiempo agotado! La misión ha fallado.");
            this.setPlayerProperty(player, "activeMission", null);
          } else {
            this.updateActionBar(player, mission, remainingTime);
          }
        }
      }
    }, 20);
  }

  updateActionBar(player, mission, remainingTime) {
    const { minutes, seconds } = this.formatTime(remainingTime);
    const progressPercentage = Math.floor(
      (mission.progress.reduce((a, b) => a + b, 0) /
        mission.targets.reduce((a, b) => a + b.count, 0)) *
        100
    );
    const actionBarText = `§eMisión: §f${
      mission.name
    } §7| §aProgreso: §f${progressPercentage}% §7| §cTiempo: §f${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;
    player.onScreenDisplay.setActionBar(actionBarText);
  }

  setPlayerCooldown(player) {
    const cooldownTime = 300000; // 5 minutos de cooldown
    const currentTime = Date.now();
    this.setPlayerProperty(player, "lastMissionTime", currentTime);
  }

  getPlayerProperty(player, propertyName, defaultValue = null) {
    try {
      const dynamicProperty = player.getDynamicProperty(propertyName);
      return dynamicProperty !== undefined ? JSON.parse(dynamicProperty) : defaultValue;
    } catch (error) {
      console.error(`Error getting player property ${propertyName}:`, error);
      return defaultValue;
    }
  }

  setPlayerProperty(player, propertyName, value) {
    try {
      player.setDynamicProperty(propertyName, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting player property ${propertyName}:`, error);
    }
  }
}

export { MissionSystem };