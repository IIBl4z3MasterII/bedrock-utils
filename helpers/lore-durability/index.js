import { world, system } from "@minecraft/server";

const EQUIPMENT_SLOTS = Object.freeze({
    Head: "Head", Chest: "Chest", Legs: "Legs", Feet: "Feet", Offhand: "Offhand"
});

const CONFIG = Object.freeze({
    EQUIPMENT_UPDATE_INTERVAL: 20,
    INVENTORY_UPDATE_INTERVAL: 40,
    DEFAULT_LORE: "by @bl4z3master",
    DURABILITY_FORMAT: "§7Durability: %current%/%max%"
});

function updateItemLore(item) {
    if (!item) return false;
    try {
        const durability = item.getComponent("minecraft:durability");
        let updated = false;
        if (durability) {
            const maxDurability = durability.maxDurability;
            const currentDurability = maxDurability - durability.damage;
            const durabilityText = CONFIG.DURABILITY_FORMAT
                .replace("%current%", currentDurability)
                .replace("%max%", maxDurability);
            if (item.getLore()?.[0] !== durabilityText) {
                item.setLore([durabilityText]);
                updated = true;
            }
        } else {
            const lore = item.getLore();
            if (!lore?.includes(CONFIG.DEFAULT_LORE)) {
                item.setLore([...(lore || []), CONFIG.DEFAULT_LORE]);
                updated = true;
            }
        }
        return updated;
    } catch (error) {
        console.warn("Error updating item lore:", error);
        return false;
    }
}

class InventoryManager {
    static updateEquipment(player) {
        const equipment = player.getComponent("minecraft:equippable");
        if (!equipment) return;
        Object.values(EQUIPMENT_SLOTS).forEach(slotId => {
            const item = equipment.getEquipment(slotId);
            if (item && updateItemLore(item)) {
                equipment.setEquipment(slotId, item);
            }
        });
    }

    static updateInventory(player) {
        const inventory = player.getComponent("minecraft:inventory")?.container;
        if (!inventory) return;
        for (let slot = 0; slot < inventory.size; slot++) {
            const item = inventory.getItem(slot);
            if (item && updateItemLore(item)) {
                inventory.setItem(slot, item);
            }
        }
    }
}

system.runInterval(() => {
    const players = world.getAllPlayers();
    for (const player of players) {
        try { InventoryManager.updateEquipment(player); } catch (error) { console.warn("Error updating equipment:", error); }
    }
}, CONFIG.EQUIPMENT_UPDATE_INTERVAL);

system.runInterval(() => {
    const players = world.getAllPlayers();
    for (const player of players) {
        try { InventoryManager.updateInventory(player); } catch (error) { console.warn("Error updating inventory:", error); }
    }
}, CONFIG.INVENTORY_UPDATE_INTERVAL);
