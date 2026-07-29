export class InventoryHelper {
    static giveItem(player, itemStack) {
        const container = player.getComponent("minecraft:inventory")?.container;
        if (!container) return false;
        const leftover = container.addItem(itemStack);
        if (leftover) {
            player.dimension.spawnItem(leftover, player.location);
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
