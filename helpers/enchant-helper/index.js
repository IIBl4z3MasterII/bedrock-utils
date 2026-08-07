import { EnchantmentTypes } from "@minecraft/server";

export class EnchantHelper {
    static enchant(itemStack, enchantId, level) {
        const enchantment = EnchantmentTypes.get(enchantId);
        if (!enchantment) {
            throw new Error(`Invalid incantation: "${enchantId}"`);
        }
        const enchantable = itemStack.getComponent("enchantable");
        if (!enchantable) {
            throw new Error(`The item "${itemStack.typeId}"is not charming`);
        }
        enchantable.addEnchantment({ type: enchantment, level });
        return itemStack;
    }
}
