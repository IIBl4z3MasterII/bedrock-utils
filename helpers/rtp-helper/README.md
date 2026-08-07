# 🌀RtpHelper

Self-contained Random Teleport (RTP) system: "stay still" phase,
secure location search in multiple dimensions, cooldown,
cancellation if player moves, teleportation and clearing effects
automatic status when disconnecting or shutting down the server.

---

## Archive

| Archive | Role |
|---|---|
| `index.js` | Class `RtpHelper` |

---

## Why does it exist

A "well-made" RTP is not just `player.teleport(random)` — it should be avoided
teleport someone to lava, to the middle of a wall, or to an already occupied point;
give visual feedback while searching; allow cancel if the player
moves during countdown; and clean everything if the player
Disconnect halfway through the process. This class solves the four phases
(wait → search → teleport → cooldown) as a single unit
configurable.

---

## Config (constructor)

```js
const rtp = new RtpHelper({
    cooldownMs: 60000,        // time between uses per player
    stillTimeMs: 5000,        // seconds the player must stay still before searching
    searchRadius: 2000,       // search radius around startX/startZ
    startX: 0,
    startZ: 0,
    maxSearchTicks: 6000,     // tick limit while searching before canceling
    safeBlockIds: [ /* blocks where the player CAN appear */ ],
    unsafeBlockIds: [ /* blocks where the player must NEVER appear */ ],
    dimensionConfigs: {
        "minecraft:overworld": { minY: -60, maxY: 319, name: "Overworld" },
        "minecraft:nether":    { minY: 0,   maxY: 127, name: "Nether" },
        "minecraft:the_end":   { minY: 0,   maxY: 255, name: "End" },
    },
    onNotify: (player, title, message) => player.sendMessage(`§8[§6RTP§8] §7${title}: §f${message}`),
});
```

All fields are optional — the values ​​above are the
defaults. `onNotify` is what allows you to change the language/format of
messages without touching the internal code of the class.

---

## Public API

| Method | Parameters | Returns | Description |
|---|---|---|---|
| `rtp(player,targetDimension?)` | `player: Player`, `targetDimension?: Dimension \| string` | `boolean` | Start the RTP. `targetDimension` now accepts a `Dimension` instance **or** an id (`"minecraft:the_end"`) — resolves to `world.getDimension()`. `false` if on cooldown or there is already an RTP in progress for that player |
| `cancel(player)` | `player:Player` | `void` | Manually cancel an RTP in progress (wait or search phase) |

---

## Internal phases

```
rtp(player)
  ├── on cooldown? → onNotify("Cooldown", ...) and aborts
  ├── wait phase (stillTimeMs)
  │     tag "rtp_waiting" · if the player moves → cancels with "movement detected"
  ├── search phase (system.runJob, generator)
  │     tag "rtp" · free camera looking down while searching
  │     every 100 ticks retries a new random point if nothing was found
  │     if it exceeds maxSearchTicks → cancels with "no safe location found"
  └── final teleport
        clears camera · teleport · particles + sound · onNotify("Successful RTP", ...)
        starts cooldown
```

Searching for "safe location" (`#isLocationSafe`/`#findSafeLocation`)
requires: solid block below, two free air blocks above, that the
block is not in `unsafeBlockIds`, and that it is in `safeBlockIds`. In
the Nether scans of `minY` a `maxY`; for the rest, try first
`getTopmostBlock` and if it is not safe scan from top to bottom.

---

## Automatic cleaning

It registers itself in the constructor (`#initCleanup`), no need
call her:

| Event | Action |
|---|---|
| `playerSpawn` (initial spawn) | Clean previous state and residual tags |
| `playerLeave` | Clear status and cancel any active timer/job |
| `system.beforeEvents.shutdown` | Cancels all active jobs/intervals for all players |

---

## Usage example

```js
import { RtpHelper } from "./helpers/rtp-helper/index.js";

const rtp = new RtpHelper({ cooldownMs: 30000, searchRadius: 5000 });

world.afterEvents.itemUse.subscribe((event) => {
    if (event.itemStack.typeId === "minecraft:ender_pearl") {
        rtp.rtp(event.source, event.source.dimension);
    }
});

// Cancel manually (e.g. from a UI button)
rtp.cancel(player);
```

---

## Grades

- A single instance of `RtpHelper` can handle all players
of the server at a time (the state is saved by `player.id` in a `Map`
internal) — there is no need for one instance per player.
- During the quest, the player is teleported internally in
every scan tick, but with the camera in free mode (`minecraft:free`)
looking down, so you don't feel the movement — it's an effect
"camera looking from the sky" visual, not the player watching his
own character tremble.
- `onNotify` messages are hardcoded in English within the
class (`"Preparing RTP"`, `"Finding location"`, etc.) — if you need
another language, this is solved by passing your own `onNotify` in config.

---

<sub>RtpHelperby **IIBl4z3MasterII**</sub>
