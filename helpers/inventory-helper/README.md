# 🎒InventoryHelper

Class with static methods to give, count and remove items from the
inventory of a player, without repeating
`player.getComponent("minecraft:inventory").container` in each script.

---

## Archive

| Archive | Role |
|---|---|
| `index.js` | Class `InventoryHelper` |

---

## Why does it exist

The three most common operations on an inventory (give an item,
count how many you have of something, remove a quantity) require managing the
`container`, iterate slots and deal with overflow. This class solves it
just once.

---

## Public API

| Method | Parameters | Returns | Description |
|---|---|---|---|
| `giveItem(player,itemStack)` | `player: Player`, `itemStack: ItemStack` | `boolean` | Give the item: first fill existing slots of the same `typeId` up to 64, then use empty slots, and if there is still extra, drop the rest to the ground. `true` if entered complete |
| `countItem(player,itemTypeId)` | `player: Player`, `itemTypeId: string` | `number` | Add the total amount of that `typeId` in inventory |
| `removeItem(player,itemTypeId, amount)` | `player: Player`, `itemTypeId:string`, `amount: number` | `boolean` | Remove the requested quantity; `false` if it didn't have enough (does not remove any partial) |

---

## Usage example

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

## Grades

-`giveItem` first try to fill partial slots of the same item
(up to stack of 64) before occupying empty slots — more efficient than
before, which delegated everything to `container.addItem`.
-`giveItem` never "lose" items: if the inventory is full, the
Any excess is dropped at the player's position instead of being discarded.
-`removeItem` is all-or-nothing: if there is not enough quantity, it does not touch the
inventory and returns `false` — this way you avoid leaving the player with less
of what he had without completing the operation.
- Does not distinguish items with NBT/lore different from the same `typeId` — count and
removes by type, not by exact instance.

---

<sub>InventoryHelperby **IIBl4z3MasterII**</sub>
