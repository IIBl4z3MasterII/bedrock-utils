# Reference of Analyzed Packs

> Detailed inventory of the 15 UI resource packs extracted from 18 Bedrock worlds. Each entry indicates what it contributes, what's reusable, and what to avoid.

---

## 1. `[Scoreboar]` — `yUyl6PzY1xA=` (world `1_10`) ⭐ Main reference

**Location**: `minecraftWorlds\yUyl6PzY1xA=\resource_packs\[Scoreboar\ui\`  
**Also present**: `jt+WZgXoAQA=\resource_packs\[Scoreboar\ui\` (variant), `H3o4ZE1zCQA=\resource_packs\[Scoreboar\ui\` (variant)

**Files**:
- `hud_screen.json` — HUD override: custom actionbar (`nperma_root`), coordinates+days panel, root_panel modifications
- `server_form.json` — full ActionForm + ModalForm, `long_form`/`custom_form` factory, body scroll, button grid
- `scoreboards.json` — sidebar override with `scoreboard_players`/`scoreboard_scores` collections
- `chat_screen.json` — chat override
- `ui_common.json` — common override (scrollbar fadeout anim)
- `search_form.json` — advanced search bar with text_edit_box **← gem**
- `hover_tooltip.json` — tooltip that follows the cursor **← gem**
- `while.json` — title/subtitle overlay with image routing and offset anim
- `loading_anim.json` — full loading screen with flip_book and loading bar **← gem**
- `_ui_defs.json` — only new files (no overrides) ✓

**BP**: `scripts/` with `FormBuilder.js` (server-ui), `worldManager.js` (setDynamicProperty only for persistence). `@minecraft/server` + `server-ui` node_modules included.

**Contributions**:
- ✅ Search bar with input + filtering by bindings
- ✅ Custom tooltip with `follows_cursor`
- ✅ Loading screen with chained animations
- ✅ HUD with player_position + days played
- ✅ Server form with grid + factory
- ✅ Correct use of `_ui_defs.json`

**Avoid**:
- ⚠ `alpha: 2.0` in hud_actionbar_text (out of range)
- ⚠ `nperma_root` as binding (check which channel the BP uses; can break if the BP changes the format)

---

## 2. `RPBl4z3Forms` — `a0+tXtMv4LY=` (world `Bl4z3`)

**Location**: `minecraftWorlds\a0+tXtMv4LY=\resource_packs\RPBl4z3Forms\ui\`

**Structure**: **`bl4z3_forms`** framework (`.cui` / Collapse-UI v4.1 + `bl4z3_form`/`bl4z3_common`) + legacy per-service forms.

> **Names in this doc**: the pack's full framework (`.cui` theme, `$cuigv:*`, and the `bl4z3_*` primitives) is documented as **`bl4z3_forms`**. "Bl4z3" is only used as the origin world.

**Key files**:
- `_ui_defs.json` — 66 entries (⚠ includes redundant vanilla overrides)
- `_global_variables.json` — ⚠ two root objects (invalid JSON) + `$cuigv:*` variables
- `server_form.json` — router by `$title_text` (SHOP/MAP/SKILLS/MAIN) **← gem**
- `scoreboards.json` — scoreboard override
- `hud_screen.json` — HUD override
- `ui_template_buttons.json` / `ui_template_toggles.json` / `ui_template_dialogs.json` — vanilla overrides
- `bl4z3/form.json` — `bl4z3_forms` `bl4z3_form` (generic_form, form_grid, sidebar) **← gem**
- `bl4z3/common.json` — `bl4z3_forms` `bl4z3_common` primitives (main_panel_empty, grid_button_panel_main) **← gem**
- `.cui/*` — `bl4z3_forms` screens with configurable `$cuigv:*` theme (cui-button, cui-slider, cui-toggle, cui-dialog, cui-tabs)
- `forms/` — main.json (2×2 grid with collection_index), shop.json, kit.json, etc.
- `crate_ui.json` — loot crate UI
- `news_ui.json`, `welcome_ui.json`, `main_menu_ui.json`, `donator_ui.json`, `investing_ui.json`, `rankup_ui.json`, `pet_ui.json` — legacy per-service forms
- `chest_server_form.json` — server form override

**Contributions**:
- ✅ Complete modular framework (`bl4z3_forms` = `bl4z3_form`/`bl4z3_common`/`.cui`)
- ✅ Centralized theme system `$cuigv:*`
- ✅ Title-based server_form router
- ✅ Grid with `collection_index` (fixed 2×2 layout)
- ✅ Paperdoll/avatar with flip_book
- ✅ Complete `.cui` dialogs

**Avoid**:
- ⚠ `_global_variables.json` with two root objects
- ⚠ `_ui_defs.json` with listed overrides (double loading)
- ⚠ Fixed `size: "200%"` and `offset: [155, -102]`
- ⚠ Massive duplication (legacy vs new-gen forms)
- ⚠ Hardcoded text in legacy forms

---

## 3. `UltimateSu` — `2C159eIMLJo=` (world `UltimateSurvival`)

**Location**: `minecraftWorlds\2C159eIMLJo=\resource_packs\UltimateSu\ui\`

**Key files**:
- `chest_screen.json` — container override with `rr_player_renderer` (live_player_renderer) **← gem**
- `inventory_screen.json` — inventory override
- `brewing_stand_screen.json`, `loom_screen.json`, `smithing_table_2_screen.json`, `stonecutter_screen.json`, `structure_editor_screen.json`, `trade_2_screen.json` — other container overrides
- `mob_effect_screen.json` — effects
- `ui_template_tabs.json` — tabs override
- `hud_screen.json` — HUD override
- `_ui_defs.json` / `_global_variables.json`

**Contributions**:
- ✅ Player renderer in chest (visible 3D player in UI)
- ✅ Correct 9×N grid with `grid_item_template` + `collection_name: container_items`
- ✅ `collection_details` for item icon/count

**Avoid**:
- ⚠ A single fixed grid (not multi-size)
- ⚠ Some overrides could conflict with each other on the same screen

---

## 4. `rp invsee` — `jt+WZgXoAQA=` (world `1_7`)

**Location**: `minecraftWorlds\jt+WZgXoAQA=\resource_packs\rp invsee\ui\`

**Key files**:
- `chest_screen.json` — override with `pocket_containers.json` + `r4isen1920\invsee\inventory.r4ui` (custom r4ui file)
- `pocket_containers.json` — touch override

**Contributions**:
- ✅ `.r4ui` extension (community custom format, not vanilla)
- ✅ Same container override technique

**Avoid**:
- ⚠ `.r4ui` extension is not standard JSON UI — depends on external tooling

---

## 5. `[RP]WayMar` — `Geq7734AhFM=` (world `Waypoint`)

**Location**: `minecraftWorlds\Geq7734AhFM=\resource_packs\[RP]WayMar\ui\`

**Key files**:
- `server_form.json` — server form override (18KB)
- `pause_screen.json` — pause override (18KB) with waypoint button + panel
- `common\common.json` — extended vanilla primitives (67KB) **← gem**
- `center\forms\waypoint_form.json`, `action_form.json`, `create_form.json`, `edit_form.json` — waypoint forms **← gem**

**Contributions**:
- ✅ Pause screen with custom waypoint button (insert_back modifications)
- ✅ Modular waypoint forms (action/create/edit)
- ✅ 67KB `common/common.json` with reusable primitives
- ✅ Correct use of `_ui_defs.json` (only new files)

**Avoid**:
- ⚠ Very waypoint-focused — not reusable for other domains without refactoring

---

## 6. `RP ChunkPrevi` — `TuRCdiIjjEw=` (world `ChunkPreviews`)

**Location**: `minecraftWorlds\TuRCdiIjjEw=\resource_packs\RP ChunkPrevi\ui\`

**Key files**:
- `server_form.json` — override
- `hud_screen.json` — override
- `scoreboards.json` — override
- `center/forms/` — waypoint_form, action_form, create_form, edit_form, **gallery_form** (waypoint gallery) **← gem**
- `center/hud/` — loading_anim, while
- **BP**: `behavior_packs\BP ChunkPrevi\scripts\waypoints\WaypointUI.js` — BP↔RP contract

**Contributions**:
- ✅ Same architecture as WayMar but with **gallery_form** (gallery with thumbnails)
- ✅ BP↔RP integration documented in the JS code

---

## 7. `[RP]ChatCh` — `Ckr82bjcBWA=` (world `ChatChannels`)

**Location**: `minecraftWorlds\Ckr82bjcBWA=\resource_packs\[RP]ChatCh\ui\`

**Key files**:
- `chat_screen.json` — chat override (26KB) with **channel button** and custom header **← gem**
- `hud_screen.json` — override
- `ui_common.json` — override
- **BP**: `[BP]ChatCh\scripts\` with `chatChannels.js` (channel protocol)

**Contributions**:
- ✅ Chat with channel selector
- ✅ Custom header (title + current channel)
- ✅ Custom chat input with text_edit_box

---

## 8. `Leaderboar` — `ehtcdHnEp4o=` (world `Leaderboards`)

**Location**: `minecraftWorlds\ehtcdHnEp4o=\resource_packs\Leaderboar\ui\`

**Key files**:
- `hud_screen.json` — HUD override with leaderboard overlay
- **Zips**: `Leaderboard With Me.zip`, `LeaderBoard.zip` (full packs with BP)

**BP**: `leaderboard.js` — leaderboard protocol via chat + scoreboard.

**Contributions**:
- ✅ Leaderboard HUD via chat protocol
- ✅ Zip format for distributing full packs

---

## 9. `[RP] System Slayer v2` — `ZhkTZFZlAgA=` (world `System Slayer`)

**Location**: `minecraftWorlds\ZhkTZFZlAgA=\resource_packs\[RP] System Slayer v2 1.19\ui\`

**Key files**:
- `add_external_server_screen.json`, `how_to_play.json`, `npc_interact.json`, `play_screen.json`, `profile_screen.json`, `progress_screen.json`, `settings_screen.json`, `start_screen.json` — main screen overrides
- `hud_screen.json` — HUD override
- `scoreboards.json` — override
- `server_form.json` — override
- `ui_common.json` — override
- `._AmBro\animated_background\ambro_x_background.json` + `ambro_x_background_data.json` + `animations\animations.json` — **animated background** **← gem**

**Contributions**:
- ✅ **AmBro animated background** — background with UV animation (flip_book/uv_offset)
- ✅ Main screen overrides (start, settings, play)

**Avoid**:
- ⚠ 1.19 — old versions; some bindings may be deprecated in current versions

---

## 10. `[Scoreboar]` H3o4ZE variant — `H3o4ZE1zCQA=` (world `SkyWars`)

**Location**: `minecraftWorlds\H3o4ZE1zCQA=\resource_packs\[Scoreboar\ui\`

**Key files**:
- Same structure as yUyl6Pz but with `add_external_server_screen`, `how_to_play`, `npc_interact`, `play_screen`, `profile_screen`, `progress_screen`, `settings_screen`, `start_screen` + `._AmBro` background

**Contributions**:
- ✅ Combines Scoreboar + System Slayer (scoreboard + animated background + main screens)

---

## 11. `pack(2)` — `48mGwha4hgQ=` (world `Test`)

**Location**: `minecraftWorlds\48mGwha4hgQ=\resource_packs\pack(2)\ui\`

**Key files**:
- `server_form.json` — override
- `animated_bar.json` — animated bar **← gem**
- `form.json` — base form
- `form\shop.json` — **giant 116KB shop** **← gem**
- `ui_common.json` — override

**BP**: `48mGwha4hgQ=\behavior_packs\pack(2)\scripts\` — in the same folder there's `resource_packs\pack(2)\ui\` and the BP.

**Contributions**:
- ✅ Giant shop (116KB) — example of large commercial forms
- ✅ `animated_bar.json` — animated progress bar

**Avoid**:
- ⚠ 116KB in a single file — bad maintainability practice
- ⚠ Probably hardcoded text (shop without server-ui)

---

## 12. `[RP]AcidRa` — `Jj1fevJ16G0=` (world `AcidRain`)

**Location**: `minecraftWorlds\Jj1fevJ16G0=\resource_packs\[RP]AcidRa\ui\`

**Contributions**:
- ✅ (no significant own UI — basic validation)

---

## 13. `Skin` — `auccjAVLQ+g=` (world `SkinTest`)

**Location**: `minecraftWorlds\auccjAVLQ+g=\resource_packs\Skin\ui\`

**Contributions**:
- ⚠ No own UI (skin only) — minimal reference

---

## 14. Worlds without UI resource packs

- `KymQscjmjoI=` — empty (no packs)
- `TP5KVMpXhDI=` — empty (no packs)
- Other worlds without own UI

---

## Pattern Matrix by Pack

| Pattern | Scoreboar | Bl4z3 | UltimateSu | WayMar | ChatCh | Leader | S.Slayer | pack(2) |
|---|---|---|---|---|---|---|---|---|
| HUD override | ✓ | ✓ | ✓ | | ✓ | ✓ | ✓ | |
| Full server form | ✓ | ✓ | | ✓ | | | ✓ | ✓ |
| `$title` router | | ✓ | | | | | | |
| Player renderer | | | ✓ | | | | | |
| Search bar | ✓ | | | | | | | |
| Cursor tooltip | ✓ | | | | | | | |
| Loading screen | ✓ | ✓ | | ✓ | | | | |
| Animated background | | | | | | | ✓ | |
| Giant shop | | ✓ | | | | | | ✓ |
| Chat channels | | | | | ✓ | | | |
| Theme framework | | ✓ (bl4z3_forms) | | | | | | |

---

## Reusability Ranking

1. **Scoreboar** (yUyl6PzY1xA) — best code/protocol/documentation balance
2. **Bl4z3** (a0+tXtMv4LY) — modular **bl4z3_forms** framework but with duplication and invalid JSON
3. **WayMar** (Geq7734AhFM) — 67KB common primitives + waypoint forms
4. **System Slayer** (ZhkTZFZlAgA) — AmBro animated background
5. **ChunkPrevi** (TuRCdiIjjEw) — gallery_form
6. **ChatCh** (Ckr82bjcBWA) — chat with channels
7. **UltimateSu** (2C159eIMLJo) — player renderer in chest
8. **pack(2)** (48mGwha4hgQ) — giant shop (scale reference)
9. **Leaderboar** (ehtcdHnEp4o) — leaderboard HUD
10. **H3o4ZE** — Scoreboar + S.Slayer combination
11. **AcidRa / Skin** — minimal