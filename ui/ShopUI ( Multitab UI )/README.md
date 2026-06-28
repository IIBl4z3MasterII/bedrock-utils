# 🛒 ShopUI — Multitab UI

Tienda multitab totalmente funcional con economía por coins, stock limitado y reset automático. Backend en Script API + interfaz en JSON UI.

---

## Estructura del sistema

```
ShopUI ( Multitab UI )/
├── bp_shop_ui/                     ← Behavior Pack
│   ├── manifest.json
│   └── scripts/
│       ├── main.js                 ← Lógica principal: economía, stock, navegación
│       └── shop_config.js          ← Config centralizada: items, precios, timers
└── rp_shop_ui/                     ← Resource Pack
    ├── manifest.json
    ├── textures/
    │   └── my_button.png           ← Botón personalizado
    └── ui/
        ├── _ui_defs.json           ← Registro de archivos UI
        └── center/forms/
            ├── gallery_form.json   ← Grid de productos por tab
            └── server_form.json    ← Routing de formularios
```

---

## Propósito

Tienda para servidores Bedrock con tabs navegables, sistema de coins via scoreboard, stock limitado por item y reset automático cada 30 minutos persistido en dynamic properties.

---

## Cómo interactúa con el resto del addon

```
main.js (ShopUI)
    ├── Scoreboard objetivo "coins"       (economía del jugador)
    └── Dynamic Properties                (stock y timers entre sesiones)
```

---

## main.js

**Responsabilidad:** Lógica principal. Maneja apertura de tabs, validación de coins, descuento de stock y entrega de items.

### Flujo interno

```
Jugador abre tienda (evento configurable)
    └── mostrarTabs() → ActionFormData con categorías
            └── elige tab → mostrarProductos(tab)
                    └── gallery_form.json renderiza el grid
                            └── jugador compra:
                                    ├── verificar coins (scoreboard)
                                    ├── verificar stock (dynamic property)
                                    ├── descontar coins
                                    ├── decrementar stock
                                    └── dar item al jugador
```

### Timer de reset

```
system.runInterval (cada segundo)
    └── ¿pasaron 30 min desde último reset?
            ├── sí → resetear todo el stock, guardar timestamp
            └── ¿faltan 10 min? → notificación al servidor
```

---

## shop_config.js

Config centralizada — todo lo editable está aquí.

```js
export const ECONOMY_CONFIG = {
  OBJECTIVE_NAME: "coins",       // nombre del scoreboard
  OBJECTIVE_DISPLAY: "§6Coins"   // nombre visible en tab
};

export const STOCK_CONFIG = {
  RESET_INTERVAL: 1800,          // segundos entre resets (30 min)
  NOTIFICATION_INTERVAL: 600,    // aviso antes del reset (10 min)
};

export const SHOP_ITEMS = [
  {
    tab: "materials",
    typeId: "minecraft:diamond",
    price: 100,
    stock: 10,
    displayName: "§bDiamante"
  }
  // añadir más items aquí
];
```

---

## JSON UI

| Archivo | Descripción |
|---|---|
| `_ui_defs.json` | Registra los archivos JSON UI del RP |
| `gallery_form.json` | Grid visual de productos del tab activo |
| `server_form.json` | Router de formularios entre tabs |

---

## Eventos utilizados

| Evento | Cuándo |
|---|---|
| Configurable en `main.js` | Apertura de la tienda |
| `system.runInterval` | Timer de reset automático de stock |

---

## Consideraciones de rendimiento

- Cada compra hace una escritura en dynamic properties (stock). Con tráfico alto, aplicar dirty flag (ver `Dynamic Pros Template.js`).
- El interval de reset corre siempre — si la tienda puede estar inactiva, evaluar pausarlo.

---

## Posibles mejoras

- Precios dinámicos por oferta/demanda.
- Descuentos por rango o tag de jugador.
- Historial de compras persistido.
- Integración con sistema de ranking para coins bonus.

---

<sub>ShopUI por **IIBl4z3MasterII** en colaboración con **drag0nd**</sub>
