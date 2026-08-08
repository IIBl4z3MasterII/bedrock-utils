# ✨ParticleHelper

Class with static methods to draw geometric shapes with
particles (line, circle, sphere, cube, perimeter), plus a system of
animated border for zones/claims and a trail for moving entities.

---

## Archive

| Archive | Role |
|---|---|
| `index.js` | Class `ParticleHelper` |

---

## Why does it exist

Drawing a figure with particles is always the same problem: calculating
N points on a curve/surface and call `spawnParticle` in each
one. This class solves mathematics in the most common ways just one
time, with optional distance filter to avoid wasting particles in
players far away who will not see them.

---

## Public API — geometric shapes

They all receive `dimension` (or `entity`, depending on the method) and `particleId`
as first parameters, and return `undefined` (they only have an effect
secondary to spawning particles).

| Method | Key parameters | Description |
|---|---|---|
| `spawn(dimension,particleId, location)` | `location:Vector3` | Spawns a single particle (direct wrapper, for API consistency) |
| `line(dimension,particleId, from, to, step?, options?)` | `step: number = 1` | Straight line between two points, one point each `step` blocks |
| `circle(dimension,particleId, center, radius, options?)` | `options.points = 32`, `options.axis = "y"` | Horizontal circle (XZ plane) |
| `circleVertical(dimension,particleId, center, radius, options?)` | `options.points = 32`, `options.axis = "z" \| "x"` | Vertical circle — `axis` defines the axis of rotation |
| `sphere(dimension,particleId, center, radius, options?)` | `options.rings = 12`, `options.pointsPerRing= 24` | Full sphere (latitude rings × points per ring) |
| `cubeOutline(dimension,particleId, from, to, options?)` | `options.step = 1` | Outline of a cube/prism (all 12 edges, reuse `line()` internally) |
| `perimeter(dimension,particleId, centerX, centerZ, radius, options?)` | `options.heightOffsets= [-0.5, 0.5, 1.5]` | Square border at ground level, at various relative heights (useful for marking the boundary of a plot of land) |

Options common to `line`, `circle`, `circleVertical`, `sphere`,
`cubeOutline`, `perimeter`, `trail`:

- `options.player`: if passed, only spawn particles inside
`options.maxDistance` player blocks (optimization for no
render full large shapes if the player is far from a
part). If you don't pass `options.maxDistance` but yes `options.player`,
uses a default of `18` blocks — before there was no default and without
  `maxDistance` explicit the filter was disabled.
- The distance check (`#inRange`) is now 3D (includes Y axis),
Before I only compared X/Z.

```js
import { ParticleHelper } from "./helpers/particle-helper/index.js";

ParticleHelper.circle(player.dimension, "minecraft:endrod", player.location, 5);

ParticleHelper.sphere(player.dimension, "minecraft:heart_particle", center, 3, {
    rings: 8, pointsPerRing: 16,
});

ParticleHelper.cubeOutline(player.dimension, "minecraft:endrod", corner1, corner2);
```

---

##`ParticleHelper.showBorder(player, center, radius,dimensionId, options?)`

Complete animated border system (square) with auto-stop and filter
distance — to show a player the boundary of a zone (claim,
World Edit region, safezone, etc.). Does not depend on any system
external: you pass direct center/radius/dimension.

| Parameter | Type | Description |
|---|---|---|
| `player` | `Player` | Who is shown the edge |
| `center` | `{x,z}` | Center of the area |
| `radius` | `number` | Block radius |
| `dimensionId` | `string` | ej. `"minecraft:overworld"` |
| `options.particleId` | `string` | Edge Particle (default `"minecraft:endrod"`) |
| `options.interval` | `number` | Ticks between frames (default `8`) |
| `options.maxDistance` | `number` | Render radius around player (default `28`) |
| `options.autoStopSeconds` | `number` | Auto-off (default `300`) |
| `options.centerParticle` | `string` | Center particle (default `"minecraft:villager_happy"`) |

```js
// Claim border (pass in your own system's data, this class doesn't know about it)
ParticleHelper.showBorder(
    player,
    { x: claimData.centerX, z: claimData.centerZ },
    claimData.level * 5,
    claimData.dimension,
    { particleId: "minecraft:endrod", maxDistance: 28, autoStopSeconds: 300 }
);
```

`ParticleHelper.hideBorder(playerId)` turns it off manually before
time. It is cleared only if the player disconnects (registered in a
`static {}` init block inside the class, no need to call it).

---

##`ParticleHelper.trail(entity, particleId, options?)`

Leaves a trail of particles behind a moving entity for
a limited time.

| Option | Default | Description |
|---|---|---|
| `options.interval` | `2` | Ticks between each particle |
| `options.duration` | `100` | Total ticks that last the trail |
| `options.maxDistance` + `options.player` | — | Same as in the shapes: filter by distance to the player |

Returns the `id` of the `runInterval` (in case you want to cancel it before with
`system.clearRun(id)`).

---

## Design Notes

- Form methods are **pure to the game world** — no
they save their own state, only `showBorder`/`hideBorder` use a `Map`
private internal (`#borderData`) to track which players have a
active edge.
- By the way, no method takes the form of a domain object
specific (like a `claim`) — everyone receives coordinates/radius/id from
direct dimension, so that the class can be used in any project, not
only in land.
-`circleVertical` with `axis: "x"` rotates in the Y-Z plane; with `axis: "z"`
(default) rotates in the X-Y plane.

---

<sub>ParticleHelperby **IIBl4z3MasterII**</sub>
