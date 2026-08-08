# 🎯 Raycaster

Class with static methods to know which entity or block it is
watching a player, without repeating the settings
`getEntitiesFromViewDirection`/`getBlockFromViewDirection` in each
script.

---

## Archive

| Archive | Role |
|---|---|
| `index.js` | `Raycaster` class |

---

## Why does it exist

Both native methods return arrays/objects with more information than they
you almost always need (distance, face of the block hit, etc.). For
the common case — "what is this player looking at right now?" - this
class directly returns the entity or block, or `undefined` if not
there is nothing in range.

---

## Public API

| Method | Parameters | Returns | Description |
|---|---|---|---|
| `getEntityLookingAt(player,maxDistance?)` | `player: Player`, `maxDistance:number = 10` | `Entity \| undefined` | First entity in line of sight, within range |
| `getBlockLookingAt(player,maxDistance?)` | `player: Player`, `maxDistance:number = 10` | `Block \| undefined` | Block in line of sight, within range |

---

## Usage example

```js
import { Raycaster } from "./helpers/raycaster/index.js";

const entity = Raycaster.getEntityLookingAt(player, 10);
if (entity) {
    player.sendMessage(`§aYou're looking at a ${entity.typeId.split(":").pop()}!`);
}

const block = Raycaster.getBlockLookingAt(player);
if (block?.typeId === "minecraft:chest") {
    player.sendMessage("§eThere is a chest in front of you.");
}
```

---

## Grades

- If there are multiple entities in the line of sight, `getEntityLookingAt`
returns the first of the array returned by the native API (usually
the closest, but it is not guaranteed in all cases —
check if the order matters for your use case).
-`maxDistance` defaults to 10 blocks in both methods — upload it
It has marginal performance cost, it is not a heavy raycast.

---

<sub>Raycaster by **IIBl4z3MasterII**</sub>
