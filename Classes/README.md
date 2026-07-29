# 🧩 Classes

Sistemas y managers orientados a objetos para add-ons de Minecraft Bedrock Edition.

---

## 📋 Responsabilidades

- Encapsular lógica de gameplay en clases/funciones exportables.
- Gestionar persistencia via Dynamic Properties.
- Operar de forma desacoplada: cada sistema escucha solo sus propios eventos.

---

## 🔗 Interacción entre módulos

```
Ban System ──────────────────► @minecraft/server-ui + Dynamic Properties
Death Custom Msg ────────────► solo @minecraft/server
Drops In Inventory ──────────► VaultDB (QIDB.js) para overflow
MobStacker ──────────────────► Mission System (integración directa)
Dynamic Pros Template ───────► patrón base reutilizable por todos
```

---

## 📂 Sistemas disponibles

| Sistema | Archivos | Doc |
|---|---|---|
| 🚫 **Ban System** | `ban-system.js`, `Main.js` | [Ban System/Ban System.md](Ban%20System/Ban%20System.md) |
| 💀 **Death Custom Msg** | `Death Custom Msg-IIBl4z3MasterII.js`, `data.js` | [Death Custom Msg/Death Custom Msg.md](Death%20Custom%20Msg/Death%20Custom%20Msg.md) |
| 🎒 **Drops In Inventory** | `drops_in_inventory.js`, `QIDB.js` | [Drops In Inventory/Drops In Inventory.md](Drops%20In%20Inventory/Drops%20In%20Inventory.md) |
| 🐾 **MobStacker + Mission System** | `mobstacker.js`, `mission-system.js` | [MobStacker + Mission System/MobStacker + Mission System.md](MobStacker%20+%20Mission%20System/MobStacker%20+%20Mission%20System.md) |
| 💾 **Dynamic Pros Template** | `Dynamic Pros Template.js` | [Dynamic Pros Template/Dynamic Pros Template.md](Dynamic%20Pros%20Template/Dynamic%20Pros%20Template.md) |
| 🏷️ **Lore & Durability** | `Lore Items Durability + Lore items.js` | [Lore Items Durability + Lore items/Lore Items Durability + Lore items.md](Lore%20Items%20Durability%20+%20Lore%20items/Lore%20Items%20Durability%20+%20Lore%20items.md) |
| 🧭 **Coordinates** | `Coordinates.js` | [Coordinates/README.md](Coordinates/README.md) |
| ⏱️ **Cooldown** | `Cooldown.js` | [Cooldown/README.md](Cooldown/README.md) |
| 📐 **Region** | `Region.js` | [Region/README.md](Region/README.md) |
| ⏳ **Timer** | `Timer.js` | [Timer/README.md](Timer/README.md) |
| 🎒 **InventoryHelper** | `InventoryHelper.js` | [InventoryHelper/README.md](InventoryHelper/README.md) |
| ✨ **EnchantHelper** | `EnchantHelper.js` | [EnchantHelper/README.md](EnchantHelper/README.md) |
| 💬 **ChatModeration** | `ChatModeration.js` | [ChatModeration/README.md](ChatModeration/README.md) |
| 🎯 **Raycaster** | `Raycaster.js` | [Raycaster/README.md](Raycaster/README.md) |

---

<sub>Todos los scripts son de **IIBl4z3MasterII** • Úsalos libremente pero da crédito al autor.</sub>
