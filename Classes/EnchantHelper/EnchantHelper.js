import { EnchantmentTypes } from "@minecraft/server";

/**
 * Método estático para encantar un ItemStack de forma segura, validando
 * que el encantamiento exista antes de aplicarlo.
 */
export class EnchantHelper {
    /**
     * @param {import("@minecraft/server").ItemStack} itemStack
     * @param {string} enchantId ej: "sharpness"
     * @param {number} level
     * @returns {import("@minecraft/server").ItemStack} el mismo itemStack, encantado
     * @throws {Error} si el encantamiento no existe o el item no es encantable
     */
    static enchant(itemStack, enchantId, level) {
        const enchantment = EnchantmentTypes.get(enchantId);
        if (!enchantment) {
            throw new Error(`Encantamiento inválido: "${enchantId}"`);
        }

        const enchantable = itemStack.getComponent("enchantable");
        if (!enchantable) {
            throw new Error(`El item "${itemStack.typeId}" no es encantable`);
        }

        enchantable.addEnchantment({ type: enchantment, level });
        return itemStack;
    }
}
