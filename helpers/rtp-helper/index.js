import { world, system, Player } from "@minecraft/server";

const MS_PER_TICK = 50;

export class RtpHelper {
  constructor(options = {}) {
    this.config = {
      cooldownMs: options.cooldownMs ?? 60000,
      stillTimeMs: options.stillTimeMs ?? 5000,
      searchRadius: options.searchRadius ?? 2000,
      startX: options.startX ?? 0,
      startZ: options.startZ ?? 0,
      maxSearchTicks: options.maxSearchTicks ?? 6000,
      safeBlockIds: options.safeBlockIds ?? [
        "minecraft:grass_block", "minecraft:dirt", "minecraft:sand",
        "minecraft:stone", "minecraft:gravel", "minecraft:snow_block",
        "minecraft:podzol", "minecraft:mycelium", "minecraft:netherrack",
        "minecraft:crimson_nylium", "minecraft:warped_nylium",
        "minecraft:end_stone",
      ],
      unsafeBlockIds: options.unsafeBlockIds ?? [
        "minecraft:lava", "minecraft:flowing_lava", "minecraft:water",
        "minecraft:flowing_water", "minecraft:cactus", "minecraft:magma_block",
        "minecraft:fire",
      ],
      dimensionConfigs: options.dimensionConfigs ?? {
        "minecraft:overworld": { minY: -60, maxY: 319, name: "Overworld" },
        "minecraft:nether": { minY: 0, maxY: 127, name: "Nether" },
        "minecraft:the_end": { minY: 0, maxY: 255, name: "End" },
      },
      onNotify: options.onNotify ?? ((player, title, message) => {
        player.sendMessage(`§8[§6RTP§8] §7${title}: §f${message}`);
      }),
    };
    this.#states = new Map();
    this.#timers = new Map();
    this.#initCleanup();
  }

  #states;
  #timers;

  #getState(playerId) {
    if (!this.#states.has(playerId)) {
      this.#states.set(playerId, { lastCooldown: 0, lastPosition: null, searchStart: null, isWaiting: false, isSearching: false });
    }
    return this.#states.get(playerId);
  }

  #cleanup(playerId) {
    this.#states.delete(playerId);
    const timer = this.#timers.get(playerId);
    if (timer !== undefined) {
      try { system.clearJob(timer); } catch {}
      try { system.clearRun(timer); } catch {}
      this.#timers.delete(playerId);
    }
  }

  #initCleanup() {
    const self = this;
    world.afterEvents.playerSpawn.subscribe((event) => {
      if (!event.initialSpawn) return;
      const p = event.player;
      self.#cleanup(p.id);
      try { p.removeTag("rtp"); p.removeTag("rtp_waiting"); } catch {}
    });
    world.afterEvents.playerLeave.subscribe((event) => { self.#cleanup(event.playerId); });
    system.beforeEvents.shutdown.subscribe(() => {
      for (const [id, timer] of self.#timers) {
        try { system.clearJob(timer); } catch {}
        try { system.clearRun(timer); } catch {}
      }
      self.#timers.clear();
      self.#states.clear();
    });
  }

  #hasTag(player, tag) { try { return player.hasTag(tag); } catch { return false; } }
  #addTag(player, tag) { try { player.addTag(tag); } catch {} }
  #removeTag(player, tag) { try { player.removeTag(tag); } catch {} }

  #isValid(player) { try { return player && player.location && player instanceof Player; } catch { return false; } }

  #getDimConfig(dimId) {
    return this.config.dimensionConfigs[dimId] || this.config.dimensionConfigs["minecraft:overworld"];
  }

  #randomize(radius) { return ((Math.random() * (radius << 1)) | 0) - radius; }

  #isLocationSafe(dimension, loc) {
    try {
      const block = dimension.getBlock(loc);
      const above = dimension.getBlock({ x: loc.x, y: loc.y + 1, z: loc.z });
      const above2 = dimension.getBlock({ x: loc.x, y: loc.y + 2, z: loc.z });
      if (!block?.isSolid || !above || above.isSolid || !above2 || above2.isSolid) return false;
      if (this.config.unsafeBlockIds.includes(block.typeId)) return false;
      return this.config.safeBlockIds.includes(block.typeId);
    } catch { return false; }
  }

  #findSafeLocation(dimension, baseLoc, dimConfig) {
    if (dimension.id === "minecraft:nether") {
      for (let y = dimConfig.minY; y <= dimConfig.maxY; y++) {
        const loc = { x: baseLoc.x, y, z: baseLoc.z };
        if (this.#isLocationSafe(dimension, loc)) return loc;
      }
      return null;
    }
    try {
      const top = dimension.getTopmostBlock(baseLoc);
      if (top && this.#isLocationSafe(dimension, top)) return top;
    } catch {}
    for (let y = dimConfig.maxY; y >= dimConfig.minY; y--) {
      const loc = { x: baseLoc.x, y, z: baseLoc.z };
      if (this.#isLocationSafe(dimension, loc)) return loc;
    }
    return null;
  }

  #generateRandomLocation(dimConfig) {
    return {
      x: this.config.startX + this.#randomize(dimConfig.radius ?? this.config.searchRadius),
      y: dimConfig.maxY,
      z: this.config.startZ + this.#randomize(dimConfig.radius ?? this.config.searchRadius),
    };
  }

  #hasMoved(state, current) {
    if (!state.lastPosition) return false;
    return (
      Math.abs(current.x - state.lastPosition.x) > 0.1 ||
      Math.abs(current.y - state.lastPosition.y) > 0.1 ||
      Math.abs(current.z - state.lastPosition.z) > 0.1
    );
  }

  #cancelRTP(player, reason) {
    const state = this.#getState(player.id);
    const timer = this.#timers.get(player.id);
    if (timer !== undefined) {
      try { system.clearJob(timer); } catch {}
      try { system.clearRun(timer); } catch {}
      this.#timers.delete(player.id);
    }
    if (this.#hasTag(player, "rtp")) { try { player.camera.clear(); } catch {} }
    this.#removeTag(player, "rtp");
    this.#removeTag(player, "rtp_waiting");
    state.lastPosition = null;
    state.searchStart = null;
    state.isWaiting = false;
    state.isSearching = false;
    this.config.onNotify(player, "RTP Cancelado", reason);
  }

  #startWaitingPhase(player, dimension, dimConfig, state) {
    this.#addTag(player, "rtp_waiting");
    state.lastPosition = { ...player.location };
    state.isWaiting = true;
    let elapsed = 0;
    const maxWait = this.config.stillTimeMs;
    this.config.onNotify(player, "Preparando RTP", `Quédate quieto ${maxWait / 1000}s → ${dimConfig.name}`);
    const waitId = system.runInterval(() => {
      if (!this.#isValid(player)) { system.clearRun(waitId); this.#timers.delete(player.id); return; }
      if (this.#hasMoved(state, player.location)) {
        system.clearRun(waitId);
        this.#timers.delete(player.id);
        this.#cancelRTP(player, "movimiento detectado");
        return;
      }
      elapsed += MS_PER_TICK;
      if (elapsed >= maxWait) {
        system.clearRun(waitId);
        this.#timers.delete(player.id);
        this.config.onNotify(player, "Buscando ubicación", `Buscando en ${dimConfig.name}...`);
        this.#startSearchPhase(player, dimension, dimConfig, state);
      }
    }, 1);
    this.#timers.set(player.id, waitId);
  }

  #startSearchPhase(player, dimension, dimConfig, state) {
    this.#removeTag(player, "rtp_waiting");
    this.#addTag(player, "rtp");
    state.searchStart = Date.now();
    state.isSearching = true;
    try { player.camera.setCamera("minecraft:free", { rotation: { x: -90, y: 0 } }); } catch {}
    const self = this;
    let searchTick = 0;
    let searchLoc = self.#generateRandomLocation(dimConfig);
    const searchJob = system.runJob((function* () {
      while (true) {
        if (!self.#isValid(player)) break;
        searchTick++;
        if (searchTick >= self.config.maxSearchTicks) { self.#cancelRTP(player, "no se encontró ubicación segura"); break; }
        if (searchTick % 100 === 0) { searchLoc = self.#generateRandomLocation(dimConfig); }
        const safe = self.#findSafeLocation(dimension, searchLoc, dimConfig);
        if (safe) {
          const searchTime = `${((Date.now() - state.searchStart) / 1000).toFixed(1)}s`;
          self.#completeRTP(player, dimension, safe, dimConfig, searchTime);
          break;
        }
        try { player.teleport(searchLoc, { dimension, checkForBlocks: false }); } catch {}
        yield;
      }
    })());
    self.#timers.set(player.id, searchJob);
  }

  #completeRTP(player, dimension, location, dimConfig, searchTime) {
    const state = this.#getState(player.id);
    try { player.camera.clear(); } catch {}
    const final = { x: location.x + 0.5, y: location.y + 1, z: location.z + 0.5 };
    try { player.teleport(final, { dimension, checkForBlocks: true }); } catch {}
    system.runTimeout(() => {
      if (!this.#isValid(player)) return;
      try {
        dimension.spawnParticle("minecraft:huge_explosion_emitter", { x: final.x, y: final.y - 0.5, z: final.z });
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          dimension.spawnParticle("minecraft:totem_particle", {
            x: final.x + Math.cos(angle) * 2, y: final.y + 1, z: final.z + Math.sin(angle) * 2,
          });
        }
        player.playSound("random.explode", { pitch: 0.8, volume: 0.6 });
      } catch {}
    }, 3);
    this.#removeTag(player, "rtp");
    state.lastCooldown = Date.now();
    state.lastPosition = null;
    state.searchStart = null;
    state.isWaiting = false;
    state.isSearching = false;
    const coords = `${Math.floor(final.x)}, ${Math.floor(final.y)}, ${Math.floor(final.z)}`;
    this.config.onNotify(player, "RTP exitoso", `${coords} · ${dimConfig.name} · ${searchTime}`);
  }

  rtp(player, targetDimension = null) {
    if (!this.#isValid(player)) return false;
    const state = this.#getState(player.id);
    const dim = targetDimension || player.dimension;
    const dimConfig = this.#getDimConfig(dim.id);
    const cooldownLeft = Math.max(0, state.lastCooldown + this.config.cooldownMs - Date.now());
    if (cooldownLeft > 0) { this.config.onNotify(player, "Cooldown", `${Math.ceil(cooldownLeft / 1000)}s restantes`); return false; }
    if (this.#hasTag(player, "rtp") || this.#hasTag(player, "rtp_waiting")) {
      if (this.#timers.has(player.id)) return false;
      this.#cleanup(player.id);
      this.#removeTag(player, "rtp");
      this.#removeTag(player, "rtp_waiting");
    }
    this.#startWaitingPhase(player, dim, dimConfig, state);
    return true;
  }

  cancel(player) { this.#cancelRTP(player, "cancelado manualmente"); }
}
