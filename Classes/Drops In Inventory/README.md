# 🎒 Drops In Inventory

Sistema que intercepta los drops al romper bloques y los transfiere directamente al inventario del jugador. Incluye persistencia de overflow via `VaultDB`.

---

## Archivos

| Archivo | Rol |
|---|---|
| `drops_in_inventory.js` | Lógica principal — registra bloques, intercepta drops, gestiona inventario |
| `QIDB.js` | `VaultDB` — base de datos liviana sobre dynamic properties |

---

## Propósito general

Elimina el paso de recoger items del suelo. Cuando un jugador rompe un bloque, los drops van directo a su inventario. Si el inventario está lleno, los items se guardan en `VaultDB` y se entregan al reconectarse.

---

## Cómo interactúa con el resto del addon

```
drops_in_inventory.js ──── instancia ────► VaultDB (QIDB.js)
        │
        ├── world.beforeEvents.playerBreakBlock  (registra bloque → jugador)
        ├── world.afterEvents.entitySpawn         (intercepta drops)
        └── world.afterEvents.playerSpawn         (entrega overflow al reconectarse)
```

---

## drops_in_inventory.js

**Responsabilidad:** Orquesta el flujo completo: registrar el bloque roto, interceptar el drop y transferirlo al jugador correcto.

### Flujo interno

```
playerBreakBlock → BlockBreakRegistry.register(block, player)
        │
entitySpawn (itemEntity) → ItemCollector.collect(entity)
        ├── BlockBreakRegistry.findPlayer(location)  ← jugador más cercano en TTL
        ├── InventoryManager.addItem(player, item)
        │       ├── hay espacio → da item directo, despawnea entidad
        │       └── inventario lleno → overflowDB.set(player, items[])
        └── playerSpawn → entregar overflow pendiente
```

### Clases internas

**`BlockBreakRegistry`** — registra pares `blockLocation → {player, timestamp}` con TTL de 40 ticks.

| Método | Descripción |
|---|---|
| `register(block, player)` | Registra el bloque roto por el jugador |
| `findPlayer(location, maxDistance, maxAgeMs)` | Jugador más cercano dentro del TTL |

**`InventoryManager`** — gestiona la adición de items y detecta overflow.

| Método | Descripción |
|---|---|
| `addItem(player, itemStack)` | Da el item; si falla → overflow handler |
| `hasSpace(player)` | Verifica slots libres |

**`ItemCollector`** — escucha spawns de tipo `item` y coordina la transferencia.

### Uso

```js
import "./Drops In Inventory/drops_in_inventory.js";
// Se autoregistra — no requiere inicialización explícita
```

---

## QIDB.js — VaultDB

**Responsabilidad:** Abstracción tipo key-value sobre Dynamic Properties, con particionado automático para respetar el límite de 32KB de Bedrock.

### API

```js
import { VaultDB } from "./QIDB.js";

const db = new VaultDB("namespace", maxEntries, version);

db.set("clave", { data: 123 });     // guarda serializado
db.get("clave");                     // retorna deserializado o null
db.delete("clave");                  // elimina
db.keys();                           // retorna array de claves
```

### Variables clave

| Variable | Descripción |
|---|---|
| `MAX_STR_LEN` | `32_000` — límite seguro por propiedad (Bedrock explota arriba de 32KB) |

---

## Eventos utilizados

| Evento | Cuándo |
|---|---|
| `world.beforeEvents.playerBreakBlock` | Registra bloque → jugador |
| `world.afterEvents.entitySpawn` | Intercepta drops (tipo `item`) |
| `world.afterEvents.playerSpawn` | Entrega overflow al reconectarse |

---

## Consideraciones de rendimiento

- TTL de 40 ticks (~2 segundos) en `BlockBreakRegistry`. Con lag alto en el servidor, considerar aumentarlo.
- `findPlayer` itera el Map — el TTL lo limpia automáticamente, pero en minería masiva simultánea el Map puede crecer momentáneamente.
- Cada guardado de overflow hace una escritura en dynamic properties — con inventarios muy llenos y muchos drops, puede acumularse.

---

## Posibles mejoras

- Soporte para drops de mobs (actualmente solo bloques).
- Notificación al jugador cuando items van al overflow.
- UI para ver y recuperar overflow manualmente.
- TTL configurable desde una constante expuesta.
