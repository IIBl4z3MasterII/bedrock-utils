# Addons

Unlike `helpers/` and `systems/` (source code to copy to your
own addon), these are **complete and installable addons**: behavior
pack + resource pack with your own `manifest.json`, ready to load
in Minecraft as is, without integrating code by hand.

| Module | Description |
|---|---|
| [**shop-ui**](shop-ui/README.md) | Store with custom UI (JSONUI), economy and persistent stock |

Each addon is installed by copying `bp/` and `rp/` to
`com.mojang/development_behavior_packs/` and
`development_resource_packs/` respectively — see each one's README
for configuration details.
