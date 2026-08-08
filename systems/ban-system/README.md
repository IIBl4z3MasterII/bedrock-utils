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
import { initBanSystem } from "./systems/ban-system/index.js";

initBanSystem(); // call once in your main.js
```

This: loads existing bans, starts the periodic ban checker
expiration, and records the ban check when a player connects.

To open the report/panel flow from your own trigger (item,
command, block), calls the exported functions — the module does not decide
only when to show the reporting UI, you connect that.

---

## Config

```js
const CONFIG = {
    STAFF_TAG: "Modd",                              // tag that identifies staff
    REDSTONE_BLOCK_ID: "minecraft:redstone_block",  // (legacy reference, not used as a trigger here)
};
```

To change which tag identifies the staff, edit `CONFIG.STAFF_TAG`
directly in `index.js`.

---

## Persistence: player tags, not Dynamic Properties

**Important:** this system saves the ban status in **player
tags** (`bannedUntil:...`, `permabanned`, `banReason:...`,
`bannedBy:...`, `banDate:...`), not in the Dynamic Properties of the world. On
load (`loadBannedPlayers` → `migrateLegacyBanData`), it reads those
tags of each connected player, moves them to an in-memory `Map`
(`bannedPlayers`), and **deletes the legacy tags** once migrated
(`removeLegacyTags`).

This means:
- The actual state "lives" in memory while the world is running — the
`Map` is the source of truth after the initial migration.
- Tags only matter for players who **were already banned before**
this system running for the first time, or if the world
restarts without the player having reconnected (in that case,
it reads from the tag again upon reconnection).
- If you need more robust persistence between reboots without depending
on the player being online, consider migrating `bannedPlayers` to a
  `WorldManager`/`DynamicStore` (see `systems/world-manager/`).

---

## Public API

### Bans

| Function | Parameters | Description |
|---|---|---|
| `initBanSystem()` | — | Start everything: load data, periodic checker, connection listener |
| `applyBan(player, reason, durationSeconds, bannedBy)` | — | Temporary ban, duration in **seconds** |
| `applyPermanentBan(player, reason, bannedBy)` | — | Permanent ban |
| `isPlayerBanned(playerName)` | `string` | `boolean` |
| `getBannedPlayers()` | — | `string[]` — names of all active bans |
| `getBanInfo(playerName)` | `string` | Ban data (`{ reason, endTime, bannedBy, permanent, banDate }`) or `null` |
| `showBanMenu(player)` | — | UI: ban / unban / view list (intended for staff) |
| `showBanForm(player)` | — | Direct ban form (choose online player + reason + duration) |
| `showBannedPlayers(player)` | — | Banned list with details and unban option |

### Reports (internal functions — triggered by displaying the main menu)

The reporting flow does not expose individual functions for each step — everything
starts from `showMainMenu(player)` (not currently exported;
if you need to trigger it from another file, export it in `index.js`).
Internally it goes through: report → choose player/reason/seriousness/description
→ notify staff → staff panel → view pending/history →
resolve (warn/ban).

---

## Internal flow (bans)

```
initBanSystem()
    ├── loadBannedPlayers()             ← migrates legacy tags → in-memory Map
    ├── startBanChecker()               ← runInterval, cleans up expired bans
    └── setupPlayerEvents()             ← playerSpawn → checkPlayerBanStatus()
                                               ├── expired → removeBannedPlayer()
                                               ├── permanent → showPermanentBanUI()
                                               └── temporary → showBanUI() with time remaining
```

## Internal flow (reports)

```
showMainMenu(player)
    ├── "Report Player" → showReportForm()
    │       → saves to reports[] → notifyStaff()
    └── "Staff Panel" (STAFF_TAG only) → showStaffPanel()
            ├── Pending reports → showReportDetails() → warn/ban
            ├── Report history
            ├── Banned players
            └── Direct ban → showBanForm()
```

---

## Key variables (state in memory)

| Variable | Type | Description |
|---|---|---|
| `bannedPlayers` | `Map<string,BanData>` | Status of all active bans, key = player name |
| `activeUI` | `Set<string>` | Avoid opening duplicate forms to the same player |
| `reports` | `Array<ReportData>` | In-memory reports — **lost upon server restart** |
| `REPORT_REASONS` | `string[]` | 10 predefined reasons selectable in the report dropdown |

### Shape of `BanData`

```js
{
  reason: string,
  bannedBy: string,
  endTime: number,     // Date.now() + duration*1000, or -1 if permanent
  permanent: boolean,
  banDate: number,      // Date.now() at the moment of the ban
}
```

---

## Events used

| Event | When |
|---|---|
| `world.afterEvents.playerSpawn` | Check and apply ban when connecting (with `initialSpawn`) |
| `system.runInterval` (verifier) | Clean temporary bans that have already expired |

---

## Performance considerations

- `bannedPlayers` is a linearly traversed `Map` — no problem in
normal servers (dozens/hundreds of bans).
- `reports[]` **does not persist** — if you need history between
reboots, you have to migrate it to `DynamicStore` (`systems/world-manager/`)
or a `VaultDB` (`systems/drops-in-inventory/vault-db.js`).
- `applyBanRestrictions` changes gamemode to Spectator and clears
input categories 1 and 2 — check that it does not collide with another system that
also manages the player's gamemode.

---

## Possible improvements

- Persist `reports[]` (VaultDB or DynamicStore) so that they survive a
  restart.
- Cooldown between reports from the same player, to avoid spam from
false reports.
- Pagination in `showBannedPlayers` for large lists.
- Export `showMainMenu` explicitly if you need to trigger it
from another module (item, command, etc).

---

<sub>Ban System by **IIBl4z3MasterII**</sub>
