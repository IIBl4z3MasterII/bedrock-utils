# Systems

Complete systems with event listeners, persistence and logic
gameplay for Minecraft Bedrock Edition. Unlike `helpers/`,
each one decides on their own when to act (they self-register at
import it, or expose an explicit initialization function — see
board).

| Module | Description | Activated with |
|---|---|---|
| [**ban-system**](ban-system/README.md) | Reports + temporary/permanent bans with UI | `initBanSystem()` |
| [**death-custom-msg**](death-custom-msg/README.md) | Custom death messages by entity/cause | Direct import (self-registers) |
| [**drops-in-inventory**](drops-in-inventory/README.md) | Items to inventory with overflow via `VaultDB` | Direct import (self-registration) |
| [**mob-stacker**](mob-stacker/README.md) | Visual hostile mob stacker via dynamic properties | Direct import (self-registers, `system.run`) |
| [**custom-commands**](custom-commands/README.md) | Custom slash commands (`/blaze:...`) via `CustomCommand` API | Direct import (self-registers) |
| [**world-manager**](world-manager/README.md) | `DynamicStore` + `WorldManager` for lifecycle and persistence | Used on demand (`worldManager.store(...)`) — no init required |

Import everything together:

```js
import { initBanSystem, worldManager, mobStackerManager } from "./systems/index.js";

initBanSystem();
```

> Note: `systems/index.js` does not re-export `VaultDB` (from `drops-in-inventory`),
> `custom-commands` (side-effects only), or anything about `lore-durability`
> (which lives in `helpers/`, not here, and has no exports). If you need
> `VaultDB` on another system, import it directly from
> `./drops-in-inventory/vault-db.js`.
