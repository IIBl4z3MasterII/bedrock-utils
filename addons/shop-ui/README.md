# 🛒 Shop UI (addon completo)

A diferencia de `helpers/` y `systems/` (código para copiar/pegar dentro
de tu propio addon), esto es un **addon instalable completo**: behavior
pack + resource pack con su propio `manifest.json`, listo para cargar en
Minecraft tal cual.

---

## Estructura

```
shop-ui/
├── bp/                          # Behavior Pack
│   ├── manifest.json
│   ├── pack_icon.png
│   └── scripts/
│       ├── main.js              # Lógica de la tienda (UI, compra, stock, economía)
│       └── shop-config.js       # Configuración: items, precios, materiales, mensajes
└── rp/                          # Resource Pack
    ├── manifest.json
    ├── pack_icon.png
    ├── textures/
    │   └── my_button.png
    └── ui/
        ├── _ui_defs.json
        ├── server_form.json
        └── center/forms/gallery_form.json
```

---

## Cómo instalar

1. Copiar `bp/` a `com.mojang/development_behavior_packs/` (o
   empaquetar como `.mcpack`).
2. Copiar `rp/` a `com.mojang/development_resource_packs/`.
3. Activar ambos packs en el mundo, en ese orden (BP y RP).

---

## `shop-config.js` — qué se configura

| Export | Contenido |
|---|---|
| `PROPERTY_KEYS` | Nombres de las Dynamic Properties usadas para persistir stock/economía |
| `ECONOMY_CONFIG` | Parámetros de precios/economía |
| `STOCK_CONFIG` | Límites y reposición de stock |
| `MATERIALS` | Catálogo de materiales/items disponibles en la tienda |
| `ITEM_TYPES` | Categorías de items |
| `UI_CONFIG` | Textos/ajustes de la interfaz |
| `MESSAGES` | Strings mostrados al jugador |
| `SOUNDS` | Sonidos reproducidos en distintas acciones |
| `SHOP_ITEM` | Item que abre la tienda al usarlo (`"minecraft:stick"` por defecto) |

Para personalizar la tienda (precios, catálogo, textos), editar
**solo `shop-config.js`** — `main.js` no debería necesitar cambios para
un uso normal.

---

## `main.js`

Módulo de ~1200 líneas, sin exports (se autoregistra al cargar el pack).
Usa `world.setDynamicProperty`/`getDynamicProperty` directo (con helpers
propios `saveObjectData`/`loadObjectData`) para persistir stock y
economía — no usa `WorldManager`/`DynamicStore` de `systems/world-manager/`.

---

## `rp/ui/`

JSON UI custom (`_ui_defs.json`, `server_form.json`,
`center/forms/gallery_form.json`) para el estilo visual de la tienda
(multi-tab, galería de items) en vez de usar el `ActionFormData` genérico
de la Forms API.

---

## Notas

- **Fix aplicado:** `main.js` importaba `./shop_config.js` (guión bajo)
  pero el archivo real se llama `shop-config.js` (guión medio) — el
  import no resolvía y el script fallaba al cargar. Corregido a
  `./shop-config.js`.
- Es el único módulo del repo que se distribuye como addon completo en
  vez de código fuente para integrar a mano — tenerlo en cuenta si estás
  buscando "la versión copiar/pegar" de un sistema de tienda (no existe
  acá; esto reemplaza esa necesidad con un pack listo para usar).

---

<sub>Shop UI por **IIBl4z3MasterII**</sub>, UI por **drag0nd**
