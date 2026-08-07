# Glyphs

Glyph textures (custom icons) to use in scoreboards, nametags or
UI using Bedrock's private unicode font trick.

| Archive | Usage |
|---|---|
| `glyph-e01.png` | Glyph custom #1 |
| `glyph-e02.png` | Glyph custom #2 |

---

## How to use them

1. Copy the `.png` to `resource_pack/font/glyph_E1.png` (one image per
page of 256 glyphs, according to the Bedrock convention).
2. Reference the corresponding private unicode character in the text
(scoreboard, item name, etc.).

> These files are just the textures — they do not include the `.json`
> font definition (`font/glyph_E1.json`) nor the code that builds the
> scoreboard with them. If you had a scoreboard system that used them,
> it was not migrated in the restructure — only the loose images.
