import { ItemStack } from "@minecraft/server";

export class InventoryHelper {
    static giveItem(player, itemStack) {
        const container = player.getComponent("minecraft:inventory")?.container;
        if (!container) return false;
        const id = itemStack.typeId;
        const maxStack = 64;
        let remaining = itemStack.amount;

        for (let i = 0; i < container.size && remaining > 0; i++) {
            const slot = container.getItem(i);
            if (!slot || slot.typeId !== id || slot.amount >= maxStack) continue;
            const space = maxStack - slot.amount;
            const toAdd = Math.min(space, remaining);
            slot.amount += toAdd;
            container.setItem(i, slot);
            remaining -= toAdd;
        }

        for (let i = 0; i < container.size && remaining > 0; i++) {
            if (container.getItem(i)) continue;
            const toAdd = Math.min(remaining, maxStack);
            container.setItem(i, new ItemStack(id, toAdd));
            remaining -= toAdd;
        }

        if (remaining > 0) {
            player.dimension.spawnItem(new ItemStack(id, remaining), player.location);
            return false;
        }
        return true;
    }

    static countItem(player, itemTypeId) {
        const container = player.getComponent("minecraft:inventory")?.container;
        if (!container) return 0;
        let total = 0;
        for (let i = 0; i < container.size; i++) {
            const slotItem = container.getItem(i);
            if (slotItem?.typeId === itemTypeId) total += slotItem.amount;
        }
        return total;
    }

    static removeItem(player, itemTypeId, amount) {
        const container = player.getComponent("minecraft:inventory")?.container;
        if (!container) return false;
        if (InventoryHelper.countItem(player, itemTypeId) < amount) return false;
        let remaining = amount;
        for (let i = 0; i < container.size && remaining > 0; i++) {
            const slotItem = container.getItem(i);
            if (slotItem?.typeId !== itemTypeId) continue;
            if (slotItem.amount <= remaining) {
                remaining -= slotItem.amount;
                container.setItem(i, undefined);
            } else {
                slotItem.amount -= remaining;
                container.setItem(i, slotItem);
                remaining = 0;
            }
        }
        return remaining === 0;
    }
}
