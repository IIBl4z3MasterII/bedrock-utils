# Changelog

Todos los cambios notables de este repo se documentan acá.
Formato basado en [Keep a Changelog](https://keepachangelog.com/), versionado [SemVer](https://semver.org/).

## [1.3.0] - 2026-07-28

### Changed
- **Se eliminó `Utils/`**. El repo ahora es 100% `Classes/` — todo lo que antes eran funciones sueltas pasó a ser clases con métodos estáticos, para no mezclar dos paradigmas distintos.
- `inventory.js` → `Classes/InventoryHelper/InventoryHelper.js`
- `enchant.js` → `Classes/EnchantHelper/EnchantHelper.js`
- `text.js` → `Classes/ChatModeration/ChatModeration.js`
- `raycast.js` → `Classes/Raycaster/Raycaster.js`
- `cooldown.js` (ya era una clase) → `Classes/Cooldown/Cooldown.js`

### Added
- `Classes/Region/` — clase `Region`: cuboide con `contains`, `overlaps`, `getCenter`, `getVolume`, `toJSON`/`fromJSON`.
- `Classes/Timer/` — clase `Timer`: cuenta regresiva con `onTick`/`onFinish`, `pause`/`resume`/`cancel`.

## [1.2.0] - 2026-07-28

### Added
- `Classes/Coordinates/` — clase `Coordinates` con métodos estáticos `local`, `relative` y `absolute` (equivalentes a `^ ^ ^`, `~ ~ ~` y coordenadas absolutas de `/execute`).

## [1.1.0] - 2026-07-28

### Added
- Carpeta `Utils/` con funciones atómicas y reusables:
  - `inventory.js` — `giveItem`, `countItem`, `removeItem`
  - `enchant.js` — `enchantItem`
  - `text.js` — `countUppercase`, `isExcessiveCaps`
  - `raycast.js` — `getEntityLookingAt`, `getBlockLookingAt`
  - `cooldown.js` — `CooldownManager`
- `package.json` con metadata del repo.
- Este `CHANGELOG.md`.

## [1.0.0] - Initial release

### Added
- `Classes/`: Ban System, Death Custom Msg, Drops In Inventory, MobStacker + Mission System, Dynamic Pros Template, Lore Items Durability + Lore items.
- `scoreboard/`: Glyphs.
- `ui/`: ShopUI (Multitab), TemplateUI.
