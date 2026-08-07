#🐾MobStacker

Visual Hostile Mob Stacker: Group nearby mobs of the same type
each other in a single "stack" (nametag with count `x{n}`), saving the
stack size as a dynamic property on the entity that remains visible.
Doesn't kill/fuse life like before — now removes excess and leaves
a single entity representing the group.

> ⚠️ The mission system (`mission-system.js`) that used to live here
> **was removed** in this update. `systems/index.js` no longer
> export `missionSystem` — export `MobStackerManager` and the instance
> `mobStackerManager`.

---

## Archive

| Archive | Role |
|---|---|
| `index.js` | Class `MobStackerManager` + self-initialized instance `mobStackerManager` |

---

## How to activate

```js
import "./systems/mob-stacker/index.js";
// Al importarse, corre system.run(() => mobStackerManager.initialize())
// — se autoregistra, no hace falta llamar nada.
```

To control it in runtime:

```js
import { mobStackerManager } from "./systems/index.js";

mobStackerManager.toggleSystem();   // activa/desactiva (persistido en dynamic property del mundo)
mobStackerManager.getStats();       // { enabled, maxStackSize, supportedMobs, updateInterval }
mobStackerManager.shutdown();       // detiene el runInterval interno
```

---

##Stackable Mob Categories

```js
const HOSTILE_MOBS = {
  UNDEAD:     ["zombie", "husk", "drowned", "skeleton", "stray", "wither_skeleton", "zombie_pigman", "zoglin"],
  ARTHROPODS: ["spider", "cave_spider", "silverfish", "endermite"],
  ILLAGERS:   ["pillager", "vindicator", "ravager", "vex"],
  NETHER:     ["blaze", "magma_cube", "piglin", "piglin_brute", "hoglin"],
  OVERWORLD:  ["creeper", "slime", "witch"],
  BOSS:       ["warden"],
};
```

> Note: `zombified_piglin` became `zombie_pigman`, and `breeze` was
> replaced by `creeper` + `slime` in `OVERWORLD` regarding the
> previous version.

---

## Config

```js
const MOB_STACKER_CONFIG = {
  MAX_STACK_SIZE: 50,
  NAME_TAG_FORMAT: "§c[ §7x{count} {name} §c]\n§a{health}§7/§a{maxHealth}",
  CUSTOM_NAME_FORMAT: "§6{name}\n§a{health}§7/§a{maxHealth}",
  STACK_RADIUS: 5,
  UPDATE_INTERVAL: 15,
  ENABLE_LOGS: false,
};
```

`CUSTOM_NAME_FORMAT` is new: used for mobs that already had a
`nameTag` own (put by another named system/spawn egg) and not
They are part of a stack — they keep their name but with added life
to the format.

---

## Public API

| Method | Description |
|---|---|
| `initialize()` | Starts listeners if `isEnabled()`; no-op if already initialized |
| `toggleSystem()` | Inverts the enabled flag (dynamic property of the world `mobstacker_enabled`) and returns it |
| `isEnabled()` / `setEnabled(value)` | Read/write that flag |
| `getStats()` | `{ enabled,maxStackSize, supportedMobs, updateInterval}` |
| `shutdown()` | Cancel the `runInterval` internal and reset `_initialized` |

---

## Internal flow

```
system.runInterval (every UPDATE_INTERVAL ticks)
  └── updateStacks()
        ├── gets "monster"/"undead" family entities from the overworld
        ├── filters by this.mobTypes (union of HOSTILE_MOBS)
        ├── groups by typeId, and within each type by processEntities()
        │     ├── separateEntities(): distinguishes mobs with a custom name
        │     │     (customNamedEntities) from stackable mobs (stackableEntities)
        │     ├── checkForNamedStacks(): re-applies the nametag if a mob with
        │     │     stack_size > 1 lost its stack formatting
        │     └── groupEntitiesByLocation() + mergeStack() for each
        │           nearby group (bucketed by STACK_RADIUS)

entityHurt (stackable mob)
  └── handleEntityHurt(): subtracts damage manually via EntityHealthComponent,
        updates the nametag, and if currentHealth reaches 0 → handleEntityDeath()

handleEntityDeath(deadEntity)
  ├── if stack_size > 1 → spawnRemainingStack() creates a replacement with
  │     stack_size - 1 at the same position/rotation
  └── kills the original entity (nameTag "§c[ §7DEAD §c]" + kill())

explosion (stacked creeper)
  └── handleCreeperExplosion(): if the exploding creeper had
        stack_size > 1, respawns a new one with stack_size - 1 after 5 ticks
```

---

## Persistence per entity (dynamic properties, prefix `mobstacker_`)

| Key | Description |
|---|---|
| `stack_size` | Number of mobs represented by this entity |
| `current_health`/`max_health` | Life Snapshot used when recalculating nametag |
| `custom_named` | `true` if the entity had a `nameTag` own before being detected (not treated as stack) |

Global flag in the world: `mobstacker_enabled` (controlled by
`isEnabled()`/`setEnabled()`/`toggleSystem()`).

---

## Differences vs. the previous version

- **` was removedMissionSystem` by complete** ( `mission-system.js` already
does not exist in this module) — the stacker no longer notifies kills to anyone
mission system.
- Damage is now manually subtracted from `handleEntityHurt` (does not depend
of the actual damage applied by the game to the next tick).
- Replaces the previous HP-summed-and-visual-scale handling with
pure counting (`stack_size`) + removal of excess entities.
- Adds explicit handling of creepers that explode while stacked
  (`handleCreeperExplosion`), non-existent before.
- All state lives in dynamic properties (persists if the chunk is
download/reload), not in `Map`s in memory as before.
-`bossStackMap`/`stackVisuals` (dead code from previous version)
They no longer exist.

---

## Possible improvements

- Currently only scans `world.getDimension("overworld")` and
  `updateStacks()` — stackable mobs in Nether/End do not group.
- No replacement for the removed quest system; yes your addon
depended on `missionSystem`/`trackKill`, we have to reimplement it
separate or restore `mission-system.js` from a previous version.

---

<sub>MobStackerby **IIBl4z3MasterII**</sub>
