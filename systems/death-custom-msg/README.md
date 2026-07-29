# 💀 Death Custom Msg

Sistema de mensajes de muerte personalizados con anti-spam, cache y
soporte para múltiples causas de muerte, armas y entidades — más una API
para agregar nuevas entradas en caliente sin tocar el código del core.

---

## Archivos

| Archivo | Rol |
|---|---|
| `index.js` | Lógica principal — escucha muertes, arma y envía el mensaje |
| `data.js` | Datos puros — causas, armas y textos de mensaje. Sin lógica |

---

## Propósito general

Reemplaza los mensajes de muerte genéricos de Minecraft por mensajes
personalizados según la causa (PvP, mob, ambiente, suicidio), el arma
usada y la entidad involucrada. Incluye cooldown por jugador y
anti-repetición para no mostrar el mismo mensaje dos veces seguidas.

---

## Cómo se activa

```js
import "./systems/death-custom-msg/index.js";
// Se autoregistra al importarlo — no requiere llamar a ninguna función.
```

---

## data.js — fuente de verdad

Solo exporta constantes, sin lógica:

| Export | Tipo | Descripción |
|---|---|---|
| `DEATH_CAUSES` | `Map<string, string>` | `damageCause` nativo → categoría legible interna |
| `TOOL_REGISTRY` | `Map<string, string>` | `typeId` del arma → nombre a mostrar en el mensaje |
| `DEATH_MESSAGES` | `object` | Mensajes por categoría/mob (arrays, para variedad — se elige uno al azar) |
| `UNKNOWN_ENTITY_MESSAGES` | `string[]` | Fallback cuando la entidad no está registrada |
| `UNKNOWN_DEATH_CAUSE_MESSAGES` | `string[]` | Fallback cuando la causa no está registrada |

### Extender agregando datos directo

```js
// data.js
DEATH_CAUSES.set("mi_causa_custom", "quemado_custom");

export const DEATH_MESSAGES = {
  // ...existentes
  quemado_custom: [
    "§c%victim% se derritió en lava custom.",
    "§c%victim% no era a prueba de fuego custom.",
  ],
};
```

---

## index.js — API pública

Además de autoregistrarse en `entityDie`, expone funciones para
inspeccionar y extender el sistema en tiempo de ejecución (útil desde un
comando de admin o un panel de staff):

| Función | Parámetros | Descripción |
|---|---|---|
| `getVerificationStats()` | — | Devuelve estadísticas: entidades/causas conocidas, cantidad de mensajes fallback, más stats de cache (`getStats()`) |
| `addNewEntity(entityId, messages)` | `entityId: string`, `messages: string[]` | Registra mensajes de muerte para una entidad no cubierta aún. `false` si `messages` no es array |
| `addNewDeathCause(cause, mappedName, messages)` | `cause: string`, `mappedName: string`, `messages: string[]` | Registra una nueva causa de muerte y sus mensajes asociados |
| `clearCache()` | — | Limpia manualmente el cache de mensajes, cooldowns e historial por jugador |

```js
import { addNewEntity, getVerificationStats } from "./systems/death-custom-msg/index.js";

addNewEntity("minecraft:my_custom_mob", [
    "§c%victim% no pudo con la nueva criatura.",
]);

console.log(getVerificationStats());
```

---

## Flujo interno

```
entityDie (jugador muere)
    ├── ¿en cooldown? → aborta (Logger.log, no envía nada)
    ├── obtener damageCause + damagingEntity
    ├── mapear causa vía DEATH_CAUSES / arma vía TOOL_REGISTRY
    ├── elegir mensaje sin repetir el último mostrado a ese jugador
    └── world.sendMessage() con el mensaje formateado
```

---

## Config

```js
const CONFIG = {
  CACHE_DURATION: 60000,             // TTL del cache de mensajes (ms)
  COOLDOWN_DURATION: 1000,           // cooldown por jugador entre mensajes (ms)
  MESSAGE_HISTORY_DURATION: 3600000, // cuánto se recuerda el último mensaje mostrado (ms)
  CLEANUP_INTERVAL: 300,             // ticks entre limpiezas automáticas de cache
  DEBUG: false,
};
```

---

## Eventos utilizados

| Evento | Cuándo |
|---|---|
| `world.afterEvents.entityDie` | Detecta la muerte de un jugador |
| `system.runInterval` | Limpieza periódica del cache (cada `CLEANUP_INTERVAL` ticks) |

---

## Consideraciones de rendimiento

- `Map` con TTL evita memory leaks en sesiones largas — se limpia solo
  cada `CLEANUP_INTERVAL` ticks (~15s por defecto).
- El cooldown de 1 segundo por jugador elimina spam en muertes rápidas
  seguidas (ej. lava con varios ticks de daño).

---

## Posibles mejoras

- Persistir entidades/causas agregadas con `addNewEntity`/`addNewDeathCause`
  en `WorldManager`/`DynamicStore` — actualmente se pierden al reiniciar.
- Soporte para mensajes diferenciados por dimensión.
- Comando in-game que llame a `addNewEntity`/`addNewDeathCause` sin tocar
  código.

---

<sub>Death Custom Msg por **IIBl4z3MasterII**</sub>
