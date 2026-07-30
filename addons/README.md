# Addons

A diferencia de `helpers/` y `systems/` (código fuente para copiar a tu
propio addon), esto son **addons completos e instalables**: behavior
pack + resource pack con su propio `manifest.json`, listos para cargar
en Minecraft tal cual, sin integrar código a mano.

| Módulo | Descripción |
|---|---|
| [**shop-ui**](shop-ui/README.md) | Tienda con UI custom (JSON UI), economía y stock persistente |

Cada addon se instala copiando `bp/` y `rp/` a
`com.mojang/development_behavior_packs/` y
`development_resource_packs/` respectivamente — ver el README de cada
uno para detalles de configuración.
