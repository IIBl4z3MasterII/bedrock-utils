# 💾 WorldManager

Sistema propio para centralizar el acceso a las Dynamic Properties: en vez
de tenerlas repartidas por todo el addon con lecturas/escrituras sueltas,
todo pasa por acá — un solo punto de entrada que resuelve el parseo de
tipos, el manejo de errores, la distribución (mundo vs. entidad) y el
ciclo de vida de carga del mundo. Dos clases: `DynamicStore` (el wrapper
de bajo nivel) y `WorldManager` (singleton que gestiona el ciclo de vida +
fábrica de stores).

---

## Archivos

| Archivo | Rol |
|---|---|
| `index.js` | Clases `DynamicStore` y `WorldManager` (export default: instancia única) |
| `logger.js` | Logger de consola con niveles (`debug`/`info`/`warn`/`error`), usado internamente por `WorldManager` |

---

## `DynamicStore`

Wrapper agnóstico de target — funciona igual sobre `world` o sobre un
`Entity`/`Player`. Auto-detecta tipo (bool/número/JSON/string) al leer, y
serializa objetos a JSON al escribir. Opcionalmente cachea en memoria.

```js
import worldManager from "./systems/world-manager/index.js";

const configStore = worldManager.store("myApp"); // namespace = "myApp", cacheado

configStore.set("difficulty", 2);
configStore.set("settings", { pvp: true, maxPlayers: 20 }); // se guarda como JSON

configStore.get("difficulty");          // 2
configStore.get("settings").pvp;        // true
configStore.get("noExiste", "default"); // "default"
configStore.has("difficulty");          // true
configStore.delete("difficulty");
configStore.keys();                     // todas las keys bajo el namespace "myApp"
```

### Payloads grandes (> 8 KB)

Bedrock corta las Dynamic Properties en ~32 KB por string. `setLarge`/`getLarge`
parten el valor en chunks automáticamente si hace falta:

```js
configStore.setLarge("bigPayload", hugeArrayOrObject);
const data = configStore.getLarge("bigPayload");
```

### Store por entidad (sin cache — cada jugador tiene su propio storage)

```js
const playerStore = worldManager.entityStore(player, "stats");
playerStore.set("kills", 10);
```

| Método | Descripción |
|---|---|
| `get(name, defaultValue?)` | Lee y parsea el valor (bool/número/JSON/string) |
| `set(name, value)` | Guarda (serializa objetos a JSON) |
| `has(name)` | `true` si existe |
| `delete(name)` | Borra (y sus chunks, si los tenía) |
| `keys()` | Todas las keys del namespace (requiere namespace no vacío) |
| `setLarge(name, value, chunkSize?)` / `getLarge(name, default?)` | Para payloads > 8 KB |
| `invalidateCache(name?)` | Limpia la cache en memoria (una key o todas) |

---

## `WorldManager`

Singleton (`export default`) que resuelve el problema de "el mundo todavía
no cargó" y centraliza la creación de `DynamicStore`s.

```js
import worldManager, { onWorldReady } from "./systems/world-manager/index.js";

// Corre apenas el mundo está listo (o inmediato si ya lo está)
onWorldReady(() => {
    console.log("Mundo listo, arrancando sistemas...");
});

// Alternativa: registrar una función de init que corre una sola vez
worldManager.registerInitFunction(() => {
    // setup que necesita el mundo cargado
}, "Sistema X inicializado");

const store = worldManager.store("myApp");
```

| Método | Descripción |
|---|---|
| `store(namespace)` | Devuelve (o crea) un `DynamicStore` cacheado sobre `world` |
| `entityStore(entity, namespace)` | `DynamicStore` sin cache sobre una entidad/jugador |
| `onReady(callback)` | Corre el callback cuando el mundo cargó (o ya mismo si ya cargó) |
| `registerInitFunction(fn, message?)` | Encola (o corre) una función de inicialización, una sola vez |
| `isWorldLoaded()` | `true`/`false` |
| `setDebugMode(enabled)` | Activa logs de debug vía `logger` |
| `rawScan(predicate)` / `rawGet(id)` / `rawDelete(id)` | Acceso directo a `getDynamicPropertyIds()` sin pasar por un store |
| `registerProperty` / `getProperty` / `setProperty` | API legacy plana (sin namespaces de `DynamicStore`), por compatibilidad hacia atrás |

---

<sub>WorldManager por **IIBl4z3MasterII**</sub>
