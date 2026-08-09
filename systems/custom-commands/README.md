# ⌨️ Custom Commands

Registers a set of slash commands (`/blaze:...`) using the stable
`CustomCommand` API (`@minecraft/server` 2.6.0+). Self-registers on
`system.beforeEvents.startup` — just import the file once and the
commands become available in-game.

## Commands

| Command            | Permission | Description                                  |
| ------------------- | ---------- | --------------------------------------------- |
| `/blaze:spawn`      | Any        | Teleports the selected player(s) to spawn.    |
| `/blaze:heal`       | Any        | Restores full health to the selected player(s).|
| `/blaze:time`       | Any        | Shows the current in-game time of day.        |
| `/blaze:teleport`   | Admin      | Teleports a player to specific coordinates.   |

## Usage

```js
import "./systems/custom-commands/index.js";
```

No exports — this module has side effects only (command registration).

## Notes

- `blaze:teleport` requires `Admin` permission level and is not runnable
  from command blocks.
- Extend the `commands` array and the `switch` in the registered handler
  to add new commands; each command needs a matching `case`.
- Requires `@minecraft/server` experimental/stable Custom Commands
  support (Script API 2.6.0+, Bedrock 1.21.60+).
