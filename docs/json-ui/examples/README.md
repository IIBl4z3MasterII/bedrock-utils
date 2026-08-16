# JSON Fragments — Bedrock Utils → JSON UI

> **Focused and annotated** fragments, extracted from the real packs (`[Scoreboar]`, `RPBl4z3Forms`). These are not the full files: only the part that demonstrates each pattern, with `//_N_...` keys explaining each block.
>
> **Validation**: all pass `JSON.parse` (Node.js) — the annotated `//_1_...` keys are normal JSON keys, not comments.

## Index

| File | Origin pack | What it demonstrates |
|---|---|---|
| `ui_defs.json` | `[Scoreboar]` | **How everything connects**: registers ONLY new files; same-key overrides don't go here; without registration, `@namespace.control` doesn't resolve |
| `server_form_router.json` | `[Scoreboar]` | **How server_form routes to custom forms**: `third_party_server_screen`, `control_ids` factory (long_form/custom_form), and the title-prefix switch `§b§l§4§z§3` that mounts the `search_form` |
| `search_bar.json` | `[Scoreboar]` | **How the search_bar works**: `text_edit_box` (`$text_edit_text_control`), lowercase processor in view bindings (string-processing), and per-button filter (`#no_match` → `#visible`) |
| `scoreboard_sidebar.json` | `[Scoreboar]` | Sidebar override: `scoreboard_players`/`scoreboard_scores` collections, factories, global visibility bindings |
| `loading_anim.json` | `[Scoreboar]` | Alpha in→out cycle with `next`, loading bar `anim_type:size`, flip_book over sprite sheet |
| `hover_tooltip.json` | `[Scoreboar]` | Tooltip that follows the cursor: `follows_cursor:true` screen, layer 100, collection binding |
| `global_variables.json` | `[Scoreboar]` | Global color/theme variables (`$player_score_color`, etc.) — real file with `//` comments that the engine tolerates |

## How to use

1. Copy the **fragment** to your production file and adapt variables (`$`), textures, and bindings to your protocol.
2. **New files** (`search_form.json`, `hover_tooltip.json`, `loading_anim.json`) → register them in `ui/_ui_defs.json` with the `ui/<file>` path.
3. **Vanilla overrides** (`server_form.json`, `scoreboards.json`) → place them in `ui/` with the vanilla name, **without** registering them.

## Full connection chain

```
BP: form.show(player) with prefixed title "§b§l§4§z§3 ..."
        │
        ▼
RP: ui/server_form.json  (third_party_server_screen, vanilla override)
        │  factory control_ids → custom_form
        ▼
server_form_router.json: custom_long_form@search_form.advanced_long_form
        │  visible if the title contains the marker prefix
        ▼
ui/center/forms/search_form.json  (registered in ui_defs.json)
        │  mounts the text_edit_box + search_processor + filterable grid
        ▼
ui/_ui_defs.json  →  "ui/center/forms/search_form.json"
```

## Validation notes

- `global_variables.json` is the real file with inline `//` comments — valid for the Bedrock engine, but rejected by `JSON.parse`/`ConvertFrom-Json`.
- The annotated fragments use `//_N_...` keys (valid JSON) to explain each block without breaking the syntax.