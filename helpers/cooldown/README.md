# ⏱️ Cooldown

Class `CooldownManager` to limit skills, commands or items with
"use every X seconds", without repeating the logic of `Map` + timestamps in
every system that needs it.

---

## Archive

| Archive | Role |
|---|---|
| `index.js` | Class `CooldownManager` |

---

## Why does it exist

Any system with a time-limited action (special sword,
`/kit` command, teleport button) ends up reimplementing the same
pattern: save a timestamp, compare it with the current tick, clear it if
already won. `CooldownManager` centralize that into a single reusable class in
memory, with independent cooldowns by `id` + `action`.

---

## How it works inside

Saves each active cooldown in an internal `Map` with key `` `${id}:${action}` ``
and value = expiration tick (`system.currentTick+ duration`). Lives
while the server is still running — does not persist between reboots (for
that, combine with `WorldManager`/`DynamicStore`).

---

## Public API

| Method | Parameters | Returns | Description |
|---|---|---|---|
| `start(id, action,durationTicks)` | `id: string`, `action: string`, `durationTicks:number` | `void` | Start (or restart) the cooldown |
| `isOnCooldown(id, action)` | `id, action: string` | `boolean` | `true` if still active; clean entry alone if it has already expired |
| `getRemaining(id, action)` | `id, action: string` | `number` | Remaining ticks (`0` if not on cooldown) |
| `clear(id, action)` | `id, action: string` | `void` | Cancel the cooldown manually before it expires |

`20 ticks = 1 second`.

---

## Usage example

```js
import { CooldownManager } from "./helpers/cooldown/index.js";
import { world } from "@minecraft/server";

const cooldowns = new CooldownManager();

world.afterEvents.itemUse.subscribe((event) => {
    const player = event.source;

    if (cooldowns.isOnCooldown(player.id, "fireball")) {
        const sec = Math.ceil(cooldowns.getRemaining(player.id, "fireball") / 20);
        player.sendMessage(`§cWait ${sec}s before using this again.`);
        return;
    }

    cooldowns.start(player.id, "fireball", 5 * 20); // 5 segundos
    // ... lanzar fireball
});
```

---

## Grades

- An `id` can have several simultaneous cooldowns as long as they use
different `action` (e.g. `"fireball"` and `"heal"` for the same player).
- It is not thread-safe nor intended for multi-server — it is local memory to
the script instance.

---

<sub>Cooldown by **IIBl4z3MasterII**</sub>
