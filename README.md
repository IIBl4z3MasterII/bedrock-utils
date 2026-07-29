# 🪨 Bedrock Utils

![version](https://img.shields.io/badge/version-2.0.0-blue?style=flat-square)
![license](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![platform](https://img.shields.io/badge/platform-Bedrock%20Edition-orange?style=flat-square)
![language](https://img.shields.io/badge/language-JavaScript-yellow?style=flat-square)
![api](https://img.shields.io/badge/@minecraft%2Fserver-2.6.0-purple?style=flat-square)

> Colección de scripts, sistemas y recursos para desarrollar add-ons en **Minecraft Bedrock Edition** con JavaScript (Script API Stable).
> Cada módulo es autocontenido, documentado y listo para integrar en tu proyecto.

---

## 📁 Arquitectura del repositorio

```
bedrock-utils/
├── helpers/                    # Clases atómicas y reusables (sin lógica de negocio propia)
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
├── systems/                    # Sistemas completos: event listeners + persistencia + lógica de gameplay
│   ├── ban-system/
│   ├── death-custom-msg/
│   ├── drops-in-inventory/
│   ├── mob-stacker/
│   ├── world-manager/
│   └── index.js                # Re-exporta la API pública de cada sistema
├── addons/                     # Addons completos e instalables (BP + RP), no solo código fuente
│   └── shop-ui/
│       ├── bp/
│       └── rp/
└── assets/                     # Recursos estáticos (texturas de glyphs, etc)
    └── glyphs/
```

**`helpers/` vs `systems/`:** un helper es una clase con métodos que vos
llamás cuando la necesitás (sin opinión sobre tu lógica de juego); un
system escucha eventos del mundo por su cuenta y tiene una lógica de
gameplay completa (algunos se autoregistran al importarlos, otros
exponen una función `inicializar...()` para arrancar explícitamente —
revisar el README de cada uno).

---

## 🗂️ Módulos disponibles

| Módulo | Descripción | Docs |
|---|---|---|
| 🧩 **helpers** | Clases atómicas y reusables | [→ helpers](helpers/README.md) |
| ⚙️ **systems** | Sistemas completos de gameplay | [→ systems](systems/README.md) |
| 📦 **addons** | Addons completos e instalables (BP+RP) | [→ addons](addons/README.md) |
| 🖼️ **assets** | Recursos estáticos (texturas, glyphs) | [→ assets](assets/README.md) |

---

## ⚙️ Tecnologías

| Tech | Versión |
|---|---|
| Minecraft Bedrock Edition | `1.20.70+` |
| `@minecraft/server` | `2.6.0` |
| `@minecraft/server-ui` | `2.0.0` |
| Lenguaje | JavaScript (ESM) |

---

## 🔄 Flujo general

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

Cada `system` escucha sus propios eventos y es independiente entre sí.
Los `helpers` no dependen de ningún `system` — podés usarlos sueltos en
cualquier proyecto sin arrastrar el resto del repo.

---

## 🚀 Uso rápido

```bash
git clone https://github.com/IIBl4z3MasterII/bedrock-utils.git
```

Importar un módulo puntual:

```js
import { Region } from "./helpers/region/index.js";
import { CooldownManager } from "./helpers/cooldown/index.js";
```

O todo un grupo de una vez, usando el índice agregador:

```js
import { Region, CooldownManager, Timer } from "./helpers/index.js";
import { worldManager, missionSystem } from "./systems/index.js";
```

Para el addon de tienda (`addons/shop-ui`), no se importa — se instala
como behavior pack + resource pack. Ver su
[README](addons/shop-ui/README.md).

---

## 👤 Autor

**IIBl4z3MasterII** — Desarrollador de Script API y JSON UI para Minecraft Bedrock.

| | |
|---|---|
| 🌐 Sitio | [bl4z3community.neocities.org](https://bl4z3community.neocities.org/) |
| 📁 Portafolio | [Ver portafolio](https://bl4z3community.neocities.org/Manifest/portafolio) |
| 📦 CurseForge | [iibl4z3masterii](https://www.curseforge.com/members/iibl4z3masterii/projects) |
| ▶️ YouTube | [@bl4z3master](https://www.youtube.com/@bl4z3master) |
| 💬 Discord | [Unirse](https://discord.gg/kBNHNxXbMM) |

Si usas cualquier sistema de este repo en tu proyecto, por favor **menciona al creador original**.

---

<sub>Proyecto personal • No afiliado con Mojang ni Microsoft</sub>
