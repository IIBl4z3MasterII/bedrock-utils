# Layout — Panels, Stack Panels, Grids, Anchors, Offsets, Sizes

> Real patterns extracted from: Scoreboar, Bl4z3 (bl4z3_forms), WayMar, ChunkPrevi, System Slayer.

---

## 1. Coordinate System and Anchors

### 1.1 `anchor_from` / `anchor_to`
Defines **where** on the control (`anchor_from`) aligns with **where** on the parent (`anchor_to`).

Valid values observed:
```
top_left, top_middle, top_right,
left_middle, center, right_middle,
bottom_left, bottom_middle, bottom_right
```

### 1.2 Real examples

**Perfect centering (Scoreboar loading_anim.json:107-108):**
```json
"logo_panel": {
  "anchor_from": "center",
  "anchor_to": "center",
  "offset": [0, -30]
}
```

**Top-right corner (Scoreboar search_form.json:44-48):**
```json
"custom_close_button": {
  "anchor_from": "top_right",
  "anchor_to": "top_right",
  "offset": [-4, 4]
}
```

**Left-center (bl4z3_forms common.json:150):**
```json
"content": {
  "anchor_from": "center",
  "anchor_to": "center"
}
```

**Bottom-left HUD (Scoreboar hud_screen.json:68-69):**
```json
"player_position": {
  "anchor_from": "bottom_left",
  "anchor_to": "bottom_left",
  "offset": [2, -2]
}
```

---

## 2. Sizes — Full Syntax

### 2.1 Units observed

| Syntax | Meaning | Real example |
|---|---|---|
| `100` | Absolute pixels | `"size": [162, 54]` (chest grid 9×3) |
| `"100%"` | % of parent | `"size": ["100%", "100%"]` |
| `"100%c"` | % of the **content size** (scrolling_panel) | `"size": ["100%c", "100%c"]` (loading_anim.json:480) |
| `"100%cm"` | % of content minus margins | `"size": ["100%cm", "100%c"]` (scoreboards.json:195) |
| `"100%sm"` | % of the sibling's **measured size** | `"size": ["100%sm + 30px", "100%sm + 6px"]` (hud_screen.json:289) |
| `"100%y"` | % of the parent's Y axis | `"size": ["100%y", "100%"]` (scoreboards.json:195) |
| `"fill"` | Remaining space in a stack_panel | `"size": ["fill", "100%c"]` (scoreboards.json:318) |
| `"100% - 16px"` | Arithmetic | `"size": ["100% - 16px", 70]` (search_form.json:72) |
| `"100% + 4px"` | Arithmetic addition | `"size": ["100% + 4px", "100% + 4px"]` (search_form.json:14) |
| `["100%c", "100%cm"]` | Mixed | (hud_screen.json:284) |
| `["200%", 274]` | ⚠ 200% of parent (probable bug) | (server_form.json:325 bl4z3_forms) |

### 2.2 `offset` with anchors
```json
"offset": [x, y]  // relative to anchor_from/anchor_to
```
Values can be numbers, `"100%c"`, `"calc(...)"`, or bindings.

**Example with calc (Scoreboar while.json:52):**
```json
"size": ["calc(($subtitle_text.length * 9)px + 10px + 20px)", 30]
```

---

## 3. Panel — Base Container

### 3.1 Simple panel with children
```json
"my_panel": {
  "type": "panel",
  "size": ["100%", "100%"],
  "controls": {
    "child1": { ... },
    "child2": { ... }
  }
}
```

### 3.2 Panel with background + centered content (Pattern `main_panel_empty` — bl4z3_forms common.json:113-146)
```json
"main_panel_empty": {
  "$background|default": "textures/ui/custom/background",
  "$content_size|default": ["100% - 2px", "100% - 2px"],
  "$panel_size|default": ["100%", "100%"],
  "$clips_children|default": false,
  "$content|default": [],
  "type": "panel",
  "size": "$panel_size",
  "controls": [
    { "background": { "type": "image", "texture": "$background", "size": ["100%", "100%"], "layer": 0 } },
    { "content": {
        "type": "panel",
        "size": "$content_size",
        "anchor_from": "center",
        "anchor_to": "center",
        "clips_children": "$clips_children",
        "layer": 1,
        "controls": "$content"
    } }
  ]
}
```
**Reusable**: injects `$background`, `$content_size`, `$content` from the parent.

---

## 4. Stack Panel — Linear Layout

### 4.1 Vertical (default)
```json
"my_stack": {
  "type": "stack_panel",
  "orientation": "vertical",
  "size": ["100%", "100%c"],
  "controls": [
    { "item1": { "type": "label", "text": "One" } },
    { "item2": { "type": "label", "text": "Two" } }
  ]
}
```

### 4.2 Horizontal
```json
"horizontal_stack": {
  "type": "stack_panel",
  "orientation": "horizontal",
  "size": ["100%c", "100%c"],
  "controls": [...]
}
```

### 4.3 `fill` — fill remaining space (Scoreboar scoreboards.json:318)
```json
"details@scoreboard.player_details": {
  "type": "stack_panel",
  "orientation": "vertical",
  "size": ["fill", "90%"],   // "fill" = remaining horizontal
  "controls": [...]
}
```

### 4.4 `collection_name` + `factory` — dynamic list (bl4z3_forms form.json:47-91)
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
- `factory.name` = name of the factory registered in the engine
- `control_ids`/`control_name` = maps internal name → control (with `@` for inheritance)

---

## 5. Grid — Grids

### 5.1 Grid with factory + rescaling (bl4z3_forms form.json:47-91)
```json
"form_grid": {
  "type": "grid",
  "grid_dimensions": [3, 3],
  "grid_fill_direction": "horizontal",
  "grid_rescaling_type": "horizontal",  // "horizontal" | "vertical" | "none"
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

### 5.2 `grid_rescaling_type` observed
| Value | Behavior |
|---|---|
| `"horizontal"` | Adds columns, fixed rows (bl4z3_forms, Scoreboar shop) |
| `"vertical"` | Adds rows, fixed columns |
| `"none"` | Fixed dimensions |

### 5.3 Grid with `collection_index` — static positioning (bl4z3_forms main.json:91-141)
```json
"top": {
  "type": "stack_panel",
  "size": ["100%c", "50%"],
  "orientation": "horizontal",
  "collection_name": "form_buttons",
  "controls": [
    { "top_left@bl4z3_main.button": { "collection_index": 0 } },
    { "top_right@bl4z3_main.button": { "collection_index": 1 } }
  ]
}
```
Useful for fixed layouts (2×2, 3×1, etc.) where each cell takes a specific index from the collection.

---

## 6. Scrolling Panel — Vertical/Horizontal Scroll

### 6.1 Pattern `common.scrolling_panel` (Scoreboar server_form.json:203-209)
```json
"body_scroll@common.scrolling_panel": {
  "$show_background": false,
  "size": ["100%", "100%"],
  "$scrolling_content": "server_form.body_scrolling_content",
  "$scroll_size": [5, "100% - 4px"],           // [scrollbar width, track height]
  "$scrolling_pane_size": ["100% - 6px", "100% - 2px"], // viewport
  "$scrolling_pane_offset": [2, 0],
  "layer": 10
}
```

### 6.2 scrolling_panel variables (injected via `$`)
| Variable | What it controls |
|---|---|
| `$show_background` | Show the scroll background (bool) |
| `$scrolling_content` | Control containing the scrollable content |
| `$scroll_size` | `[bar_width, track_height]` |
| `$scrolling_pane_size` | Size of the visible viewport |
| `$scrolling_pane_offset` | Viewport offset within the panel |

### 6.3 Horizontal scroll (bl4z3_forms common.json:532-594 `grid_button_panel_main`)
```json
"grid_button_panel_main": {
  "type": "grid",
  "grid_dimensions": [3, 1],
  "grid_fill_direction": "horizontal",
  "grid_rescaling_type": "horizontal",
  "grid_item_template": "$button_control",
  ...
}
```
(Uses a grid with 1 row + horizontal rescaling = effective horizontal scroll)

---

## 7. Clipping — `clips_children` and `allow_clipping`

### 7.1 `clips_children: true` — clips children to the panel bounds
```json
"loading_bar_grass": {
  "type": "panel",
  "clips_children": true,
  "controls": [{
    "loading_bar": {
      "anchor_from": "left_middle",
      "anchor_to": "left_middle",
      "anims": ["@loading_anim.anim_loading_bar"],
      "clips_children": true,
      "controls": [{ "bar_img": { ... } }]
    }
  }]
}
```
Scoreboar loading_anim.json:469-484 — loading bar that grows from the left (`clips_children` on the parent panel + `size` animation on the child).

### 7.2 `allow_clipping: false` — forces render outside bounds (tooltips)
```json
"custom_hover_screen": {
  "type": "screen",
  "layer": 100,
  "size": [0, 0],
  "follows_cursor": true,
  "allow_clipping": false,      // key for a tooltip that follows the cursor!
  "controls": [...]
}
```
Scoreboar hover_tooltip.json:4-16 — without this, the tooltip would be clipped at the screen edge.

---

## 8. Common Layout Patterns (Summary)

| Pattern | Where it's used | Key |
|---|---|---|
| **Centered panel + background** | Almost all forms | `main_panel_empty` (bl4z3_forms) |
| **Header (title + close) + Body scroll + Buttons grid** | Server forms | `server_form.long_form` (Scoreboar, bl4z3_forms) |
| **Sidebar + Grid content** | Shops, main menus | `bl4z3_form.generic_form` + `form_grid` + `sidebar` |
| **Chest grid 9×N + inventory below** | Containers | `chest_screen.json` (invsee) |
| **Full-screen centered loading screen** | Loading anim | `loading_animation` (Scoreboar) |
| **Fixed bottom-left/right HUD** | Coordinates, days | `hud_screen.json` (Scoreboar) |

---

## 9. "Magic" values observed (avoid / document)

| Value | Where | Comment |
|---|---|---|
| `alpha: 2.0` | Scoreboar hud_screen.json:22 | ⚠ Out of range [0,1], may not work |
| `"200%"` width | bl4z3_forms server_form.json:325 | ⚠ Probable bug, overflows |
| `"115% - 15px"` | bl4z3_forms server_form.json:608 | Blind tuning |
| `offset: [155, -102]` | bl4z3_forms grid.json:51 | Absolute px anchor, not responsive |
| `"100%c + 6px"` | Scoreboar search_form.json:14 | Content size + fixed padding |

---

## 10. Minimal Reusable Example — Standard Form

```json
{
  "namespace": "my_form",
  "generic_form": {
    "$form_size|default": ["90%", "80%"],
    "$form_offset|default": [0, 0],
    "$title_text|default": "Title",
    "$form_content|default": [],
    "type": "panel",
    "size": "$form_size",
    "offset": "$form_offset",
    "controls": [
      { "header@my_form.header_panel": {} },
      { "body@common.scrolling_panel": {
          "$show_background": false,
          "size": ["100%", "100% - 60px"],
          "$scrolling_content": "my_form.body_content",
          "$scroll_size": [5, "100% - 4px"]
        }
      },
      { "footer@my_form.button_bar": {} }
    ]
  },
  "header_panel": {
    "type": "panel",
    "size": ["100%", 40],
    "anchor_from": "top_middle",
    "anchor_to": "top_middle",
    "controls": [
      { "title": {
          "type": "label", "text": "$title_text",
          "font_type": "MinecraftTen", "font_scale_factor": 1.6,
          "anchor_from": "center", "anchor_to": "center"
        }
      },
      { "close@common.close_button": {
          "anchor_from": "top_right", "anchor_to": "top_right", "offset": [-8, 8]
        }
      }
    ]
  },
  "body_content": {
    "type": "stack_panel",
    "orientation": "vertical",
    "size": ["100%", "100%c"],
    "controls": "$form_content"
  },
  "button_bar": {
    "type": "stack_panel",
    "orientation": "horizontal",
    "size": ["100%", 40],
    "anchor_from": "bottom_middle",
    "anchor_to": "bottom_middle",
    "controls": []
  }
}
```
Based on `bl4z3/form.json:5-26` + `server_form.json` patterns.