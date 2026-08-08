# Helpers

Atomic and reusable classes for Minecraft Bedrock Edition. Each module
is self-contained, with no external dependencies beyond
`@minecraft/server` (and `@minecraft/server-ui` for `template-ui`). No
depend on `system` — they can be copied loose into any
project.

| Module | Description |
|---|---|
| [**chat-moderation**](chat-moderation/README.md) | Uppercase count, excessive caps detection |
| [**cooldown**](cooldown/README.md) | In-memory cooldown manager, by `id` + `action` |
| [**coordinates**](coordinates/README.md) | Local (`^`), relative (`~`) and absolute coordinates |
| [**enchant-helper**](enchant-helper/README.md) | Encantar `ItemStack` validating enchantment and compatibility |
| [**inventory-helper**](inventory-helper/README.md) | `giveItem`, `countItem`, `removeItem` with overflow handling |
| [**lore-durability**](lore-durability/README.md) | Automatic durability lore — install-and-forget script, no dedicated API |
| [**particle-helper**](particle-helper/README.md) | Geometric particle shapes, trail and animated edge |
| [**raycaster**](raycaster/README.md) | `getEntityLookingAt`, `getBlockLookingAt` |
| [**region**](region/README.md) | Cuboid region with `contains`, `overlaps`, `toJSON`/`fromJSON` |
| [**rtp-helper**](rtp-helper/README.md) | Random teleport with safe-location search and cooldown |
| [**ui-template**](ui-template/README.md) | Declarative builder for `ActionForm`/`ModalForm`/`MessageForm` + menu router |
| [**hours**](hours/README.md) | Countdown timer with `pause`/`resume`/`cancel` |

> Every module (except `lore-durability`) now includes an `example.js`
> with a minimal use case, in addition to its `README.md`.

Import everything together:

```js
import { Region, CooldownManager, Timer } from "./helpers/index.js";
```
