# 🛒 Shop UI (full addon)

Unlike `helpers/` and `systems/` (code to copy/paste into
from your own addon), this is a **complete installable addon**: behavior
pack + resource pack with your own `manifest.json`, ready to load into
Minecraft as is.

---

## Structure

```
shop-ui/
├── bp/                          # Behavior Pack
│   ├── manifest.json
│   ├── pack_icon.png
│   └── scripts/
│       ├── main.js              # Shop logic (UI, purchase, stock, economy)
│       └── shop-config.js       # Config: items, prices, materials, messages
└── rp/                          # Resource Pack
    ├── manifest.json
    ├── pack_icon.png
    ├── textures/
    │   └── my_button.png
    └── ui/
        ├── _ui_defs.json
        ├── server_form.json
        └── center/forms/gallery_form.json
```

---

## How to install

1. Copy `bp/` to `com.mojang/development_behavior_packs/` (o
package as `.mcpack`).
2. Copy `rp/` to `com.mojang/development_resource_packs/`.
3. Activate both packs in the world, in that order (BP and RP).

---

## `shop-config.js` — what is configured

| Export | Content |
|---|---|
| `PROPERTY_KEYS` | Names of the Dynamic Properties used to persist stock/economy |
| `ECONOMY_CONFIG` | Price/economic parameters |
| `STOCK_CONFIG` | Limits and stock replenishment |
| `MATERIALS` | Catalog of materials/items available in the store |
| `ITEM_TYPES` | Item categories |
| `UI_CONFIG` | Texts/interface settings |
| `MESSAGES` | Strings shown to the player |
| `SOUNDS` | Sounds played in different actions |
| `SHOP_ITEM` | Item that opens the store when used (`"minecraft:stick"` by default) |

To customize the store (prices, catalog, texts), edit
**only `shop-config.js`** — `main.js` should not need changes to
normal use.

---

## `main.js`

Module of ~1200 lines, without exports (it registers itself when loading the pack).
Usa `world.setDynamicProperty`/`getDynamicProperty` direct (with helpers
own `saveObjectData`/`loadObjectData`) to persist stock and
economy — does not use `WorldManager`/`DynamicStore` de `systems/world-manager/`.

---

## `rp/ui/`

JSONUI custom (`_ui_defs.json`, `server_form.json`,
`center/forms/gallery_form.json`) para el estilo visual de la tienda
(multi-tab, item gallery) instead of using the `ActionFormData` generic
of the Forms API.

---

## Grades

- **Fix applied:** `main.js` imported `./shop_config.js` (underscore)
but the actual file is called `shop-config.js` (middle dash) — the
import did not resolve and the script failed to load. Corrected to
`./shop-config.js`.
- It is the only module in the repo that is distributed as a complete addon in
instead of source code to integrate by hand — keep this in mind if you are
looking for "copy/paste version" of a store system (does not exist
here; This replaces that need with a ready-to-use pack).

---

<sub>Shop UI by **IIBl4z3MasterII**</sub>, UI by **drag0nd**
