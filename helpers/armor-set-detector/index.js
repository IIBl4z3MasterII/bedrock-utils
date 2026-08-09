import { world, system, ItemStack } from "@minecraft/server";

const EQUIPMENT_SLOTS = {
  HEAD: "Head",
  CHEST: "Chest",
  LEGS: "Legs",
  FEET: "Feet"
};

const EQUIPMENT_SLOT_INDEX = { Head: 0, Chest: 1, Legs: 2, Feet: 3 };
const HOTBAR_SIZE = 9;

export class ArmorSetDetector {
  constructor(mapping, options = {}) {
    this.mapping = mapping;
    this.intervalTicks = options.intervalTicks ?? 20;
    this.searchHotbarOnly = options.searchHotbarOnly ?? false;
    this.playerArmorStatus = new Map();
    this._intervalId = null;
  }

  static isHotbarSlot(slotIndex) {
    return slotIndex >= 0 && slotIndex < HOTBAR_SIZE;
  }

  getSlotItem(player, slotIndex) {
    const inventory = player.getComponent("inventory").container;
    return inventory.getItem(slotIndex) ?? null;
  }

  getHotbarSlots(player) {
    const inventory = player.getComponent("inventory").container;
    const slots = [];
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      slots.push({ slotIndex: i, item: inventory.getItem(i) ?? null });
    }
    return slots;
  }

  findMappedItem(player) {
    const inventory = player.getComponent("inventory").container;
    const limit = this.searchHotbarOnly ? HOTBAR_SIZE : inventory.size;

    for (let i = 0; i < limit; i++) {
      const item = inventory.getItem(i);
      if (item && this.mapping[item.typeId]) {
        return {
          blockId: item.typeId,
          slotIndex: i,
          inHotbar: ArmorSetDetector.isHotbarSlot(i)
        };
      }
    }
    return null;
  }

  checkPlayers() {
    try {
      for (const player of world.getAllPlayers()) {
        const playerName = player.name;
        const found = this.findMappedItem(player);

        if (found) {
          const armorInfo = this.mapping[found.blockId];
          const currentArmorType = this.playerArmorStatus.get(playerName);

          if (currentArmorType !== armorInfo.type) {
            if (currentArmorType) this.removeArmor(player);

            if (this._canEquip(armorInfo)) {
              this._equip(player, armorInfo);
              this.playerArmorStatus.set(playerName, armorInfo.type);
            }
          }
        } else if (this.playerArmorStatus.has(playerName)) {
          this.removeArmor(player);
          this.playerArmorStatus.delete(playerName);
        }
      }
    } catch (error) {
      console.error(`[ArmorSetDetector] checkPlayers error: ${error}`);
    }
  }

  start() {
    if (this._intervalId !== null) return;
    this._intervalId = system.runInterval(() => this.checkPlayers(), this.intervalTicks);
  }

  stop() {
    if (this._intervalId === null) return;
    system.clearRun(this._intervalId);
    this._intervalId = null;
  }

  _canEquip(armorInfo) {
    if (armorInfo.fullSet) return true;
    return Boolean(armorInfo.head || armorInfo.chestplate || armorInfo.leggings || armorInfo.boots);
  }

  _equip(player, armorInfo) {
    try {
      const equipmentComponent = player.getComponent("equippable");
      const pieces = armorInfo.fullSet
        ? { head: true, chestplate: true, leggings: true, boots: true }
        : armorInfo;

      if (pieces.head) {
        this._equipPiece(player, equipmentComponent, EQUIPMENT_SLOTS.HEAD, new ItemStack(`minecraft:${armorInfo.type}_helmet`));
      }
      if (pieces.chestplate) {
        this._equipPiece(player, equipmentComponent, EQUIPMENT_SLOTS.CHEST, new ItemStack(`minecraft:${armorInfo.type}_chestplate`));
      }
      if (pieces.leggings) {
        this._equipPiece(player, equipmentComponent, EQUIPMENT_SLOTS.LEGS, new ItemStack(`minecraft:${armorInfo.type}_leggings`));
      }
      if (pieces.boots) {
        this._equipPiece(player, equipmentComponent, EQUIPMENT_SLOTS.FEET, new ItemStack(`minecraft:${armorInfo.type}_boots`));
      }

      player.sendMessage(`§aYou equipped ${armorInfo.name} armor!`);
    } catch (error) {
      console.error(`[ArmorSetDetector] equip error: ${error}`);
      player.sendMessage("§cError equipping armor.");
    }
  }

  _equipPiece(player, equipmentComponent, slot, item) {
    try {
      equipmentComponent.setEquipment(slot, item);
    } catch (error) {
      try {
        const container = player.getComponent("minecraft:equipment_inventory").container;
        container.setItem(EQUIPMENT_SLOT_INDEX[slot], item);
      } catch (innerError) {
        console.error(`[ArmorSetDetector] fallback equip ${slot} failed: ${innerError}`);
      }
    }
  }

  removeArmor(player) {
    try {
      const equipmentComponent = player.getComponent("equippable");
      for (const slot of Object.values(EQUIPMENT_SLOTS)) {
        equipmentComponent.setEquipment(slot, undefined);
      }
      player.sendMessage("§cYour armor was removed!");
    } catch (error) {
      try {
        const container = player.getComponent("minecraft:equipment_inventory").container;
        [0, 1, 2, 3].forEach((i) => container.setItem(i, undefined));
        player.sendMessage("§cYour armor was removed!");
      } catch (innerError) {
        console.error(`[ArmorSetDetector] removeArmor fallback failed: ${innerError}`);
      }
    }
  }
}

export const DEFAULT_ARMOR_MAPPING = {
  "minecraft:iron_block": { type: "iron", fullSet: true, name: "iron" },
  "minecraft:diamond_block": { type: "diamond", fullSet: true, name: "diamond" },
  "minecraft:gold_block": {
    type: "golden", fullSet: false, name: "gold",
    head: false, chestplate: true, leggings: true, boots: false
  },
  "minecraft:netherite_block": { type: "netherite", fullSet: true, name: "netherite" },
  "minecraft:copper_block": {
    type: "chainmail", fullSet: false, name: "chainmail",
    head: true, chestplate: false, leggings: true, boots: true
  }
};
