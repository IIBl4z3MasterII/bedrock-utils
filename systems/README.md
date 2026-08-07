# Systems

Complete systems with event listeners, persistence and logic
gameplay for Minecraft Bedrock Edition. Unlike `helpers/`,
each one decides on their own when to act (they self-register at
import it, or expose an explicit initialization function — see
board).

| Module | Description | Activated with |
|---|---|---|
| [**ban-system**](ban-system/README.md) | Reportes + baneos temporales/permanentes con UI | `inicializarSistemaBaneos()` |
| [**death-custom-msg**](death-custom-msg/README.md) | Mensajes de muerte personalizados por entidad/causa | Import directo (autoregistra) |
| [**drops-in-inventory**](drops-in-inventory/README.md) | Items to inventory with overflow via `VaultDB` | Direct import (self-registration) |
| [**mob-stacker**](mob-stacker/README.md) | Apilador visual de mobs hostiles via dynamic properties | Import directo (autoregistra, `system.run`) |
| [**world-manager**](world-manager/README.md) | `DynamicStore` + `WorldManager` for lifecycle and persistence | It is used on demand (`worldManager.store(...)`) — no requiere init |

Import everything together:

```js
import { inicializarSistemaBaneos, worldManager, mobStackerManager } from "./systems/index.js";

inicializarSistemaBaneos();
```

> Note: `systems/index.js` does not re-export `VaultDB` (de `drops-in-inventory`)
> or anything about `lore-durability` (which lives in `helpers/`, not here, and has no
> exports). If you need `VaultDB` on another system, import it directly from
> `./drops-in-inventory/vault-db.js`.
