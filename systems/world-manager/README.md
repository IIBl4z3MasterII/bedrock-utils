#💾WorldManager

Own system to centralize access to Dynamic Properties: instead
to have them distributed throughout the addon with loose reads/writes,
everything happens here — a single entry point that resolves the parsing of
types, error handling, distribution (world vs. entity), and
world cargo life cycle. Two classes: `DynamicStore` (el wrapper
low level) and `WorldManager` (singleton that manages the life cycle +
store factory).

---

## Files

| Archive | Role |
|---|---|
| `index.js` | Classes `DynamicStore` and `WorldManager` (export default: single instance) |
| `logger.js` | Console logger with levels (`debug`/`info`/`warn`/`error`), used internally by `WorldManager` |

---

##`DynamicStore`

Target agnostic wrapper — works the same on `world` or on a
`Entity`/`Player`. Auto-detect type (bool/number/JSON/string) al leer, y
serializes objects toJSONin writing. Optionally cache in memory.

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

Bedrock cuts Dynamic Properties at ~32 KB per string. `setLarge`/`getLarge`
They split the value into chunks automatically if necessary:

```js
configStore.setLarge("bigPayload", hugeArrayOrObject);
const data = configStore.getLarge("bigPayload");
```

### Store per entity (no cache — each player has their own storage)

```js
const playerStore = worldManager.entityStore(player, "stats");
playerStore.set("kills", 10);
```

| Method | Description |
|---|---|
| `get(name,defaultValue?)` | Read and parse the value (bool/number/JSON/string) |
| `set(name, value)` | Save (serializes objects toJSON) |
| `has(name)` | `true` if exists |
| `delete(name)` | Delete (and its chunks, if any) |
| `keys()` | All namespace keys (requires non-empty namespace) |
| `setLarge(name, value,chunkSize?)` / `getLarge(name, default?)` | Para payloads > 8 KB |
| `invalidateCache(name?)` | Clear the cache in memory (one key or all) |

---

##`WorldManager`

Singleton (`export default`) that solves the problem of "the world is still
did not load" and centralizes the creation of `DynamicStore`s.

```js
import worldManager, { onWorldReady } from "./systems/world-manager/index.js";

// Runs as soon as the world is ready (or immediately if it already is)
onWorldReady(() => {
    console.log("Mundo listo, arrancando sistemas...");
});

// Alternative: register an init function that runs only once
worldManager.registerInitFunction(() => {
    // setup que necesita el mundo cargado
}, "Sistema X inicializado");

const store = worldManager.store("myApp");
```

| Method | Description |
|---|---|
| `store(namespace)` | Returns (or creates) a `DynamicStore`curly about `world` |
| `entityStore(entity, namespace)` | `DynamicStore` no cache on an entity/player |
| `onReady(callback)` | Run the callback when the world loaded (or right now if it already loaded) |
| `registerInitFunction(fn, message?)` | Queue (or run) an initialization function, just once |
| `isWorldLoaded()` | `true`/`false` |
| `setDebugMode(enabled)` | Activate debug logs via `logger` |
| `rawScan(predicate)` / `rawGet(id)` / `rawDelete(id)` | Shortcut to `getDynamicPropertyIds()` without going through a store |
| `registerProperty`/`getProperty`/`setProperty` | Flat legacy API (no ` namespacesDynamicStore`), for backward compatibility |

---

<sub>WorldManagerby **IIBl4z3MasterII**</sub>
