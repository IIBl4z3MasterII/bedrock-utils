# 🎒 Drops In Inventory

Sistema que intercepta los drops al romper bloques y los transfiere
directamente al inventario del jugador, con persistencia de overflow vía
`VaultDB` (una base de datos liviana propia sobre Dynamic Properties).

---

## Archivos

| Archivo | Rol |
|---|---|
| `index.js` | Lógica principal — registra bloques rotos, intercepta drops, gestiona inventario |
| `vault-db.js` | Clase `VaultDB` — mini base de datos key-value sobre Dynamic Properties, con cache, cola de guardado y validaciones |

---

## Propósito general

Elimina el paso de "agacharse a recoger el item del suelo": cuando un
jugador rompe un bloque, el drop va directo a su inventario. Si el
inventario está lleno, el item se guarda en `VaultDB` (namespace
`"overflow"`) y se entrega automáticamente al reconectarse.

---

## Cómo se activa

```js
import "./systems/drops-in-inventory/index.js";
// Se autoregistra — no requiere inicialización explícita.
```

---

## Flujo interno

```
playerBreakBlock → BlockBreakRegistry.register(block, player)
        │
entitySpawn (item entity) → ItemCollector detecta el drop
        ├── BlockBreakRegistry.findPlayer(location)   ← jugador más cercano dentro del TTL
        ├── InventoryManager.addItem(player, item)
        │       ├── hay espacio → da el item directo, despawnea la entidad
        │       └── inventario lleno → overflowDB.set(...) (VaultDB)
        └── playerSpawn → entrega el overflow pendiente al reconectarse
```

---

## Clases internas de `index.js`

### `BlockBreakRegistry`

Registra qué jugador rompió cada bloque, con un TTL para poder emparejar
el drop resultante con el jugador correcto.

| Método | Descripción |
|---|---|
| `register(block, player)` | Guarda `{ player, timestamp }` bajo la clave `x,y,z` del bloque; se auto-limpia tras `ttlTicks` (default `40`, ~2s) |
| `findPlayer(location, maxDistance?, maxAgeMs?)` | Devuelve el jugador registrado más cercano dentro de `maxDistance` (default `2`) y `maxAgeMs` (default `2000`) |

### `InventoryManager`

| Método | Descripción |
|---|---|
| `addItem(player, itemStack)` | Da el item con lógica de stacking correcta (rellena stacks parciales existentes antes de usar slots vacíos); `false` si no entró nada |
| `clamp(amount)` | Normaliza cantidades fuera de rango (`≤0 → 1`, `≥256 → 255`) |

### `ItemCollector`

Escucha el spawn de entidades tipo `item`, usa `BlockBreakRegistry` para
saber de quién es, y usa `InventoryManager` para dárselo (o mandarlo a
overflow si no entra).

---

## `vault-db.js` — clase `VaultDB`

Base de datos key-value sobre Dynamic Properties, pensada específicamente
para guardar **arrays de `ItemStack`** (serializa `typeId`, `amount`,
`nameTag`, `keepOnDeath`, lore y encantamientos), aunque también acepta
otros valores serializables.

### Por qué no es solo `set`/`get` directo sobre Dynamic Properties

- **Cola de guardado asíncrona**: los `set()` no escriben la Dynamic
  Property al instante — se encolan y se persisten de a `saveRate` claves
  por tick, para no saturar de escrituras un tick con drops masivos.
- **Cache en memoria** con tamaño máximo (`cacheSize`) — lecturas
  repetidas no vuelven a tocar Dynamic Properties.
- **Debe esperar a `world.afterEvents.worldLoad`** antes de aceptar
  operaciones — usar `set`/`get` antes de que esté listo lanza `Error`.
- **Avisa si el mundo se cierra con datos sin guardar** (cola pendiente
  al hacer shutdown → `console.error`).

### Constructor

```js
new VaultDB(namespace = "", cacheSize = 50, saveRate = 1)
```

| Parámetro | Descripción |
|---|---|
| `namespace` | Prefijo de las keys en Dynamic Properties (solo `A-Za-z0-9_`) |
| `cacheSize` | Máximo de entradas cacheadas en memoria antes de descartar las más viejas |
| `saveRate` | Claves guardadas por tick desde la cola pendiente — `>1` genera advertencia de posible lag |

### API pública

| Método | Descripción |
|---|---|
| `onReady(callback)` | Se llama cuando la instancia ya puede usarse (post `worldLoad`) |
| `set(key, value)` | Guarda (encola); valida nombre de key y longitud (`≤30` chars), y que un array no supere `1024` items |
| `get(key)` | Lee (cache primero, luego Dynamic Property); lanza `Error` si se llama antes de `onReady` |
| `has(key)` | `boolean` |
| `delete(key)` | Elimina; lanza `Error` si la key no existe |
| `keys()` | Todas las keys bajo el namespace |
| `values()` | Todos los valores bajo el namespace |
| `clear()` | Borra todas las keys del namespace |
| `logs` | Objeto público `{ save, load, set, get, has, delete, clear, keys, values }` — poner en `false` el que no querés loguear en consola |

```js
import { VaultDB } from "./systems/drops-in-inventory/vault-db.js";

const db = new VaultDB("myNamespace", 100, 1);

db.onReady(() => {
    db.set("player123", [{ t: "minecraft:diamond", a: 5 }]);
    console.log(db.get("player123"));
});
```

---

## Eventos utilizados

| Evento | Cuándo |
|---|---|
| `world.beforeEvents.playerBreakBlock` | Registra qué jugador rompió qué bloque |
| `world.afterEvents.entitySpawn` | Intercepta el drop resultante (tipo `item`) |
| `world.afterEvents.playerSpawn` | Entrega el overflow pendiente al reconectarse |

---

## Consideraciones de rendimiento

- TTL de 40 ticks en `BlockBreakRegistry` — con lag alto en el servidor,
  considerar aumentarlo para no perder el emparejamiento bloque↔jugador.
- `VaultDB` con `saveRate: 1` (el default en `overflowDB`) es la opción
  más segura contra lag — solo sube `saveRate` si de verdad necesitás
  guardar más rápido y medís que no genera problemas.
- Cada `set()` en `VaultDB` es asíncrono (se guarda en un tick posterior)
  — no asumir que el dato ya está en Dynamic Properties justo después de
  llamar a `set()`, aunque `get()` sí lo va a devolver correctamente
  gracias al cache.

---

## Posibles mejoras

- Soporte para drops de mobs (actualmente solo intercepta drops de
  bloques rotos).
- Notificar al jugador cuando un item se va a overflow, no solo al
  entregarlo de vuelta.
- UI para ver y recuperar overflow manualmente sin esperar a
  reconectarse.

---

<sub>Drops In Inventory por **IIBl4z3MasterII**</sub>
