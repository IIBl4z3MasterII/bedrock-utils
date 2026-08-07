# ✨EnchantHelper

Class with a static method to enchant a `ItemStack` validating that
the enchantment exists, instead of silently failing or rolling a
cryptic native API error.

---

## Archive

| Archive | Role |
|---|---|
| `index.js` | Class `EnchantHelper` |

---

## Why does it exist

`ItemStack.getComponent("enchantable").addEnchantment(...)` does not validate that
the `enchantId`what happened to him really exists in `EnchantmentTypes` — yes
You have the wrong string, it fails in an unclear way. `EnchantHelper` to choose
both (valid enchantment + enchantable item) before applying, and
throws an `Error` with explicit message if something is wrong.

---

## Public API

| Method | Parameters | Returns | Exceptions |
|---|---|---|---|
| `enchant(itemStack, enchantId, level)` | `itemStack: ItemStack`, `enchantId: string`, `level: number` | The same 'itemStack`, already enchanted | `Error` if `enchantId` does not exist or the item is not enchantable |

---

## Usage example

```js
import { EnchantHelper } from "./helpers/enchant-helper/index.js";
import { ItemStack } from "@minecraft/server";

const sword = new ItemStack("minecraft:diamond_sword", 1);

try {
    EnchantHelper.enchant(sword, "sharpness", 5);
} catch (error) {
    console.warn(`No se pudo encantar: ${error.message}`);
}
```

---

## Grades

- Does not validate the maximum level allowed per enchantment (e.g. Sharpness
vanilla limit is 5, but if you pass it 10 the API can accept it without
notice depending on the version) — if your addon depends on exact limits,
validate it before calling `enchant()`.
- `level` accepts any integer; there is no automatic clamp.

---

<sub>EnchantHelperby **IIBl4z3MasterII**</sub>
