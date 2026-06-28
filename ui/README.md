# 🖼️ UI Systems

Interfaces de usuario para Minecraft Bedrock Edition usando el Scripting API y JSON UI.  
Incluye templates listos para usar y sistemas completos con backend integrado.

---

## 📦 Contenido

| Sistema | Descripción | Estado |
|---|---|---|
| 🛒 ShopUI (Multitab) | Tienda completa con múltiples tabs, stock y economía por coins | ✅ Listo |
| 📋 TemplateUI | Template base para menús anidados con `ActionFormData` | ✅ Listo |

---

## 🛒 ShopUI — Multitab UI

Tienda multitab totalmente funcional con sistema de economía, stock limitado y reset automático.

### Previews

![ShopUI Preview 1](https://i.postimg.cc/Fr0xpfHV/image.png)

![ShopUI Preview 2](https://i.postimg.cc/WbzrBtTk/image.png)

![ShopUI Preview 3](https://i.postimg.cc/DzrbrXdR/image.png)

### Características

- 🗂️ **Múltiples tabs** — navega entre categorías sin cerrar la UI
- 💰 **Economía por coins** — scoreboard `coins` como moneda (`§6Coins`)
- 📦 **Stock limitado** — cada item tiene cantidad limitada que se resetea automáticamente
- ⏱️ **Reset automático** — stock se reinicia cada 30 minutos con notificación a los 10 min
- 💾 **Persistencia** — stock y timers guardados en dynamic properties entre sesiones
- 🛠️ **Config centralizada** — todo configurable desde `shop_config.js`

### Estructura

```
ShopUI (Multitab UI)/
├── bp_shop_ui/
│   ├── manifest.json
│   └── scripts/
│       ├── main.js          # Lógica principal de la tienda
│       └── shop_config.js   # Config de economía, materiales y stock
└── rp_shop_ui/
    ├── manifest.json
    ├── textures/
    │   └── my_button.png    # Botón personalizado
    └── ui/
        ├── _ui_defs.json
        └── center/forms/
            ├── gallery_form.json   # Grid de productos
            └── server_form.json    # Routing de formularios
```

### Configuración rápida

Abre `shop_config.js` y edita:

```js
export const ECONOMY_CONFIG = {
  OBJECTIVE_NAME: "coins",      // nombre del scoreboard
  OBJECTIVE_DISPLAY: "§6Coins"  // nombre visible
};

export const STOCK_CONFIG = {
  RESET_INTERVAL: 1800,         // segundos entre resets (30 min)
  NOTIFICATION_INTERVAL: 600,   // aviso antes del reset (10 min)
};
```

### Requisitos

- Minecraft Bedrock `1.20.70+`
- `@minecraft/server` `2.6.0`
- `@minecraft/server-ui` `2.0.0`

---

## 📋 TemplateUI

Template base para crear menús anidados de forma rápida usando `ActionFormData` y `ModalFormData`.

- Estructura de menús declarativa via `MENU_STRUCTURE`
- Navegación entre submenús sin código repetitivo
- Listo para extender con tu propia lógica de acciones

```js
// Ejemplo de uso
import { mostrarMenu } from "./TemplateUI.js";

world.afterEvents.itemUse.subscribe(({ source }) => {
    mostrarMenu(source, "main");
});
```

---

<sub>UI systems por **IIBl4z3MasterII** • UI de ShopUI en colaboración con **drag0nd**</sub>
