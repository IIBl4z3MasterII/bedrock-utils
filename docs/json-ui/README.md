# Bedrock Utils — JSON UI Reference

Practical knowledge base for developing JSON UI interfaces in Minecraft Bedrock, built **exclusively from real implementations** found in 18 local worlds (extracted resource packs and behavior packs).

> **Golden rule**: Nothing here is invented. Every pattern, binding, control, or structure comes from real `.json` files in your worlds. Anything that doesn't appear in any of your packs is explicitly marked as **not observed**.

---

## Index

1. [Fundamentals](./fundamentals.md) — Pack structure, `_ui_defs.json`, namespaces, overrides vs new files, inheritance, global variables.
2. [Layout](./layout.md) — Panels, stack panels, grids, anchors, offsets, relative/absolute sizes, `fill`/`c`/`cm`/`sm`/`y`, clipping.
3. [Components](./components.md) — Buttons, labels, images, inputs (text_edit_box), lists, scroll views, grids, tooltips, modals.
4. [Complete Interfaces](./interfaces.md) — HUD, server_form, pause_screen, chat_screen, scoreboard, containers (chest), custom forms.
5. [Advanced Patterns](./advanced-patterns.md) — Bindings (view/global/collection/collection_details), factories, templates, dynamic components, navigation, animations, Script API integration.
6. [Reference of Analyzed Packs](./packs.md) — Summary of each pack, what it contributes, what's reusable, what to avoid.
7. [JSON Fragments](./examples/README.md) — Focused, annotated fragments of each pattern (search_bar, server_form router, _ui_defs, scoreboard, animations), extracted from production.

---

## Methodology

| Source | What it contributes |
|---|---|
| **IIBl4z3MasterII's worlds (18)** | Complete and partial implementations |
| **Microsoft Learn (Tier 1)** | API, enum, Script API method validation |
| **CubitosMC (Tier 4)** | Particle verification |
| **Bedrock Wiki / Community** | Additional context |

**Conventions in this doc:**
- `file.json:line` — literal quote from the JSON
- `**Bold**` = real name of the control/property in the JSON
- `⚠` = warning / observed bad practice
- `✓` = validated, reusable pattern
- `❌` = not observed in any analyzed pack

---

## Executive summary of findings

| Category | Patterns found | Quality |
|---|---|---|
| **Server Forms** | Title-based router (`server_form.long_form`), button grid with factory, native custom form (label/toggle/slider/dropdown/input) | ✓ Mature (Scoreboar, Bl4z3, WayMar) |
| **Search Bar** | `search_form.advanced_long_form` with text_edit_box + icon + string-processing filter in view bindings | ✓ Complete (Scoreboar) |
| **Hover Tooltips** | `follows_cursor:true` screen + `layer:100` + collection binding | ✓ Minimal but functional (Scoreboar) |
| **HUD / Title / ActionBar** | `hud_screen.json` override + global bindings `#hud_title_text_string`, `#actionbar_text`, native scoreboard sidebar | ✓ Standard (Scoreboar, Leaderboar, System Slayer) |
| **Scoreboard** | `scoreboards.json` override with `scoreboard_players`/`scoreboard_scores` collections, factory rows | ✓ Clean (Scoreboar, Bl4z3) |
| **Containers (Chest)** | `chest_screen.json` same-key override, 9×N grids, `common.inventory_screen_common` inheritance | ✓ Complete (UltimateSu, invsee) |
| **Pause Screen** | `insert_back` modifications in `root_panel`, custom button + waypoints panel | ✓ Functional (WayMar, ChunkPrevi) |
| **Animations** | `anim_type`: alpha/size/offset/wait/flip_book, `easing`, `next`, `destroy_at_end`, `clip_direction:left` for bars | ✓ Rich (Scoreboar loading, bl4z3_forms gradient, AmBro background) |
| **bl4z3_forms framework** | Centralized theme `$cuigv:*`, 4-state animated buttons, 8-sub-state tabs, sliders, toggles, modals, tooltip-bubble — `.cui`/`bl4z3_*` framework of the Bl4z3 pack | ✓ Independent (bl4z3_forms) |
| **Animated Background (AmBro)** | `ambro_x_background` + `animations.json` with flip_book UV, referenced from start/settings screens | ✓ Unique (System Slayer, H3o4ZE) |
| **Binding String-Processing** | `%.Ns` slicing, concatenation, subtraction, comparison, suffix flags (`.icon`, `.sidebar`, `~`, `@`) | ✓ Advanced (Bl4z3, Scoreboar search) |

---

## What has NOT been observed (real gaps)

- **Drag & drop** between grids — no `draggable`/`drop_target` in the analyzed packs.
- **Real virtual scrolling** (only `scrolling_panel` with fixed content).
- **WebView / iframe / HTML** — does not exist in Bedrock JSON UI.
- **IME / custom virtual keyboard** — only native `text_edit_box`.
- **Audio-reactive UI** — only `sound_name` on buttons.
- **Integrated internationalization (i18n)** — all texts come from the server or are hardcoded; `_global_variables.json` defines colors, not strings.
- **Automated UI testing** — no tooling in the packs.
- **Hot-reload of JSON UI at runtime** — requires reloading the pack.

---

## How to use this reference

1. **To create X** → go to the corresponding category (e.g. `components/buttons.md`, `advanced-patterns/factories.md`).
2. **Copy the pattern** — each section includes a "Minimal reusable example" with ready-to-adapt JSON.
3. **Adapt the variables** — replace textures (`textures/ui/custom/...`), colors (`$cuigv:*`), sizes and bindings to your protocol.
4. **Validate against vanilla** — same-key overrides (chest_screen, hud_screen, server_form, scoreboards) don't need `_ui_defs.json`; NEW files do.

---

## Credits of the analyzed packs

| World | Pack(s) | Main contribution |
|---|---|---|
| `yUyl6PzY1xA=` | `[Scoreboar]` (RP+BP) | Search bar, tooltips, HUD/title/actionbar, scoreboard, loading anim, full server_form |
| `a0+tXtMv4LY=` | `RPBl4z3Forms` + `BPBl4z3Forms` | **bl4z3_forms** framework (`.cui` Collapse-UI v4.1 + `bl4z3_form`/`bl4z3_common`), server_form router, grids, sidebar, gradients, paperdoll |
| `2C159eIMLJo=` | `UltimateSu` | Vanilla container overrides (chest/ender/shulker/barrel), player renderer in chest, ui_template_tabs |
| `jt+WZgXoAQA=` | `rp invsee`, `[Scoreboar]`, `RP`, `Bl4z3Entit` | invsee, pocket_containers |
| `Geq7734AhFM=` | `[RP]WayMar` + `[BP]WayMar` | Pause screen + waypoint forms, 67KB common primitives |
| `TuRCdiIjjEw=` | `RP ChunkPrevi` + `BP ChunkPrevi` | Waypoint forms (gallery_form), hud + scoreboard + server_form |
| `Ckr82bjcBWA=` | `[RP]ChatCh` + `[BP]ChatCh` | Chat screen variants (channel button, header fix) |
| `ehtcdHnEp4o=` | `Leaderboar` (RP+BP) | Leaderboard HUD via chat, leaderboard.js |
| `ZhkTZFZlAgA=` | `[RP] System Slayer v2` | Scoreboard, server_form, **AmBro animated background** |
| `H3o4ZE1zCQA=` | `[Scoreboar]` (variant) | Same AmBro pattern + scoreboard |
| `48mGwha4hgQ=` | `pack(2)` (RP+BP) | 116KB giant shop, animated_bar, simple server_form |
| `auccjAVLQ+g=` | `Skin` | (skin only, no UI) |
| `Jj1fevJ16G0=` | `[RP]AcidRa` + `[BP]AcidRa` | (no significant own UI) |
| `KymQscjmjoI=` | (empty) | — |
| `TP5KVMpXhDI=` | (empty) | — |

> Total: **15 packs with real UI** from the 18 worlds of **IIBl4z3MasterII**. 3 worlds without active resource packs.