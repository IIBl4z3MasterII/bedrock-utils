import { world, system, ItemStack } from "@minecraft/server";
import { VaultDB } from "./vault-db.js";

const overflowDB = new VaultDB("overflow", 100, 1);

const sanitizeKey = (name) => name.replace(/[^A-Za-z0-9_]/g, "_");

class BlockBreakRegistry {
    #breaks = new Map();
    #ttl;

    constructor(ttlTicks = 40) {
        this.#ttl = ttlTicks;
    }

    register(block, player) {
        const key = this.#toKey(block.location);
        this.#breaks.set(key, { player, timestamp: Date.now() });
        system.runTimeout(() => this.#breaks.delete(key), this.#ttl);
    }

    findPlayer(location, maxDistance = 2, maxAgeMs = 2000) {
        let matchedPlayer = null;
        let nearestDistance = maxDistance;
        for (const [key, info] of this.#breaks) {
            if (Date.now() - info.timestamp > maxAgeMs) continue;
            const [x, y, z] = key.split(",").map(Number);
            const distance = Math.hypot(location.x - x, location.y - y, location.z - z);
            if (distance < nearestDistance) { nearestDistance = distance; matchedPlayer = info.player; }
        }
        return matchedPlayer;
    }

    #toKey({ x, y, z }) { return `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`; }
}

class InventoryManager {
    #MAX_AMOUNT = 255;

    clamp(amount) { if (amount <= 0) return 1; if (amount >= 256) return this.#MAX_AMOUNT; return amount; }

    addItem(player, itemStack) {
        if (!itemStack) return false;
        const inventory = player.getComponent("inventory")?.container;
        if (!inventory) return false;
        const size = inventory.size;
        if (itemStack.maxAmount === 1) {
            for (let i = 0; i < size; i++) { if (!inventory.getItem(i)) { inventory.setItem(i, itemStack); return true; } }
            return false;
        }
        let remaining = this.clamp(itemStack.amount);
        for (let i = 0; i < size && remaining > 0; i++) {
            const slot = inventory.getItem(i);
            if (slot?.typeId === itemStack.typeId && slot.amount < slot.maxAmount) {
                const addable = Math.min(slot.maxAmount - slot.amount, remaining);
                inventory.setItem(i, new ItemStack(slot.typeId, slot.amount + addable));
                remaining -= addable;
            }
        }
        for (let i = 0; i < size && remaining > 0; i++) {
            if (!inventory.getItem(i)) {
                const stackAmount = Math.min(remaining, itemStack.maxAmount);
                inventory.setItem(i, new ItemStack(itemStack.typeId, stackAmount));
                remaining -= stackAmount;
            }
        }
        return remaining === 0;
    }
}

class ItemCollector {
    #registry;
    #inventory;

    constructor() { this.#registry = new BlockBreakRegistry(); this.#inventory = new InventoryManager(); }

    init() {
        console.warn("Collection system withVaultDB iniciado.");
        world.afterEvents.playerBreakBlock.subscribe((e) => this.#onBlockBreak(e));
        world.afterEvents.entitySpawn.subscribe((e) => this.#onEntitySpawn(e));
        world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => { if (initialSpawn) this.#deliverOverflow(player); });
    }

    #onBlockBreak({ player, block }) { this.#registry.register(block, player); }

    #onEntitySpawn({ entity }) {
        let typeId, location;
        try { typeId = entity.typeId; location = entity.location; } catch { return; }
        if (typeId !== "minecraft:item") return;
        const player = this.#registry.findPlayer(location);
        if (!player) return;
        system.runTimeout(() => this.#collectItem(entity, player), 3);
    }

    #collectItem(entity, player) {
        try {
            const itemComp = entity.getComponent("item");
            if (!itemComp) return;
            const original = itemComp.itemStack;
            if (!original) return;
            if (this.#inventory.addItem(player, original)) { entity.kill(); player.playSound("random.pop"); }
            else {
                this.#saveOverflow(player, original);
                entity.kill();
                player.sendMessage("§eInventory full.§fThe item was saved and will be delivered when you have space.");
            }
        } catch (error) { console.error(`[Critical error]${error}`); console.error(`Stack trace:${error.stack}`); }
    }

    #saveOverflow(player, item) {
        overflowDB.onReady(() => {
            try {
                const key = sanitizeKey(player.name);
                let pending = [];
                if (overflowDB.has(key)) { const stored = overflowDB.get(key); pending = Array.isArray(stored) ? stored : (stored ? [stored] : []); }
                pending.push(item);
                overflowDB.set(key, pending);
                console.log(`VaultDB> Overflow item saved for [${player.name}]. Earrings:${pending.length}`);
            } catch (err) { console.error(`[VaultDBoverflow save error]${err}`); }
        });
    }

    #deliverOverflow(player) {
        overflowDB.onReady(() => {
            try {
                const key = sanitizeKey(player.name);
                if (!overflowDB.has(key)) return;
                const stored = overflowDB.get(key);
                const pending = Array.isArray(stored) ? stored : (stored ? [stored] : []);
                if (pending.length === 0) return;
                const undelivered = [];
                for (const item of pending) { if (!this.#inventory.addItem(player, item)) undelivered.push(item); else player.playSound("random.pop"); }
                if (undelivered.length === 0) { overflowDB.delete(key); player.sendMessage(`§aAll your saved items were delivered (${pending.length}).`); }
                else { overflowDB.set(key, undelivered); player.sendMessage(`§eThey surrendered${pending.length - undelivered.length} items. §f${undelivered.length}are still saved (inventory full).`); }
            } catch (err) { console.error(`[VaultDBoverflow deliver error]${err}`); }
        });
    }
}

new ItemCollector().init();
