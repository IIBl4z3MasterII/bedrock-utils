# 📋 TemplateUI

**Archivo:** `TemplateUI.js`

Template base para construir menús anidados de forma rápida usando `ActionFormData`. Estructura declarativa via `MENU_STRUCTURE` con router de navegación incluido.

---

## Propósito

Eliminar el código repetitivo de abrir/cerrar forms y manejar navegación entre submenús. Define la estructura una vez y el router se encarga del resto.

---

## Cómo interactúa con el resto del addon

No tiene dependencias externas. Es un patrón base adoptable por cualquier sistema que necesite menús.

---

## Flujo interno

```
mostrarMenu(player, "main")
    └── buscar "main" en MENU_STRUCTURE
            └── renderizar ActionFormData
                    ├── elige opción con submenú → mostrarMenu(player, subMenuId)
                    └── elige acción directa → ejecutar callback
```

---

## Estructura de MENU_STRUCTURE

```js
const MENU_STRUCTURE = {
  main: {
    title: "Menú Principal",
    buttons: [
      { label: "Ir a Submenú A", action: "submenuA" },
      { label: "Acción directa", callback: (player) => { /* tu lógica */ } }
    ]
  },
  submenuA: {
    title: "Submenú A",
    buttons: [ /* ... */ ]
  }
};
```

---

## API pública

| Función | Descripción |
|---|---|
| `mostrarMenu(player, menuId)` | Abre el menú con el ID dado |

---

## Uso

```js
import { mostrarMenu } from "./TemplateUI.js";

world.afterEvents.itemUse.subscribe(({ source }) => {
    mostrarMenu(source, "main");
});
```

---

## Posibles mejoras

- Soporte para `ModalFormData` (inputs de texto/toggles) en el router.
- Breadcrumbs para mostrar la ruta de navegación actual.
- Botón de "Volver" automático en cada submenú.
