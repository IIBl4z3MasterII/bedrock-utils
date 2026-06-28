# 🧩 Classes

Sistemas y managers orientados a objetos para add-ons de Minecraft Bedrock Edition.  
Cada clase es autocontenida y está diseñada para integrarse fácilmente en cualquier proyecto.

---

## 📦 Contenido

| Sistema | Archivo | Descripción |
|---|---|---|
| 🚫 Ban System | `Ban System/ban-system.js` | Baneos temporales y permanentes con UI integrada |
| 🛡️ Report System | `Ban System/Main.js` | Panel de reportes y moderación para staff |
| 💀 Death Custom Msg | `Death Custom Msg/Death Custom Msg-IIBl4z3MasterII.js` | Mensajes de muerte personalizados por causa/arma/mob |
| 🎒 Drops In Inventory | `Drops In Inventory/drops_in_inventory.js` | Los drops van directo al inventario del jugador |
| 🐾 MobStacker | `MobStacker + Mission System/mobstacker.js` | Apilador de mobs hostiles con efectos y nametag dinámico |
| 🎯 Mission System | `MobStacker + Mission System/mission-system.js` | Sistema de misiones con logros y recompensas |
| 💾 Dynamic Props Template | `Dynamic Pros Template.js` | Template para dynamic properties con dirty flag (0 escrituras innecesarias) |
| 🏷️ Lore & Durability | `Lore Items Durability + Lore items.js` | Muestra durabilidad y lore en tiempo real en el equipo |

---

## 🔍 Detalle de cada sistema

### 🚫 Ban System
Sistema completo de moderación con dos archivos:
- **`ban-system.js`** — Core del sistema: baneos temporales/permanentes, UI de ban/desban, verificación automática al entrar, migración de datos legacy (tags → dynamic properties).
- **`Main.js`** — Panel de reportes: jugadores pueden reportar a otros, el staff ve y gestiona reportes pendientes, puede advertir o banear directamente desde la UI.

Exporta: `inicializarSistemaBaneos`, `mostrarMenuBaneos`, `aplicarBan`, `aplicarBanPermanente`, `estaJugadorBaneado`, `obtenerJugadoresBaneados`

---

### 💀 Death Custom Messages
Mensajes de muerte dinámicos con anti-spam y cache integrado.
- Detecta la causa de muerte (PvP, mob, suicidio, ambiente)
- Identifica el arma usada via `TOOL_REGISTRY`
- Evita mensajes repetidos con `getNonRepeatingRandomMessage`
- Cooldown de 1 segundo por jugador para evitar spam

---

### 🎒 Drops In Inventory
Los items que caen al romper bloques o matar mobs van directo al inventario.
- `BlockBreakRegistry` — registra qué jugador rompió cada bloque (con TTL)
- `InventoryManager` — gestiona el inventario y detecta overflow
- `ItemCollector` — intercepta el drop y lo transfiere al jugador correcto
- Usa `VaultDB` para persistir el overflow entre sesiones

---

### 🐾 MobStacker + Mission System
Dos sistemas integrados:
- **MobStacker** — apila mobs hostiles cercanos (radio 5 bloques, máx 50 por stack), muestra HP en nametag, aplica efectos al stack y al jugador según el tipo de mob.
- **Mission System** — misiones con objetivos, límite de tiempo, logros (`Mission Master`, `Speed Runner`, `Monster Hunter`) y recompensas en XP + items.

Categorías de mobs soportadas: Undead, Arthropods, Illagers, Nether, Overworld, Boss.

---

### 💾 Dynamic Props Template
Template listo para usar con dynamic properties y dirty flag.
- Solo escribe en disco cuando hubo cambios (0 escrituras innecesarias)
- Respeta el límite de 32KB de Bedrock con `MAX_STR_LEN`
- Incluye configuraciones de mundo y stats por jugador como ejemplo

---

### 🏷️ Lore & Durability
Muestra en tiempo real la durabilidad del equipo y lore de items.
- Monitorea Head, Chest, Legs, Feet y Offhand
- Formato personalizable: `§7Durabilidad: %current%/%max%`
- Actualiza equipo cada 20 ticks e inventario cada 40 ticks

---

## ⚙️ Requisitos

- Minecraft Bedrock Edition `1.20.70+`
- `@minecraft/server` `2.6.0`
- `@minecraft/server-ui` `2.0.0`

## 📋 Uso

Cada sistema es independiente. Copia la carpeta del sistema que necesites a tu behavior pack e impórtalo en tu `main.js`:

```js
import { inicializarSistemaBaneos } from "./ban-system.js";

inicializarSistemaBaneos();
```

---

<sub>Todos los scripts son de **IIBl4z3MasterII** • Úsalos libremente pero da crédito al autor.</sub>
