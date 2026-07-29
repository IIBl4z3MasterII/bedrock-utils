# Helpers

Clases atómicas y reusables para Minecraft Bedrock Edition. Cada módulo
es autocontenido, sin dependencias externas más allá de
`@minecraft/server` (y `@minecraft/server-ui` para `template-ui`). No
dependen de ningún `system` — se pueden copiar sueltos a cualquier
proyecto.

| Módulo | Descripción |
|---|---|
| [**chat-moderation**](chat-moderation/README.md) | Conteo de mayúsculas, detección de caps excesivos |
| [**cooldown**](cooldown/README.md) | Manager de cooldowns en memoria, por `id` + `action` |
| [**coordinates**](coordinates/README.md) | Coordenadas local (`^`), relativa (`~`) y absoluta |
| [**enchant-helper**](enchant-helper/README.md) | Encantar `ItemStack` validando encantamiento y compatibilidad |
| [**inventory-helper**](inventory-helper/README.md) | `giveItem`, `countItem`, `removeItem` con manejo de overflow |
| [**lore-durability**](lore-durability/README.md) | Lore automático con durabilidad — script de instalar y olvidar, sin API propia |
| [**particle-helper**](particle-helper/README.md) | Formas geométricas de partículas, trail y borde animado |
| [**raycaster**](raycaster/README.md) | `getEntityLookingAt`, `getBlockLookingAt` |
| [**region**](region/README.md) | Región cuboide con `contains`, `overlaps`, `toJSON`/`fromJSON` |
| [**rtp-helper**](rtp-helper/README.md) | Random teleport con búsqueda de ubicación segura y cooldown |
| [**template-ui**](template-ui/README.md) | Builder declarativo de `ActionForm`/`ModalForm`/`MessageForm` + router de menús |
| [**timer**](timer/README.md) | Cuenta regresiva con `pause`/`resume`/`cancel` |

Importar todo junto:

```js
import { Region, CooldownManager, Timer } from "./helpers/index.js";
```
