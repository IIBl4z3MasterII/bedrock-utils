/* 

██████╗ ██╗██╗  ██╗███████╗██████╗     ███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗ 
██╔══██╗██║██║  ██║╚══███╔╝╚════██╗    ████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗
██████╔╝██║███████║  ███╔╝  █████╔╝    ██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝
██╔══██╗██║╚════██║ ███╔╝   ╚═══██╗    ██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗
██████╔╝███████╗██║███████╗██████╔╝    ██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║
╚═════╝ ╚══════╝╚═╝╚══════╝╚═════╝     ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
                                                                                           
                          QIDB •  By: @bl4z3master 
( Original file from @carchi77 "https://discord.com/channels/523663022053392405/1252014916496527380" )
*/
// Made by Carchi77, refactored and optimized by IIBl4z3MasterII

import { world, system, ItemStack } from "@minecraft/server";

const _date = () => {
  const d = new Date();
  const ms = d.getMilliseconds().toString().padStart(3, "0");
  return d.toLocaleString().replace(/(AM|PM)/, `.${ms} $1`);
};

const MAX_ITEMS = 1024;
const MAX_KEY_LENGTH = 30;
const VALID_NAME = /^[A-Za-z0-9_]*$/;

function serializeItem(item) {
  if (!item) return null;
  const obj = { t: item.typeId, a: item.amount };
  if (item.nameTag !== undefined) obj.n = item.nameTag;
  if (item.keepOnDeath !== undefined) obj.k = item.keepOnDeath;
  const lore = item.getLore();
  if (lore.length > 0) obj.l = lore;
  const enchComp = item.getComponent("enchantable");
  if (enchComp) {
    const enchs = enchComp.getEnchantments();
    if (enchs.length > 0)
      obj.e = enchs.map((e) => ({ id: e.type.id, lvl: e.level }));
  }
  const durComp = item.getComponent("durability");
  if (durComp) obj.d = durComp.damage;
  return obj;
}

function deserializeItem(obj) {
  if (!obj) return undefined;
  const item = new ItemStack(obj.t, obj.a ?? 1);
  if (obj.n !== undefined) item.nameTag = obj.n;
  if (obj.k !== undefined) item.keepOnDeath = obj.k;
  if (obj.l) item.setLore(obj.l);
  if (obj.e) {
    const enchComp = item.getComponent("enchantable");
    if (enchComp)
      obj.e.forEach(({ id, lvl }) => {
        try { enchComp.addEnchantment({ type: { id }, level: lvl }); } catch {}
      });
  }
  if (obj.d !== undefined) {
    const durComp = item.getComponent("durability");
    if (durComp) durComp.damage = obj.d;
  }
  return item;
}

const CHUNK_SIZE = 30000;

function dpWrite(fk, value) {
  if (value === undefined || value === null) {
    dpDelete(fk);
    return;
  }
  const isArray = Array.isArray(value);
  const items = isArray ? value : [value];
  const serialized = JSON.stringify(items.map(serializeItem));

  const chunks = [];
  for (let i = 0; i < serialized.length; i += CHUNK_SIZE)
    chunks.push(serialized.slice(i, i + CHUNK_SIZE));

  world.setDynamicProperty(`${fk}__n`, chunks.length);
  world.setDynamicProperty(`${fk}__arr`, isArray);
  chunks.forEach((chunk, i) =>
    world.setDynamicProperty(i === 0 ? fk : `${fk}__${i}`, chunk)
  );

  let extra = chunks.length;
  while (world.getDynamicProperty(`${fk}__${extra}`) !== undefined) {
    world.setDynamicProperty(`${fk}__${extra}`, undefined);
    extra++;
  }
}

function dpRead(fk) {
  const countProp = world.getDynamicProperty(`${fk}__n`);
  if (countProp === undefined || countProp === null) return undefined;

  const n = typeof countProp === "number" ? countProp : 1;
  let serialized = "";
  for (let i = 0; i < n; i++) {
    const chunk = world.getDynamicProperty(i === 0 ? fk : `${fk}__${i}`);
    if (typeof chunk !== "string") return undefined;
    serialized += chunk;
  }

  try {
    const rawArr = JSON.parse(serialized);
    const items = rawArr.map(deserializeItem);
    const isArray = world.getDynamicProperty(`${fk}__arr`);
    return isArray ? items : items[0];
  } catch {
    return undefined;
  }
}

function dpExists(fk) {
  return world.getDynamicProperty(`${fk}__n`) !== undefined;
}

function dpDelete(fk) {
  const countProp = world.getDynamicProperty(`${fk}__n`);
  const n = typeof countProp === "number" ? countProp : 0;
  for (let i = 0; i < n; i++)
    world.setDynamicProperty(i === 0 ? fk : `${fk}__${i}`, undefined);
  world.setDynamicProperty(`${fk}__n`, undefined);
  world.setDynamicProperty(`${fk}__arr`, undefined);
}

export class VaultDB {
  constructor(namespace = "", cacheSize = 50, saveRate = 1) {
    if (!VALID_NAME.test(namespace))
      throw new Error(
        `§cVaultDB > "${namespace}" namespace inválido. Chars: A-Z a-z 0-9 _ §r${_date()}`
      );

    this.#settings = { namespace, cacheSize, saveRate };
    this.#cache = new Map();
    this.#queue = new Map();

    const init = () => {
      this.#setupSaveLoop();
      this.#setupShutdown();

      const { namespace, saveRate } = this.#settings;
      if (saveRate > 1) {
        const warn = `§c§lWARNING!\n§r§cVaultDB > saveRate > 1 puede causar lag. namespace: <${namespace}> §r${_date()}`;
        console.warn(warn);
        world.getPlayers().forEach((p) => p.isOp() && p.sendMessage(warn));
      }

      console.log(`§aVaultDB > initialized. namespace: ${namespace} §r${_date()}`);
      this.#setReady();
    };

    const sub = world.afterEvents.worldLoad.subscribe(() => {
      world.afterEvents.worldLoad.unsubscribe(sub);
      init();
    });
  }

  #ready = false;
  #readyCbs = [];

  onReady(cb) {
    this.#ready ? cb() : this.#readyCbs.push(cb);
  }

  #setReady() {
    this.#ready = true;
    this.#readyCbs.forEach((cb) => cb());
    this.#readyCbs = [];
  }

  #setupSaveLoop() {
    const { cacheSize, saveRate } = this.#settings;
    let saving = false;
    let logId;
    let lastSize;

    system.runInterval(() => {
      const overflow = this.#cache.size - cacheSize;
      if (overflow > 0) {
        const iter = this.#cache.keys();
        for (let i = 0; i < overflow; i++)
          this.#cache.delete(iter.next().value);
      }

      if (this.#queue.size === 0) {
        if (logId !== undefined) {
          system.clearRun(logId);
          logId = undefined;
          if (saving && this.logs.save)
            console.log(
              `§aVaultDB > Guardado completo. Puedes cerrar el mundo. §r${_date()}`
            );
          saving = false;
        }
        return;
      }

      saving = true;
      if (logId === undefined) {
        this.#logSave(lastSize);
        logId = system.runInterval(() => this.#logSave(lastSize), 120);
      }

      const iter = this.#queue.entries();
      const count = Math.min(saveRate, this.#queue.size);
      for (let i = 0; i < count; i++) {
        const { value: entry } = iter.next();
        if (!entry) break;
        const [key, val] = entry;
        dpWrite(key, val);
        this.#queue.delete(key);
      }

      lastSize = this.#queue.size;
      if (this.logs.save) this.#logSave(lastSize);
    }, 1);
  }

  #logSave(lastSize) {
    if (!this.logs.save) return;
    const speed =
      lastSize !== undefined
        ? (-(this.#queue.size - lastSize) / 6).toFixed(0)
        : "//";
    console.log(
      `§eVaultDB > Guardando...\n§r[Stats] Pendientes: ${
        this.#queue.size
      } | Velocidad: ${speed} keys/s §r${_date()}`
    );
  }

  #setupShutdown() {
    system.beforeEvents.shutdown.subscribe(() => {
      if (this.#queue.size > 0)
        console.error(
          `\n\n§c§lVaultDB > ERROR FATAL§r§c > Mundo cerrado con datos sin guardar!\n` +
            `Namespace: ${this.#settings.namespace} | Keys perdidas: ${
              this.#queue.size
            } §r${_date()}\n\n`
        );
    });
  }

  logs = {
    save: true,
    load: true,
    set: true,
    get: true,
    has: true,
    delete: true,
    clear: true,
    keys: true,
    values: true,
  };

  #settings;
  #cache;
  #queue;

  #assertReady() {
    if (!this.#ready)
      throw new Error(
        `§cVaultDB > [${this.#settings.namespace}] Aún no está listo. §r${_date()}`
      );
  }

  set(key, value) {
    if (!VALID_NAME.test(key))
      throw new Error(`§cVaultDB > Key inválida: <${key}>. §r${_date()}`);
    if (key.length > MAX_KEY_LENGTH)
      throw new Error(
        `§cVaultDB > Key <${key}> supera ${MAX_KEY_LENGTH} caracteres. §r${_date()}`
      );
    this.#assertReady();

    const t = Date.now();
    const fk = `${this.#settings.namespace}:${key}`;

    if (Array.isArray(value) && value.length > MAX_ITEMS)
      throw new Error(`§cVaultDB > Máximo ${MAX_ITEMS} ItemStacks. §r${_date()}`);

    this.#cache.set(fk, value);
    this.#queue.set(fk, value);

    if (this.logs.set)
      console.log(`§aVaultDB > Set <${fk}> ${Date.now() - t}ms §r${_date()}`);
  }

  get(key) {
    if (!VALID_NAME.test(key))
      throw new Error(`§cVaultDB > Key inválida: <${key}>. §r${_date()}`);
    this.#assertReady();

    const t = Date.now();
    const fk = `${this.#settings.namespace}:${key}`;

    if (this.#cache.has(fk)) {
      if (this.logs.get)
        console.log(`§aVaultDB > Got <${fk}> (cache) ${Date.now() - t}ms §r${_date()}`);
      return this.#cache.get(fk);
    }

    if (!dpExists(fk)) {
      if (this.logs.get)
        console.log(`§eVaultDB > Key <${fk}> no existe. §r${_date()}`);
      return undefined;
    }

    const result = dpRead(fk);
    this.#cache.set(fk, result);

    if (this.logs.get)
      console.log(`§aVaultDB > Got <${fk}> ${Date.now() - t}ms §r${_date()}`);
    return result;
  }

  has(key) {
    if (!VALID_NAME.test(key))
      throw new Error(`§cVaultDB > Key inválida: <${key}>. §r${_date()}`);
    const fk = `${this.#settings.namespace}:${key}`;
    const exists = this.#cache.has(fk) || dpExists(fk);
    if (this.logs.has)
      console.log(`§aVaultDB > has <${fk}>: ${exists} §r${_date()}`);
    return exists;
  }

  delete(key) {
    if (!VALID_NAME.test(key))
      throw new Error(`§cVaultDB > Key inválida: <${key}>. §r${_date()}`);
    const fk = `${this.#settings.namespace}:${key}`;
    if (!dpExists(fk))
      throw new Error(`§cVaultDB > Key <${fk}> no existe. §r${_date()}`);
    this.#cache.delete(fk);
    this.#queue.delete(fk);
    dpDelete(fk);
    if (this.logs.delete)
      console.log(`§aVaultDB > Deleted <${fk}> §r${_date()}`);
  }

  keys() {
    const prefix = `${this.#settings.namespace}:`;
    const ids = world
      .getDynamicPropertyIds()
      .filter((id) => id.startsWith(prefix) && !id.includes("__"))
      .map((id) => id.slice(prefix.length));
    if (this.logs.keys)
      console.log(`§aVaultDB > ${ids.length} keys. §r${_date()}`);
    return ids;
  }

  values() {
    const t = Date.now();
    const vals = this.keys().map((k) => this.get(k));
    if (this.logs.values)
      console.log(`§aVaultDB > ${vals.length} values. ${Date.now() - t}ms §r${_date()}`);
    return vals;
  }

  clear() {
    const t = Date.now();
    const ks = this.keys();
    ks.forEach((k) => this.delete(k));
    if (this.logs.clear)
      console.log(`§aVaultDB > Cleared ${ks.length} keys. ${Date.now() - t}ms §r${_date()}`);
  }
}
