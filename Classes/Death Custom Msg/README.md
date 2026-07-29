# 💀 Death Custom Msg

Sistema de mensajes de muerte personalizados con anti-spam, cache y soporte para múltiples causas de muerte.

---

## Archivos

| Archivo | Rol |
|---|---|
| `Death Custom Msg-IIBl4z3MasterII.js` | Lógica principal — escucha muertes y envía mensajes |
| `data.js` | Datos puros — causas, armas y mensajes |

---

## Propósito general

Reemplaza los mensajes de muerte genéricos de Minecraft por mensajes personalizados según la causa (PvP, mob, ambiente, suicidio), el arma usada y la entidad involucrada. Incluye anti-repetición y cooldown por jugador.

---

## Cómo interactúa con el resto del addon

```
Death Custom Msg-IIBl4z3MasterII.js ──── importa ────► data.js
        │
        └── @minecraft/server (entityDie, system.runInterval)
```

No tiene dependencias externas fuera de su propia carpeta.

---

## Death Custom Msg-IIBl4z3MasterII.js

**Responsabilidad:** Escucha el evento `entityDie`, identifica la causa y el killer, selecciona un mensaje no repetido y lo envía al mundo con cooldown por jugador.

### Flujo interno

```
entityDie (jugador muere)
    ├── obtener damageCause
    ├── identificar killer (Player / Entity / null)
    ├── buscar arma en TOOL_REGISTRY
    ├── getNonRepeatingRandomMessage()   ← evita repetir el último mensaje
    ├── cooldown check (1 segundo por jugador)
    └── world.sendMessage() con mensaje formateado
```

### Config

```js
const CONFIG = {
  CACHE_DURATION: 60000,           // TTL del cache de mensajes (ms)
  COOLDOWN_DURATION: 1000,         // cooldown por jugador (ms)
  MESSAGE_HISTORY_DURATION: 3600000, // historial anti-repetición (ms)
  CLEANUP_INTERVAL: 300,           // ticks entre limpiezas de cache
  DEBUG: false,
};
```

### Eventos utilizados

| Evento | Cuándo |
|---|---|
| `world.afterEvents.entityDie` | Detecta muerte de jugadores |
| `system.runInterval` | Limpieza periódica del cache |

### Uso

```js
import "./Death Custom Msg/Death Custom Msg-IIBl4z3MasterII.js";
// Se autoregistra — no requiere inicialización explícita
```

---

## data.js

**Responsabilidad:** Fuente de verdad de todos los datos del sistema. Solo exporta constantes — sin lógica.

### Exports

| Export | Descripción |
|---|---|
| `DEATH_CAUSES` | Mapeo `damageCause` → categoría legible |
| `TOOL_REGISTRY` | Mapeo `typeId` de item → nombre para el mensaje |
| `DEATH_MESSAGES` | Mensajes por categoría y arma (arrays para variedad) |
| `UNKNOWN_ENTITY_MESSAGES` | Fallback cuando la entidad no está registrada |
| `UNKNOWN_DEATH_CAUSE_MESSAGES` | Fallback cuando la causa no está registrada |

### Cómo extender

Para añadir una nueva causa de muerte o arma, solo editar `data.js`:

```js
// Nueva causa
export const DEATH_CAUSES = {
  // ...existentes
  "mi_causa_custom": "quemado por lava custom"
};

// Nuevos mensajes para esa causa
export const DEATH_MESSAGES = {
  // ...existentes
  "mi_causa_custom": [
    "§c%victim% se derritió en lava custom.",
    "§c%victim% no era a prueba de fuego custom."
  ]
};
```

---

## Consideraciones de rendimiento

- `WeakMap` / `Map` con TTL evitan memory leaks en sesiones largas.
- Cooldown de 1 segundo por jugador elimina spam en muertes rápidas seguidas.
- El cleanup corre cada 300 ticks (~15 segundos) — ajustable en `CONFIG`.

---

## Posibles mejoras

- Mensajes configurables por admin desde una dynamic property o archivo externo.
- Soporte para entidades custom de addons.
- Mensajes diferenciados por dimensión (Nether, End).
