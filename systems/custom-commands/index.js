import {
    world,
    system,
    CommandPermissionLevel,
    CustomCommandStatus,
    CustomCommandParamType
} from "@minecraft/server";

/**
 * @type {import("@minecraft/server").CustomCommand[]}
 *
 * CommandPermissionLevel Enumeration
 * Any = 0 - Any entity can run this command
 * GameDirectors = 1 - Any operator can run this command, including command blocks
 * Admin = 2 - Any operator can run this command, but NOT command blocks
 * Host = 3 - Only the server host can run this command
 * Owner = 4 - Only the dedicated server can run this command
 */
const commands = [
    {
        name: "blaze:spawn",
        description: "Teleports the selected player(s) to the world spawn point.",
        permissionLevel: CommandPermissionLevel.Any,
        mandatoryParameters: [
            {
                name: "target",
                type: CustomCommandParamType.PlayerSelector,
            }
        ],
    },
    {
        name: "blaze:heal",
        description: "Restores full health to the selected player(s).",
        permissionLevel: CommandPermissionLevel.Any,
        mandatoryParameters: [
            {
                name: "target",
                type: CustomCommandParamType.PlayerSelector,
            }
        ],
    },
    {
        name: "blaze:time",
        description: "Shows the in-game time of day.",
        permissionLevel: CommandPermissionLevel.Any,
    },
    {
        name: "blaze:teleport",
        description: "Teleports a player to specific coordinates.",
        permissionLevel: CommandPermissionLevel.Admin,
        mandatoryParameters: [
            {
                name: "player",
                type: CustomCommandParamType.PlayerSelector,
            },
            {
                name: "x",
                type: CustomCommandParamType.Float,
            },
            {
                name: "y",
                type: CustomCommandParamType.Float,
            },
            {
                name: "z",
                type: CustomCommandParamType.Float,
            }
        ],
        optionalParameters: [
            {
                name: "dimension",
                type: CustomCommandParamType.String,
                default: "overworld"
            }
        ]
    }
];

system.beforeEvents.startup.subscribe((reg) => {
    for (const command of commands) {
        reg.customCommandRegistry.registerCommand(command, (origin, ...args) => {
            try {
                if (!origin.sourceEntity && (command.name === "blaze:time")) {
                    world.sendMessage("§cError: Could not identify the command sender");
                    return {
                        status: CustomCommandStatus.Error,
                        message: "Could not identify the sender"
                    };
                }

                const executorName = origin.sourceEntity ? origin.sourceEntity.name : "Console";

                let targetPlayers = [];
                if (command.name === "blaze:spawn" || command.name === "blaze:heal") {
                    targetPlayers = args[0] || [];

                    if (targetPlayers.length === 0) {
                        return {
                            status: CustomCommandStatus.Error,
                            message: "No player found matching that selector"
                        };
                    }
                }

                system.run(() => {
                    switch (command.name) {
                        case "blaze:spawn": {
                            const overworld = world.getDimension("overworld");
                            const spawnLoc = { x: 0, y: 64, z: 0 };

                            for (const player of targetPlayers) {
                                player.teleport(spawnLoc, { dimension: overworld });
                            }

                            if (targetPlayers.length === 1) {
                                world.sendMessage(`§a${targetPlayers[0].name} has been teleported to spawn!`);
                            } else {
                                world.sendMessage(`§a${targetPlayers.length} players have been teleported to spawn!`);
                            }
                            break;
                        }

                        case "blaze:heal": {
                            let healedCount = 0;

                            for (const player of targetPlayers) {
                                try {
                                    const health = player.getComponent("health");
                                    if (health) {
                                        health.resetToMaxValue();
                                        healedCount++;
                                    }
                                } catch (error) {
                                    console.error(`§cError healing ${player.name}: ${error.message}`);
                                }
                            }

                            if (healedCount === 1) {
                                world.sendMessage(`§a${targetPlayers[0].name} has fully recovered their health!`);
                            } else {
                                world.sendMessage(`§a${healedCount} players have fully recovered their health!`);
                            }
                            break;
                        }

                        case "blaze:time": {
                            const currentTime = world.getTimeOfDay();
                            let timeText = "";

                            if (currentTime >= 0 && currentTime < 6000) {
                                timeText = "Morning";
                            } else if (currentTime >= 6000 && currentTime < 12000) {
                                timeText = "Noon";
                            } else if (currentTime >= 12000 && currentTime < 18000) {
                                timeText = "Afternoon";
                            } else {
                                timeText = "Night";
                            }

                            world.sendMessage(`§e${executorName} checked the time: ${timeText} (${currentTime} ticks)`);
                            break;
                        }

                        case "blaze:teleport": {
                            const players = args[0] || [];
                            const x = args[1] || 0;
                            const y = args[2] || 64;
                            const z = args[3] || 0;
                            const dimensionId = args[4] || "overworld";

                            if (players.length === 0) {
                                world.sendMessage("§cNo player found matching that selector");
                                break;
                            }

                            const dimension = world.getDimension(dimensionId);
                            const targetLocation = { x, y, z };

                            let teleportedCount = 0;
                            for (const player of players) {
                                try {
                                    player.teleport(targetLocation, { dimension });
                                    teleportedCount++;
                                } catch (error) {
                                    console.error(`§cError teleporting ${player.name}: ${error.message}`);
                                }
                            }

                            if (teleportedCount === 1) {
                                world.sendMessage(`§a${players[0].name} has been teleported to ${x}, ${y}, ${z} in ${dimensionId}!`);
                            } else {
                                world.sendMessage(`§a${teleportedCount} players have been teleported to ${x}, ${y}, ${z} in ${dimensionId}!`);
                            }
                            break;
                        }

                        default:
                            world.sendMessage(`§c${executorName} ran an unknown command.`);
                    }
                });

                return {
                    status: CustomCommandStatus.Success,
                    message: "Command executed successfully"
                };

            } catch (err) {
                console.error(`§cError running command: ${err.message}`);
                console.warn(`Error in command ${command.name}: ${err.stack || err}`);

                return {
                    status: CustomCommandStatus.Error,
                    message: `Error: ${err.message}`
                };
            }
        });
    }
});
