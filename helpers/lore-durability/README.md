# 🏷️ Lore Durability

"Install and forget" script that keeps the lore of the
player items: shows the remaining durability in real time for
items that are spent, and adds a fixed lore signature to those that do not have
durability component.

---

## Archive

| Archive | Role |
|---|---|
| `index.js` | All logic — no exports, auto-executes upon import |

---

## Why does it exist

Bedrock does not show numerical durability in the item tooltip
natively visible as text — just the color bar. This script
write `§7Durability: X/Y` as the first line of the lore, updating it
alone as the item is spent, and avoids rewriting the lore if the
text did not change (so as not to generate unnecessary item updates).

---

## How it works inside

Run dos `system.runInterval`independents hardly care
file — **you don't have to call any function to activate it**:

| Interval | Frequency | What updates |
|---|---|---|
| Team | every `20` ticks (~1s) | Armor and offhand (`getComponent("minecraft:equippable")`) |
| Inventory | every `40` ticks (~2s) | All main inventory slots |

For each item reviewed (`updateItemLore`):

```
has component "minecraft:durability"?
    yes → calculate current durability = max - damage
          does the lore already say that text? → don't touch it
          if not → rewrite lore with the new value
    no → does it already have the default lore ("by @bl4z3master")?
         no → append it to the end of the existing lore
```

---

## Internal config

```js
const CONFIG = {
    EQUIPMENT_UPDATE_INTERVAL: 20,   // ticks between equipment updates
    INVENTORY_UPDATE_INTERVAL: 40,   // ticks between inventory updates
    DEFAULT_LORE: "by @bl4z3master", // signature for items without durability
    DURABILITY_FORMAT: "§7Durability: %current%/%max%",
};
```

To change the durability text or signature, edit this constant
directly in `index.js` (not exposed as a configurable parameter
from outside — it's a direct installation script, not a class).

---

## Use

```js
import "./helpers/lore-durability/index.js";
// Nothing else to do — it activates just by importing it.
```

---

## Grades

- **Does not export anything** — unlike the rest of `helpers/`, this module
It is a side effect script, not a class with API. I just know
import once in the addon's `main.js`.
- If the item already had another lore before receiving the default signature, it
adds to the end of the array (`[...lore,DEFAULT_LORE]`), it does not
  replace it.
- The check `item.getLore()?.[0] !==durabilityText` avoids rewriting the
lore in each tick if it did not change — important to not generate load
extra in large inventories.

---

<sub>Lore Durability by **IIBl4z3MasterII**</sub>
