# Glyphs

Texturas de glyphs (iconos custom) para usar en scoreboards, nametags o
UI mediante el truco de fuente unicode privada de Bedrock.

| Archivo | Uso |
|---|---|
| `glyph-e01.png` | Glyph custom #1 |
| `glyph-e02.png` | Glyph custom #2 |

---

## Cómo usarlos

1. Copiar el `.png` a `resource_pack/font/glyph_E1.png` (una imagen por
   página de 256 glyphs, según la convención de Bedrock).
2. Referenciar el carácter unicode privado correspondiente en el texto
   (scoreboard, nombre de item, etc).

> Estos archivos son solo las texturas — no incluyen el `.json` de
> definición de fuente (`font/glyph_E1.json`) ni el código que arma el
> scoreboard con ellos. Si tenías un sistema de scoreboard que los usaba,
> no se migró en el restructure — solo las imágenes sueltas.
