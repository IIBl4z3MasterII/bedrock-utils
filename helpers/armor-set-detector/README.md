# 🛡️ Armor Set Detector

Reusable helper that scans a player's inventory for a mapped block and
auto-equips (or removes) a matching armor set. Includes slot and hotbar
detection utilities. No side effects on import — you instantiate it and
call `start()` yourself.

## Usage

```js
import { ArmorSetDetector, DEFAULT_ARMOR_MAPPING } from "./helpers/armor-set-detector/index.js";

const detector = new ArmorSetDetector(DEFAULT_ARMOR_MAPPING, {
  intervalTicks: 20,
  searchHotbarOnly: false
});

detector.start();
```

See `example.js` for a full example, including extending the
default mapping and reading hotbar slots directly.

## Mapping format

```js
{
  "minecraft:iron_block": {
    type: "iron",
    name: "iron",
    fullSet: true,
    head: false, chestplate: true, leggings: true, boots: false
  }
}
```

`DEFAULT_ARMOR_MAPPING` covers iron, diamond, gold (chest+legs only),
netherite, and copper→chainmail (head+legs+boots, vanilla has no
chainmail chestplate item).

## Slot & hotbar API

| Method                          | Returns                                            |
| -------------------------------- | --------------------------------------------------- |
| `ArmorSetDetector.isHotbarSlot(i)` | `boolean` — true if `i` is 0-8                     |
| `getSlotItem(player, slotIndex)`  | `ItemStack \| null` at that inventory slot          |
| `getHotbarSlots(player)`          | `{ slotIndex, item }[]` for slots 0-8                |
| `findMappedItem(player)`          | `{ blockId, slotIndex, inHotbar } \| null` — first mapping match |

## Notes

- Uses `equippable` component with a manual `equipment_inventory` fallback,
  same pattern as the rest of the repo.
- `removeArmor(player)` and `checkPlayers()` are public if you want to call
  them outside the interval loop (e.g. from a custom command).
- One detector instance = one mapping + one interval. Create multiple
  instances for different mappings/rates if needed.
