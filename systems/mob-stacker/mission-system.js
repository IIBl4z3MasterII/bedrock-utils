import { system, world, Player, ItemStack } from "@minecraft/server";

export class MissionSystem {
  constructor() {
    this.achievements = {
      "Mission Master": { requirement: 50, description: "Complete 50 missions", reward: { xp: 1000, items: ["netherite_ingot"] } },
      "Speed Runner": { requirement: 25, description: "Complete 25 missions in half the time limit", reward: { xp: 800, items: ["diamond"] } },
      "Monster Hunter": { requirement: 1000, description: "Kill 1000 monsters in missions", reward: { xp: 1200, items: ["enchanted_golden_apple"] } },
      "Perfect Score": { requirement: 10, description: "Complete 10 missions without taking damage", reward: { xp: 1500, items: ["totem_of_undying"] } },
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
      { name: "Nether Expedition", entityTypes: ["piglin", "hoglin"], difficulty: 3, rewards: { xp: 180, items: ["golden_apple", "cooked_porkchop"] }, dimension: "nether" },
      { name: "Blaze Extinguisher", entityTypes: ["blaze"], difficulty: 4, rewards: { xp: 250, items: ["blaze_rod", "fire_resistance_potion"] }, dimension: "nether" },
    ];
    this.playerMissions = new Map();
    this.playerStats = new Map();
    this.initListeners();
  }

  initListeners() {
    world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
      if (initialSpawn) this.initPlayer(player);
    });
  }

  initPlayer(player) {
    if (!this.playerMissions.has(player.id)) this.playerMissions.set(player.id, []);
    if (!this.playerStats.has(player.id)) this.playerStats.set(player.id, { kills: 0, missionsCompleted: 0, perfectMissions: 0 });
  }

  getAvailableMissions(player) {
    this.initPlayer(player);
    const available = [];
    const playerMissions = this.playerMissions.get(player.id) || [];
    const playerDim = player.dimension.id;
    for (let i = 0; i < this.missionTemplates.length; i++) {
      const tmpl = this.missionTemplates[i];
      const dim = `minecraft:${tmpl.dimension}`;
      if (dim === playerDim && !playerMissions.some(m => m.templateIndex === i && !m.completed)) {
        available.push({ ...tmpl, templateIndex: i });
      }
    }
    return available;
  }

  startMission(player, templateIndex) {
    this.initPlayer(player);
    const tmpl = this.missionTemplates[templateIndex];
    if (!tmpl) return false;
    const missions = this.playerMissions.get(player.id);
    if (missions.some(m => m.templateIndex === templateIndex && !m.completed)) return false;
    missions.push({ templateIndex, kills: 0, completed: false, startTime: Date.now(), startHealth: player.getComponent("minecraft:health")?.currentValue || 20 });
    player.sendMessage(`§aMisión iniciada: §6${tmpl.name}`);
    if (tmpl.difficulty >= 3) player.sendMessage(`§7Dificultad: §c${"★".repeat(tmpl.difficulty)}`);
    return true;
  }

  trackKill(player, entityId) {
    this.initPlayer(player);
    const missions = this.playerMissions.get(player.id);
    if (!missions) return;
    const stats = this.playerStats.get(player.id);
    if (stats) stats.kills++;
    for (const mission of missions) {
      if (mission.completed) continue;
      const tmpl = this.missionTemplates[mission.templateIndex];
      if (!tmpl) continue;
      if (tmpl.entityTypes.some(t => entityId.includes(t))) {
        mission.kills++;
        const killsNeeded = tmpl.difficulty * 10;
        const progress = Math.floor((mission.kills / killsNeeded) * 100);
        player.sendMessage(`§7[§6${tmpl.name}§7] §a${mission.kills}/${killsNeeded} (${progress}%)`);
        if (mission.kills >= killsNeeded) this.completeMission(player, mission, tmpl);
      }
    }
  }

  trackBossKill(player, bossId) {
    this.initPlayer(player);
    player.sendMessage(`§c${bossId} derrotado! Recompensa especial`);
  }

  completeMission(player, mission, tmpl) {
    mission.completed = true;
    const stats = this.playerStats.get(player.id);
    if (stats) stats.missionsCompleted++;
    const healthComp = player.getComponent("minecraft:health");
    const currentHealth = healthComp?.currentValue || 0;
    const maxHealth = healthComp?.effectiveMaxHealth || 20;
    const timeElapsed = (Date.now() - mission.startTime) / 1000;
    if (currentHealth >= maxHealth && timeElapsed < 120) {
      if (stats) stats.perfectMissions++;
      player.sendMessage(`§b¡Misión perfecta!`);
    }
    player.sendMessage(`§aMisión completada: §6${tmpl.name}`);
    this.giveRewards(player, tmpl.rewards);
    this.checkAchievements(player);
  }

  giveRewards(player, rewards) {
    if (rewards.xp) player.addExperience(rewards.xp);
    if (rewards.items) {
      for (const itemId of rewards.items) {
        const item = new ItemStack(`minecraft:${itemId}`, 1);
        const container = player.getComponent("minecraft:inventory")?.container;
        if (container) container.addItem(item);
        else player.dimension.spawnItem(item, player.location);
      }
    }
  }

  checkAchievements(player) { }
}
