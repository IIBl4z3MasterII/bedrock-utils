# Complete Interfaces — HUD, Server Form, Pause, Chat, Scoreboard, Containers

> Complete real screens extracted from your packs. These are proven templates, not isolated fragments.

---

## 1. HUD (`hud_screen.json`)

The HUD is made up of vanilla sections that can be overridden: **actionbar**, **title/subtitle**, **chat**, **scoreboard**, **position**, **days played**.

### 1.1 Basic override with modifications (Scoreboar hud_screen.json:1-18)
```json
{
  "namespace": "hud",
  "hud_actionbar_text@common.hud_actionbar_text": {
    "alpha": 2.0,   // ⚠ bug: alpha >1 is not supported; use 1.0
    "layer": 2,
    "text": "nperma_root",
    "text_alignment": "center",
    "anchor_from": "bottom_left",
    "anchor_to": "bottom_left",
    "offset": [0, 0]
  },
  "hud_title_text@common.hud_title_text": {
    "text": "hud_title_text_string",
    "text_alignment": "center",
    "shadow": true
  }
}
```

### 1.2 Injecting your own panels into the root (Scoreboar hud_screen.json:689-732)
```json
"root_panel": {
  "modifications": [
    {
      "array_name": "controls",
      "operation": "insert_back",
      "value": [
        { "custom_position_panel@hud.player_position_and_days_played": {} },
        { "loading_anim_hook": { ... } },
        { "tooltip_hook@hover_tooltip.custom_hover_screen": {} }
      ]
    }
  ]
}
```

### 1.3 Custom coordinates + days panel (Scoreboar hud_screen.json:19-99)
```json
"player_position_and_days_played": {
  "type": "panel",
  "size": ["100%", "100%"],
  "anchor_from": "bottom_left",
  "anchor_to": "bottom_left",
  "offset": [2, -2],
  "controls": [
    { "number_of_days_played": {
        "type": "image",
        "texture": "textures/ui/Black",
        "size": ["100%", "100%"],
        "alpha": 0.7,
        "anchor_from": "bottom_left",
        "anchor_to": "bottom_left",
        "controls": [{
          "days_label": {
            "type": "label",
            "text": "#number_of_days_played_text",
            "color": [1.0, 1.0, 1.0],
            "layer": 2,
            "anchor_from": "center",
            "anchor_to": "center",
            "binding_name_override": "#text",
            "binding_condition": "always_when_visible",
            "binding_type": "global",
            "enable_profanity_filter": false
          }
        }]
    } },
    { "position_text": {
        "type": "label",
        "text": "#position_text",
        "color": [1.0, 1.0, 1.0],
        "shadow": true,
        "layer": 2,
        "anchor_from": "bottom_left",
        "anchor_to": "bottom_left",
        "offset": [0, -14],
        "binding_type": "global",
        "binding_condition": "always_when_visible",
        "text_alignment": "center",
        "enable_profanity_filter": false
    } }
  ]
}
```

### 1.4 Most used HUD global bindings
| Binding | Origin | What it shows |
|---|---|---|
| `#position_text` | engine | Player XYZ coordinates |
| `#number_of_days_played_text` | engine | Days played (1.21+) |
| `#actionbar_text` | engine / `setActionBar()` | ActionBar |
| `hud_title_text_string` / `hud_subtitle_text_string` | engine / `setTitle()` | Title/Subtitle |
| `$title_text` / `$subtitle_text` | engine | Title/Subtitle (var) |
| `#hud_scoreboard_objective_name` | engine | Scoreboard objective |

### 1.5 `$title_text` routing with images (Scoreboar while.json:39-60)
```json
"totem_image": {
  "type": "image",
  "texture": "textures/items/totem",
  "size": [30, 30],
  "ignored": "(not (($title_text > 'totem_blz.') and ($title_text < 'totem_blz/')))"
}
```
**Trick**: compares `$title_text` lexicographically against a range to know if the title starts with `totem_blz.` → only shows the image if the title requests it.

---

## 2. Server Form (`server_form.json`)

### 2.1 Base structure (Scoreboar server_form.json:35-44)
```json
"third_party_server_screen@common.base_screen": {
  "$screen_content": "server_form.main_screen_content",
  "button_mappings": [
    { "from_button_id": "button.menu_cancel",
      "to_button_id": "button.menu_exit",
      "mapping_type": "global" }
  ]
}
```

### 2.2 Screen content (Scoreboar server_form.json:45-68)
```json
"main_screen_content": {
  "type": "panel",
  "size": ["90%", "80%"],
  "layer": 1,
  "propagate_alpha": true,
  "animations": [
    { "screen_open_alpha": { "anim_type": "alpha", "from": 0.0, "to": 1.0, "duration": 0.3, "easing": "out_sine" } },
    { "screen_open_scale": { "anim_type": "size", "from": ["95%", "95%"], "to": ["100%", "100%"], "duration": 0.35, "easing": "out_back" } }
  ],
  "controls": [...]
}
```
- `propagate_alpha: true` — the fade applies to all children.
- Entrance animations: fade + scale (out_back = slight bounce).

### 2.3 Forms factory (Scoreboar server_form.json:69-77)
```json
"server_form_factory": {
  "type": "factory",
  "control_ids": {
    "long_form": "@server_form.long_form",
    "custom_form": "@server_form.custom_form"
  }
}
```
The engine picks between `long_form` (ActionForm) and `custom_form` (ModalForm) depending on the received form type.

### 2.4 `long_form` — full ActionForm (Scoreboar server_form.json:78-230)
```json
"long_form": {
  "type": "panel",
  "size": ["100%", "100%"],
  "layer": 1,
  "controls": [
    { "header@server_form.header_panel": {} },
    { "body@server_form.body_scroll": {} },
    { "footer@server_form.footer_buttons": {} }
  ]
}
```
- **header**: title + close button.
- **body**: `common.scrolling_panel` with the button list.
- **footer**: button bar (optional).

### 2.5 Button grid in the body (Scoreboar server_form.json:180-202)
```json
"body_buttons_grid": {
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
```
- `form_buttons` is the collection the engine fills with the ActionForm buttons.
- `#form_button_length` limits how many are shown (max grid items).

### 2.6 Form button (Scoreboar server_form.json:210-290)
```json
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
```

### 2.7 `custom_form` — native ModalForm (Scoreboar server_form.json:292-330)
```json
"custom_form": {
  "type": "panel",
  "size": ["100%", "100%"],
  "controls": [{
    "custom_form_body@server_form.custom_form_scroll": {
      "controls": [
        { "form_title": { "type": "label", "text": "#title_text", ... } },
        { "form_dropdown@settings_common.option_dropdown": {} },
        { "form_slider@settings_common.option_slider": {} },
        { "form_toggle@common_toggles.light_template_toggle": {} },
        { "form_text_input@settings_common.option_text_edit": {} }
      ]
    }
  }]
}
```
The engine injects the `#title_text`, `#dropdown`, `#slider`, `#toggle`, `#input` controls depending on the ModalForm element type.

### 2.8 Server form bindings (engine)
| Binding | Form type | What it feeds |
|---|---|---|
| `#title_text` | Both | Title |
| `#body_text` | ModalForm | Body text |
| `#form_text` | Both | Main text |
| `#form_button_text` | ActionForm | Button text (collection `form_buttons`) |
| `#form_button_length` | ActionForm | Number of buttons |
| `#form_button_texture` | ActionForm | Button texture |
| `#form_button_texture_file_system` | ActionForm | File system (web vs local) |
| `#dropdown_options` | ModalForm | Dropdown options (collection `dropdown_options`) |

### 2.9 Title-based router (bl4z3_forms server_form.json:584-640)
```json
"server_form_factory": {
  "type": "factory",
  "control_ids": {
    "long_form": "@server_form.long_form",
    "custom_form": "@server_form.custom_form"
  }
},
"long_form": {
  "type": "panel",
  "controls": [{
    "form_router": {
      "type": "panel",
      "controls": [
        { "shop@bl4z3_shop.shop": { "ignored": "(not ($title_text = 'SHOP'))" } },
        { "map@bl4z3_map.map": { "ignored": "(not ($title_text = 'MAP'))" } },
        { "skills@bl4z3_skills.skills": { "ignored": "(not ($title_text = 'SKILLS'))" } },
        { "default@bl4z3_main.default": { "ignored": "(not ($title_text = 'MAIN'))" } }
      ]
    }
  }]
}
```
**The game engine** selects the sub-panel whose `ignored` evaluates to `false` by comparing `$title_text`.

### 2.10 Server form with header text + icon (bl4z3_forms `server_form.json`)
```json
"title": {
  "type": "label",
  "text": "#title_text",
  "color": "$cuigv:FontPrimaryColor",
  "font_type": "MinecraftTen",
  "font_scale_factor": 1.5,
  "layer": 2
}
```
bl4z3_forms uses `#title_text` + custom header text to brand its forms.

---

## 3. Pause Screen (`pause_screen.json`)

### 3.1 Basic override (WayMar pause_screen.json:1-30)
```json
"root_panel": {
  "modifications": [
    {
      "array_name": "controls",
      "operation": "insert_back",
      "value": [
        { "waypoint_button@pause_screen.waypoint_button": {} },
        { "waypoint_panel@pause_screen.waypoint_panel": {} }
      ]
    }
  ]
}
```

### 3.2 Custom button in pause (WayMar pause_screen.json:31-80)
```json
"waypoint_button": {
  "type": "button",
  "size": ["100%", 24],
  "anchor_from": "top_left",
  "anchor_to": "top_left",
  "offset": [0, 24],
  "default_control": "default",
  "hover_control": "hover",
  "button_mappings": [
    { "from_button_id": "button.menu_select",
      "to_button_id": "button.menu_ok",
      "mapping_type": "pressed" }
  ]
}
```

### 3.3 Pause screen with "menu_exit" (ChunkPrevi pause_screen.json)
```json
"quit_button": {
  "type": "button",
  "button_mappings": [
    { "from_button_id": "button.menu_select",
      "to_button_id": "button.menu_exit",
      "mapping_type": "pressed" }
  ]
}
```
Closes the pause menu (equivalent to Esc).

---

## 4. Chat Screen (`chat_screen.json`)

### 4.1 Basic override with `common.chat_screen` (ChatCh)
```json
"chat_screen@common.chat_screen": {
  "controls": [
    { "header@chat.chat_header": {} },
    { "messages@chat.chat_messages": {} },
    { "input@chat.chat_input": {} }
  ]
}
```

### 4.2 Chat input (ChatCh chat_screen.json)
```json
"chat_input": {
  "type": "text_edit_box",
  "text_name": "chat_text",
  "placeholder_text": "Type...",
  "size": ["100%", 20],
  "anchor_from": "bottom_left",
  "anchor_to": "bottom_left",
  "text_edit_box_binding": {
    "binding_name": "#chat_text",
    "binding_type": "global"
  }
}
```

### 4.3 Message rendering (`chat_texts` collection)
```json
"message_list": {
  "type": "stack_panel",
  "orientation": "vertical",
  "size": ["100%", "100%c"],
  "anchor_from": "bottom_left",
  "anchor_to": "bottom_left",
  "collection_name": "chat_texts",
  "controls": [{ "message": { "type": "label", "text": "#text" } }]
}
```
The engine feeds `chat_texts` with chat messages (native collection).

### 4.4 Chat with channel button (ChatCh chat_screen.json:150-170)
```json
"channel_button": {
  "type": "button",
  "size": [100, 20],
  "default_control": "default",
  "button_mappings": [
    { "from_button_id": "button.menu_select",
      "to_button_id": "button.menu_ok",
      "mapping_type": "pressed" }
  ]
}
```
ChatCh adds a channel switch button that the BP listens to via `sendMessage`.

---

## 5. Scoreboard (`scoreboards.json`)

### 5.1 Sidebar override (Scoreboar scoreboards.json:1-30)
```json
"scoreboard_sidebar": {
  "type": "panel",
  "size": ["100%cm", "100%c"],
  "anchor_from": "left_middle",
  "anchor_to": "left_middle",
  "controls": [
    { "main": { "type": "image", "texture": "textures/ui/Black", "alpha": 0.5, "size": ["100%", "100%"] } },
    { "displayed_objective": {
        "type": "label",
        "text": "#objective_sidebar_name",
        "color": [1.0, 1.0, 1.0],
        "anchor_from": "top_middle",
        "anchor_to": "top_middle",
        "shadow": true,
        "layer": 2,
        "font_type": "MinecraftTen",
        "font_scale_factor": 1.2
    } }
  ]
}
```

### 5.2 Dynamic rows (Scoreboar scoreboards.json:24-120)
```json
"scoreboard_sidebar_score": {
  "type": "label",
  "layer": 2,
  "size": ["default", 10],
  "text": "#player_score_sidebar",
  "text_alignment": "right",
  "inherit_max_sibling_width": true,
  "locked_alpha": 1.0,
  "color": "$player_score_color",
  "shadow": true,
  "binding_type": "collection",
  "binding_collection_name": "scoreboard_scores",
  "binding_name": "#player_score_sidebar"
},
"scoreboard_sidebar_player": {
  "type": "label",
  "layer": 2,
  "size": ["default", 10],
  "text": "#player_name_sidebar",
  "text_alignment": "left",
  "inherit_max_sibling_width": true,
  "locked_alpha": 1.0,
  "color": "$player_name_color",
  "shadow": true,
  "binding_type": "collection",
  "binding_collection_name": "scoreboard_players",
  "binding_name": "#player_name_sidebar"
}
```
- `scoreboard_players` / `scoreboard_scores` — engine collections per player.
- `inherit_max_sibling_width` aligns name and score.
- `locked_alpha` prevents fade.

### 5.3 Scoreboard bindings (engine)
| Binding | What it feeds |
|---|---|
| `#objective_sidebar_name` | Objective name |
| `#player_name_sidebar` | Player name (collection `scoreboard_players`) |
| `#player_score_sidebar` | Player score (collection `scoreboard_scores`) |
| `#scoreboard_sidebar_visible` | Visibility |
| `#scoreboard_sidebar_size` | Number of rows |
| `#scoreboard_sidebar_display_order` | Order |

---

## 6. Containers (`chest_screen.json`)

### 6.1 `pocket_containers.json` override (touch) — invsee
```json
"small_chest_grid": {
  "type": "grid",
  "size": [162, 54],
  "grid_dimensions": [9, 3],
  "grid_item_template": "chest.chest_grid_item",
  "collection_name": "container_items"
}
```
(On touch, the grids are bigger for touch screens.)

---

## 7. Reusable Complete Interface Patterns

### 7.1 Modal form (native ModalForm) — Scoreboar
```json
"custom_form": {
  "type": "panel",
  "size": ["100%", "100%"],
  "controls": [{
    "body": {
      "type": "panel",
      "size": ["80%", "70%"],
      "anchor_from": "center",
      "anchor_to": "center",
      "controls": [
        { "title": { "type": "label", "text": "#title_text", "font_type": "MinecraftTen", "font_scale_factor": 1.5 } },
        { "form_dropdown@settings_common.option_dropdown": {} },
        { "form_slider@settings_common.option_slider": {} },
        { "form_toggle@common_toggles.light_template_toggle": {} },
        { "form_text_input@settings_common.option_text_edit": {} }
      ]
    }
  }]
}
```

### 7.2 Form with sidebar (bl4z3_forms `bl4z3_form.generic_form`)
```json
"generic_form": {
  "type": "panel",
  "size": ["100%", "100%"],
  "controls": [
    { "sidebar@bl4z3_form.sidebar": {} },
    { "content@bl4z3_form.content": { "controls": "$form_content" } }
  ]
}
```
The sidebar navigates between sections; the content changes via `$form_content`.

### 7.3 Crate / Loot UI (bl4z3_forms `crate_ui.json`)
```json
"crate_main": {
  "type": "panel",
  "size": ["100%", "100%"],
  "controls": [
    { "title@crate_ui.crate_title": {} },
    { "grid@crate_ui.crate_grid": { "collection_name": "crate_items", "factory": { "name": "crate_factory" } } },
    { "spin_button@crate_ui.spin_button": {} }
  ]
}
```
Item grid + spin button (the BP controls the cycle).

### 7.4 Loading screen (Scoreboar loading_anim.json:450-600)
```json
"loading_screen": {
  "type": "screen",
  "layer": 0,
  "controls": [
    { "bg": { "type": "image", "texture": "textures/ui/Black", "size": ["100%", "100%"] } },
    { "logo": { "type": "image", "texture": "textures/ui/loading_anim/worldsIcon", "anchor_from": "center", "anchor_to": "center", "offset": [0, -40], "anims": [{"anim_type": "alpha", "from": 0, "to": 1, "duration": 0.5, "loop": true, "easing": "out_cubic"}] } },
    { "loading_bar": { ... } }
  ]
}
```

---

## 8. Most used vanilla texture paths

| Texture | Use |
|---|---|
| `textures/ui/Black` | Universal translucent background (exists in vanilla) |
| `textures/ui/White` | White panel (engine-special texture; vanilla references it) |
| `textures/ui/custom/background` | Custom bg (bl4z3_forms `textures/ui/custom/background.png`) |
| `textures/ui/ScrollBox` | Scrollbar (real vanilla name; `scrollbar` does not exist) |
| `textures/ui/ScrollRail` | Vanilla scroll track |
| `textures/ui/close_button_default` | Close (`x_icon` does not exist) |
| `textures/ui/control_white` | UI icons (`icon_set_white` does not exist) |
| `textures/items/totem` | Totem icon |
| `textures/ui/empty` | Transparent (placeholder icon; engine-special texture that vanilla references) |

> Verified against the official vanilla resource pack (Mojang/bedrock-samples): `textures/ui/scrollbar`, `textures/ui/x_icon` and `textures/ui/icon_set_white` do not exist. Real names: `ScrollBox`, `ScrollRail`, `ScrollHandle`, `ScrollGutterWithBG`, `close_button_default/hover/pressed`, `control_white`, `icon_setting`.

---

## 9. Complete interface checklist

- [ ] Screen inherits from `common.base_screen` (for server_form/pause) or uses a direct `screen`
- [ ] Correct `layer` (0 background, 1 content, 50+ modals, 100+ tooltips)
- [ ] `size` in % (responsive) not fixed px where not needed
- [ ] `ignored` with binding for routing (never `visible` with direct binding in modals)
- [ ] Entrance/exit animations (`alpha` + `size` with `easing`)
- [ ] Correct `button_mappings` (menu_select→menu_ok, menu_cancel→menu_exit)
- [ ] `sound_name: "random.click"` on buttons
- [ ] Texture exists in `textures/ui/`
- [ ] Collections: `form_buttons`, `container_items`, `scoreboard_players/scores`, `chat_texts`