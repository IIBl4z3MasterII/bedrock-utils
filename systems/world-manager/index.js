import { world, system } from "@minecraft/server";
import { logger } from "./logger.js";

class DynamicStore {
  #target;
  #ns;
  #cache;
  #useCache;

  constructor(target, namespace, useCache = true) {
    this.#target = target;
    this.#ns = namespace;
    this.#useCache = useCache;
    this.#cache = useCache ? new Map() : null;
  }

  #key(name) { return this.#ns ? `${this.#ns}_${name}` : name; }

  #parse(raw) {
    if (typeof raw !== "string") return raw;
    if (raw.startsWith("[") || raw.startsWith("{")) { try { return JSON.parse(raw); } catch { return raw; } }
    if (raw === "true") return true;
    if (raw === "false") return false;
    const n = Number(raw);
    if (!isNaN(n) && raw !== "" && Number.isSafeInteger(n) && String(n) === raw) return n;
    return raw;
  }

  get(name, defaultValue = undefined) {
    const key = this.#key(name);
    if (this.#useCache && this.#cache.has(key)) return this.#cache.get(key);
    try {
      const raw = this.#target.getDynamicProperty(key);
      if (raw === undefined) return defaultValue;
      const val = this.#parse(raw);
      if (this.#useCache) this.#cache.set(key, val);
      return val;
    } catch { return defaultValue; }
  }

  set(name, value) {
    const key = this.#key(name);
    const stored = typeof value === "object" && value !== null ? JSON.stringify(value) : typeof value === "boolean" ? value : value;
    try { this.#target.setDynamicProperty(key, stored); } catch (error) { this.log(`Error setting dynamic property${key}: ${error}`, true); }
    if (this.#useCache) this.#cache.set(key, value);
  }

  has(name) { return this.get(name) !== undefined; }

  delete(name) {
    const key = this.#key(name);
    const meta = this.get(name);
    if (typeof meta === "number" && meta > 0 && this.#target.getDynamicProperty(`${key}_chunk0`) !== undefined) {
      for (let i = 0; i < meta; i++) {
        const chunkKey = this.#key(`${name}_chunk${i}`);
        try { this.#target.setDynamicProperty(chunkKey, undefined); } catch (error) { this.log(`Error clearing chunk${chunkKey}: ${error}`, true); }
        if (this.#useCache) this.#cache.delete(chunkKey);
      }
    }
    try { this.#target.setDynamicProperty(key, undefined); } catch (error) { this.log(`Error deleting dynamic property${key}: ${error}`, true); }
    if (this.#useCache) this.#cache.delete(key);
  }

  keys() {
    if (!this.#ns) throw new Error("keys() requires a non-empty namespace");
    const prefix = `${this.#ns}_`;
    if (typeof this.#target.getDynamicPropertyIds !== "function") return [];
    return this.#target.getDynamicPropertyIds().filter(id => id.startsWith(prefix)).map(id => id.slice(prefix.length));
  }

  setLarge(name, value, chunkSize = 8000) {
    const str = typeof value === "object" ? JSON.stringify(value) : String(value);
    if (str.length <= chunkSize) { this.set(name, str); return; }
    const numChunks = Math.ceil(str.length / chunkSize);
    this.set(name, numChunks);
    for (let i = 0; i < numChunks; i++) this.set(`${name}_chunk${i}`, str.slice(i * chunkSize, (i + 1) * chunkSize));
  }

  getLarge(name, defaultValue = undefined) {
    const meta = this.get(name);
    if (meta === undefined) return defaultValue;
    if (typeof meta === "string") { try { return JSON.parse(meta); } catch { return meta; } }
    if (typeof meta === "number" && meta > 0) {
      let result = "";
      for (let i = 0; i < meta; i++) result += this.get(`${name}_chunk${i}`, "");
      try { return JSON.parse(result); } catch { return result; }
    }
    return meta;
  }

  deleteLarge(name) {
    const meta = this.get(name);
    this.delete(name);
    if (typeof meta === "number" && meta > 0) { for (let i = 0; i < meta; i++) this.delete(`${name}_chunk${i}`); }
  }

  invalidateCache(name) {
    if (!this.#useCache) return;
    if (name !== undefined) this.#cache.delete(this.#key(name));
    else this.#cache.clear();
  }
}

class WorldManager {
  constructor() {
    this.worldLoaded = false;
    this.initFunctions = [];
    this.debugMode = false;
    this.#stores = new Map();
    this.#readyQueue = [];
    this.#initRan = false;
    this.#legacyDefaults = new Map();
    this.#legacyCache = new Map();

    const runInit = () => {
      if (this.worldLoaded || this.#initRan) return;
      this.worldLoaded = true;
      this.#initRan = true;
      this.log("World loaded successfully! Initializing systems...");
      this.#initLegacyDefaults();
      this.runInitFunctions();
      for (const cb of this.#readyQueue) { try { cb(); } catch (error) { this.log(`Error inonReadycallback:${error}`, true); } }
      this.#readyQueue.length = 0;
    };

    world.afterEvents.worldLoad.subscribe(runInit);
    system.run(() => { if (!this.worldLoaded) runInit(); });
  }

  store(namespace) {
    if (!this.#stores.has(namespace)) this.#stores.set(namespace, new DynamicStore(world, namespace, true));
    return this.#stores.get(namespace);
  }

  entityStore(entity, namespace) { return new DynamicStore(entity, namespace, false); }

  rawScan(predicate) { return world.getDynamicPropertyIds().filter(predicate); }
  rawGet(id) { return world.getDynamicProperty(id); }
  rawDelete(id) { world.setDynamicProperty(id, undefined); }

  onReady(callback) { if (this.worldLoaded) callback(); else this.#readyQueue.push(callback); }

  registerInitFunction(func, message) {
    if (this.worldLoaded) { try { func(); if (message && this.debugMode) this.log(message); } catch (error) { this.log(`Error in init function:${error}`, true); } return; }
    this.initFunctions.push(func);
  }

  runInitFunctions() {
    for (const fn of this.initFunctions) {
      if (fn.__wmRan) continue;
      try { fn(); fn.__wmRan = true; } catch (error) { this.log(`Error running init:${error}`, true); }
    }
    this.log("All systems initialized successfully");
  }

  isWorldLoaded() { return this.worldLoaded; }
  setDebugMode(enabled) { this.debugMode = enabled; }

  log(message, isError = false) { if (isError) logger.error("WorldManager", message); else if (this.debugMode) logger.debug("WorldManager", message); }

  #stores;
  #readyQueue;
  #initRan;
  #legacyDefaults;
  #legacyCache;

  #initLegacyDefaults() {
    this.#legacyDefaults.forEach((defaultValue, propertyName) => {
      try {
        if (world.getDynamicProperty(propertyName) === undefined) {
          world.setDynamicProperty(propertyName, typeof defaultValue === "object" ? JSON.stringify(defaultValue) : String(defaultValue));
        }
      } catch (error) { this.log(`Error init legacy prop${propertyName}: ${error}`, true); }
    });
  }

  registerProperty(propertyName, defaultValue, namespace = "") {
    const fullName = namespace ? `${namespace}_${propertyName}` : propertyName;
    this.#legacyDefaults.set(fullName, defaultValue);
    if (this.worldLoaded) {
      try {
        if (world.getDynamicProperty(fullName) === undefined) {
          world.setDynamicProperty(fullName, typeof defaultValue === "object" ? JSON.stringify(defaultValue) : String(defaultValue));
        }
      } catch (error) { this.log(`Error init prop${fullName}: ${error}`, true); }
    }
  }

  getProperty(propertyName, namespace = "") {
    const fullName = namespace ? `${namespace}_${propertyName}` : propertyName;
    const cached = this.#legacyCache.get(fullName);
    if (cached !== undefined) return cached;
    const raw = world.getDynamicProperty(fullName);
    if (raw === undefined) return this.#legacyDefaults.get(fullName);
    let parsed;
    if (typeof raw !== "string") parsed = raw;
    else if (raw.startsWith("[") || raw.startsWith("{")) { try { parsed = JSON.parse(raw); } catch { parsed = raw; } }
    else if (raw === "true") parsed = true;
    else if (raw === "false") parsed = false;
    else { const n = Number(raw); parsed = !isNaN(n) && raw !== "" && Number.isSafeInteger(n) && String(n) === raw ? n : raw; }
    this.#legacyCache.set(fullName, parsed);
    return parsed;
  }

  setProperty(propertyName, value, namespace = "") {
    if (!this.isWorldLoaded()) { this.log("World not loaded, cannot set property.", true); return false; }
    try {
      const fullName = namespace ? `${namespace}_${propertyName}` : propertyName;
      const toStore = typeof value === "object" && value !== null ? JSON.stringify(value) : typeof value === "boolean" ? value : String(value);
      world.setDynamicProperty(fullName, toStore);
      this.#legacyCache.delete(fullName);
      return true;
    } catch (error) { this.log(`Error setting${propertyName}: ${error}`, true); return false; }
  }
}

const worldManager = new WorldManager();
export default worldManager;
export const onWorldReady = (cb) => worldManager.onReady(cb);
