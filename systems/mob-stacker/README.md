# 🐾 MobStacker

Apilador visual de mobs hostiles: agrupa mobs del mismo tipo cercanos
entre sí en un solo "stack" (nametag con conteo `x{n}`), guardando el
tamaño del stack como dynamic property en la entidad que queda visible.
No mata/fusiona vida como antes — ahora remueve los excedentes y deja
una sola entidad representando al grupo.

> ⚠️ El sistema de misiones (`mission-system.js`) que antes vivía acá
> **fue eliminado** en esta actualización. `systems/index.js` ya no
> exporta `missionSystem` — exporta `MobStackerManager` y la instancia
> `mobStackerManager`.

---

## Archivo

| Archivo | Rol |
|---|---|
| `index.js` | Clase `MobStackerManager` + instancia autoinicializada `mobStackerManager` |

---

## Cómo se activa

```js
import "./systems/mob-stacker/index.js";
// Al importarse, corre system.run(() => mobStackerManager.initialize())
// — se autoregistra, no hace falta llamar nada.
```

Para controlarlo en runtime:

```js
import { mobStackerManager } from "./systems/index.js";

mobStackerManager.toggleSystem();   // activa/desactiva (persistido en dynamic property del mundo)
mobStackerManager.getStats();       // { enabled, maxStackSize, supportedMobs, updateInterval }
mobStackerManager.shutdown();       // detiene el runInterval interno
```

---

## Categorías de mobs apilables

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

> Nota: `zombified_piglin` pasó a `zombie_pigman`, y `breeze` fue
> reemplazado por `creeper` + `slime` en `OVERWORLD` respecto a la
> versión anterior.

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

`CUSTOM_NAME_FORMAT` es nuevo: se usa para mobs que ya tenían un
`nameTag` propio (puesto por otro sistema/spawn egg nombrado) y no
forman parte de un stack — conservan su nombre pero con vida agregada
al formato.

---

## API pública

| Método | Descripción |
|---|---|
| `initialize()` | Arranca los listeners si `isEnabled()`; no-op si ya se inicializó |
| `toggleSystem()` | Invierte el flag de habilitado (dynamic property del mundo `mobstacker_enabled`) y lo devuelve |
| `isEnabled()` / `setEnabled(value)` | Lee/escribe ese flag |
| `getStats()` | `{ enabled, maxStackSize, supportedMobs, updateInterval }` |
| `shutdown()` | Cancela el `runInterval` interno y resetea `_initialized` |

---

## Flujo interno

```
system.runInterval (cada UPDATE_INTERVAL ticks)
  └── updateStacks()
        ├── obtiene entidades familia "monster"/"undead" del overworld
        ├── filtra por this.mobTypes (union de HOSTILE_MOBS)
        ├── agrupa por typeId, y dentro de cada tipo por processEntities()
        │     ├── separateEntities(): distingue mobs con nombre propio
        │     │     (customNamedEntities) de mobs apilables (stackableEntities)
        │     ├── checkForNamedStacks(): re-aplica nametag si un mob con
        │     │     stack_size > 1 perdió el formato de stack
        │     └── groupEntitiesByLocation() + mergeStack() por cada grupo
        │           cercano (bucket por STACK_RADIUS)

entityHurt (mob apilable)
  └── handleEntityHurt(): resta daño manualmente vía EntityHealthComponent,
        actualiza nametag, y si currentHealth llega a 0 → handleEntityDeath()

handleEntityDeath(deadEntity)
  ├── si stack_size > 1 → spawnRemainingStack() crea un reemplazo con
  │     stack_size - 1 en la misma posición/rotación
  └── mata la entidad original (nameTag "§c[ §7DEAD §c]" + kill())

explosion (creeper apilado)
  └── handleCreeperExplosion(): si el creeper que explota tenía
        stack_size > 1, respawnea uno nuevo con stack_size - 1 tras 5 ticks
```

---

## Persistencia por entidad (dynamic properties, prefijo `mobstacker_`)

| Key | Descripción |
|---|---|
| `stack_size` | Cantidad de mobs representados por esta entidad |
| `current_health` / `max_health` | Snapshot de vida usado al recalcular el nametag |
| `custom_named` | `true` si la entidad tenía un `nameTag` propio antes de ser detectada (no se trata como stack) |

Flag global en el mundo: `mobstacker_enabled` (controlado por
`isEnabled()`/`setEnabled()`/`toggleSystem()`).

---

## Diferencias vs. la versión anterior

- **Se eliminó `MissionSystem` por completo** (`mission-system.js` ya
  no existe en este módulo) — el stacker ya no notifica kills a ningún
  sistema de misiones.
- El daño ahora se resta manualmente en `handleEntityHurt` (no depende
  del daño real aplicado por el juego al tick siguiente).
- Reemplaza el manejo por HP-sumado-y-visual-scale anterior por
  conteo puro (`stack_size`) + remoción de las entidades excedentes.
- Agrega manejo explícito de creepers que explotan estando apilados
  (`handleCreeperExplosion`), inexistente antes.
- Todo el estado vive en dynamic properties (persiste si el chunk se
  descarga/recarga), no en `Map`s en memoria como antes.
- `bossStackMap`/`stackVisuals` (código muerto de la versión previa)
  ya no existen.

---

## Posibles mejoras

- Actualmente solo escanea `world.getDimension("overworld")` en
  `updateStacks()` — mobs apilables en Nether/End no se agrupan.
- No hay reemplazo del sistema de misiones eliminado; si tu addon
  dependía de `missionSystem`/`trackKill`, hay que reimplementarlo
  aparte o restaurar `mission-system.js` de una versión previa.

---

<sub>MobStacker por **IIBl4z3MasterII**</sub>
