# Changelog

All notable changes to this repo are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/), versioned [SemVer](https://semver.org/).

## [0.0.1] - 2026-07-29

### First release

Repo structure by module type:

- `helpers/` — 12 atomic and reusable modules, without dependencies on each other: `coordinates`, `cooldown`, `timer`, `region`, `enchant-helper`, `inventory-helper`, `chat-moderation`, `raycaster`, `particle-helper`, `rtp-helper`, `template-ui`, `lore-durability`. Each with `index.js` + `README.md`, most with `example.js`. Barrel export in `helpers/index.js`.
- `systems/` — 5 sistemas completos con event listeners y persistencia: `ban-system`, `death-custom-msg`, `drops-in-inventory` (+ `VaultDB`), `mob-stacker` (mob stacker via dynamic properties), `world-manager` (`DynamicStore` + `WorldManager`). Barrel export and `systems/index.js`.
- `addons/` — packs completos BP+RP instalables (`shop-ui`).
- `assets/` — static resources (`glyphs`).

All names normalized to kebab-case, one `index.js` as entry point per module,READMEswith complete API table and usage example.

