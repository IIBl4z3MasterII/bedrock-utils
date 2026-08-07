import { world, system } from "@minecraft/server";
import { DEATH_CAUSES, TOOL_REGISTRY, DEATH_MESSAGES, UNKNOWN_ENTITY_MESSAGES, UNKNOWN_DEATH_CAUSE_MESSAGES } from "./data.js";

const CONFIG = {
  CACHE_DURATION: 60000,
  COOLDOWN_DURATION: 1000,
  MESSAGE_HISTORY_DURATION: 3600000,
  CLEANUP_INTERVAL: 300,
  DEBUG: false,
};

const messageCache = new Map();
const messageCooldowns = new Map();
const playerLastMessages = new Map();

const Logger = {
  log: CONFIG.DEBUG ? (msg) => console.warn(`§7[DeathMsg] ${msg}`) : () => {},
  error: (msg, err) => console.error(`§c[DeathMsgError]${msg}${err ? `: ${err.message}` : ""}`),
};

const identifyTool = (itemId) => {
  if (!itemId) return null;
  const cleanId = itemId.replace("minecraft:", "");
  return TOOL_REGISTRY.get(cleanId) || null;
};

const shouldShowDeathMessage = (playerName) => {
  const now = Date.now();
  const lastMessage = messageCooldowns.get(playerName);
  if (lastMessage && now - lastMessage < CONFIG.COOLDOWN_DURATION) return false;
  messageCooldowns.set(playerName, now);
  return true;
};

const getNonRepeatingRandomMessage = (type, subtype = null, weaponType = null, lastMessage = null) => {
  let messages;
  if (type === "pvp") {
    if (subtype === "suicide") messages = DEATH_MESSAGES.pvp.suicide;
    else if (weaponType && DEATH_MESSAGES.pvp.weapon[weaponType]) messages = DEATH_MESSAGES.pvp.weapon[weaponType];
    else messages = DEATH_MESSAGES.pvp.default;
  } else if (type === "mob" && subtype && DEATH_MESSAGES.mob[subtype]) messages = DEATH_MESSAGES.mob[subtype];
  else messages = DEATH_MESSAGES[type] || DEATH_MESSAGES.other;
  if (!Array.isArray(messages)) messages = [messages];
  if (messages.length === 1) return messages[0];
  let availableMessages = lastMessage ? messages.filter((msg) => msg !== lastMessage) : messages;
  if (availableMessages.length === 0) availableMessages = messages;
  return availableMessages[Math.floor(Math.random() * availableMessages.length)];
};

const getPersistedRandomMessage = (playerName, type, subtype = null, weaponType = null) => {
  const deathKey = `${type}_${subtype || "null"}_${weaponType || "null"}`;
  let playerDeaths = playerLastMessages.get(playerName);
  if (!playerDeaths) { playerDeaths = new Map(); playerLastMessages.set(playerName, playerDeaths); }
  const previousDeath = playerDeaths.get(deathKey);
  let message;
  if (type === "mob" && subtype) {
    message = getNonRepeatingRandomMessage("mob", subtype, null, previousDeath?.message);
    if (!message) message = getNonRepeatingRandomMessage("other", null, null, previousDeath?.message);
  } else message = getNonRepeatingRandomMessage(type, subtype, weaponType, previousDeath?.message);
  if (message) playerDeaths.set(deathKey, { message, timestamp: Date.now() });
  return message;
};

const replacePlaceholders = (message, playerName, killerName = null, weapon = null) => {
  return message.replace(/%player%/g, playerName).replace(/%killer%/g, killerName || "").replace(/%weapon%/g, weapon || "");
};

const isKnownEntity = (entityId) => {
  if (!entityId) return false;
  const cleanId = entityId.replace("minecraft:", "");
  return DEATH_MESSAGES.mob.hasOwnProperty(cleanId);
};

const isKnownDeathCause = (cause) => DEATH_CAUSES.has(cause);

const EnhancedLogger = {
  ...Logger,
  logUnknownEntity: (entityId, playerName) => {
    console.warn(`§e[DeathMsg] Unknown entity detected:${entityId}(killed${playerName})`);
    if (CONFIG.DEBUG) console.warn(`§e[DeathMsg] Consider adding messages for:${entityId}`);
  },
  logUnknownCause: (cause, playerName) => {
    console.warn(`§e[DeathMsg] Unknown cause of death:${cause}(player:${playerName})`);
    if (CONFIG.DEBUG) console.warn(`§e[DeathMsg] Consider adding messages for the cause:${cause}`);
  },
};

const getVerifiedMessage = (playerName, type, subtype = null, weaponType = null, entityId = null, deathCause = null) => {
  if (type === "mob" && entityId && !isKnownEntity(entityId)) {
    EnhancedLogger.logUnknownEntity(entityId, playerName);
    return UNKNOWN_ENTITY_MESSAGES[Math.floor(Math.random() * UNKNOWN_ENTITY_MESSAGES.length)];
  }
  if (type !== "pvp" && type !== "mob" && deathCause && !isKnownDeathCause(deathCause)) {
    EnhancedLogger.logUnknownCause(deathCause, playerName);
    return UNKNOWN_DEATH_CAUSE_MESSAGES[Math.floor(Math.random() * UNKNOWN_DEATH_CAUSE_MESSAGES.length)];
  }
  return getPersistedRandomMessage(playerName, type, subtype, weaponType);
};

export const getVerificationStats = () => ({
  ...getStats(),
  knownEntities: Object.keys(DEATH_MESSAGES.mob).length,
  knownCauses: DEATH_CAUSES.size,
  unknownEntityMessages: UNKNOWN_ENTITY_MESSAGES.length,
  unknownCauseMessages: UNKNOWN_DEATH_CAUSE_MESSAGES.length,
});

export const addNewEntity = (entityId, messages) => {
  if (!Array.isArray(messages)) { console.error("Messages must be an array"); return false; }
  DEATH_MESSAGES.mob[entityId.replace("minecraft:", "")] = messages;
  console.warn(`§a[DeathMsg] New entity added:${entityId}`);
  return true;
};

export const addNewDeathCause = (cause, mappedName, messages) => {
  if (!Array.isArray(messages)) { console.error("Messages must be an array"); return false; }
  DEATH_CAUSES.set(cause, mappedName);
  DEATH_MESSAGES[mappedName] = messages;
  console.warn(`§a[DeathMsg] New cause of death added:${cause} -> ${mappedName}`);
  return true;
};

world.afterEvents.entityDie.subscribe((event) => {
  try {
    const entity = event.deadEntity;
    if (entity.typeId !== "minecraft:player") return;
    const playerName = entity.name;
    if (!shouldShowDeathMessage(playerName)) { Logger.log(`Cooldown message for${playerName}`); return; }
    const damageSource = event.damageSource;
    const { damagingEntity } = damageSource;
    let message = "";
    if (damagingEntity?.typeId === "minecraft:player") {
      const killerName = damagingEntity.name;
      const equippable = damagingEntity.getComponent("equippable");
      const currentItem = equippable?.getEquipment("Mainhand");
      const toolInfo = currentItem ? identifyTool(currentItem.typeId) : null;
      if (killerName === playerName) message = replacePlaceholders(getVerifiedMessage(playerName, "pvp", "suicide"), playerName);
      else if (toolInfo) message = replacePlaceholders(getVerifiedMessage(playerName, "pvp", "default", toolInfo.type), playerName, killerName, `${toolInfo.material} ${toolInfo.type}`);
      else message = replacePlaceholders(getVerifiedMessage(playerName, "pvp", "default"), playerName, killerName);
    } else if (damagingEntity) {
      message = replacePlaceholders(getVerifiedMessage(playerName, "mob", damagingEntity.typeId.replace("minecraft:", ""), null, damagingEntity.typeId), playerName);
    } else {
      const deathCause = damageSource.cause;
      const deathType = DEATH_CAUSES.get(deathCause) || "unknown";
      if (deathType === "unknown") message = replacePlaceholders(getVerifiedMessage(playerName, "environmental", null, null, null, deathCause), playerName);
      else message = replacePlaceholders(getVerifiedMessage(playerName, deathType), playerName);
    }
    if (!message) { Logger.log("Using final backup message"); message = `§c${playerName}found a very creative way to die`; }
    world.sendMessage(message);
    Logger.log(`Message sent to${playerName}: ${message}`);
  } catch (error) {
    Logger.error("Death event error", error);
    if (event.deadEntity?.name) world.sendMessage(`§c${event.deadEntity.name}has died mysteriously`);
  }
});

system.runInterval(() => {
  const now = Date.now();
  for (const [key, value] of messageCache.entries()) { if (now - value.timestamp > CONFIG.CACHE_DURATION) messageCache.delete(key); }
  for (const [player, timestamp] of messageCooldowns.entries()) { if (now - timestamp > CONFIG.COOLDOWN_DURATION) messageCooldowns.delete(player); }
  for (const [player, deaths] of playerLastMessages.entries()) {
    for (const [deathType, data] of deaths.entries()) { if (now - data.timestamp > CONFIG.MESSAGE_HISTORY_DURATION) deaths.delete(deathType); }
    if (deaths.size === 0) playerLastMessages.delete(player);
  }
}, CONFIG.CLEANUP_INTERVAL);

const getStats = () => ({
  totalPlayers: playerLastMessages.size,
  activeCooldowns: messageCooldowns.size,
  cacheSize: messageCache.size,
  totalDeathTypes: Object.keys(DEATH_MESSAGES).length,
  totalMobTypes: Object.keys(DEATH_MESSAGES.mob).length,
});

export const clearCache = () => { messageCache.clear(); messageCooldowns.clear(); playerLastMessages.clear(); Logger.log("Manually cleared cache"); };

if (CONFIG.DEBUG) {
  globalThis.deathMessages = { ...globalThis.deathMessages, getVerificationStats, addNewEntity, addNewDeathCause, isKnownEntity, isKnownDeathCause, EnhancedLogger };
}
