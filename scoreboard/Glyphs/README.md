# 🔤 Glyphs

Imágenes de glifos custom para usar en displays de scoreboard, nametags y UIs de Bedrock Edition via resource pack.

---

## Archivos

| Archivo | Descripción |
|---|---|
| `glyph_E01.png` | Glifo custom #1 — página `E0` del atlas de fuentes |
| `glyph_E02.png` | Glifo custom #2 — página `E0` del atlas de fuentes |

---

## Cómo usar en un resource pack

1. Copia los `.png` a `textures/font/` de tu RP.
2. Registra en `font/default.json`:

```json
{
  "type": "bitmap",
  "file": "textures/font/glyph_E01.png",
  "ascent": 8,
  "height": 16,
  "chars": ["\uE001"]
}
```

3. Usa el carácter `\uE001` en nametags, títulos, scoreboard — cualquier texto del juego.

---

## Relación con otros módulos

- Compatibles con nametags del **MobStacker** para iconos de categoría.
- Usables en cualquier sistema de UI custom del repo.
