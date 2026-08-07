# 💀 Death Custom Msg

Personalized death message system with anti-spam, cache and
support for multiple causes of death, weapons, and entities — plus an API
to add new entries hot without touching the core code.

---

## Files

| Archive | Role |
|---|---|
| `index.js` | Main logic — listen for kills, arm and send the message |
| `data.js` | Pure data — causes, weapons and message texts. Without logic |

---

## General purpose

Replace generic Minecraft death messages with messages
personalized according to the cause (PvP, mob, environment, suicide), the weapon
used and the entity involved. Includes cooldown per player and
anti-replay to not show the same message twice in a row.

---

## How to activate

```js
import "./systems/death-custom-msg/index.js";
// Self-registers on import — no need to call any function.
```

---

## data.js — source of truth

Just export constants, no logic:

| Export | Type | Description |
|---|---|---|
| `DEATH_CAUSES` | `Map<string, string>` | `damageCause` native → internal readable category |
| `TOOL_REGISTRY` | `Map<string, string>` | `typeId` weapon → name to display in the message |
| `DEATH_MESSAGES` | `object` | Posts by category/mob (arrays, for variety — choose one at random) |
| `UNKNOWN_ENTITY_MESSAGES` | `string[]` | Fallback when entity is not registered |
| `UNKNOWN_DEATH_CAUSE_MESSAGES` | `string[]` | Fallback when cause is not registered |

### Extend by adding direct data

```js
// data.js
DEATH_CAUSES.set("my_custom_cause", "custom_burned");

export const DEATH_MESSAGES = {
  // ...existing
  custom_burned: [
    "§c%victim% melted in custom lava.",
    "§c%victim% was not custom fireproof.",
  ],
};
```

---

## index.js — Public API

In addition to self-registration in `entityDie`, exposes functions for
inspect and extend the system at runtime (useful from a
admin command or a staff panel):

| Function | Parameters | Description |
|---|---|---|
| `getVerificationStats()` | — | Returns statistics: known entities/causes, number of fallback messages, plus cache stats (`getStats()`) |
| `addNewEntity(entityId, messages)` | `entityId: string`, `messages: string[]` | Logs death messages for an entity not yet covered. `false` if `messages` is not array |
| `addNewDeathCause(cause,mappedName, messages)` | `cause: string`, `mappedName: string`, `messages: string[]` | Register a new cause of death and its associated messages |
| `clearCache()` | — | Manually clear the cache of messages, cooldowns and history per player |

```js
import { addNewEntity, getVerificationStats } from "./systems/death-custom-msg/index.js";

addNewEntity("minecraft:my_custom_mob", [
    "§c%victim% could not handle the new creature.",
]);

console.log(getVerificationStats());
```

---

## Internal flow

```
entityDie (player dies)
    ├── on cooldown? → aborts (Logger.log, sends nothing)
    ├── get damageCause + damagingEntity
    ├── map cause via DEATH_CAUSES / weapon via TOOL_REGISTRY
    ├── pick a message without repeating the last one shown to that player
    └── world.sendMessage() with the formatted message
```

---

## Config

```js
const CONFIG = {
  CACHE_DURATION: 60000,             // message cache TTL (ms)
  COOLDOWN_DURATION: 1000,           // per-player cooldown between messages (ms)
  MESSAGE_HISTORY_DURATION: 3600000, // how long the last shown message is remembered (ms)
  CLEANUP_INTERVAL: 300,             // ticks between automatic cache cleanups
  DEBUG: false,
};
```

---

## Events used

| Event | When |
|---|---|
| `world.afterEvents.entityDie` | Detect the death of a player |
| `system.runInterval` | Periodic cleaning of the cache (every `CLEANUP_INTERVAL` ticks) |

---

## Performance considerations

- `Map` with TTL avoids memory leaks in long sessions — it cleans itself
each `CLEANUP_INTERVAL` ticks (~15s by default).
- 1 second cooldown per player eliminates spam on quick kills
in a row (e.g. lava with several ticks of damage).

---

## Possible improvements

- Persist entities/causes added with `addNewEntity`/`addNewDeathCause`
in `WorldManager`/`DynamicStore` — are currently lost on reboot.
- Support for messages differentiated by dimension.
- In-game command that calls `addNewEntity`/`addNewDeathCause`untouched
code.

---

<sub>Death Custom Msg por **IIBl4z3MasterII**</sub>
