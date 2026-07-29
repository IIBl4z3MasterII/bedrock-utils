# 💾 Dynamic Pros Template

**Archivo:** `Dynamic Pros Template.js`

Template listo para copiar que implementa el patrón **dirty flag** sobre Dynamic Properties de Bedrock. Solo escribe en disco cuando hubo cambios reales — cero escrituras innecesarias.

---

## Propósito

Proveer una base reutilizable para cualquier sistema que necesite persistir estado entre sesiones, sin generar escrituras a cada tick o a cada evento.

---

## Cómo interactúa con el resto del addon

No tiene dependencias externas. Es un template de referencia — se copia y adapta para cada sistema.

---

## Flujo interno

```
setPlayerStat(player, key, value)
    ├── actualiza estado en memoria (playerStats Map)
    ├── marca jugador en dirtyPlayers Set
    └── scheduleFlush() si no hay flush pendiente
            │
            └── system.run() → siguiente tick
                    └── guardarTodosLosDirty()
                            └── para cada jugador dirty:
                                    world.setDynamicProperty(key, JSON.stringify(stats))
                                    dirtyPlayers.delete(player)
```

---

## Variables clave

| Variable | Descripción |
|---|---|
| `MAX_STR_LEN` | `32_000` — límite seguro por propiedad (Bedrock explota arriba de 32KB) |
| `KEYS` | Object con las claves de dynamic properties del sistema |
| `DEFAULT_CONFIG` | Valores por defecto para configuración del mundo |
| `dirtyPlayers` | `Set<Player>` — jugadores con cambios pendientes |

---

## Uso

```js
// Copiar el archivo, renombrar KEYS y adaptar DEFAULT_CONFIG
import { initDynamicProps, setPlayerStat, getPlayerStat } from "./Dynamic Pros Template.js";

initDynamicProps();

setPlayerStat(player, "coins", 500);   // solo escribe en disco si cambió
const coins = getPlayerStat(player, "coins"); // 500
```

---

## Consideraciones de rendimiento

- El flush ocurre en el siguiente tick (`system.run()`), no de forma síncrona — nunca bloquea el tick actual.
- Con 100+ jugadores marcados como dirty simultáneamente, el flush itera todos. Para volumen muy alto, evaluar flush en batches.
- Validar manualmente que el JSON serializado no supere `MAX_STR_LEN` antes de guardar.

---

## Posibles mejoras

- Flush diferido con debounce (guardar N ms después del último cambio).
- Validación automática de `MAX_STR_LEN` con truncado graceful o split en múltiples propiedades.
- Versioning integrado para migraciones de datos entre versiones del addon.
