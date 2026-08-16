# Docs

> Documentation for **Bedrock Utils**, the add-on development kit for Minecraft Bedrock Edition of **IIBl4z3MasterII**. Each subfolder contains its own README with index and usage.

---

## 📂 Contents

| Folder | What it documents | Entry point |
|---|---|---|
| 📖 **json-ui** | Complete JSON UI knowledge base for Bedrock: fundamentals, layout, components, full screens, advanced patterns (bindings, factories, routers, animations, Script API integration), analysis of 15 real resource packs, and annotated JSON fragments | [→ json-ui/README.md](./json-ui/README.md) |

---

## 🔗 How the folders relate

```
docs/
└── json-ui/                    # JSON UI reference (the main knowledge base)
    ├── README.md               # Index + executive summary of findings
    ├── fundamentals.md         # Pack structure, _ui_defs.json, namespaces, overrides
    ├── layout.md               # Panels, grids, anchors, offsets, sizes
    ├── components.md           # Buttons, labels, images, inputs, scroll, tooltips, modals
    ├── interfaces.md           # HUD, server form, pause, chat, scoreboard, containers
    ├── advanced-patterns.md    # Bindings, factories, templates, navigation, animations, Script API
    ├── packs.md                # Reference of the 15 analyzed resource packs
    └── examples/               # Annotated JSON fragments of each pattern
```

---

## 🧭 How to use

1. Start at **json-ui/README.md** for the index and the executive summary of what was found.
2. Go to the specific file for the topic you need (layout, components, patterns...).
3. Copy the pattern and adapt textures, colors and bindings to your protocol.

> **Rule of the knowledge base**: nothing is invented. Every pattern comes from the real resource packs found in the 18 worlds of **IIBl4z3MasterII**.

---

<sub>Personal project • Not affiliated with Mojang or Microsoft</sub>