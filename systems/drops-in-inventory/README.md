# 🎒 Drops In Inventory

System that intercepts drops when breaking blocks and transfers them
directly to the player's inventory, with overflow persistence via
`VaultDB` (a proprietary lightweight database on Dynamic Properties).

---

## Files

| Archive | Role |
|---|---|
| `index.js` | Core logic — records broken blocks, intercepts drops, manages inventory |
| `vault-db.js` | Clase `VaultDB` — mini key-value database on Dynamic Properties, with cache, save queue and validations |

---

## General purpose

Eliminates the "bend down to pick up the item from the ground" step: when a
player breaks a block, the drop goes directly to his inventory. If he
inventory is full, the item is saved in `VaultDB` (namespace
`"overflow"`) and is delivered automatically upon reconnection.

---

## How to activate

```js
import "./systems/drops-in-inventory/index.js";
// Self-registers — no explicit initialization required.
```

---

## Internal flow

```
playerBreakBlock → BlockBreakRegistry.register(block, player)
        │
entitySpawn (item entity) → ItemCollector detecta el drop
        ├── BlockBreakRegistry.findPlayer(location)   ← nearest player within the TTL
        ├── InventoryManager.addItem(player, item)
        │       ├── hay espacio → da el item directo, despawnea la entidad
        │       └── inventario lleno → overflowDB.set(...) (VaultDB)
        └── playerSpawn → entrega el overflow pendiente al reconectarse
```

---

## Internal classes of `index.js`

### `BlockBreakRegistry`

Record which player broke each block, with a TTL for matching
the resulting drop with the correct player.

| Method | Description |
|---|---|
| `register(block, player)` | Store `{ player, timestamp }` under the `x,y,z` key of the block; self-cleans after `ttlTicks` (default `40`, ~2s) |
| `findPlayer(location,maxDistance?, maxAgeMs?)` | Returns the closest registered player within `maxDistance` (default `2`) y `maxAgeMs` (default `2000`) |

### `InventoryManager`

| Method | Description |
|---|---|
| `addItem(player,itemStack)` | Returns the item with correct stacking logic (fills existing partial stacks before using empty slots); `false` if nothing entered |
| `clamp(amount)` | Normalize quantities out of range (`≤0 → 1`, `≥256 → 255`) |

### `ItemCollector`

Listen for the spawn of `item` type entities, use `BlockBreakRegistry` for
know whose it is, and use `InventoryManager` to give it to him (or send it to
overflow if it does not enter).

---

## `vault-db.js` — clase `VaultDB`

Key-value database on Dynamic Properties, specifically designed
to save **arrays of `ItemStack`** (serialization `typeId`, `amount`,
`nameTag`, `keepOnDeath`, lore and enchantments), although it also accepts
other serializable values.

### Why isn't it just direct `set`/`get` over Dynamic Properties

- **Asynchronous save queue**: `set()` do not write the Dynamic
Property instantly — they are queued and persisted one at a time.saveRate` keys
per tick, so as not to saturate a tick with massive drops.
- **In-memory cache** with maximum size (`cacheSize`) — readings
Repeated actions do not touch Dynamic Properties again.
- **Must wait for `world.afterEvents.worldLoad`** before accepting
operations — using `set`/`get` before ready throws `Error`.
- **Warns if the world closes with unsaved data** (pending queue
when doing shutdown → `console.error`).

### Constructor

```js
new VaultDB(namespace = "", cacheSize = 50, saveRate = 1)
```

| Parameter | Description |
|---|---|
| `namespace` | Key prefix in Dynamic Properties (`A-Za-z0-9_` only) |
| `cacheSize` | Maximum entries cached in memory before discarding the oldest ones |
| `saveRate` | Keys saved per tick from pending queue — `>1` generates possible lag warning |

### Public API

| Method | Description |
|---|---|
| `onReady(callback)` | Called when the instance can already be used (post `worldLoad`) |
| `set(key, value)` | Save (enqueue); validates key name and length (`≤30` chars), and that an array does not exceed `1024` items |
| `get(key)` | Read (cache first, then Dynamic Property); throws `Error` if called before `onReady` |
| `has(key)` | `boolean` |
| `delete(key)` | Delete; throws `Error` if the key does not exist |
| `keys()` | All keys under the namespace |
| `values()` | All values ​​under the namespace |
| `clear()` | Delete all namespace keys |
| `logs` | Public object `{ save, load, set, get, has, delete, clear, keys, values ​​}` — set to `false` the one you do not want to log into the console |

```js
import { VaultDB } from "./systems/drops-in-inventory/vault-db.js";

const db = new VaultDB("myNamespace", 100, 1);

db.onReady(() => {
    db.set("player123", [{ t: "minecraft:diamond", a: 5 }]);
    console.log(db.get("player123"));
});
```

---

## Events used

| Event | When |
|---|---|
| `world.beforeEvents.playerBreakBlock` | Record which player broke which block |
| `world.afterEvents.entitySpawn` | Intercepts the resulting drop (type `item`) |
| `world.afterEvents.playerSpawn` | Delivers pending overflow upon reconnection |

---

## Performance considerations

- TTL the 40 ticks and `BlockBreakRegistry` — with high server lag,
consider increasing it so as not to lose the block↔player pairing.
-`VaultDB` with `saveRate: 1` (the default in `overflowDB`) is the option
safer against lag — just upload `saveRate'if you really need
Save faster and without problems.
- Every `set()` in `VaultDB` is asynchronous (saved to a later tick)
— do not assume that the data is already in Dynamic Properties right after
call `set()`, although `get()` will return it correctly
thanks to the cache.

---

## Possible improvements

- Support for mob drops (currently only intercepts mob drops).
broken blocks).
- Notify the player when an item is going to overflow, not just the
deliver it back.
- UI to view and recover overflow manually without waiting for
  reconectarse.

---

<sub>Drops In Inventory por **IIBl4z3MasterII**</sub>
