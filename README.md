# 🪨 Bedrock Utils

![version](https://img.shields.io/badge/version-0.0.1-blue?style=flat-square)
![license](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![platform](https://img.shields.io/badge/platform-Bedrock%20Edition-orange?style=flat-square)
![language](https://img.shields.io/badge/language-JavaScript-yellow?style=flat-square)
![api](https://img.shields.io/badge/@minecraft%2Fserver-2.6.0-purple?style=flat-square)

> Collection of scripts, systems and resources to develop add-ons in **Minecraft Bedrock Edition** withJavaScript(Script API Stable).
> Each module is self-contained, documented and ready to integrate into your project.

---

## 📁 Repository architecture

```
bedrock-utils/
├── helpers/                    # Atomic and reusable classes (no business logic of their own)
│   ├── chat-moderation/
│   ├── cooldown/
│   ├── coordinates/
│   ├── enchant-helper/
│   ├── inventory-helper/
│   ├── lore-durability/
│   ├── particle-helper/
│   ├── raycaster/
│   ├── region/
│   ├── rtp-helper/
│   ├── template-ui/
│   ├── timer/
│   └── index.js                # Re-exporta todo lo de arriba en un solo import
├── systems/                    # Full systems: event listeners + persistence + gameplay logic
│   ├── ban-system/
│   ├── death-custom-msg/
│   ├── drops-in-inventory/
│   ├── mob-stacker/
│   ├── world-manager/
│   └── index.js                # Re-exports the public API of each system
├── addons/                     # Complete, installable addons (BP + RP), not just source code
│   └── shop-ui/
│       ├── bp/
│       └── rp/
└── assets/                     # Static resources (glyph textures, etc.)
    └── glyphs/
```

**`helpers/` vs `systems/`:** a helper is a class with methods that you
you call when you need it (without opinion on your game logic); a
system listens to world events on its own and has logic
complete gameplay (some self-register when imported, others
expose an `initialize...()` function to bootstrap explicitly —
review theREADMEof each one).

---

## 🗂️ Available modules

| Module | Description | Docs |
|---|---|---|
| 🧩 **helpers** | Atomic and reusable classes | [→ helpers](helpers/README.md) |
| ⚙️ **systems** | Sistemas completos de gameplay | [→ systems](systems/README.md) |
| 📦 **addons** | Complete and installable addons (BP+RP) | [→ addons](addons/README.md) |
| 🖼️ **assets** | Static resources (textures, glyphs) | [→ assets](assets/README.md) |

---

## ⚙️ Technologies

| Tech | Version |
|---|---|
| Minecraft Bedrock Edition | `1.20.70+` |
| `@minecraft/server` | `2.6.0` |
| `@minecraft/server-ui` | `2.0.0` |
| Language |JavaScript(ESM) |

---

## 🔄 General flow

```
Evento de Minecraft (playerSpawn, entityDie, blockBreak...)
        │
        ▼
   Sistema correspondiente (systems/ban-system, systems/mob-stacker...)
        │
        ├──► helpers/ (Region, Cooldown, InventoryHelper...) como piezas reusables
        ├──► Dynamic Properties / VaultDB / WorldManager (persistencia)
        └──► UI Forms (ActionFormData / ModalFormData / TemplateUI / JSON UI)
```

Each `system` listens to its own events and is independent of each other.
The `helpers` do not depend on any `system` — you can use them alone in
any project without dragging the rest of the repo.

---

## 🚀 Quick use

```bash
git clone https://github.com/IIBl4z3MasterII/bedrock-utils.git
```

Import a point module:

```js
import { Region } from "./helpers/region/index.js";
import { CooldownManager } from "./helpers/cooldown/index.js";
```

Or a whole group at once, using the aggregator index:

```js
import { Region, CooldownManager, Timer } from "./helpers/index.js";
import { worldManager, mobStackerManager } from "./systems/index.js";
```

For the shop addon (`addons/shop-ui`), it is not imported — it is installed
as behavior pack + resource pack. See your
[README](addons/shop-ui/README.md).

---

## 👤 Author

**IIBl4z3MasterII** — API Script Developer andJSONUI for Minecraft Bedrock.

| | |
|---|---|
| 🌐 Site | [bl4z3community.neocities.org](https://bl4z3community.neocities.org/) |
| 📁 Portfolio | [See portfolio](https://bl4z3community.neocities.org/portafolio/) |
| 📦CurseForge| [iibl4z3master](https://www.curseforge.com/members/iibl4z3master/projects) |
| ▶️YouTube| [@bl4z3master](https://www.youtube.com/@bl4z3master) |
| 💬 Discord | [Join](https://discord.gg/kBNHNxXbMM) |

If you use any system from this repo in your project, please **mention the original creator**.

---

<sub>Personal project • Not affiliated with Mojang or Microsoft</sub>
