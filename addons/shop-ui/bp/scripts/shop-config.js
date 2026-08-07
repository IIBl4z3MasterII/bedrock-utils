/* ██████╗ ██╗██╗ ██╗███████╗██████╗ ███╗ ███╗ █████╗ ███████╗████████╗███████╗██████╗ 
██╔══██╗██║██║ ██║╚══███╔╝╚════██╗ ████╗ ████║██╔══██╗██╔════╝╚═ ═██╔══╝██╔════╝██╔══██╗
██████╔╝██║███████║ ███╔╝ █████╔╝ ██╔████╔██║███████║███████╗ ██║ █████╗ ██████╔╝
██╔══██╗██║╚════██║ ███╔╝ ╚═══██╗ ██║╚██╔╝██║██╔══██║╚════██║ ██║ ██╔══╝ ██╔══██╗
██████╔╝███████╗██║███████╗██████╔╝ ██║ ╚═╝ ██║██║ ██║███████║ ██║ ███████╗██║ ██║
╚═════╝ ╚══════╝╚═╝╚══════╝╚═════╝ ╚═╝ ╚═╝╚═╝ ╚═╝╚══════╝ ╚═╝ ╚══════╝╚═╝ ╚═╝
                                                                                           
          Shop Config • By: @bl4z3master */

export const PROPERTY_KEYS = {
  SHOP_STOCKS: 'shop_stocks_data',
  SHOP_TIMERS: 'shop_timer_data'
};

export const ECONOMY_CONFIG = {
  OBJECTIVE_NAME: "coins",
  OBJECTIVE_DISPLAY: "§6Coins"
};

export const STOCK_CONFIG = {
  RESET_INTERVAL: 1800, // 30 minutes in seconds
  NOTIFICATION_INTERVAL: 600, // 10 minutes in seconds
  AUTO_SAVE_INTERVAL: 6000 // 5 minutes in ticks (6000 ticks = 5 min)
};

export const MATERIALS = {
  tools: [
    { name: "Madera", id: "wooden", multiplier: 0.2 },
    { name: "Piedra", id: "stone", multiplier: 0.4 },
    { name: "Hierro", id: "iron", multiplier: 0.6 },
    { name: "Oro", id: "golden", multiplier: 0.8 },
    { name: "Diamante", id: "diamond", multiplier: 1.0 },
    { name: "Netherite", id: "netherite", multiplier: 2.0 }
  ],
  armor: [
    { name: "Cuero", id: "leather", multiplier: 0.3 },
    { name: "Coat of mail", id: "chainmail", multiplier: 0.5 },
    { name: "Hierro", id: "iron", multiplier: 0.6 },
    { name: "Oro", id: "golden", multiplier: 0.8 },
    { name: "Diamante", id: "diamond", multiplier: 1.0 },
    { name: "Netherite", id: "netherite", multiplier: 2.0 }
  ],
  wood: [
    { name: "Roble", id: "oak", multiplier: 1.0 },
    { name: "Abeto", id: "spruce", multiplier: 1.1 },
    { name: "Abedul", id: "birch", multiplier: 1.1 },
    { name: "Jungla", id: "jungle", multiplier: 1.2 },
    { name: "Acacia", id: "acacia", multiplier: 1.2 },
    { name: "Dark Oak", id: "dark_oak", multiplier: 1.3 },
    { name: "Manglar", id: "mangrove", multiplier: 1.3 },
    { name: "Cerezo", id: "cherry", multiplier: 1.4 }
  ],
  stone: [
    { name: "Piedra", id: "stone", itemId: "minecraft:stone", multiplier: 1.0 },
    { name: "Granito", id: "granite", itemId: "minecraft:granite", multiplier: 1.1 },
    { name: "Diorita", id: "diorite", itemId: "minecraft:diorite", multiplier: 1.1 },
    { name: "Andesita", id: "andesite", itemId: "minecraft:andesite", multiplier: 1.1 },
    { name: "Smooth Stone", id: "smooth_stone", itemId: "minecraft:smooth_stone", multiplier: 1.3 },
    { name: "Cobble", id: "cobblestone", itemId: "minecraft:cobblestone", multiplier: 0.8 },
    { name: "Pizarra", id: "deepslate", itemId: "minecraft:deepslate", multiplier: 1.4 },
    { name: "Toba", id: "tuff", itemId: "minecraft:tuff", multiplier: 1.2 }
  ],
  mineral_blocks: [
    { name: "Hierro", id: "iron", itemId: "minecraft:iron_block", multiplier: 0.6 },
    { name: "Oro", id: "gold", itemId: "minecraft:gold_block", multiplier: 0.8 },
    { name: "Diamante", id: "diamond", itemId: "minecraft:diamond_block", multiplier: 1.0 },
    { name: "Esmeralda", id: "emerald", itemId: "minecraft:emerald_block", multiplier: 1.5 },
    { name: "Netherite", id: "netherite", itemId: "minecraft:netherite_block", multiplier: 2.5 },
    { name: "Lapis lazuli", id: "lapis", itemId: "minecraft:lapis_block", multiplier: 0.4 },
    { name: "Redstone", id: "redstone", itemId: "minecraft:redstone_block", multiplier: 0.3 },
    { name: "Cobre", id: "copper", itemId: "minecraft:copper_block", multiplier: 0.5 },
    { name: "Cuarzo", id: "quartz", itemId: "minecraft:quartz_block", multiplier: 0.7 }
  ]
};

export const ITEM_TYPES = {
  TOOLS: ["sword", "axe", "pickaxe", "shovel", "hoe"],
  ARMOR: ["helmet", "chestplate", "leggings", "boots"]
};

export const UI_CONFIG = {
  TITLE_PREFIX: "§c§u§s§t§o§m§r",
  CATEGORY_PREFIX: "§c§a§t§e§g§o§r§y",
  FILLER_BASE_LENGTH: 10
};

export const MESSAGES = {
  COUNTDOWN_3: "§c§l[TIENDA] §r§eReset of stocks in§c§l3§e...",
  COUNTDOWN_2: "§c§l[TIENDA] §r§eReset of stocks in§c§l2§e...",
  COUNTDOWN_1: "§c§l[TIENDA] §r§eReset of stocks in§c§l1§e...",
  RESET_COMPLETE: "§a§l[TIENDA] §r§eStore stocks have been reset!",
  INSUFFICIENT_FUNDS: "§cYou don\'t have enough coins!",
  INSUFFICIENT_STOCK: "§cThere is not enough stock of§f{item}§c!",
  WAIT_RESET: "§7Wait for the next stock reset",
  PURCHASE_SUCCESS: "§a✓ You bought§f{quantity}x {item}§apor §6{price}§eCoins",
  NEXT_RESET: "§e§l[TIENDA] §r§7Next reset of stocks in:§6{minutes} minutes"
};

export const SOUNDS = {
  SUCCESS: "random.orb",
  ERROR: "note.bass",
  NOTIFICATION: "note.pling",
  LEVELUP: "random.levelup",
  COUNTDOWN_1: { sound: "note.pling", pitch: 0.8 },
  COUNTDOWN_2: { sound: "note.pling", pitch: 1.0 },
  COUNTDOWN_3: { sound: "note.pling", pitch: 1.2 }
};

export const SHOP_ITEM = "minecraft:stick";
