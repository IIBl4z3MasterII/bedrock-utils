/**
 * Métodos estáticos para manejar el inventario de un jugador sin repetir
 * el boilerplate de getComponent("inventory").container en cada script.
 */
export class InventoryHelper {
    /**
     * Da un item a un jugador. Si el inventario está lleno, lo dropea en el
     * suelo en vez de perderlo.
     * @param {import("@minecraft/server").Player} player
     * @param {import("@minecraft/server").ItemStack} itemStack
     * @returns {boolean} true si entró completo al inventario, false si hubo overflow
     */
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

    /**
     * Cuenta cuántos items de un typeId tiene un jugador en su inventario.
     * @param {import("@minecraft/server").Player} player
     * @param {string} itemTypeId ej: "minecraft:diamond"
     * @returns {number}
     */
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

    /**
     * Remueve una cantidad de un item del inventario del jugador.
     * @param {import("@minecraft/server").Player} player
     * @param {string} itemTypeId
     * @param {number} amount
     * @returns {boolean} true si pudo remover la cantidad completa
     */
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
