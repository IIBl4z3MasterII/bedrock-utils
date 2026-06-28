# 🪨 Bedrock Utils

![version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)
![license](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![platform](https://img.shields.io/badge/platform-Bedrock%20Edition-orange?style=flat-square)
![language](https://img.shields.io/badge/language-JavaScript-yellow?style=flat-square)
![api](https://img.shields.io/badge/@minecraft%2Fserver-2.6.0-purple?style=flat-square)

> Colección de scripts, sistemas y recursos para desarrollar add-ons en **Minecraft Bedrock Edition** con JavaScript (Script API Stable).  
> Cada sistema es autocontenido, documentado y listo para integrar en tu proyecto.

---

## 📁 Arquitectura del repositorio

```
bedrock-utils/
├── Classes/                    # Sistemas JS orientados a objetos
│   ├── Ban System/
│   ├── Death Custom Msg/
│   ├── Drops In Inventory/
│   ├── MobStacker + Mission System/
│   ├── Dynamic Pros Template.js
│   └── Lore Items Durability + Lore items.js
├── scoreboard/                 # Sistemas de scoreboard y glyphs
│   └── Glyphs/
├── ui/                         # Interfaces de usuario (JSON UI + Script API)
│   └── ShopUI ( Multitab UI )/
└── docs/                       # 📚 Documentación modular
    ├── classes/                # Docs por archivo de Classes/
    ├── scoreboard/             # Docs de Scoreboard
    └── ui/                     # Docs de UI
```

---

## 🗂️ Módulos disponibles

| Módulo | Descripción | Docs |
|---|---|---|
| 📦 **Classes** | Managers y sistemas JS | [→ docs/classes](docs/classes/README.md) |
| 📊 **Scoreboard** | Glyphs y sistemas de ranking | [→ docs/scoreboard](docs/scoreboard/README.md) |
| 🖼️ **UI** | Interfaces con JSON UI + Script API | [→ docs/ui](docs/ui/README.md) |

---

## ⚙️ Tecnologías

| Tech | Versión |
|---|---|
| Minecraft Bedrock Edition | `1.20.70+` |
| `@minecraft/server` | `2.6.0` |
| `@minecraft/server-ui` | `2.0.0` |
| Lenguaje | JavaScript (ESM) |

---

## 🔄 Flujo general del addon

```
Evento de Minecraft (playerSpawn, entityDie, blockBreak...)
        │
        ▼
   Sistema correspondiente (BanSystem / MobStacker / DropManager...)
        │
        ├──► Dynamic Properties  (persistencia entre sesiones)
        ├──► Scoreboards         (economía / stats visibles)
        └──► UI Forms            (ActionFormData / ModalFormData / JSON UI)
```

Cada sistema escucha sus propios eventos y es independiente. No hay acoplamiento forzado entre módulos: pueden integrarse de forma opcional.

---

## 🚀 Uso rápido

```bash
git clone https://github.com/IIBl4z3MasterII/bedrock-utils.git
```

Entra a la carpeta del sistema que necesites, lee su doc en `docs/` e importa el archivo `.js` en tu `main.js`.

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
