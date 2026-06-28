# 🏷️ Lore Items Durability + Lore items

**Archivo:** `Lore Items Durability + Lore items.js`

Muestra en tiempo real la durabilidad del equipo equipado y el lore de los items del inventario del jugador, con cache para evitar escrituras innecesarias.

---

## Propósito

Enriquecer la experiencia visual mostrando la durabilidad actual/máxima directamente en el lore de cada pieza de equipo, sin que el jugador tenga que abrir la UI de Bedrock.

---

## Cómo interactúa con el resto del addon

No tiene dependencias externas. Se autoregistra al importarlo.

---

## Flujo interno

```
system.runInterval (cada 20 ticks) → revisar slots de equipo (Head, Chest, Legs, Feet, Offhand)
    └── para cada jugador:
            └── comparar item actual con cache (WeakMap)
                    ├── sin cambio → skip (0 escrituras)
                    └── cambio detectado → actualizar lore con durabilidad actual

system.runInterval (cada 40 ticks) → revisar inventario completo
    └── mismo proceso con todos los slots
```

---

## Variables clave

| Variable | Descripción |
|---|---|
| `EQUIPMENT_SLOTS` | `{ Head, Chest, Legs, Feet, Offhand }` — slots monitoreados |
| `CONFIG.EQUIPMENT_UPDATE_INTERVAL` | `20` ticks |
| `CONFIG.INVENTORY_UPDATE_INTERVAL` | `40` ticks |
| `CONFIG.DURABILITY_FORMAT` | `"§7Durabilidad: %current%/%max%"` — formato personalizable |
| `itemCache` | `WeakMap<Player, Map>` — estado previo para evitar re-escrituras |

---

## Uso

```js
import "./Lore Items Durability + Lore items.js";
// Se autoregistra — no requiere inicialización explícita
```

---

## Consideraciones de rendimiento

- `WeakMap` permite garbage collection automático de jugadores desconectados.
- Cache evita escribir el lore si el item no cambió — crítico para no generar lag por escrituras constantes.
- Intervalo de 40 ticks para inventario completo es un balance seguro; reducirlo aumenta reactividad pero también carga.

---

## Posibles mejoras

- Color dinámico en el texto según % de durabilidad restante (verde → amarillo → rojo).
- Soporte para items custom con durabilidad via dynamic properties.
- Lore adicional: encantamientos activos, nivel de reparación acumulada.
