# 🐾 MobStacker + Mission System

Dos sistemas integrados: apilador visual de mobs hostiles cercanos en una
sola entidad, y sistema de misiones con objetivos de kill, recompensas y
logros.

---

## Archivos

| Archivo | Rol |
|---|---|
| `index.js` | Apilador de mobs — detecta, fusiona, actualiza nametag/escala |
| `mission-system.js` | Clase `MissionSystem` — misiones, progreso, recompensas, logros |

---

## Propósito general

`MobStacker` agrupa mobs hostiles cercanos del mismo tipo en una sola
entidad "visual" (mata a las demás y suma su vida a la primera), para que
no se acumulen cientos de entidades sueltas en zonas de farmeo. Muestra
el conteo y HP total en el nametag. Al detectar un kill hecho por un
jugador, notifica a `MissionSystem` para avanzar el progreso de sus
misiones activas.

---

## Cómo se activa

```js
import "./systems/mob-stacker/index.js";
// Se autoregistra — no hay función de init que llamar.
```

`missionSystem` (instancia única de `MissionSystem`) se exporta desde
`index.js` para que otro código pueda consultar/asignar misiones
directamente:

```js
import { missionSystem } from "./systems/mob-stacker/index.js";

missionSystem.startMission(player, 0); // asigna la primera misión del template
```

---

## Categorías de mobs apilables

```js
const HOSTILE_MOBS = {
  UNDEAD:     ["zombie", "husk", "drowned", "skeleton", "stray", "wither_skeleton", "zombified_piglin", "zoglin"],
  ARTHROPODS: ["spider", "cave_spider", "silverfish", "endermite"],
  ILLAGERS:   ["pillager", "vindicator", "ravager", "vex"],
  NETHER:     ["blaze", "magma_cube", "piglin", "piglin_brute", "hoglin"],
  OVERWORLD:  ["breeze", "witch"],
  BOSS:       ["warden"],
};
```

---

## Config

```js
const CONFIG = {
  MAX_STACK_SIZE: 50,
  NAME_TAG_FORMAT: "§c[ §7x{count} {name} §c]\n§a{health}§7/§a{maxHealth}",
  STACK_RADIUS: 5,      // bloques, para fusionar mobs cercanos
  UPDATE_INTERVAL: 15,  // ticks entre refrescos de nametag/escala
};
```

---

## Flujo interno — apilado

```
entitySpawn (mob hostil)
    ├── ¿es apilable? (isStackable)
    ├── buscar stack existente en radio STACK_RADIUS
    │       └── si hay uno cerca → fusionar (sumar HP, matar al nuevo, escalar visual)
    └── si no hay → agregarlo como cabeza de un stack nuevo

system.runInterval (cada UPDATE_INTERVAL ticks)
    └── updateStackVisuals()
            ├── limpia entidades inválidas de cada stack
            ├── fusiona cualquier miembro sobrante hacia el primero (stack[0])
            └── refresca nametag + escala visual del primero

entityHurt (mob de un stack con >1 miembro recibe daño de un jugador)
    └── missionSystem.trackKill(jugador, tipoDeMob)   ← ver nota abajo

entityDie (mob del stack muere)
    ├── lo saca del stack
    ├── refresca nametag/escala del que queda como cabeza
    └── si el killer es jugador → missionSystem.trackKill / trackBossKill
```

**Nota sobre `entityHurt`:** el trackeo de misiones también se dispara en
`entityHurt` (no solo en `entityDie`) cuando el mob pertenece a un stack
de más de un miembro — es intencional para que golpear un stack grande
cuente progreso incluso mientras el "mob visible" no muere del todo
(porque son varios fusionados en uno). Si estás debuggeando progreso de
misión que avanza "de más", revisar este listener primero.

---

## Fusión visual (`applyVisualMerge`)

Al fusionar un mob nuevo con un stack existente: suma su HP actual al del
mob "cabeza" (con tope `maxHP × cantidad de miembros`), escala visual del
mob cabeza (`+0.05` por miembro, tope `+0.5`), y actualiza el nametag con
el formato de `CONFIG.NAME_TAG_FORMAT`. El mob absorbido se elimina
(`entity.kill()`).

---

## Variables clave (estado en memoria)

| Variable | Tipo | Descripción |
|---|---|---|
| `mobStackMap` | `Map<string, Entity[]>` | Stacks activos, clave = tipo de mob (sin `minecraft:`) |
| `bossStackMap` | `Map<string, Entity[]>` | Reservado para stacks de jefes — se consulta en `getOrCreateStack` pero **no se puebla en ningún lado del archivo actual**; parece infraestructura preparada para una feature de bosses no terminada |
| `stackVisuals` | `Map` | Declarada pero no se usa en el código actual — posible remanente de una versión anterior |

---

## `mission-system.js` — clase `MissionSystem`

### API pública

| Método | Descripción |
|---|---|
| `getAvailableMissions(player)` | Templates disponibles en la dimensión actual del jugador que no tenga ya activos |
| `startMission(player, templateIndex)` | Inicia una misión por índice de template; `false` si ya tiene esa misión activa o el índice no existe |
| `trackKill(player, entityId)` | Suma el kill a cualquier misión activa cuyo `entityTypes` incluya ese id; completa la misión si llega al objetivo |
| `trackBossKill(player, bossId)` | Notifica un kill de jefe (actualmente solo envía un mensaje — no está conectado a ninguna misión de boss específica) |
| `getPlayerMission(player)` *(no presente como método propio — ver `playerMissions` abajo)* | — |

### Templates de misión (`missionTemplates`)

10 misiones predefinidas con `entityTypes`, `difficulty` (1-4, define
`killsNeeded = difficulty * 10`), `rewards.xp`, `rewards.items` y
`dimension`. **Nota:** algunas incluyen tipos de mob (`slime`, `guardian`)
que no están en `HOSTILE_MOBS` de `index.js` — el trackeo de misiones
(`trackKill`) funciona igual porque escucha eventos de juego directamente
(`entityHurt`/`entityDie`), no depende de que el mob esté en un stack.

### Logros (`achievements`)

| Logro | Requisito |
|---|---|
| `Mission Master` | 50 misiones completadas |
| `Speed Runner` | 25 misiones completadas en menos de la mitad del límite de tiempo |
| `Monster Hunter` | 1000 mobs matados en misiones |
| `Perfect Score` | 10 misiones sin recibir daño |

⚠️ **`checkAchievements(player)` está definido pero con el cuerpo vacío**
(`{ }`) — se llama desde `completeMission` pero actualmente no otorga
ningún logro. Los logros están declarados en `this.achievements` pero no
hay lógica que los verifique ni entregue todavía.

### Estado interno

| Variable | Tipo | Descripción |
|---|---|---|
| `playerMissions` | `Map<playerId, Mission[]>` | Misiones activas/completadas por jugador |
| `playerStats` | `Map<playerId, { kills, missionsCompleted, perfectMissions }>` | Stats acumulados, insumo para logros (una vez implementados) |

Ninguno de los dos persiste — se pierde todo al reiniciar el servidor.

---

## Eventos utilizados

| Evento | Archivo | Cuándo |
|---|---|---|
| `world.afterEvents.entitySpawn` | `index.js` | Detecta mob nuevo apilable, intenta fusionar |
| `system.runInterval` | `index.js` | Refresca nametag/escala cada `UPDATE_INTERVAL` ticks |
| `world.afterEvents.entityHurt` | `index.js` | Trackea progreso de misión en stacks de >1 miembro |
| `world.afterEvents.entityDie` | `index.js` | Saca el mob del stack, trackea kill/boss kill |
| `world.afterEvents.playerSpawn` | `mission-system.js` | Inicializa stats/misiones del jugador al conectarse |

---

## Consideraciones de rendimiento

- `updateStackVisuals` recorre todos los stacks cada `UPDATE_INTERVAL`
  ticks (15 por defecto, ~0.75s) — con zonas muy densas de mobs, subir
  este número reduce carga a costa de menos fluidez visual.
- La fusión ocurre tanto al spawnear como en cada tick de actualización
  — es redundante pero barato (early-return si no hay nada que fusionar).
- `missionTemplates`/`achievements`/progreso de jugador viven solo en
  memoria — considerar `WorldManager`/`DynamicStore` si necesitás que
  sobrevivan un reinicio.

---

## Posibles mejoras

- Implementar `checkAchievements` (actualmente es un no-op).
- Poblar `bossStackMap` o eliminarlo si no se va a usar — ahora mismo es
  código muerto que solo se lee, nunca se escribe.
- Persistir progreso de misiones y logros.
- Conectar `trackBossKill` a una recompensa/logro real en vez de solo un
  mensaje de chat.

---

<sub>MobStacker + Mission System por **IIBl4z3MasterII**</sub>
