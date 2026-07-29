# Changelog

Todos los cambios notables de este repo se documentan acá.
Formato basado en [Keep a Changelog](https://keepachangelog.com/), versionado [SemVer](https://semver.org/).

## [2.0.0] - 2026-07-29

### Changed — restructure completo (breaking)
- `Classes/` reemplazado por `helpers/` (clases atómicas y reusables) y `systems/` (sistemas completos con event listeners y persistencia), ambas en kebab-case con `index.js` + `README.md` por módulo, más un `index.js` agregador por carpeta.
- `ui/` reemplazado por `addons/` — `ShopUI` ahora es un addon completo instalable (behavior pack + resource pack), no solo un script suelto. `TemplateUI` pasó a `helpers/template-ui/`.
- `scoreboard/` reemplazado por `assets/glyphs/` (solo texturas; la lógica de scoreboard no se migró).

### Fixed
- `addons/shop-ui/bp/scripts/main.js` importaba `./shop_config.js` (guión bajo) pero el archivo real es `shop-config.js` (guión medio) — el import no resolvía. Corregido.

### Docs
- Reescritos todos los README de `helpers/` y `systems/` con tablas de API completas, ejemplos de uso y notas de comportamiento verificadas contra el código actual (no solo copiadas de versiones anteriores).
- Documentadas funciones nuevas no cubiertas antes: `death-custom-msg` (`addNewEntity`, `addNewDeathCause`, `getVerificationStats`, `clearCache`), `VaultDB` (cola de guardado asíncrona, cache, `onReady`).
- Corregida documentación de `ban-system`: la persistencia real es vía tags de jugador, no Dynamic Properties.
- Señalado que `MissionSystem.checkAchievements()` está sin implementar (cuerpo vacío) y que `bossStackMap`/`stackVisuals` en `mob-stacker` no se usan en el código actual.
- Nuevo `addons/shop-ui/README.md` (no existía documentación para el addon).

## [1.5.0] - 2026-07-29

### Added
- `Classes/ParticleHelper/` — formas geométricas de partículas (línea, círculo, esfera, cubo, perímetro), trail y borde animado con filtro de distancia.
- `Classes/RtpHelper/` — RTP autocontenido con fases de espera/búsqueda, cooldown, config inyectable y limpieza en shutdown/leave/spawn.

### Fixed
- `ParticleHelper`: `#stopBorder` (privado estático) se llamaba desde fuera del cuerpo de la clase → `SyntaxError` al cargar el archivo. Movido a un `static {}` init block dentro de la clase.
- `ParticleHelper.showBorder`: desacoplado del objeto `claim` — ahora recibe `center, radius, dimensionId` directo en vez de asumir `claim.centerX/level/dimension`, para no atar una clase genérica de partículas al sistema de claims.

## [2.0.0] - 2026-07-29

### Changed
- **Reestructuración completa del repositorio.** Se reemplazó la estructura plana (`Classes/`, `scoreboard/`, `ui/`) por una jerarquía por tipo:
  - `helpers/` — 12 módulos atómicos (coordinates, cooldown, timer, region, enchant-helper, inventory-helper, chat-moderation, raycaster, particle-helper, rtp-helper, template-ui, lore-durability)
  - `systems/` — 5 sistemas complejos (ban-system, death-custom-msg, drops-in-inventory, mob-stacker, world-manager)
  - `addons/` — Packs completos BP+RP (shop-ui)
  - `assets/` — Recursos estáticos (glyphs)
- Todos los nombres normalizados a kebab-case sin espacios ni símbolos.
- Cada módulo tiene un único `index.js` como entry point.
- Barrel exports en `helpers/index.js` y `systems/index.js` para importaciones centralizadas.
- `Classes/Ban System/Main.js` + `ban-system.js` fusionados en `systems/ban-system/index.js`.
- `Classes/Drops In Inventory/QIDB.js` renombrado a `systems/drops-in-inventory/vault-db.js`.
- `ui/ShopUI ( Multitab UI )/` movido a `addons/shop-ui/` con carpeta `bp/` y `rp/`.
- `scoreboard/Glyphs/` movido a `assets/glyphs/` con nombres en kebab-case.

## [1.4.1] - 2026-07-29

### Changed
- `Classes/Dynamic Pros Template/` renombrado a `Classes/WorldManager/` (el nombre anterior ya no representaba lo que hace el sistema).

## [1.4.0] - 2026-07-29

### Changed
- **`Classes/Dynamic Pros Template/` reescrito por completo.** La versión anterior (patrón "dirty flag" con config/stats de ejemplo hardcodeados) fue reemplazada por `worldManager.js`: clases `DynamicStore` (wrapper de Dynamic Properties agnóstico de target, con cache, auto-parseo de tipos y soporte de payloads grandes vía chunking) y `WorldManager` (singleton que resuelve el ciclo de vida de carga del mundo y fabrica stores por namespace).
- Se agregó `logger.js` como dependencia (logger con niveles debug/info/warn/error usado por `WorldManager`).

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
