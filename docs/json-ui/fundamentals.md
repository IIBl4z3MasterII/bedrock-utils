# Fundamentals — JSON UI Structure in Minecraft Bedrock

> Based on analysis of 15 real resource packs across the 18 worlds of **IIBl4z3MasterII**.

---

## 1. Minimum structure of a Resource Pack with UI

```
resource_pack/
├── manifest.json
├── ui/
│   ├── _ui_defs.json          # Registration of NEW files (not overrides)
│   ├── _global_variables.json # Global variables ($color, $size, etc.)
│   ├── hud_screen.json        # HUD override (by vanilla same-key)
│   ├── server_form.json       # Server form override (by same-key)
│   ├── scoreboards.json       # Scoreboard override (by same-key)
│   ├── chat_screen.json       # Chat override (by same-key)
│   ├── pause_screen.json      # Pause override (by same-key)
│   ├── chest_screen.json      # Containers override
│   ├── <custom>.json          # Your new files
│   └── subfolders/            # Free organization
└── textures/
    └── ui/                    # Textures referenced in JSON
```

### 1.1 `manifest.json` — UI requirements
```json
{
  "format_version": 2,
  "header": { "name": "My UI Pack", "uuid": "...", "version": [1,0,0] },
  "modules": [{ "type": "resources", "uuid": "...", "version": [1,0,0] }],
  "dependencies": [
    { "module_name": "@minecraft/server-ui", "version": "2.0.0" }
  ]
}
```
- `@minecraft/server-ui` in dependencies is **only needed if the BP uses server-ui**; the RP only needs it if it references controls requiring that version (e.g. `ModalFormData` with an options object).

---

## 2. `_ui_defs.json` — What to register and what NOT to

**Key rule discovered across all packs:**
- **Files that OVERRIDE vanilla** (same path as vanilla: `hud_screen.json`, `server_form.json`, `scoreboards.json`, `chat_screen.json`, `pause_screen.json`, `chest_screen.json`, `inventory_screen.json`, `ui_template_buttons.json`, `ui_template_toggles.json`, `ui_template_dialogs.json`, `ui_common.json`, etc.) → **NOT in `_ui_defs.json`**. The engine merges them automatically by file name.
- **NEW files** (any other name: `search_form.json`, `pandora/form.json`, `center/forms/waypoint_form.json`, etc.) → **MUST go in `_ui_defs.json`** with a path relative to `ui/`.

### Real example (Scoreboar - `yUyl6PzY1xA=`):
```json
// ui/_ui_defs.json
{
  "ui_defs": [
    "ui/center/forms/search_form.json",
    "ui/center/forms/hover_tooltip.json",
    "ui/center/hud/loading_anim.json"
  ]
}
```
Only new files — the rest (`hud_screen.json`, `server_form.json`, `scoreboards.json`, `chat_screen.json`, `ui_common.json`) are overrides and **are not listed**.

### Real example (Pandora - `a0+tXtMv4LY=`):
```json
// ui/_ui_defs.json (66 entries)
"ui_defs": [
    "ui/pet_ui.json",
    "ui/scoreboards.json",        // ⚠ This IS listed but it's an override!
    "ui/hud_screen.json",         // ⚠ Same
    "ui/server_form.json",        // ⚠ Same
    "ui/pandora/common.json",
    "ui/pandora/form.json",
    "ui/forms/main.json",
    ...
    "ui/.cui/.cui-anims.json",
    "ui/.cui/.screens/.cui-start_screen.json",
    ...
]
```
⚠ **Pandora also lists the overrides** — it works but is redundant. The engine loads them twice (once via vanilla merge, once via defs). It doesn't break but duplicates work.

### Real example (WayMar - `Geq7734AhFM=`):
```json
// ui/_ui_defs.json (only 1 line of real content)
{
  "ui_defs": [
    "ui/center/forms/action_form.json",
    "ui/center/forms/create_form.json",
    "ui/center/forms/edit_form.json",
    "ui/center/forms/waypoint_form.json"
  ]
}
```
The overrides (`server_form.json`, `pause_screen.json`, `common/common.json`) **are not present**.

---

## 3. Namespaces

Each JSON file **must** declare a unique `namespace` at the start:
```json
{
  "namespace": "my_pack",
  "controls...": {}
}
```

### Namespaces observed in your packs:
| Pack | Namespaces |
|---|---|
| Scoreboar | `hud` (implicit, no namespace in hud_screen), `server_form`, `scoreboard`, `while`, `loading_anim`, `search_form`, `hover_tooltip`, `common` |
| Pandora | `server_form`, `scoreboard`, `common_buttons`, `common_dialogs`, `chest_ui`, `pandora_form`, `pandora_common`, `pandora_main`, `pandora_shop`, `pandora_kit`, `pandora_map`, `pandora_skills`, `pandora_pets`, `pandora_team`, `pandora_bounties`, `pandora_gambling`, `pandora_warps`, `pandora_mines`, `pandora_wheel`, `pandora_towers`, `pandora_roulette`, `grid`, `rangos_form`, `island_form`, `crate_ui`, `news_ui`, `welcome_ui`, `main_menu_ui`, `donator_ui`, `donator_2_ui`, `investing_ui`, `rankup_ui`, `pet_ui`, `cui-button`, `cui-common`, `cui-dialog`, `cui-slider`, `cui-toggle`, `cui-anims`, `cui-debug`, `cui-gamepad` |
| WayMar | `server_form`, `pause_screen`, `common`, `waypoint_form`, `action_form`, `create_form`, `edit_form` |
| ChunkPrevi | `server_form`, `hud`, `scoreboard`, `gallery_form`, `waypoint_form`, `action_form`, `create_form`, `edit_form` |
| UltimateSu | `chest` (explicit namespace in chest_screen) |
| ChatCh | `chat` (implicit), `common` |
| Leaderboar | `leaderboard` (implicit) |
| System Slayer | `scoreboard`, `server_form`, `hud` (implicit), `ambro` |

**Best practice**: one namespace per file, short and unique. Hyphenated names (`pandora_form`, `cui-button`) work well.

> Note: the `pandora_*` and `cui-*` namespaces in the Pandora row are the real identifiers of the framework documented as **bl4z3_forms**. They stay as-is in the code; "bl4z3_forms" is just the name the docs use to refer to that framework.

---

## 4. `_global_variables.json` — Global variables

**Optional** file that defines variables accessible from any binding via `$name` or `$namespace.name`.

### Real example (Scoreboar - vanilla colors):
```json
// ui/_global_variables.json (first root object)
{
  "$light_button_default_text_color": [1.0, 1.0, 1.0],
  "$light_button_hover_text_color": [1.0, 1.0, 1.0],
  "$dark_button_default_text_color": [0.2, 0.2, 0.2],
  "$title_text_color": [1.0, 1.0, 1.0],
  "$player_name_color": [1.0, 1.0, 1.0],
  "$player_score_color": [1.0, 1.0, 1.0],
  "$objective_title_color": [1.0, 1.0, 1.0],
  "$chat_text_color": [1.0, 1.0, 1.0],
  ...
}
```

### Real example (Pandora `a0+tXtMv4LY=` — `bl4z3_forms` `.cui` theme, **second root object** ⚠):
```json
// ui/_global_variables.json (line 1400+)
{
  "$cuigv:ConfigName": "Default",
  "$cuigv:DesignedVersion": "v4.1",
  "$cuigv:PrimaryColor":   [0.65, 0.2, 0.75],
  "$cuigv:SecondaryColor": [0.95, 0.35, 0.8],
  "$cuigv:TertiaryColor":  [0.4, 0.15, 0.5],
  "$cuigv:FontPrimaryColor":   [1, 1, 1],
  "$cuigv:FontSecondaryColor": [0.75, 0.6, 0.8],
  "$cuigv:BackgroundAlpha": 0.8,
  "$cuigv:ButtonAlpha": 0.8,
  "$cuigv:UIBackground": false,
  "$cuigv:UIBackgroundSlider": true,
  "$cuigv:Shadows": true,
  "$cuigv:FadedProgressBar": true,
  "$cuigv:UIAnimations": true,
  ...
}
```
⚠ **Two root objects in a single JSON** — standard JSON doesn't allow this. The Bedrock engine seems to read it sequentially, but external validators fail. **Recommendation**: split into two files or use a single object.

### Usage in bindings:
```json
"color": "$title_text_color"              // simple global variable
"color": "$cuigv:PrimaryColor"            // variable with implicit namespace
"alpha": "$cuigv:BackgroundAlpha"
```

---

## 5. Inheritance and Override (`@` syntax)

### 5.1 Control inheritance (`child@parent`)
```json
"my_button@common_buttons.light_text_button": {
  "$button_text": "Custom text",
  "size": [200, 40]
}
```
The child inherits **everything** from the parent and can override/add properties.

### 5.2 Vanilla screen override (`screen@common.base_screen`)
```json
"third_party_server_screen@common.base_screen": {
  "$screen_content": "server_form.main_screen_content",
  "button_mappings": [...]
}
```
Scoreboar: `server_form.json:35-44`  
bl4z3_forms (Pandora pack): `server_form.json:584-597`  
WayMar: does not use base_screen, defines its own screen.

### 5.3 Same-key override (without explicit inheritance)
Files with the same name as vanilla (`hud_screen.json`, `chest_screen.json`, etc.) **replace/extend** the vanilla controls automatically. The engine merges by control key:
```json
// In hud_screen.json (vanilla override)
"hud_actionbar_text": { ... }    // replaces the vanilla hud_actionbar_text control
"hud_title_text": { ... }        // replaces hud_title_text
"root_panel": {                   // extends the vanilla root_panel
  "modifications": [{
    "array_name": "controls",
    "operation": "insert_back",
    "value": [{ "my_panel@my_pack.my_control": {} }]
  }]
}
```
Scoreboar `hud_screen.json:3-15` and `689-732` — uses `modifications` to inject extra controls into the vanilla `root_panel` without redefining it entirely.

---

## 6. Control variables (`$variable`)

Local variables defined **inside the control** and accessible in its children and bindings:
```json
"my_panel": {
  "$my_size": [200, 100],
  "$my_color": [1, 0, 0],
  "size": "$my_size",
  "controls": [{
    "child": {
      "size": "$my_size",          // inherits
      "color": "$my_color"
    }
  }]
}
```

### Variables with default (`$var|default: value`)
```json
"generic_form": {
  "$content_size|default": ["100% - 10px", "100% - 10px"],
  "$form_size|default": ["100%", "100%"],
  "$form_offset|default": [0, -16],
  "$form_content|default": [],
  ...
}
```
bl4z3_forms `pandora/form.json:5-11` — lets the parent inject values without breaking if they're not passed.

---

## 7. Modifications Array (extending vanilla arrays)

Pattern for **adding controls to a vanilla array without redefining it**:
```json
"root_panel": {
  "modifications": [
    {
      "array_name": "controls",
      "operation": "insert_back",      // or "insert_front"
      "value": [
        { "custom_position_panel@hud.player_position_and_days_played": {} },
        { "loading_anim_hook": { ... } }
      ]
    }
  ]
}
```
Scoreboar `hud_screen.json:689-732` — injects custom panels, loading anim, etc. at the end of the vanilla `root_panel`.

Valid operations: `insert_front`, `insert_back`, `remove`, `replace` (documented in vanilla, observed `insert_back`/`insert_front`).

---

## 8. Control structure (summary)

```json
"control_name": {
  "type": "panel|label|image|button|stack_panel|grid|screen|factory|...",
  "size": [width, height],        // numbers, "100%", "100%c", "fill", "100%c + 10px"
  "offset": [x, y],               // relative to anchor
  "anchor_from": "top_left|center|...", // control origin
  "anchor_to": "top_left|center|...",   // anchor in the parent
  "layer": 0,                     // z-index
  "alpha": 1.0,                   // 0-1 (⚠ Scoreboar uses 2.0 in actionbar - bug)
  "visible": true,                // or binding
  "ignored": "expression",        // if false, control is omitted (not rendered)
  "controls": { ... },            // children (for panel, stack_panel, screen, button states)
  "bindings": [ ... ],            // see Bindings section
  "animations": [ ... ],          // see Animations section
  "factory": { ... },             // see Factories section
  "collection_name": "name",      // for factory/stack_panel/grid
  "renderer": "live_player_renderer|live_horse_renderer|hover_text_renderer|gradient_renderer",
  "property_bag": { ... },        // local variables for internal bindings
  "variables": [                  // conditionals via requires (only in special screens/panels)
    { "requires": "$condition", "$var": "value" }
  ]
}
```

### Special sizes observed:
| Syntax | Meaning |
|---|---|
| `100%` | % of parent |
| `100%c` | % of the **content** (content size) — used in scrolling_panel |
| `100%cm` | % of content **minus margins** |
| `100%sm` | % of the sibling's **measured size** |
| `100%y` | % of the parent's Y axis |
| `fill` | fills the remaining space in a stack_panel |
| `100%c + 10px` | mixed arithmetic |
| `calc(($subtitle_text.length * 9)px + 10px)` | dynamic calculation with binding (bl4z3_forms `.cui` and `while.json`) |

---

## 9. Main Control Types

| Type | Main use |
|---|---|
| `panel` | Generic container, base of everything |
| `stack_panel` | Linear layout (vertical/horizontal) with `orientation` |
| `grid` | Grid with `grid_dimensions`, `grid_item_template`, `grid_rescaling_type` |
| `label` | Text with `text`, `color`, `font_type`, `font_scale_factor`, `shadow`, `text_alignment` |
| `image` | Texture with `texture`, `uv`, `uv_size`, `alpha`, `color` |
| `button` | Interactive with `default_control`, `hover_control`, `pressed_control`, `locked_control`, `button_mappings`, `sound_name` |
| `screen` | Full window with `layer`, `follows_cursor`, `is_modal`, `absorbs_input` |
| `factory` | Generates controls dynamically (`control_ids` or `control_name` + `collection_name`) |
| `edit_box` / `text_edit_box` | Text input (vanilla `settings_common.option_text_edit`) |
| `slider` / `step_slider` | Slider (vanilla `settings_common.option_slider`) |
| `toggle` | Switch (vanilla `common_toggles.light_template_toggle`) |
| `dropdown` | Dropdown (vanilla `settings_common.option_dropdown`) |

---

## 10. Vanilla files usually overridden

| File | What it controls | Packs that touch it |
|---|---|---|
| `hud_screen.json` | HUD, title, subtitle, actionbar, chat | Scoreboar, Pandora, WayMar, ChunkPrevi, UltimateSu, Leaderboar, System Slayer |
| `server_form.json` | Server forms (ActionForm/ModalForm) | Scoreboar, Pandora, WayMar, ChunkPrevi, pack(2), System Slayer |
| `scoreboards.json` | Sidebar + player list | Scoreboar, Pandora, ChunkPrevi, System Slayer, jt+WZg Scoreboar |
| `chat_screen.json` | Chat panel, messages | Scoreboar, ChatCh, jt+WZg Scoreboar, yUyl6Pz Scoreboar |
| `pause_screen.json` | Pause menu | WayMar, ChunkPrevi, yUyl6Pz Scoreboar, System Slayer |
| `chest_screen.json` | Containers (chest, ender, shulker, barrel) | UltimateSu, invsee |
| `ui_template_buttons.json` | Vanilla buttons (`common_buttons`) | Pandora, UltimateSu |
| `ui_template_toggles.json` | Vanilla toggles | Pandora |
| `ui_template_dialogs.json` | Vanilla dialogs | Pandora |
| `ui_common.json` | Vanilla utilities (animations, common panel) | Scoreboar, ChatCh, H3o4ZE, jt+WZg, yUyl6Pz, ZhkTZF, System Slayer |
| `inventory_screen.json` | Player inventory | UltimateSu |
| `trade_2_screen.json` | Villager trade | UltimateSu, Pandora (subpack) |
| `pause_screen.json` | Pause menu | WayMar, ChunkPrevi, yUyl6Pz Scoreboar, System Slayer |

---

## 11. Checklist when creating a new UI pack

- [ ] `manifest.json` with unique UUIDs, `format_version: 2`, dependencies if it uses server-ui
- [ ] `ui/_ui_defs.json` **only** with NEW files (no vanilla overrides)
- [ ] `ui/_global_variables.json` for shared colors/themes
- [ ] A unique `namespace` per JSON file
- [ ] Textures in `textures/ui/` referenced correctly
- [ ] Vanilla overrides by same-key (not in `_ui_defs`)
- [ ] New files in `_ui_defs` with a `ui/...` path
- [ ] Test in game: `/reload` reloads resource packs; F3+T reloads everything