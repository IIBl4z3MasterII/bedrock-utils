# Systems

Sistemas completos con event listeners, persistencia y lógica de
gameplay para Minecraft Bedrock Edition. A diferencia de `helpers/`,
cada uno decide por su cuenta cuándo actuar (se autoregistra al
importarlo, o expone una función explícita de inicialización — ver
tabla).

| Módulo | Descripción | Se activa con |
|---|---|---|
| [**ban-system**](ban-system/README.md) | Reportes + baneos temporales/permanentes con UI | `inicializarSistemaBaneos()` |
| [**death-custom-msg**](death-custom-msg/README.md) | Mensajes de muerte personalizados por entidad/causa | Import directo (autoregistra) |
| [**drops-in-inventory**](drops-in-inventory/README.md) | Items al inventario con overflow vía `VaultDB` | Import directo (autoregistra) |
| [**mob-stacker**](mob-stacker/README.md) | Apilador visual de mobs hostiles via dynamic properties | Import directo (autoregistra, `system.run`) |
| [**world-manager**](world-manager/README.md) | `DynamicStore` + `WorldManager` para ciclo de vida y persistencia | Se usa bajo demanda (`worldManager.store(...)`) — no requiere init |

Importar todo junto:

```js
import { inicializarSistemaBaneos, worldManager, mobStackerManager } from "./systems/index.js";

inicializarSistemaBaneos();
```

> Nota: `systems/index.js` no re-exporta `VaultDB` (de `drops-in-inventory`)
> ni nada de `lore-durability` (que vive en `helpers/`, no acá, y no tiene
> exports). Si necesitás `VaultDB` en otro sistema, importalo directo desde
> `./drops-in-inventory/vault-db.js`.
