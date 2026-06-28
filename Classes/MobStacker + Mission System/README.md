# 🐾 MobStacker + Mission System

Dos sistemas integrados: apilador de mobs hostiles con nametag dinámico, y sistema de misiones con logros y recompensas.

---

## Archivos

| Archivo | Rol |
|---|---|
| `mobstacker.js` | Apila mobs cercanos del mismo tipo en una sola entidad |
| `mission-system.js` | Rastrea kills del jugador y gestiona misiones con objetivos |

---

## Propósito general

`MobStacker` agrupa mobs hostiles cercanos (radio 5 bloques, máx 50 por stack) mostrando HP total en el nametag y aplicando efectos especiales por categoría. Al morir un mob del stack, notifica a `MissionSystem` para avanzar el progreso de misiones.

---

## Cómo interactúan entre sí

```
mobstacker.js ──── notifica kills ────► mission-system.js
      │                                        │
      ├── system.runInterval (apilamiento)      ├── rastrea progreso por jugador
      └── entityDie (actualiza stack)           ├── otorga logros y recompensas
                                                └── asigna nueva misión al completar
```

---

## mobstacker.js

**Responsabilidad:** Detecta mobs hostiles elegibles, los consolida en stacks, actualiza nametags y aplica efectos.

### Categorías de mobs soportadas

```js
const HOSTILE_MOBS = {
  UNDEAD:      ["zombie", "husk", "drowned", "skeleton", "stray", "wither_skeleton", "zombie_pigman", "zoglin"],
  ARTHROPODS:  ["spider", "cave_spider", "silverfish", "endermite"],
  ILLAGERS:    ["pillager", "vindicator", "ravager", "vex"],
  NETHER:      ["blaze", "magma_cube", "piglin", "piglin_brute", "hoglin"],
  OVERWORLD:   ["creeper", "witch", "ghast", "phantom", "shulker"],
  BOSS:        ["wither", "ender_dragon", "elder_guardian", "warden"]
};
```

### Flujo interno

```
system.runInterval (cada 40 ticks)
    └── para cada jugador online:
            └── buscar HOSTILE_MOBS en radio 5 bloques
                    ├── stack existente → actualizar HP y nametag
                    └── no existe → crear nuevo stack

entityDie (mob del stack muere)
    ├── decrementar stack count
    ├── actualizar nametag
    └── MissionSystem.onMobKill(player, mobType)
```

### Variables clave

| Variable | Descripción |
|---|---|
| `MAX_STACK_SIZE` | `50` — máximo de mobs por stack |
| `STACK_RADIUS` | `5` — radio en bloques para agrupar |
| `activeStacks` | `Map<entityId, StackData>` — stacks activos en memoria |

### Uso

```js
import { initMobStacker } from "./MobStacker + Mission System/mobstacker.js";
initMobStacker();
```

---

## mission-system.js

**Responsabilidad:** Gestiona misiones con objetivos de kill, tiempo límite y recompensas. Recibe notificaciones de `mobstacker.js`.

### Flujo interno

```
MissionSystem.onMobKill(player, mobType)
    ├── trackKill(player, mobType)      → actualiza progreso en missionProgress Map
    ├── ¿objetivo completado?
    │       └── otorgar XP + items + logro → asignar nueva misión
    └── ¿tiempo límite expirado?
            └── notificar misión fallida → asignar nueva misión
```

### Logros

| Logro | Condición |
|---|---|
| `Mission Master` | Completar 10 misiones |
| `Speed Runner` | Completar una misión en menos de 60 segundos |
| `Monster Hunter` | Matar 500 mobs totales |

### API pública (clase `MissionSystem`)

| Método | Descripción |
|---|---|
| `assignMission(player)` | Asigna misión aleatoria al jugador |
| `trackKill(player, mobType)` | Registra kill y verifica progreso |
| `getPlayerMission(player)` | Retorna misión activa del jugador |
| `onMobKill(player, mobType)` | Entry point llamado por `mobstacker.js` |

---

## Eventos utilizados

| Evento | Archivo | Cuándo |
|---|---|---|
| `system.runInterval` | `mobstacker.js` | Tick de apilamiento cada 40 ticks |
| `world.afterEvents.entityDie` | `mobstacker.js` | Decrementar stack al morir un mob |

---

## Consideraciones de rendimiento

- Interval de 40 ticks (2 segundos) — con muchos jugadores y mobs densos, considerar aumentarlo o filtrar por dimensión activa.
- `getEntitiesAtBlockLocation` en radio 5 puede ser costoso en zonas muy pobladas.
- `missionProgress` vive en memoria — se pierde al reiniciar si no se persiste.

---

## Posibles mejoras

- Persistir progreso de misiones en dynamic properties.
- Misiones cooperativas por equipo.
- Radio de apilamiento configurable por tipo de mob.
- Partículas y efectos visuales al formar un stack.
