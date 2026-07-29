import { EnchantmentTypes } from "@minecraft/server";

export class EnchantHelper {
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
