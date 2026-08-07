# 🧭 Coordinates

Static class with methods to solve coordinates equivalently
to vanilla `/execute` notation: local (`^ ^ ^`), relative (`~ ~ ~`) and
absoluta.

---

## Archive

| Archive | Role |
|---|---|
| `index.js` | Class `Coordinates` |

---

## Why does it exist

When you need to position something relative to the view/orientation of a
entity (e.g. spawning a projectile "in front" of the player, an effect "ahead"
the left", a particle "above the head looking where
look"), replicating that vector math by hand is repetitive and easy
to break `Coordinates` encapsulates that logic just once, just like
`/execute anchored ... run ... ^ ^ ^` does this in commands.

---

## Public API

### `Coordinates.local(entity, x, y, z, anchor)`

Equivalent to `^X ^Y ^Z`. Use the view direction of the entity as
axis: `+x` = left, `+y` = up, `+z` = forward.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `entity` | `Entity` | — | Reference entity |
| `x, y, z` | `number` | `0` | Offsets locales |
| `anchor` | `"feet" \| "eyes"` | `"feet"` | Where is the origin calculated from |

```js
import { Coordinates } from "./helpers/coordinates/index.js";

// Punto 2 bloques adelante y 1 arriba de la vista del jugador
const spawnPoint = Coordinates.local(player, 0, 1, 2);
player.dimension.spawnEntity("minecraft:arrow", spawnPoint);
```

### `Coordinates.relative(entity, x, y, z, anchor)`

Equivalent to `~X ~Y ~Z`. Add the direct offset to the world axes,
without rotating depending on where the entity is facing.

```js
// 3 blocks above the current position, regardless of facing direction
const above = Coordinates.relative(player, 0, 3, 0);
```

### `Coordinates.absolute(x, y, z)`

Returns `{ x, y, z }` as is — just for API consistency with the
two other methods (so as not to mix hand-assembled objects with those
generates this class).

---

## How it works inside

`local()` builds an orthonormal base (`forward`, `right`, `up`) from
the view direction of the entity using cross product (`#cross`) and
normalization (`#normalize`) — both methods are private, not part of
the public API.

---

## Grades

- `local()` with `y` other than 0 can give unintuitive results if
the entity looks very up/down (the calculated "up" becomes
unstable near the poles — classic problem of orthonormal bases
from a single vector). For most game cases (spawning
things in front of the player) is not a noticeable problem.

---

<sub>Coordinates by **IIBl4z3MasterII**</sub>
