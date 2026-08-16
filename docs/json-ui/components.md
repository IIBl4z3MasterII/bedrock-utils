# Components — Buttons, Labels, Images, Inputs, Lists, Scroll, Tooltips, Modals

> Real patterns extracted from: Scoreboar, Bl4z3 (bl4z3_forms .cui), WayMar, ChunkPrevi, pack(2), ChatCh, System Slayer.

---

## 1. Buttons

### 1.1 Simple button with per-state texture (Scoreboar search_form.json:40-66)
```json
"custom_close_button": {
  "type": "button",
  "size": "$size|default: [20, 20]",
  "layer": 1,
  "anchor_from": "top_right",
  "anchor_to": "top_right",
  "offset": [-4, 4],
  "sound_name": "random.click",
  "default_control": "close_default",
  "hover_control": "close_hover",
  "pressed_control": "close_pressed",
  "button_mappings": [
    { "from_button_id": "button.menu_select",
      "to_button_id": "button.menu_exit",
      "mapping_type": "pressed" },
    { "from_button_id": "button.menu_ok",
      "to_button_id": "button.menu_exit",
      "mapping_type": "focused" }
  ]
}
```
- `default_control` / `hover_control` / `pressed_control` → sub-controls with visual states.
- `button_mappings` connects the button to game actions.
- `sound_name: "random.click"` provides sound feedback.

### 1.2 Button sub-states (Scoreboar search_form.json:66-90)
```json
"close_default": {
  "type": "image",
  "texture": "$close_texture|default: textures/custom_ui/close_button",
  "size": "$size|default: [20, 20]"
},
"close_hover": {
  "type": "image",
  "texture": "$close_hover_texture|default: textures/custom_ui/close_button_hover",
  "size": "$size|default: [20, 20]"
},
"close_pressed": {
  "type": "image",
  "texture": "$close_pressed_texture|default: textures/custom_ui/close_button",
  "size": "$size|default: [20, 20]"
}
```
> Real paths from the Scoreboar pack (`textures/custom_ui/close_button.png`, `close_button_hover.png`). Vanilla alternative: `textures/ui/close_button_default` / `close_button_hover` / `close_button_pressed`.

### 1.3 Full button with text + hover animation (bl4z3_forms `.cui-button`)
```json
"cui-button": {
  "$cui-button-CheckButtonID": true,
  "$cui-button-size|default": [274, 43],
  "$cui-button-text|default": "Default",
  "$cui-button-align|default": "center",
  "$cui-button-color|default": "$cuigv:PrimaryColor",
  "$cui-button-background|default": "textures/.cui-assets/background",
  "$cui-button-icon|default": "textures/ui/empty",
  "$cui-button-font-color|default": "$cuigv:FontPrimaryColor",
  "type": "button",
  "size": "$cui-button-size",
  "layer": 1,
  "default_control": "default",
  "hover_control": "hover",
  "pressed_control": "pressed",
  "button_mappings": [...]
}
```
- Inherits the theme from `$cuigv:*` (color, fonts, alphas).
- 4 visual states (default/hover/pressed) + focus ring.

### 1.4 Reusable vanilla "menu_button" button
```json
"my_btn@common_buttons.menu_button": {
  "$button_text": "My Button",
  "$pressed_button_name": "button.menu_select",
  "$button_effect_name": "button.menu_ok"
}
```
Used by bl4z3_forms as the base of `menu_button_main`.

---

## 2. Labels (Text)

### 2.1 Basic label
```json
"my_label": {
  "type": "label",
  "text": "Static text",
  "color": [1.0, 1.0, 1.0],
  "font_type": "MinecraftTen",
  "font_scale_factor": 1.0,
  "shadow": true,
  "text_alignment": "center",
  "anchor_from": "center",
  "anchor_to": "center",
  "layer": 2
}
```

### 2.2 Label with binding (dynamic text) — Scoreboar scoreboards.json:24-30
```json
"scoreboard_sidebar_score": {
  "type": "label",
  "layer": 2,
  "size": ["default", 10],
  "text": "#player_score_sidebar",
  "text_alignment": "right",
  "anchor_from": "top_right",
  "anchor_to": "top_right",
  "inherit_max_sibling_width": true,
  "locked_alpha": 1.0,
  "color": "$player_score_color",
  "shadow": true,
  "binding_type": "collection",
  "binding_collection_name": "scoreboard_scores",
  "binding_name": "#player_score_sidebar"
}
```
Key properties:
- `inherit_max_sibling_width: true` — aligns to the maximum width of the stack (scoreboard).
- `locked_alpha: 1.0` — prevents the scoreboard fade from dimming it.
- `binding_type: "collection"` — filled by factory per player.

### 2.3 Label with `font_type` observed
| Font | Use |
|---|---|
| `MinecraftTen` | Large titles (Bl4z3 `titles`, Scoreboar loading) |
| `default` | Normal text |

---

## 3. Images

### 3.1 Simple image
```json
"bg": {
  "type": "image",
  "texture": "textures/ui/Black",
  "size": ["100%", "100%"],
  "color": [0.2, 0.2, 0.2, 0.9],   // color + alpha as RGBA
  "alpha": 0.85,
  "layer": 0
}
```

### 3.2 Image with `flip_book` (animated sprite sheet) — Scoreboar loading_anim.json
```json
"anim": {
  "anim_type": "flip_book",
  "initial_uv": [0, 0],
  "frame_count": 91,
  "frame_step": 10,
  "fps": 30,
  "reversible": false,
  "easing": "linear"
},
"pickaxe": {
  "type": "image",
  "layer": 1,
  "texture": "textures/ui/loading_anim/mine_chop_dig_animation",
  "size": [30, 30],
  "uv_size": [10, 10],
  "uv": "@loading_anim.anim",
  "color": [1, 1, 1, 1]
}
```
The `flip_book` animation advances the `uv` over a sprite sheet; the node links it with `"uv": "@name.animation"`.
Other real flip_books in the same file: `portal_animation` (16 frames, `reversible: true`), `spinner_animation` (10 frames), `anim_realms_stories_icon` (13 frames, `looping: false`).

### 3.3 Texture `textures/ui/Black` — universal translucent block
Used in: Scoreboar (scoreboard bg, tooltip bg), Bl4z3 (backgrounds), System Slayer.
```json
"bg": { "type": "image", "texture": "textures/ui/Black", "alpha": 0.7 }
```

---

## 4. Inputs

### 4.1 Text Edit Box (text field) — Scoreboar search_form.json
```json
"search_text": {
  "type": "text_edit_box",
  "text_name": "search_field",         // input binding name
  "placeholder_text": "Search...",
  "size": ["100% - 44px", 20],
  "anchor_from": "left_middle",
  "anchor_to": "left_middle",
  "text_edit_box_binding": {
    "binding_name": "#search_query",   // binding that feeds the value
    "binding_type": "view"
  },
  "bindings": [
    { "binding_name": "#search_query",
      "binding_type": "view" }
  ]
}
```

### 4.2 `text_edit_box_binding` — Binding an input to a value
```json
"text_edit_box_binding": {
  "binding_name": "#my_value",
  "binding_type": "view"
}
```
When the user types, it updates `#my_value`; when the server sets `#my_value`, it fills the input.

---

## 5. Dynamic Lists and Grids

### 5.1 Stack + factory (vertical list) — bl4z3_forms form.json:47-91
```json
"form_grid": {
  "type": "grid",
  "grid_dimensions": [3, 3],
  "grid_fill_direction": "horizontal",
  "grid_rescaling_type": "horizontal",
  "grid_item_template": "$grid_item_template",
  "collection_name": "form_buttons",
  "factory": {
    "name": "buttons",
    "control_name": "$grid_item_template"
  }
}
```
- The **engine** calls the factory with a registered name (`buttons`).
- `control_name`/`control_ids` assigns the control to use for each "item".

### 5.2 Grid + factory (button grid) — bl4z3_forms form.json:47-91
```json
"form_grid": {
  "type": "grid",
  "grid_dimensions": [3, 3],
  "grid_fill_direction": "horizontal",
  "grid_rescaling_type": "horizontal",
  "grid_item_template": "$grid_item_template",
  "collection_name": "form_buttons",
  "factory": {
    "name": "buttons",
    "control_name": "$grid_item_template"
  },
  "bindings": [
    { "binding_name": "#form_button_length",
      "binding_name_override": "#maximum_grid_items" }
  ]
}
```

### 5.3 Scrollable list (chats, logs) — ChatCh chat_screen.json
```json
"messages": {
  "type": "panel",
  "size": ["100%", "100%"],
  "controls": [{
    "message_list@chat.common_text_panel": {
      "size": ["100%", "100%c"],
      "anchor_from": "bottom_left",
      "anchor_to": "bottom_left",
      "collection_name": "chat_texts",          // the engine fills this collection
      "type": "stack_panel",
      "orientation": "vertical"
    }
  }]
}
```
The chat engine feeds `chat_texts`; you just render it.

---

## 6. Scroll Views (Scrolling Panel)

### 6.1 Standard usage (bl4z3_forms common.json)
```json
"scroll_panel@common.scrolling_panel": {
  "$show_background": false,
  "size": ["100% - 20px", "100% - 20px"],
  "$scrolling_content": "bl4z3_common.content_stack",
  "$scroll_size": [5, "100% - 4px"],
  "$scrolling_pane_size": ["100% - 8px", "100% - 4px"],
  "$scrolling_pane_offset": [4, 0]
}
```

### 6.2 Scrollbar styles observed
| Style | Scrollbar | Scroll track | Use |
|---|---|---|---|
| Vanilla default | `textures/ui/ScrollBox` | `textures/ui/ScrollRail` / `ScrollGutterWithBG` | Everything (real vanilla paths) |
| Thin | `[5, "100% - 4px"]` | custom | Scoreboar |
| Transparent with hover | `anim_scrollbar_box_fadeout` | vanilla | Scoreboar ui_common.json |

> Note: `textures/ui/scrollbar` does not exist in vanilla — the real names are `ScrollBox`, `ScrollRail`, `ScrollHandle` and `ScrollGutterWithBG` (verified in the official vanilla resource pack).

### 6.3 `anim_scrollbar_box_fadeout` (Scoreboar ui_common.json:4-11)
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
The scrollbar fades out on release and reappears on interaction.

---

## 7. Tooltips (Hover)

### 7.1 Native tooltip (vanilla `hover_text_renderer`)
```json
"tooltip": {
  "type": "panel",
  "bindings": [
    { "binding_name": "#tooltip_text", "binding_type": "global" }
  ],
  "renderer": "hover_text_renderer",   // renders text on cursor hover
  "size": ["100%", "100%"],
  "controls": [{ "tooltip_bg": { "type": "image", "texture": "textures/ui/tooltip_default_background", "size": ["100%", "100%"] } }]
}
```
❌ **Not observed** in your packs — the renderer exists but your packs don't use it.

### 7.2 Custom tooltip that follows the cursor (Scoreboar hover_tooltip.json:4-16)
```json
"custom_hover_screen": {
  "type": "screen",
  "layer": 100,
  "size": [0, 0],
  "follows_cursor": true,
  "force_render_below": false,
  "always_accepts_input": false,
  "should_steal_mouse": false,
  "is_modal": false,
  "controls": [{
    "hover_bg": {
      "type": "image",
      "texture": "textures/ui/Black",
      "size": ["100%c + 10px", "100%c + 6px"],
      "layer": 101,
      "anchor_from": "top_left",
      "anchor_to": "top_left",
      "offset": [2, 4],
      "alpha": 0.85,
      "controls": [{
        "hover_text": {
          "type": "label",
          "text": "#form_button_text",
          "color": [1, 1, 1],
          "max_size": [200, "default"],
          "binding_type": "collection",
          "binding_collection_name": "form_buttons"
        }
      }]
    }
  }]
}
```
**How it works**:
- 0×0 screen with `follows_cursor: true` — positions itself at the cursor.
- `layer: 100` — on top of everything.
- `size: ["100%c + 10px", ...]` — auto-fits to the content (text).
- The text uses `binding_type: collection` + `binding_collection_name: form_buttons` to read the current button's hover.
- `allow_clipping: false` (layout.md §7.2) prevents clipping.

---

## 8. Modals / Overlays

### 8.1 `screen` modal — blocks input
```json
"confirm_screen": {
  "type": "screen",
  "layer": 50,
  "is_modal": true,
  "absorbs_input": true,          // captures all input
  "should_steal_mouse": true,
  "controls": [{
    "dark_bg": {
      "type": "image",
      "texture": "textures/ui/Black",
      "alpha": 0.6,
      "size": ["100%", "100%"]
    }
  }]
}
```
bl4z3_forms `.cui-dialog` is the most complete example (see advanced-patterns.md).

### 8.2 `.cui` dialog (bl4z3_forms .cui/.screens/.cui-dialog)
```json
"cui-dialog": {
  "type": "panel",
  "size": ["100%", "100%"],
  "layer": 100,
  "controls": [
    { "backdrop": { "type": "image", "texture": "textures/ui/Black", "alpha": 0.6, "size": ["100%", "100%"] } },
    { "dialog": {
        "type": "panel",
        "size": ["80%", "70%"],
        "anchor_from": "center",
        "anchor_to": "center",
        "layer": 101,
        "controls": [
          { "header@cui-common.cui-header": {} },
          { "body@cui-common.cui-body": {} },
          { "footer@cui-common.cui-footer": {} }
        ]
    } }
  ]
}
```
Full dialog pattern with backdrop + centered panel + header/body/footer.

---

## 9. Sliders, Toggles, Dropdowns (reusable vanilla)

### 9.1 Slider (vanilla)
```json
"my_slider@settings_common.option_slider": {
  "$slider_label": "Volume",
  "$slider_value": 0.5,
  "$slider_min": 0.0,
  "$slider_max": 1.0,
  "$slider_step": 0.01,
  "$slider_tooltip": "Controls the volume"
}
```

### 9.2 Toggle (vanilla) — bl4z3_forms `.cui-toggle`
```json
"my_toggle@common_toggles.light_template_toggle": {
  "$toggle_label": "Enable",
  "$toggle_value": true
}
```

### 9.3 Dropdown (vanilla)
```json
"my_dropdown@settings_common.option_dropdown": {
  "$dropdown_label": "Language",
  "$dropdown_options": ["ES", "EN", "FR"]
}
```

---

## 10. Paperdoll / Player Renderer

### 10.1 Paperdoll with renderer_hover_text (bl4z3_forms)
```json
"renderer_hover_text": {
  "type": "custom",
  "renderer": "hover_text_renderer",
  "size": ["100%", "100%"]
}
```
Shows a tooltip on hover.

---

## 11. Per-component checklist

| Component | Essential props | Useful defaults |
|---|---|---|
| **button** | `type`, `default_control`, `hover_control`, `pressed_control`, `button_mappings`, `sound_name` | `locked_control`, `focus_control` |
| **label** | `type`, `text`, `color`, `binding_type`, `text_alignment` | `font_type: MinecraftTen`, `font_scale_factor`, `shadow`, `inherit_max_sibling_width`, `locked_alpha` |
| **image** | `type`, `texture`, `size` | `uv`, `uv_size`, `alpha`, `color` |
| **text_edit_box** | `type`, `text_edit_box_binding`, `text_name` | `placeholder_text` |
| **stack_panel** | `type`, `orientation`, `controls` | `size` with `"fill"` |
| **grid** | `type`, `grid_dimensions`, `grid_item_template`, `collection_name` | `grid_rescaling_type`, `grid_fill_direction`, `factory` |
| **screen** | `type`, `layer`, `controls` | `follows_cursor`, `is_modal`, `absorbs_input`, `should_steal_mouse`, `allow_clipping` |
| **factory** | `name`, `control_ids` or `control_name` | — |
| **scrolling_panel** | `type` (via `common.scrolling_panel`), `$scrolling_content`, `$scroll_size` | `$show_background`, `$scrolling_pane_size`, `$scrolling_pane_offset` |