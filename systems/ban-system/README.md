# 🚫 Ban System

Complete moderation system: reports between players, staff panel,
and temporary/permanent bans with integrated UI.

---

## Archive

| Archive | Role |
|---|---|
| `index.js` | The entire system — reports + bans, a single module |

---

## General purpose

Covers two flows that usually go together on servers in moderation
community:

1. **Reports**: any player reports to another (reason, seriousness,
description, optional evidence) from a form.
2. **Bans**: the staff (identified by a tag) resolves these reports
with warning or ban, or ban directly from a panel — with
duration in minutes/seconds or permanent.

---

## How to activate

```js
import { inicializarSistemaBaneos } from "./systems/ban-system/index.js";

inicializarSistemaBaneos(); // llamar una vez en tu main.js
```

This: loads existing bans, starts the periodic ban checker
expiration, and records the ban check when a player connects.

To open the report/panel flow from your own trigger (item,
command, block), calls the exported functions — the module does not decide
Only when to show the reporting UI, you connect that.

---

## Config

```js
const CONFIG = {
    STAFF_TAG: "Modd",                              // tag que identifica al staff
    REDSTONE_BLOCK_ID: "minecraft:redstone_block",  // (legacy reference, not used as a trigger here)
};
```

To change which tag identifies the staff, edit `CONFIG.STAFF_TAG`
directly in `index.js`.

---

## Persistence: player tags, not Dynamic Properties

**Important:** this system saves the ban status in **tags of the
player** (`bannedUntil:...`, `permabanned`, `banReason:...`,
`bannedBy:...`, `banDate:...`), not in the Dynamic Properties of the world. To the
load(`cargarJugadoresBaneados` → `migrarDatosLegacyBan`), read those
tags of each connected player, passes them to a `Map` in memory
(`jugadoresBaneados`), and **delete the legacy tags** once migrated
(`removerTagsLegacy`).

This means:
- The actual state "lives" in memory while the world is running — the
`Map` is the source of truth after the initial migration.
- Tags only matter for players who **were already banned before**
of this system running for the first time, or if the world
restarts without the player having reconnected (in that case,
reads from the tag again upon reconnection).
- If you need more robust persistence between reboots without depending on
for the player to be online, consider migrating `jugadoresBaneados` a
  `WorldManager`/`DynamicStore` (ver `systems/world-manager/`).

---

## Public API

### Bans

| Function | Parameters | Description |
|---|---|---|
| `inicializarSistemaBaneos()` | — | Start everything: load data, periodic checker, connection listener |
| `aplicarBan(player, reason,duracionSegundos, baneadoPor)` | — | Temporary ban, duration in **seconds** |
| `aplicarBanPermanente(player, reason,baneadoPor)` | — | Permanent ban |
| `estaJugadorBaneado(nombreJugador)` | `string` | `boolean` |
| `obtenerJugadoresBaneados()` | — | `string[]` — names of all active bans |
| `obtenerInfoBan(nombreJugador)` | `string` | Ban data (`{ reason,tiempoFin, baneadoPor, permanent,fechaBan}`) o `null` |
| `mostrarMenuBaneos(player)` | — | UI: ban / unban / view list (intended for staff) |
| `mostrarFormularioBan(player)` | — | Direct ban form (choose online player + reason + duration) |
| `mostrarJugadoresBaneados(player)` | — | Banned list with details and unban option |

### Reports (internal functions — triggered by displaying the main menu)

The reporting flow does not expose individual functions for each step — everything
boot from `mostrarMenuPrincipal(player)` (not currently exported;
if you need to trigger it from another file, export it in `index.js`).
Internally it goes through: report → choose player/reason/seriousness/description
→ notify staff → staff panel → view pending/history →
resolve (warn/ban).

---

## Internal flow (bans)

```
inicializarSistemaBaneos()
    ├── cargarJugadoresBaneados()       ← migra tags legacy → Map en memoria
    ├── iniciarVerificadorBaneos()      ← runInterval, limpia expirados
    └── configurarEventoJugadores()     ← playerSpawn → verificarEstadoBanJugador()
                                               ├── expirado → removerJugadorBaneado()
                                               ├── permanente → mostrarUIBanPermanente()
                                               └── temporal → mostrarUIBan() con tiempo restante
```

## Internal flow (reports)

```
mostrarMenuPrincipal(player)
    ├── "Reportar Jugador" → mostrarFormularioReporte()
    │       → guarda en reportes[] → notificarStaff()
    └── "Panel de Staff" (solo con STAFF_TAG) → mostrarPanelStaff()
            ├── Reportes pendientes → mostrarDetalleReporte() → advertir/banear
            ├── Historial de reportes
            ├── Jugadores baneados
            └── Ban directo → mostrarFormularioBan()
```

---

## Key variables (state in memory)

| Variable | Type | Description |
|---|---|---|
| `jugadoresBaneados` | `Map<string,BanData>` | Status of all active bans, key = player name |
| `uiActiva` | `Set<string>` | Avoid opening duplicate forms to the same player |
| `reports` | `Array<ReporteData>` | In-memory reports — **lost upon server restart** |
| `RAZONES_REPORTE` | `string[]` | 10 predefined reasons selectable in the report dropdown |

### Form of `BanData`

```js
{
  razon: string,
  baneadoPor: string,
  tiempoFin: number,     // Date.now() + duracion*1000, o -1 si es permanente
  permanente: boolean,
  fechaBan: number,      // Date.now() al momento del ban
}
```

---

## Events used

| Event | When |
|---|---|
| `world.afterEvents.playerSpawn` | Check and apply ban when connecting (with `initialSpawn`) |
| `system.runInterval` (verifier) ​​| Clean temporary bans that have already expired |

---

## Performance considerations

-`jugadoresBaneados` is a linearly traversed `Map` — no problem in
normal servers (dozens/hundreds of bans).
- `reportes[]` **does not persist** — if you need history between
reboots, you have to migrate it to `DynamicStore` (`systems/world-manager/`)
o a `VaultDB` (`systems/drops-in-inventory/vault-db.js`).
-`aplicarRestriccionesBan` change gamemode to Spectator and crash
input categories 1 and 2 — check that it does not collide with another system that
Also manage player's gamemode.

---

## Possible improvements

- Persist `reports[]` (VaultDB o DynamicStore) so that they survive a
  reinicio.
- Cooldown between reports from the same player, to avoid spam from
false reports.
- Pagination in `mostrarJugadoresBaneados` for large lists.
- Export `mostrarMenuPrincipal` explicitly if you need to fire it
from another module (item, command, etc).

---

<sub>Ban System por**IIBl4z3MasterII**</sub>
