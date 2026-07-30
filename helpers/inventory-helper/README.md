# 🎒 InventoryHelper

Clase con métodos estáticos para dar, contar y remover items del
inventario de un jugador, sin repetir
`player.getComponent("minecraft:inventory").container` en cada script.

---

## Archivo

| Archivo | Rol |
|---|---|
| `index.js` | Clase `InventoryHelper` |

---

## Por qué existe

Las tres operaciones más comunes sobre un inventario (dar un item,
contar cuántos tenés de algo, quitar una cantidad) requieren manejar el
`container`, iterar slots y lidiar con overflow. Esta clase lo resuelve
una sola vez.

---

## API pública

| Método | Parámetros | Devuelve | Descripción |
|---|---|---|---|
| `giveItem(player, itemStack)` | `player: Player`, `itemStack: ItemStack` | `boolean` | Da el item: primero rellena slots existentes del mismo `typeId` hasta 64, después usa slots vacíos, y si sigue sobrando dropea el resto al suelo. `true` si entró completo |
| `countItem(player, itemTypeId)` | `player: Player`, `itemTypeId: string` | `number` | Suma la cantidad total de ese `typeId` en el inventario |
| `removeItem(player, itemTypeId, amount)` | `player: Player`, `itemTypeId: string`, `amount: number` | `boolean` | Remueve la cantidad pedida; `false` si no tenía suficiente (no remueve nada parcial) |

---

## Ejemplo de uso

```js
import { InventoryHelper } from "./helpers/inventory-helper/index.js";
import { ItemStack } from "@minecraft/server";

InventoryHelper.giveItem(player, new ItemStack("minecraft:diamond", 5));

const diamonds = InventoryHelper.countItem(player, "minecraft:diamond");

if (diamonds >= 5) {
    InventoryHelper.removeItem(player, "minecraft:diamond", 5);
    player.sendMessage("§aCanjeado.");
}
```

---

## Notas

- `giveItem` primero intenta rellenar slots parciales del mismo item
  (hasta stack de 64) antes de ocupar slots vacíos — más eficiente que
  antes, que delegaba todo a `container.addItem`.
- `giveItem` nunca "pierde" items: si el inventario está lleno, el
  sobrante se dropea en la posición del jugador en vez de descartarse.
- `removeItem` es todo-o-nada: si no hay suficiente cantidad, no toca el
  inventario y devuelve `false` — así evitás dejar al jugador con menos
  de lo que tenía sin completar la operación.
- No distingue items con NBT/lore distinto del mismo `typeId` — cuenta y
  remueve por tipo, no por instancia exacta.

---

<sub>InventoryHelper por **IIBl4z3MasterII**</sub>
