# Advanced Patterns — Bindings, Factories, Templates, Navigation, Animations, Script API Integration

> The most sophisticated patterns found in your packs. This is where JSON UI stops being "drawing" and becomes "programming".

---

## 1. Bindings — The RP↔BP connection

### 1.1 Binding types observed

| `binding_type` | What it does | Where it's used |
|---|---|---|
| `view` | Reads an internal variable of the control/panel (via `property_bag` or `variables`) | search_form (Scoreboar), scroll_panel (bl4z3_forms) |
| `global` | Reads a global variable of the screen (`#name`) | HUD, server_form, scoreboard |
| `collection` | Reads the current factory collection (per row) | form_buttons, scoreboard rows |
| `collection_details` | Reads details of the current item (icon, count, custom_name) | chest_grid_item (UltimateSu) |

### 1.2 Global binding — dynamic text from the server
```json
{
  "binding_name": "#hud_scoreboard_objective_name",
  "binding_type": "global",
  "binding_condition": "always_when_visible",
  "enable_profanity_filter": false
}
```
- `binding_condition` can be `always_when_visible` (updates only when visible) or `always` (always).
- `enable_profanity_filter: false` — important for custom text (prevents censoring `$` or words).

### 1.3 Binding with `binding_name_override` — mapping to a native control
```json
{
  "binding_name_override": "#text",
  "binding_name": "#number_of_days_played_text",
  "binding_type": "global"
}
```
You override the native binding of a vanilla control (`#text`) with your own value. **Key pattern** for customizing vanilla labels without remaking them.

### 1.4 `collection` — per factory row
```json
{
  "binding_name": "#player_score_sidebar",
  "binding_type": "collection",
  "binding_collection_name": "scoreboard_scores"
}
```
Evaluated once per item of the collection (each scoreboard row, each form button).

### 1.5 `collection_details` — detailed item info
```json
{
  "binding_name": "#item_icon",
  "binding_type": "collection_details",
  "binding_collection_name": "container_items",
  "binding_name_override": "#texture"
}
```
The engine exposes `#item_icon`, `#count`, `#custom_name`, `#item_id` of the item in that cell. UltimateSu chest_grid_item uses this pattern.

### 1.6 "view" bindings with `property_bag` — internal state
```json
"my_panel": {
  "property_bag": { "#my_state": "closed" },
  "bindings": [
    { "binding_name": "#my_state", "binding_type": "view" }
  ]
}
```
The state is local to the panel. It's changed via `play_sound`/events (rare) or with conditional `variables`.

### 1.7 Conditional variables (`variables` + `requires`)
```json
"my_panel": {
  "variables": [
    { "requires": "$tipo = 'A'", "$color": [1, 0, 0] },
    { "requires": "$tipo = 'B'", "$color": [0, 1, 0] },
    { "requires": "$tipo = 'C'", "$color": [0, 0, 1] }
  ],
  "controls": [{ "box": { "color": "$color" } }]
}
```
Evaluates `$tipo` and assigns `$color` based on the first condition that matches. **Base of the routers** of bl4z3_forms (framework of the Pandora pack).

### 1.8 Expressions in bindings (string-processing)
Syntax observed (bl4z3_forms, Scoreboar):
```json
{
  "binding_name": "#form_button_text",
  "binding_name_override": "#text",
  "binding_type": "collection",
  "binding_collection_name": "form_buttons"
}
```
**Slicing/concatenation** in `$` variables:
```json
"text": "$prefix + $text"
"size": "calc(($subtitle_text.length * 9)px + 10px)"
"ignored": "(not (($title_text > 'totem_blz.') and ($title_text < 'totem_blz/')))"
```
Operators observed: `+`, `-`, `=`, `>`, `<`, `>=`, `<=`, `!=`, `not`, `and`, `or`, `.length`, `%` (mod).

### 1.9 Useful comparisons
| Comparison | Real use |
|---|---|
| `$title_text = 'SHOP'` | Form router (bl4z3_forms) |
| `$title_text > 'totem_blz.' and $title_text < 'totem_blz/'` | Prefix detection (Scoreboar while.json) |

---

## 2. Factories — Generating controls dynamically

### 2.1 Factory over a collection (grid/stack)
```json
"factory": {
  "name": "buttons",               // factory name (engine)
  "control_name": "$grid_item_template"  // or control_ids
}
```

### 2.2 Factory with control_ids (multi-mapping)
```json
"factory": {
  "name": "buttons",
  "control_ids": {
    "button": "@common_buttons.menu_button",
    "image_button": "@common_buttons.light_text_button"
  }
}
```
Different "item types" → different controls.

### 2.3 Collection + static index (fixed layout)
```json
"controls": [
  { "top_left@pandora_main.button": { "collection_index": 0 } },
  { "top_right@pandora_main.button": { "collection_index": 1 } },
  { "bottom_left@pandora_main.button": { "collection_index": 2 } },
  { "bottom_right@pandora_main.button": { "collection_index": 3 } }
]
```
With `collection_name` on the parent stack/grid, each control takes the item at its index. **Perfect for 2×2, 3×1, etc. menus.**

### 2.4 `#maximum_grid_items` — limiting item count
```json
"bindings": [
  { "binding_name": "#form_button_length",
    "binding_name_override": "#maximum_grid_items" }
]
```
Prevents the grid from trying to render more than fits.

---

## 3. Templates / Reusable controls

### 3.1 Template with `$variables` with defaults
```json
"generic_button": {
  "$btn_text|default": "Button",
  "$btn_size|default": [274, 43],
  "$btn_icon|default": "textures/ui/empty",
  "$btn_color|default": [0.6, 0.2, 0.8],
  "$btn_texture|default": "textures/.cui-assets/background",
  "type": "button",
  "size": "$btn_size",
  ...
}
```

### 3.2 Inherited template with partial override
```json
"my_button@generic_button": {
  "$btn_text": "Click me!",
  "$btn_color": [1, 0.2, 0.2]
}
```
No need to redefine `type`/`size` — it inherits from the template.

### 3.3 Template with `modifications` in controls (bl4z3_forms common.json)
```json
"generic_form": {
  "$form_content|default": [],
  "type": "panel",
  "controls": [
    { "content": {
        "type": "panel",
        "size": "$content_size",
        "controls": "$form_content"   // the parent injects its children here
    } }
  ]
}
```

---

## 4. Navigation between screens / modals

### 4.1 Opening modals via button_mappings
```json
"button_mappings": [
  { "from_button_id": "button.menu_select", "to_button_id": "button.menu_ok", "mapping_type": "pressed" },
  { "from_button_id": "button.menu_cancel", "to_button_id": "button.menu_exit", "mapping_type": "global" }
]
```
- `menu_ok` = confirm (opens the next).
- `menu_exit` = close/go back.
- `global` = fires without needing focus.

### 4.2 Custom screen opened by an action (ChatCh)
ChatCh uses `chat_screen` as an overlay when chat is open; the BP opens/closes it via `setActionBar`/chat protocol.

### 4.3 Syncing a screen with game state (bl4z3_forms `.cui` screens)
```json
"cui-start_screen": {
  "type": "screen",
  "layer": 1,
  "controls": [
    { "start_screen@cui-common.cui-main": {} },
    { "dialog@cui-dialog.cui-dialog": { "ignored": "(not ($cuigv:DialogOpen = true))" } }
  ]
}
```
The theme controls modal visibility via `$cuigv:DialogOpen`.

---

## 5. Animations

### 5.1 Animation types observed

| `anim_type` | What it animates | Key properties |
|---|---|---|
| `alpha` | Opacity | `from`, `to`, `duration`, `easing` |
| `size` | Size | `from`, `to` (array of 2) |
| `offset` | Position | `from`, `to` (array of 2) |
| `wait` | Delay | `duration` |
| `uv_offset` | Sprite offset | `from`, `to` |
| `flip_book` | Frame change | `flipbook_texture`, `flipbook_uv_size`, `flipbook_fps` |
| `rotation` | Rotation | `from`, `to` (degrees) |

### 5.2 Structure
```json
"entrance_anim": {
  "anim_type": "alpha",
  "from": 0.0,
  "to": 1.0,
  "duration": 0.3,
  "easing": "out_sine",
  "next": "next_anim"
}
```

### 5.3 Easings observed
| Easing | Use |
|---|---|
| `linear` | Bars, flips |
| `out_sine` | Soft entrance |
| `in_sine` | Soft exit |
| `out_expo` | Fast slides |
| `in_out_circ` | Loading |
| `out_back` | Bounce (scale pop) |
| `spring` | Offset (Scoreboar while.json) |
| `in_quart` / `out_quart` / `in_out_quart` | Strong curves |

### 5.4 Animation chain (Scoreboar loading_anim.json:450-600)
```json
"anim_fade_in": {
  "anim_type": "alpha",
  "from": 0.0,
  "to": 1.0,
  "duration": 0.5,
  "easing": "out_cubic",
  "next": "anim_wait"
},
"anim_wait": {
  "anim_type": "wait",
  "duration": "$loading_animation_wait_duration",
  "next": "anim_fade_out"
},
"anim_fade_out": {
  "anim_type": "alpha",
  "from": 1.0,
  "to": 0.0,
  "duration": 0.5,
  "easing": "in_quart",
  "destroy_at_end": "loading_anim_wrapper"   // removes the control when it finishes
}
```

### 5.5 Infinite loop (bl4z3_forms gradient)
```json
"gradient_anim": {
  "anim_type": "uv_offset",
  "from": [0, 0],
  "to": [128, 0],
  "duration": 4.0,
  "loop": true
}
```

### 5.6 `destroy_at_end` — cleanup
```json
"anim_out": {
  "anim_type": "offset",
  "from": [0, 0],
  "to": ["100%", 0],
  "duration": 0.5,
  "easing": "in_quart",
  "destroy_at_end": "hud_title_text"
}
```
Removes the control when it finishes — key for transient HUD (Scoreboar while.json `offset_out`).

### 5.7 `play_event` / `reset_event` — event-driven animations
```json
"anim_scrollbar_box_fadeout": {
  "anim_type": "alpha",
  "from": 1.0,
  "to": 0.0,
  "duration": 0.3,
  "play_event": "scrollbar.released",
  "reset_event": "scrollbar.active"
}
```

---

## 6. Script API integration (BP↔RP protocol)

### 6.1 Communication channels observed (Scoreboar BP `core/` + RP)

| Channel | BP (Script API) | RP (JSON UI) |
|---|---|---|
| **ActionBar** | `player.onScreenDisplay.setActionBar("...")` | `$actionbar_text` / `nperma_root` |
| **Title/Subtitle** | `player.onScreenDisplay.setTitle("...")` | `#hud_title_text_string` / `#hud_subtitle_text_string` / `$title_text` |
| **Scoreboard** | `world.scoreboard.getObjective(...)` | `#player_name_sidebar` / `#player_score_sidebar` / `#objective_sidebar_name` |
| **Server Form** | `ActionFormData` / `ModalFormData` (server-ui) | `#title_text`, `#form_button_text`, `form_buttons`, `form_grid` |

### 6.2 Native forms server (Scoreboar `core/FormBuilder`)
```js
// BP: send ActionForm
const form = new ActionFormData();
form.title("My Form").body("Hello").button("Go", "textures/ui/icon_setting");
form.show(player);
```
```json
// RP: renders the buttons via grid + form_buttons collection
"body_buttons_grid": {
  "type": "grid",
  "collection_name": "form_buttons",
  "grid_item_template": "server_form.form_button",
  "bindings": [{ "binding_name": "#form_button_length", "binding_name_override": "#maximum_grid_items" }]
}
```

### 6.3 Dynamic state via `setDynamicProperty` — ⚠ NOT used for UI
In Scoreboar `setDynamicProperty` is only used for **persistence** (`worldManager.js`), not for the UI. The UI is fed exclusively by the engine channels (§6.1). **Lesson**: don't try to pass UI data through dynamic properties — use ActionBar/Title/Scoreboard/Forms.

---

## 7. "Router" pattern — one screen, multiple views

### 7.1 Router by `$title_text` (bl4z3_forms server_form.json:584-640)
```json
"form_router": {
  "type": "panel",
  "controls": [
    { "shop@pandora_shop.shop":   { "ignored": "(not ($title_text = 'SHOP'))" } },
    { "map@pandora_map.map":      { "ignored": "(not ($title_text = 'MAP'))" } },
    { "main@pandora_main.main":   { "ignored": "(not ($title_text = 'MAIN'))" } },
    { "default@pandora_main.default": { "ignored": "(not ($title_text = 'UNKNOWN'))" } }
  ]
}
```
**How it works**: the server sends a form with a specific `title`; the JSON UI only shows the panel whose `ignored` is `false`. The rest are omitted (not rendered).

### 7.2 Router with prefix suffix (Scoreboar while.json:39-60)
```json
"ignored": "(not (($title_text > 'totem_blz.') and ($title_text < 'totem_blz/')))"
```
Prefix detection without exact match (lexicographic range).

### 7.3 Icon router by suffix (bl4z3_forms `$title_text ~ 'icon'`)
bl4z3_forms uses `.icon`, `.sidebar` etc. suffixes so the same form renders differently depending on the suffix.

---

## 8. Theme System (`bl4z3_forms` — `.cui` / Collapse UI v4.1)

### 8.1 Centralized theme variables
```json
"$cuigv:PrimaryColor":   [0.65, 0.2, 0.75],
"$cuigv:SecondaryColor": [0.95, 0.35, 0.8],
"$cuigv:FontPrimaryColor":   [1, 1, 1],
"$cuigv:FontSecondaryColor": [0.75, 0.6, 0.8],
"$cuigv:BackgroundAlpha": 0.8,
"$cuigv:ButtonAlpha": 0.8,
"$cuigv:Shadows": true,
"$cuigv:UIAnimations": true,
"$cuigv:UIBackground": false
```
All `.cui-*` controls of the **bl4z3_forms** framework read from `$cuigv:*`. Changing the theme = editing `_global_variables.json`.

### 8.2 Themed button (`.cui-button`)
```json
"cui-button": {
  "$cui-button-color|default": "$cuigv:PrimaryColor",
  "$cui-button-font-color|default": "$cuigv:FontPrimaryColor",
  "$cui-button-size|default": [274, 43],
  "type": "button",
  "default_control": "default",
  "hover_control": "hover",
  "pressed_control": "pressed",
  "controls": {
    "default": { "type": "panel", "controls": [
        { "bg": { "type": "image", "texture": "$cui-button-background", "color": "$cui-button-color" } },
        { "label": { "type": "label", "text": "$cui-button-text", "color": "$cui-button-font-color" } }
    ] },
    "hover": { ... with $cuigv:HoverColor overlay ... }
  }
}
```

### 8.3 Themed Slider / Toggle / Dialog
```json
"cui-slider": {
  "$cui-slider-color|default": "$cuigv:PrimaryColor",
  "type": "panel",
  "controls": [
    { "track": { "type": "image", "texture": "textures/.cui-assets/background", "color": "$cuigv:SliderColor" } },
    { "thumb": { "type": "image", "texture": "textures/.cui-assets/slider_ball", "color": "$cui-slider-color" } }
  ]
}
```

### 8.4 Tab with 8 sub-states (bl4z3_forms `.cui-tabs`)
Tabs use multiple states (default/hover/pressed/selected × focused/disabled) to provide rich UX without JS.

---

## 9. Performance and Stability Patterns

| Anti-pattern | Problem | Alternative |
|---|---|---|
| `_ui_defs.json` with vanilla overrides | Double loading of the file | Only register new files |
| Two root objects in `_global_variables.json` | Invalid JSON for validators | Single object |
| `alpha: 2.0` | Out of range, undefined behavior | `alpha: 1.0` |
| `size: "200%"` | Overflow | `"100%"` + padding |
| Hardcoded text in UI | Not translatable, fragile | Bindings from the server |
| Fixed `offset: [155, -102]` | Not responsive on other resolutions | Anchors + `%` |
| `visible` with binding in modals | The control still takes space/input | `ignored` with binding |
| Grid without setting `#maximum_grid_items` | Crashes if the grid doesn't limit | Always bind `#form_button_length` |

---

## 10. Complete Reusable Example — Server Form with Router and Button Grid

Complete, portable pattern for rendering ActionForms with a custom view (extracted from Scoreboar `server_form.json` + bl4z3_forms `pandora_form`).

### RP (server_form.json)
```json
{
  "namespace": "server_form",
  "third_party_server_screen@common.base_screen": {
    "$screen_content": "server_form.main_screen_content",
    "button_mappings": [
      { "from_button_id": "button.menu_cancel",
        "to_button_id": "button.menu_exit",
        "mapping_type": "global" }
    ]
  },
  "main_screen_content": {
    "type": "panel",
    "size": ["90%", "80%"],
    "layer": 1,
    "propagate_alpha": true,
    "animations": [
      { "anim_open_alpha": { "anim_type": "alpha", "from": 0, "to": 1, "duration": 0.3, "easing": "out_sine" } },
      { "anim_open_scale": { "anim_type": "size", "from": ["95%", "95%"], "to": ["100%", "100%"], "duration": 0.35, "easing": "out_back" } }
    ],
    "controls": [
      { "title": { "type": "label", "text": "#title_text", "color": [1, 1, 1], "font_type": "MinecraftTen", "font_scale_factor": 1.5, "anchor_from": "top_middle", "anchor_to": "top_middle" } },
      { "body@common.scrolling_panel": {
          "$show_background": false,
          "size": ["100%", "100% - 60px"],
          "$scrolling_content": "server_form.body_scrolling_content",
          "$scroll_size": [5, "100% - 4px"]
        }
      },
      { "buttons_grid": {
          "type": "grid",
          "grid_dimensions": [1, 5],
          "grid_fill_direction": "horizontal",
          "grid_rescaling_type": "horizontal",
          "grid_item_template": "server_form.form_button",
          "collection_name": "form_buttons",
          "bindings": [
            { "binding_name": "#form_button_length",
              "binding_name_override": "#maximum_grid_items" }
          ]
        }
      }
    ]
  },
  "form_button": {
    "$button_text": "",
    "type": "button",
    "size": ["100%", 30],
    "sound_name": "random.click",
    "default_control": "default",
    "hover_control": "hover",
    "pressed_control": "pressed",
    "button_mappings": [
      { "from_button_id": "button.menu_select",
        "to_button_id": "button.menu_ok",
        "mapping_type": "pressed" }
    ]
  }
}
```

### How to use it
- The BP sends an `ActionFormData` with title, body, and buttons.
- The engine fills `form_buttons` (collection) and the grid renders them.
- `#form_button_length` limits how many buttons fit.
- If you want view routing (e.g. SHOP/MAP), add a router panel inside `body_scrolling_content` using `ignored` + `$title_text` (see §7).

---

## 11. When to use Script API vs pure JSON UI

| Need | Tool |
|---|---|
| Interactive forms (Action/Modal) | `@minecraft/server-ui` + `server_form.json` |
| Persistent HUD (pos, days, stats) | `hud_screen.json` + global bindings |
| Custom scoreboard | `scoreboards.json` + engine collections |
| Custom text input | `text_edit_box` + view/global bindings |
| Pause menu | `pause_screen.json` + modifications |
| Custom containers | `chest_screen.json` + engine collections |
| Backgrounds / animated backgrounds | `ambro_x_background` + `uv_offset` anim |
| Persistent player state | `setDynamicProperty` (NOT for direct UI) |