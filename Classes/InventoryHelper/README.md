# 🎒 InventoryHelper

Clase con métodos estáticos para dar, contar y remover items del
inventario de un jugador sin repetir `getComponent("inventory").container`
en cada script.

---

## Archivos

| Archivo | Rol |
|---|---|
| `InventoryHelper.js` | Clase `InventoryHelper` |

---

## API pública

```js
import { InventoryHelper } from "./Classes/InventoryHelper/InventoryHelper.js";
import { ItemStack } from "@minecraft/server";

InventoryHelper.giveItem(player, new ItemStack("minecraft:diamond", 5));

const diamonds = InventoryHelper.countItem(player, "minecraft:diamond");

if (diamonds >= 5) {
    InventoryHelper.removeItem(player, "minecraft:diamond", 5);
    player.sendMessage("§aCanjeado.");
}
```

| Método | Descripción |
|---|---|
| `giveItem(player, itemStack)` | Da el item; si no entra completo, dropea el sobrante |
| `countItem(player, itemTypeId)` | Cuenta cuántos tiene en el inventario |
| `removeItem(player, itemTypeId, amount)` | Remueve una cantidad; `false` si no tenía suficiente |

---

<sub>InventoryHelper por **IIBl4z3MasterII**</sub>
