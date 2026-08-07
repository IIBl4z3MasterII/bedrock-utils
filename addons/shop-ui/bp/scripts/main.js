/* ██████╗ ██╗██╗ ██╗███████╗██████╗ ███╗ ███╗ █████╗ ███████╗████████╗███████╗██████╗ 
██╔══██╗██║██║ ██║╚══███╔╝╚════██╗ ████╗ ████║██╔══██╗██╔════╝╚═ ═██╔══╝██╔════╝██╔══██╗
██████╔╝██║███████║ ███╔╝ █████╔╝ ██╔████╔██║███████║███████╗ ██║ █████╗ ██████╔╝
██╔══██╗██║╚════██║ ███╔╝ ╚═══██╗ ██║╚██╔╝██║██╔══██║╚════██║ ██║ ██╔══╝ ██╔══██╗
██████╔╝███████╗██║███████╗██████╔╝ ██║ ╚═╝ ██║██║ ██║███████║ ██║ ███████╗██║ ██║
╚═════╝ ╚══════╝╚═╝╚══════╝╚═════╝ ╚═╝ ╚═╝╚═╝ ╚═╝╚══════╝ ╚═╝ ╚══════╝╚═╝ ╚═╝
                                                                                           
          Main • By: @bl4z3master */

import { world, system, ItemStack } from "@minecraft/server";
import { ActionFormData, ModalFormData } from '@minecraft/server-ui';
import {
  PROPERTY_KEYS,
  ECONOMY_CONFIG,
  STOCK_CONFIG,
  MATERIALS,
  ITEM_TYPES,
  UI_CONFIG,
  MESSAGES,
  SOUNDS,
  SHOP_ITEM
} from './shop-config.js';

function saveObjectData(key, object) {
  try {
    const jsonString = JSON.stringify(object);
    world.setDynamicProperty(key, jsonString);
    return true;
  } catch (error) {
    return false;
  }
}

function loadObjectData(key, defaultObject = {}) {
  try {
    const jsonString = world.getDynamicProperty(key);
    return jsonString ? JSON.parse(jsonString) : defaultObject;
  } catch (error) {
    return defaultObject;
  }
}

class Economy {
  static getCoins(player) {
    try {
      const objective = world.scoreboard.getObjective(ECONOMY_CONFIG.OBJECTIVE_NAME) 
        || world.scoreboard.addObjective(ECONOMY_CONFIG.OBJECTIVE_NAME, ECONOMY_CONFIG.OBJECTIVE_DISPLAY);
      return objective.getScore(player) || 0;
    } catch {
      return 0;
    }
  }

  static setCoins(player, amount) {
    try {
      const objective = world.scoreboard.getObjective(ECONOMY_CONFIG.OBJECTIVE_NAME) 
        || world.scoreboard.addObjective(ECONOMY_CONFIG.OBJECTIVE_NAME, ECONOMY_CONFIG.OBJECTIVE_DISPLAY);
      objective.setScore(player, amount);
      return true;
    } catch (e) {
      console.error("Error setting coins:", e);
      return false;
    }
  }

  static deductCoins(player, amount) {
    const current = this.getCoins(player);
    if (current >= amount) {
      this.setCoins(player, current - amount);
      return true;
    }
    return false;
  }
}

class StockManager {
  static stocks = new Map();
  static lastResetTime = 0;
  static resetTimerId = null;
  static notificationTimerId = null;
  static lastNotificationTime = 0;
  static shouldShowEntranceScreen = true;
  static isInitialized = false;
  static saveDebounceId = null;

  static initialize() {
    if (this.isInitialized) return;
    
    this.loadFromStorage();
    
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (this.lastResetTime === 0) {
      this.lastResetTime = currentTime;
      this.lastNotificationTime = currentTime;
    }
    
    const elapsed = currentTime - this.lastResetTime;
    if (elapsed >= STOCK_CONFIG.RESET_INTERVAL) {
      this.resetAllStocks();
    }
    
    this.startResetTimer();
    this.startNotificationTimer();
    this.isInitialized = true;
    
  }

  static scheduleSave() {
    if (this.saveDebounceId) {
      system.clearRun(this.saveDebounceId);
    }
    
    this.saveDebounceId = system.runTimeout(() => {
      this.saveToStorage();
      this.saveDebounceId = null;
    }, 100); 
  }

  static saveToStorage() {
    try {
      const stocksObject = {};
      for (const [key, value] of this.stocks) {
        stocksObject[key] = value;
      }
      
      saveObjectData(PROPERTY_KEYS.SHOP_STOCKS, stocksObject);
      
      saveObjectData(PROPERTY_KEYS.SHOP_TIMERS, {
        lastResetTime: this.lastResetTime,
        lastNotificationTime: this.lastNotificationTime,
        shouldShowEntranceScreen: this.shouldShowEntranceScreen
      });
      
    } catch (error) {
    }
  }

  static loadFromStorage() {
    try {
      const stocksObject = loadObjectData(PROPERTY_KEYS.SHOP_STOCKS, {});
      this.stocks.clear();
      for (const [key, value] of Object.entries(stocksObject)) {
        this.stocks.set(key, value);
      }
      
      const timerData = loadObjectData(PROPERTY_KEYS.SHOP_TIMERS, {
        lastResetTime: 0,
        lastNotificationTime: 0,
        shouldShowEntranceScreen: true
      });
      
      this.lastResetTime = timerData.lastResetTime || 0;
      this.lastNotificationTime = timerData.lastNotificationTime || 0;
      this.shouldShowEntranceScreen = timerData.shouldShowEntranceScreen !== false;
      
      if (this.stocks.size > 0) {
      }
    } catch (error) {
    }
  }

  static startResetTimer() {
    if (this.resetTimerId) {
      system.clearRun(this.resetTimerId);
    }

    this.resetTimerId = system.runInterval(() => {
      const currentTime = Math.floor(Date.now() / 1000);
      const elapsed = currentTime - this.lastResetTime;

      if (elapsed >= STOCK_CONFIG.RESET_INTERVAL) {
        this.resetAllStocks();
      }
    }, 20);
  }

  static startNotificationTimer() {
    if (this.notificationTimerId) {
      system.clearRun(this.notificationTimerId);
    }

    this.notificationTimerId = system.runInterval(() => {
      const currentTime = Math.floor(Date.now() / 1000);
      const elapsed = currentTime - this.lastNotificationTime;

      if (elapsed >= STOCK_CONFIG.NOTIFICATION_INTERVAL) {
        this.notifyTimeRemaining();
        this.lastNotificationTime = currentTime;
        this.saveToStorage(); 
      }
    }, 20);
  }

  static notifyTimeRemaining() {
    const players = world.getAllPlayers();
    if (players.length === 0) return; 

    const timeUntilReset = this.getTimeUntilReset();
    const minutes = Math.floor(timeUntilReset / 60);
    const message = MESSAGES.NEXT_RESET.replace('{minutes}', minutes);
    
    for (const player of players) {
      player.sendMessage(message);
      player.playSound(SOUNDS.NOTIFICATION);
    }
  }

  static async resetAllStocks() {
    const players = world.getAllPlayers();
    
    for (const player of players) {
      player.sendMessage(MESSAGES.COUNTDOWN_3);
      player.playSound(SOUNDS.COUNTDOWN_1.sound, { pitch: SOUNDS.COUNTDOWN_1.pitch });
    }
    
    await new Promise(resolve => system.runTimeout(resolve, 20));
    
    for (const player of players) {
      player.sendMessage(MESSAGES.COUNTDOWN_2);
      player.playSound(SOUNDS.COUNTDOWN_2.sound, { pitch: SOUNDS.COUNTDOWN_2.pitch });
    }
    
    await new Promise(resolve => system.runTimeout(resolve, 20));
    
    for (const player of players) {
      player.sendMessage(MESSAGES.COUNTDOWN_1);
      player.playSound(SOUNDS.COUNTDOWN_3.sound, { pitch: SOUNDS.COUNTDOWN_3.pitch });
    }
    
    await new Promise(resolve => system.runTimeout(resolve, 20));
    
    this.stocks.clear();
    this.lastResetTime = Math.floor(Date.now() / 1000);
    this.lastNotificationTime = this.lastResetTime;
    this.shouldShowEntranceScreen = true;
    
    this.saveToStorage();
    
    for (const player of players) {
      player.sendMessage(MESSAGES.RESET_COMPLETE);
      player.playSound(SOUNDS.LEVELUP);
    }
  }

  static setStock(itemId, maxStock) {
    if (!this.stocks.has(itemId)) {
      this.stocks.set(itemId, maxStock);
    }
  }

  static getStock(itemId) {
    return this.stocks.get(itemId) || 0;
  }

  static hasStock(itemId, amount) {
    const current = this.getStock(itemId);
    return current >= amount;
  }

  static deductStock(itemId, amount) {
    const current = this.getStock(itemId);
    if (current >= amount) {
      this.stocks.set(itemId, current - amount);
      this.scheduleSave(); 
      return true;
    }
    return false;
  }

  static getTimeUntilReset() {
    const currentTime = Math.floor(Date.now() / 1000);
    const elapsed = currentTime - this.lastResetTime;
    const remaining = STOCK_CONFIG.RESET_INTERVAL - elapsed;
    return Math.max(0, remaining);
  }

  static formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `§e${minutes}m ${secs}s`;
  }

  static checkAndDisableEntranceScreen() {
    if (this.shouldShowEntranceScreen) {
      this.shouldShowEntranceScreen = false;
      this.scheduleSave(); 
      return true;
    }
    return false;
  }
}

class ShopItem {
  constructor(name, price, itemId, maxAmount = 64, texture = "", enchanted = false, isMaterial = false, isGroup = false, groupItems = [], maxStock = 999) {
    this.name = name;
    this.price = price;
    this.itemId = itemId;
    this.maxAmount = maxAmount;
    this.texture = texture;
    this.enchanted = enchanted;
    this.isMaterial = isMaterial;
    this.isGroup = isGroup;
    this.groupItems = groupItems;
    this.maxStock = maxStock;
    this.uniqueId = this.generateUniqueId();
    
    this._cachedDisplayText = null;
    this._lastStockCheck = 0;
  }

  generateUniqueId() {
    return `${this.itemId}_${this.name}_${this.price}`.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  getDisplayText() {
    if (this.isGroup) {
      return `${this.name}\n§7View available variants`;
    }
    
    const currentTime = Date.now();
    if (this._cachedDisplayText && currentTime - this._lastStockCheck < 1000) {
      return this._cachedDisplayText;
    }
    
    const stock = StockManager.getStock(this.uniqueId);
    const stockColor = stock > 10 ? "§a" : stock > 0 ? "§e" : "§c";
    this._cachedDisplayText = `${this.name}\n§7Price: §6${this.price} §eCoins §7x1\n${stockColor}Stock:${stock}/${this.maxStock}`;
    this._lastStockCheck = currentTime;
    
    return this._cachedDisplayText;
  }

  calculateMaxPurchase(playerCoins) {
    const maxAffordable = Math.floor(playerCoins / this.price);
    const currentStock = StockManager.getStock(this.uniqueId);
    return Math.min(maxAffordable, this.maxAmount, currentStock);
  }

  hasStock(amount) {
    return StockManager.hasStock(this.uniqueId, amount);
  }

  deductStock(amount) {
    return StockManager.deductStock(this.uniqueId, amount);
  }

  initializeStock() {
    StockManager.setStock(this.uniqueId, this.maxStock);
  }
}

class UIManager {
  static createTitle(text, coins) {
    return `${UI_CONFIG.TITLE_PREFIX}${text} §7(§6${coins} §eCoins§7)`;
  }

  static createBody(categoriesSize, additionalText = "") {
    const catSizeStr = String(categoriesSize);
    const baseLength = UI_CONFIG.FILLER_BASE_LENGTH;
    const fillerLength = Math.max(0, baseLength - catSizeStr.length);
    
    return catSizeStr + "]".repeat(fillerLength) + additionalText;
  }

  static showNotification(player, message, success = true) {
    player.sendMessage(message);
    player.playSound(success ? SOUNDS.SUCCESS : SOUNDS.ERROR);
  }

  static showInsufficientFunds(player, required, current) {
    const needed = required - current;
    player.sendMessage(MESSAGES.INSUFFICIENT_FUNDS);
    player.sendMessage(`§7You need §6${needed} §eCoins §7further`);
    player.playSound(SOUNDS.ERROR);
  }

  static showInsufficientStock(player, itemName) {
    const message = MESSAGES.INSUFFICIENT_STOCK.replace('{item}', itemName);
    player.sendMessage(message);
    player.sendMessage(MESSAGES.WAIT_RESET);
    player.playSound(SOUNDS.ERROR);
  }
}

class ShopForm {
  constructor(title = "§6§lSTORE", description = "§7Select a category") {
    this.categories = new Map();
    this.titleText = title;
    this.bodytext = description;
    
    this._allItemsCache = null;
  }

  addItem(categoryName, item) {
    if (!this.categories.has(categoryName)) {
      this.categories.set(categoryName, []);
    }
    this.categories.get(categoryName).push(item);
    item.initializeStock();
    
    if (item.isGroup && item.groupItems) {
      item.groupItems.forEach(subItem => {
        subItem.initializeStock();
      });
    }
    
    this._allItemsCache = null;
    
    return this;
  }

  getCategoryByIndex(index) {
    return Array.from(this.categories.keys())[index] || null;
  }

  getAllItems() {
    if (this._allItemsCache) {
      return this._allItemsCache;
    }

    const allItems = [];
    for (const [categoryName, items] of this.categories) {
      items.forEach(item => {
        if (!item.isGroup) {
          allItems.push({ category: categoryName, item: item });
        } else {
          item.groupItems.forEach(subItem => {
            allItems.push({ category: categoryName, item: subItem, parentGroup: item.name });
          });
        }
      });
    }
    
    this._allItemsCache = allItems;
    return allItems;
  }

  async openShop(player) {
    if (StockManager.checkAndDisableEntranceScreen()) {
      await this.showEntrance(player);
    } else {
      await this.show(player);
    }
  }

  async showEntrance(player) {
    const form = new ActionFormData();
    const coins = Economy.getCoins(player);
    
    form.title(UIManager.createTitle("§6§lSTORE - ENTRANCE", coins));
    
    form.button(`${UI_CONFIG.CATEGORY_PREFIX}§a§lENTER THE STORE\n§7See categories and buy items`);
    
    const allItems = this.getAllItems();
    const stockParts = ["§e§l━━━━━━━AVAILABLE STOCKS━━━━━━━\\n\\n"];
    
    const itemsByCategory = new Map();
    allItems.forEach(({ category, item, parentGroup }) => {
      if (!itemsByCategory.has(category)) {
        itemsByCategory.set(category, []);
      }
      const displayName = parentGroup ? `${parentGroup} - ${item.name}` : item.name;
      const stock = StockManager.getStock(item.uniqueId);
      const stockColor = stock > 10 ? "§a" : stock > 0 ? "§e" : "§c";
      
      itemsByCategory.get(category).push(
        `  §7• §f${displayName.replace(/§[0-9a-fklmnor]/g, '')}: ${stockColor}${stock}§7/§f${item.maxStock}`
      );
    });

    for (const [category, items] of itemsByCategory) {
      stockParts.push(`§6§l${category}:\n`);
      stockParts.push(items.join("\n"));
      stockParts.push("\n\n");
    }

    const timeUntilReset = StockManager.getTimeUntilReset();
    stockParts.push(
      `§e§l━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`,
      `§a§lNext reboot on:${StockManager.formatTime(timeUntilReset)}\n`,
      `§7Stocks reset every 30 minutes`
    );
    
    const stockList = stockParts.join("");
    
    form.body(UIManager.createBody(1, stockList));
    
    const response = await form.show(player);
    if (!response || response.canceled) return;
    
    if (response.selection === 0) {
      system.runTimeout(() => this.show(player), 5);
    }
  }

  async show(player, categoryName = this.getCategoryByIndex(0)) {
    const form = new ActionFormData();
    const coins = Economy.getCoins(player);
    
    form.title(UIManager.createTitle(this.titleText, coins));
    
    const items = this.categories.get(categoryName) || [];
    
    const sortedItems = [...items].sort((a, b) => {
      if (a.isGroup && !b.isGroup) return -1;
      if (!a.isGroup && b.isGroup) return 1;
      return 0;
    });
    
    sortedItems.forEach(item => {
      form.button(item.getDisplayText(), item.texture);
    });
    
    Array.from(this.categories.keys()).forEach(cat => {
      form.button(`${UI_CONFIG.CATEGORY_PREFIX}§8 ${cat}`);
    });
    
    form.body(UIManager.createBody(this.categories.size, this.bodytext));
    
    const response = await form.show(player);
    if (!response || response.canceled) return;
    
    const itemsLength = sortedItems.length;
    const categoriesStart = itemsLength;
    
    if (response.selection >= categoriesStart) {
      const newCategory = this.getCategoryByIndex(response.selection - categoriesStart);
      return this.show(player, newCategory);
    }
    
    if (response.selection < itemsLength) {
      const selectedItem = sortedItems[response.selection];
      
      if (selectedItem.isGroup) {
        await this.showGroupItems(player, selectedItem, categoryName);
      } else if (selectedItem.isMaterial) {
        await this.showMaterialSelector(player, selectedItem, categoryName);
      } else {
        await this.showQuantitySelector(player, selectedItem, categoryName);
      }
    }
  }

  async showGroupItems(player, groupItem, previousCategory) {
    const form = new ActionFormData();
    const coins = Economy.getCoins(player);
    
    form.title(UIManager.createTitle(groupItem.name, coins));
    
    groupItem.groupItems.forEach(item => {
      form.button(item.getDisplayText(), item.texture);
    });
    
    form.button(`${UI_CONFIG.CATEGORY_PREFIX}§c§lRETURN TO THE STORE\n§7Return to main menu`);
    
    form.body(UIManager.createBody(1, `§7Select a variant of§f${groupItem.name}`));
    
    const response = await form.show(player);
    if (!response || response.canceled) {
      system.runTimeout(() => this.show(player, previousCategory), 5);
      return;
    }
    
    const itemsLength = groupItem.groupItems.length;
    
    if (response.selection === itemsLength) {
      system.runTimeout(() => this.show(player, previousCategory), 5);
      return;
    }
    
    if (response.selection < itemsLength) {
      const selectedItem = groupItem.groupItems[response.selection];
      await this.showQuantitySelector(player, selectedItem, previousCategory);
    }
  }

  async showMaterialSelector(player, item, previousCategory) {
    const materials = MaterialData.getMaterialsForType(item.itemId);
    const form = new ActionFormData();
    const coins = Economy.getCoins(player);
    
    form.title(UIManager.createTitle(item.name, coins));
    form.button(`${UI_CONFIG.CATEGORY_PREFIX}§c§lRETURN TO THE STORE\n§7Return to main menu`);
    
    materials.forEach(mat => {
      form.button(`${UI_CONFIG.CATEGORY_PREFIX}§8 ${mat.name}`);
    });
    
    form.body(UIManager.createBody(materials.length + 1, `§7Select the material for your§f${item.name}`));
    
    const response = await form.show(player);
    if (!response || response.canceled) {
      system.runTimeout(() => this.show(player, previousCategory), 5);
      return;
    }
    
    if (response.selection === 0) {
      system.runTimeout(() => this.show(player, previousCategory), 5);
      return;
    }
    
    if (response.selection > 0 && response.selection <= materials.length) {
      const selectedMaterial = materials[response.selection - 1];
      await this.showMaterialConfirmation(player, item, selectedMaterial, previousCategory);
    }
  }

  async showMaterialConfirmation(player, item, material, previousCategory) {
    const finalPrice = Math.round(item.price * material.multiplier);
    const finalItemId = material.itemId;
    
    const coins = Economy.getCoins(player);
    const currentStock = StockManager.getStock(item.uniqueId);
    const maxPurchase = Math.min(Math.floor(coins / finalPrice), item.maxAmount, currentStock);
    
    if (maxPurchase <= 0) {
      if (currentStock <= 0) {
        UIManager.showInsufficientStock(player, `${item.name} of ${material.name}`);
      } else {
        UIManager.showInsufficientFunds(player, finalPrice, coins);
      }
      system.runTimeout(() => this.showMaterialSelector(player, item, previousCategory), 5);
      return;
    }
    
    const modal = new ModalFormData();
    modal.title("Select Quantity");
    
    modal.slider(
      `§6Quantity §7(Have:§6${coins} §eCoins§7)\n§f${item.name} of ${material.name}\n§7Unit price: §6${finalPrice} §eCoins\n§aStock available:§f${currentStock}`,
      1,
      maxPurchase,
      { valueStep: 1, defaultValue: 1 }
    );
    
    const response = await modal.show(player);
    if (!response || response.canceled) {
      system.runTimeout(() => this.showMaterialSelector(player, item, previousCategory), 5);
      return;
    }
    
    const quantity = response.formValues[0];
    const totalPrice = finalPrice * quantity;
    
    if (!item.hasStock(quantity)) {
      UIManager.showInsufficientStock(player, `${item.name} of ${material.name}`);
      system.runTimeout(() => this.showMaterialSelector(player, item, previousCategory), 10);
      return;
    }
    
    if (Economy.deductCoins(player, totalPrice)) {
      item.deductStock(quantity);
      const itemStack = new ItemStack(finalItemId, quantity);
      player.getComponent("inventory").container.addItem(itemStack);
      
      const message = MESSAGES.PURCHASE_SUCCESS
        .replace('{quantity}', quantity)
        .replace('{item}', `${item.name} §7of §f${material.name}`)
        .replace('{price}', totalPrice);
      
      UIManager.showNotification(player, message, true);
      
      system.runTimeout(() => this.show(player, previousCategory), 10);
    } else {
      UIManager.showInsufficientFunds(player, totalPrice, Economy.getCoins(player));
      system.runTimeout(() => this.showMaterialSelector(player, item, previousCategory), 10);
    }
  }

  async showQuantitySelector(player, item, category) {
    const coins = Economy.getCoins(player);
    const maxPurchase = item.calculateMaxPurchase(coins);
    
    if (maxPurchase <= 0) {
      const currentStock = StockManager.getStock(item.uniqueId);
      if (currentStock <= 0) {
        UIManager.showInsufficientStock(player, item.name);
      } else {
        UIManager.showInsufficientFunds(player, item.price, coins);
      }
      system.runTimeout(() => this.show(player, category), 5);
      return;
    }
    
    const modal = new ModalFormData();
    modal.title("Select Quantity");
    const currentStock = StockManager.getStock(item.uniqueId);
    
    modal.slider(
      `§6Quantity §7(Have:§6${coins} §eCoins§7)\n§f${item.name}\n§7Unit price: §6${item.price} §eCoins\n§aStock available:§f${currentStock}`,
      1,
      maxPurchase,
      { valueStep: 1, defaultValue: 1 }
    );
    
    const response = await modal.show(player);
    if (!response || response.canceled) {
      system.runTimeout(() => this.show(player, category), 5);
      return;
    }
    
    const quantity = response.formValues[0];
    const totalPrice = item.price * quantity;
    
    if (!item.hasStock(quantity)) {
      UIManager.showInsufficientStock(player, item.name);
      system.runTimeout(() => this.show(player, category), 10);
      return;
    }
    
    if (Economy.deductCoins(player, totalPrice)) {
      item.deductStock(quantity);
      const itemStack = new ItemStack(item.itemId, quantity);
      player.getComponent("inventory").container.addItem(itemStack);
      
      const message = MESSAGES.PURCHASE_SUCCESS
        .replace('{quantity}', quantity)
        .replace('{item}', item.name)
        .replace('{price}', totalPrice);
      
      UIManager.showNotification(player, message, true);
      
      system.runTimeout(() => this.show(player, category), 10);
    } else {
      UIManager.showInsufficientFunds(player, totalPrice, Economy.getCoins(player));
      system.runTimeout(() => this.show(player, category), 10);
    }
  }
}

class ShopConfig {
  static createShop() {
    const shop = new ShopForm();
    
    const valuables = [
      new ShopItem(`§bDiamond`, 100, "minecraft:diamond", 64, "textures/items/diamond", true, false, false, [], 500),
      new ShopItem(`§aEmerald`, 150, "minecraft:emerald", 64, "textures/items/emerald", true, false, false, [], 500),
      new ShopItem(`§6Raw Gold`, 60, "minecraft:raw_gold", 64, "textures/items/raw_gold", false, false, false, [], 500),
      new ShopItem(`§6Gold ingot`, 80, "minecraft:gold_ingot", 64, "textures/items/gold_ingot", true, false, false, [], 500),
      new ShopItem(`§7Raw Iron`, 25, "minecraft:raw_iron", 64, "textures/items/raw_iron", false, false, false, [], 500),
      new ShopItem(`§7Iron Ingot`, 40, "minecraft:iron_ingot", 64, "textures/items/iron_ingot", true, false, false, [], 500),
      new ShopItem(`§8Netherite Ingot`, 1000, "minecraft:netherite_ingot", 4, "textures/items/netherite_ingot", true, false, false, [], 100),
      new ShopItem(`§5Amethyst`, 120, "minecraft:amethyst_shard", 64, "textures/items/amethyst_shard", true, false, false, [], 500),
      new ShopItem(`§3Netherite Shard`, 500, "minecraft:netherite_scrap", 16, "textures/items/netherite_scrap", true, false, false, [], 200),
      new ShopItem(`§dNether Star`, 2000, "minecraft:nether_star", 1, "textures/items/nether_star", true, false, false, [], 50),
      new ShopItem(`§bRaw Copper`, 15, "minecraft:raw_copper", 64, "textures/items/raw_copper", false, false, false, [], 500),
      new ShopItem(`§bCopper bar`, 20, "minecraft:copper_ingot", 64, "textures/items/copper_ingot", false, false, false, [], 500),
      new ShopItem(`§4Coal`, 8, "minecraft:coal", 64, "textures/items/coal", false, false, false, [], 500),
      new ShopItem(`§1Lapis lazuli`, 25, "minecraft:lapis_lazuli", 64, "textures/items/dye_powder_blue", false, false, false, [], 500),
      new ShopItem(`§cRedstone`, 20, "minecraft:redstone", 64, "textures/items/redstone_dust", false, false, false, [], 500),
      new ShopItem(`§fNether Quartz`, 30, "minecraft:quartz", 64, "textures/items/quartz", false, false, false, [], 500),
      new ShopItem(`§eGold nugget`, 10, "minecraft:gold_nugget", 64, "textures/items/gold_nugget", false, false, false, [], 500),
      new ShopItem(`§7Iron Nugget`, 5, "minecraft:iron_nugget", 64, "textures/items/iron_nugget", false, false, false, [], 500),
      new ShopItem(`§dCrystalline Prismarine`, 80, "minecraft:prismarine_crystals", 64, "textures/items/prismarine_crystals", false, false, false, [], 500),
      new ShopItem(`§bPrismarine Shard`, 50, "minecraft:prismarine_shard", 64, "textures/items/prismarine_shard", false, false, false, [], 500)
    ];
    
    const blocks = [
      new ShopItem(`§7Stone`, 5, "stone_group", 64, "textures/blocks/stone", false, false, true, [
        new ShopItem(`§7Stone`, 5, "minecraft:stone", 64, "textures/blocks/stone", false, false, false, [], 1000),
        new ShopItem(`§cGranite`, 6, "minecraft:granite", 64, "textures/blocks/stone_granite", false, false, false, [], 1000),
        new ShopItem(`§fDiorite`, 6, "minecraft:diorite", 64, "textures/blocks/stone_diorite", false, false, false, [], 1000),
        new ShopItem(`§7Andesite`, 6, "minecraft:andesite", 64, "textures/blocks/stone_andesite", false, false, false, [], 1000),
        new ShopItem(`§7Smooth Stone`, 7, "minecraft:smooth_stone", 64, "textures/blocks/stone_slab_top", false, false, false, [], 1000),
        new ShopItem(`§8Cobble`, 4, "minecraft:cobblestone", 64, "textures/blocks/cobblestone", false, false, false, [], 1000),
        new ShopItem(`§8Deepslate`, 8, "minecraft:deepslate", 64, "textures/blocks/deepslate", false, false, false, [], 1000),
        new ShopItem(`§7Tuff`, 5, "minecraft:tuff", 64, "textures/blocks/tuff", false, false, false, [], 1000),
        new ShopItem(`§8Calcite`, 9, "minecraft:calcite", 64, "textures/blocks/calcite", false, false, false, [], 1000),
        new ShopItem(`§8Basalt`, 6, "minecraft:basalt", 64, "textures/blocks/basalt_side", false, false, false, [], 1000),
        new ShopItem(`§8Smooth Basalt`, 7, "minecraft:smooth_basalt", 64, "textures/blocks/smooth_basalt", false, false, false, [], 1000)
      ]),
      new ShopItem(`§2Land and Grass`, 5, "dirt_group", 64, "textures/blocks/grass_side_carried", false, false, true, [
        new ShopItem(`§2Grass`, 8, "minecraft:grass_block", 64, "textures/blocks/grass_side_carried", false, false, false, [], 1000),
        new ShopItem(`§6Dirt`, 2, "minecraft:dirt", 64, "textures/blocks/dirt", false, false, false, [], 1000),
        new ShopItem(`§6Coarse Earth`, 3, "minecraft:coarse_dirt", 64, "textures/blocks/coarse_dirt", false, false, false, [], 1000),
        new ShopItem(`§8Rooted Earth`, 4, "minecraft:rooted_dirt", 64, "textures/blocks/dirt_with_roots", false, false, false, [], 1000),
        new ShopItem(`§2Podzol`, 6, "minecraft:podzol", 64, "textures/blocks/dirt_podzol_side", false, false, false, [], 1000),
        new ShopItem(`§6Mycelium`, 8, "minecraft:mycelium", 64, "textures/blocks/mycelium_side", false, false, false, [], 1000),
        new ShopItem(`§6Dirt road`, 3, "minecraft:grass_path", 64, "textures/blocks/grass_path_side", false, false, false, [], 1000),
        new ShopItem(`§6Farmland`, 5, "minecraft:farmland", 64, "textures/blocks/farmland_wet", false, false, false, [], 1000)
      ]),
      new ShopItem(`§6Wood`, 15, "planks_group", 64, "textures/blocks/planks_oak", false, false, true, [
        new ShopItem(`§6Oak Boards`, 15, "minecraft:oak_planks", 64, "textures/blocks/planks_oak", false, false, false, [], 1000),
        new ShopItem(`§6Fir Boards`, 17, "minecraft:spruce_planks", 64, "textures/blocks/planks_spruce", false, false, false, [], 1000),
        new ShopItem(`§fBirch Boards`, 17, "minecraft:birch_planks", 64, "textures/blocks/planks_birch", false, false, false, [], 1000),
        new ShopItem(`§2Jungle Tables`, 18, "minecraft:jungle_planks", 64, "textures/blocks/planks_jungle", false, false, false, [], 1000),
        new ShopItem(`§6Acacia Boards`, 18, "minecraft:acacia_planks", 64, "textures/blocks/planks_acacia", false, false, false, [], 1000),
        new ShopItem(`§8Dark Oak Planks`, 20, "minecraft:dark_oak_planks", 64, "textures/blocks/planks_big_oak", false, false, false, [], 1000),
        new ShopItem(`§cMangrove Boards`, 20, "minecraft:mangrove_planks", 64, "textures/blocks/mangrove_planks", false, false, false, [], 1000),
        new ShopItem(`§dCherry Boards`, 21, "minecraft:cherry_planks", 64, "textures/blocks/cherry_planks", false, false, false, [], 1000),
        new ShopItem(`§6Bamboo Boards`, 19, "minecraft:bamboo_planks", 64, "textures/blocks/bamboo_planks", false, false, false, [], 1000),
        new ShopItem(`§cCrimson Tables`, 22, "minecraft:crimson_planks", 64, "textures/blocks/crimson_planks", false, false, false, [], 1000),
        new ShopItem(`§bDistorted Tables`, 22, "minecraft:warped_planks", 64, "textures/blocks/warped_planks", false, false, false, [], 1000)
      ]),
      new ShopItem(`§6Log`, 20, "log_group", 64, "textures/blocks/log_oak", false, false, true, [
        new ShopItem(`§6Oak Trunk`, 20, "minecraft:oak_log", 64, "textures/blocks/log_oak", false, false, false, [], 1000),
        new ShopItem(`§6Fir Trunk`, 22, "minecraft:spruce_log", 64, "textures/blocks/log_spruce", false, false, false, [], 1000),
        new ShopItem(`§fBirch Trunk`, 22, "minecraft:birch_log", 64, "textures/blocks/log_birch", false, false, false, [], 1000),
        new ShopItem(`§2Jungle Trunk`, 24, "minecraft:jungle_log", 64, "textures/blocks/log_jungle", false, false, false, [], 1000),
        new ShopItem(`§6Acacia trunk`, 24, "minecraft:acacia_log", 64, "textures/blocks/log_acacia", false, false, false, [], 1000),
        new ShopItem(`§8Dark Oak Trunk`, 26, "minecraft:dark_oak_log", 64, "textures/blocks/log_big_oak", false, false, false, [], 1000),
        new ShopItem(`§cMangrove Trunk`, 26, "minecraft:mangrove_log", 64, "textures/blocks/mangrove_log_side", false, false, false, [], 1000),
        new ShopItem(`§dCherry Trunk`, 28, "minecraft:cherry_log", 64, "textures/blocks/cherry_log_side", false, false, false, [], 1000),
        new ShopItem(`§6Bamboo Trunk`, 25, "minecraft:bamboo_block", 64, "textures/blocks/bamboo_block", false, false, false, [], 1000),
        new ShopItem(`§cCrimson Trunk`, 30, "minecraft:crimson_stem", 64, "textures/blocks/crimson_stem_side", false, false, false, [], 1000),
        new ShopItem(`§bDistorted Trunk`, 30, "minecraft:warped_stem", 64, "textures/blocks/warped_stem_side", false, false, false, [], 1000)
      ]),
      new ShopItem(`§eSand`, 12, "sand_group", 64, "textures/blocks/sand", false, false, true, [
        new ShopItem(`§eSand`, 12, "minecraft:sand", 64, "textures/blocks/sand", false, false, false, [], 1000),
        new ShopItem(`§cRed Sand`, 14, "minecraft:red_sand", 64, "textures/blocks/red_sand", false, false, false, [], 1000),
        new ShopItem(`§7Gravel`, 5, "minecraft:gravel", 64, "textures/blocks/gravel", false, false, false, [], 1000),
        new ShopItem(`§fSand Soul`, 20, "minecraft:soul_sand", 64, "textures/blocks/soul_sand", false, false, false, [], 1000),
        new ShopItem(`§8Land of Souls`, 22, "minecraft:soul_soil", 64, "textures/blocks/soul_soil", false, false, false, [], 1000)
      ]),
      new ShopItem(`§6Sandstone`, 20, "sandstone_group", 64, "textures/blocks/sandstone_normal", false, false, true, [
        new ShopItem(`§6Sandstone`, 20, "minecraft:sandstone", 64, "textures/blocks/sandstone_normal", false, false, false, [], 1000),
        new ShopItem(`§6Smooth Sandstone`, 22, "minecraft:smooth_sandstone", 64, "textures/blocks/sandstone_smooth", false, false, false, [], 1000),
        new ShopItem(`§6Cut Sandstone`, 21, "minecraft:cut_sandstone", 64, "textures/blocks/sandstone_carved", false, false, false, [], 1000),
        new ShopItem(`§6Chiseled Sandstone`, 23, "minecraft:chiseled_sandstone", 64, "textures/blocks/sandstone_carved", false, false, false, [], 1000),
        new ShopItem(`§cRed Sandstone`, 22, "minecraft:red_sandstone", 64, "textures/blocks/red_sandstone_normal", false, false, false, [], 1000),
        new ShopItem(`§cSmooth Red Sandstone`, 24, "minecraft:smooth_red_sandstone", 64, "textures/blocks/red_sandstone_smooth", false, false, false, [], 1000),
        new ShopItem(`§cCut Red Sandstone`, 23, "minecraft:cut_red_sandstone", 64, "textures/blocks/red_sandstone_carved", false, false, false, [], 1000),
        new ShopItem(`§cChiseled Red Sandstone`, 25, "minecraft:chiseled_red_sandstone", 64, "textures/blocks/red_sandstone_carved", false, false, false, [], 1000)
      ]),
      new ShopItem(`§fGlass`, 25, "minecraft:glass", 64, "textures/blocks/glass", false, false, false, [], 1000),
      new ShopItem(`§cBricks`, 35, "brick_group", 64, "textures/blocks/brick", false, false, true, [
        new ShopItem(`§cBrick`, 40, "minecraft:bricks", 64, "textures/blocks/brick", false, false, false, [], 1000),
        new ShopItem(`§cNether Brick`, 35, "minecraft:nether_brick", 64, "textures/blocks/nether_brick", false, false, false, [], 1000),
        new ShopItem(`§cNether Red Brick`, 40, "minecraft:red_nether_brick", 64, "textures/blocks/red_nether_brick", false, false, false, [], 1000),
        new ShopItem(`§5End Brick`, 65, "minecraft:end_stone_bricks", 64, "textures/blocks/end_bricks", false, false, false, [], 1000),
        new ShopItem(`§8Slate Brick`, 45, "minecraft:deepslate_bricks", 64, "textures/blocks/deepslate_bricks", false, false, false, [], 1000),
        new ShopItem(`§8Slate Tiles`, 50, "minecraft:deepslate_tiles", 64, "textures/blocks/deepslate_tiles", false, false, false, [], 1000),
        new ShopItem(`§7Stone Brick`, 30, "minecraft:stone_bricks", 64, "textures/blocks/stonebrick", false, false, false, [], 1000),
        new ShopItem(`§7Mossy Brick`, 32, "minecraft:mossy_stone_bricks", 64, "textures/blocks/stonebrick_mossy", false, false, false, [], 1000),
        new ShopItem(`§7Cracked Brick`, 28, "minecraft:cracked_stone_bricks", 64, "textures/blocks/stonebrick_cracked", false, false, false, [], 1000),
        new ShopItem(`§7Chiseled Brick`, 35, "minecraft:chiseled_stone_bricks", 64, "textures/blocks/stonebrick_carved", false, false, false, [], 1000),
        new ShopItem(`§cMud Brick`, 25, "minecraft:mud_bricks", 64, "textures/blocks/mud_bricks", false, false, false, [], 1000)
      ]),
      new ShopItem(`§5Purpur`, 50, "minecraft:purpur_block", 64, "textures/blocks/purpur_block", false, false, false, [], 1000),
      new ShopItem(`§3Prismarine`, 45, "minecraft:prismarine", 64, "textures/blocks/prismarine_rough", false, false, false, [], 1000),
      new ShopItem(`§0Obsidian`, 100, "minecraft:obsidian", 64, "textures/blocks/obsidian", false, false, false, [], 500),
      new ShopItem(`§5Weeping Obsidian`, 150, "minecraft:crying_obsidian", 64, "textures/blocks/crying_obsidian", false, false, false, [], 500),
      new ShopItem(`§fOre Block`, 360, "mineral_block_group", 64, "textures/blocks/iron_block", false, false, true, [
        new ShopItem(`§7Iron Block`, 360, "minecraft:iron_block", 64, "textures/blocks/iron_block", false, false, false, [], 500),
        new ShopItem(`§6Gold Block`, 720, "minecraft:gold_block", 64, "textures/blocks/gold_block", false, false, false, [], 500),
        new ShopItem(`§bDiamond Block`, 900, "minecraft:diamond_block", 64, "textures/blocks/diamond_block", false, false, false, [], 500),
        new ShopItem(`§aEmerald Block`, 1350, "minecraft:emerald_block", 64, "textures/blocks/emerald_block", false, false, false, [], 500),
        new ShopItem(`§8Netherite Block`, 9000, "minecraft:netherite_block", 4, "textures/blocks/netherite_block", false, false, false, [], 100),
        new ShopItem(`§1Lapis Lazuli Block`, 225, "minecraft:lapis_block", 64, "textures/blocks/lapis_block", false, false, false, [], 500),
        new ShopItem(`§cRedstone Block`, 180, "minecraft:redstone_block", 64, "textures/blocks/redstone_block", false, false, false, [], 500),
        new ShopItem(`§bCopper Block`, 180, "minecraft:copper_block", 64, "textures/blocks/copper_block", false, false, false, [], 500),
        new ShopItem(`§fQuartz Block`, 270, "minecraft:quartz_block", 64, "textures/blocks/quartz_block_side", false, false, false, [], 500),
        new ShopItem(`§0Carbon Block`, 72, "minecraft:coal_block", 64, "textures/blocks/coal_block", false, false, false, [], 500),
        new ShopItem(`§5Amethyst Block`, 1080, "minecraft:amethyst_block", 64, "textures/blocks/amethyst_block", false, false, false, [], 500)
      ]),
      new ShopItem(`§6Terracotta`, 18, "terracotta_group", 64, "textures/blocks/hardened_clay", false, false, true, [
        new ShopItem(`§6Terracotta`, 18, "minecraft:terracotta", 64, "textures/blocks/hardened_clay", false, false, false, [], 1000),
        new ShopItem(`§fWhite Terracotta`, 20, "minecraft:white_terracotta", 64, "textures/blocks/hardened_clay_stained_white", false, false, false, [], 1000),
        new ShopItem(`§7Light Gray Terracotta`, 20, "minecraft:light_gray_terracotta", 64, "textures/blocks/hardened_clay_stained_silver", false, false, false, [], 1000),
        new ShopItem(`§8Gray Terracotta`, 20, "minecraft:gray_terracotta", 64, "textures/blocks/hardened_clay_stained_gray", false, false, false, [], 1000),
        new ShopItem(`§0Black Terracotta`, 20, "minecraft:black_terracota", 64, "textures/blocks/hardened_clay_stained_black", false, false, false, [], 1000),
        new ShopItem(`§6Terracotta Coffee`, 20, "minecraft:brown_terracotta", 64, "textures/blocks/hardened_clay_stained_brown", false, false, false, [], 1000),
        new ShopItem(`§cRed Terracotta`, 20, "minecraft:red_terracotta", 64, "textures/blocks/hardened_clay_stained_red", false, false, false, [], 1000),
        new ShopItem(`§6Orange Terracotta`, 20, "minecraft:orange_terracotta", 64, "textures/blocks/hardened_clay_stained_orange", false, false, false, [], 1000),
        new ShopItem(`§eYellow Terracotta`, 20, "minecraft:yellow_terracotta", 64, "textures/blocks/hardened_clay_stained_yellow", false, false, false, [], 1000),
        new ShopItem(`§eLime Terracotta`, 20, "minecraft:lime_terracotta", 64, "textures/blocks/hardened_clay_stained_lime", false, false, false, [], 1000),
        new ShopItem(`§2Green Terracotta`, 20, "minecraft:green_terracotta", 64, "textures/blocks/hardened_clay_stained_green", false, false, false, [], 1000),
        new ShopItem(`§bCyan Terracotta`, 20, "minecraft:cyan_terracotta", 64, "textures/blocks/hardened_clay_stained_cyan", false, false, false, [], 1000),
        new ShopItem(`§9Light Blue Terracotta`, 20, "minecraft:light_blue_terracotta", 64, "textures/blocks/hardened_clay_stained_light_blue", false, false, false, [], 1000),
        new ShopItem(`§1Blue Terracotta`, 20, "minecraft:blue_terracotta", 64, "textures/blocks/hardened_clay_stained_blue", false, false, false, [], 1000),
        new ShopItem(`§5Purple Terracotta`, 20, "minecraft:purple_terracotta", 64, "textures/blocks/hardened_clay_stained_purple", false, false, false, [], 1000),
        new ShopItem(`§dMagenta Terracotta`, 20, "minecraft:magenta_terracotta", 64, "textures/blocks/hardened_clay_stained_magenta", false, false, false, [], 1000),
        new ShopItem(`§dPink Terracotta`, 20, "minecraft:pink_terracotta", 64, "textures/blocks/hardened_clay_stained_pink", false, false, false, [], 1000)
      ]),
      new ShopItem(`§5End Stone`, 55, "minecraft:end_stone", 64, "textures/blocks/end_stone", false, false, false, [], 1000),
      new ShopItem(`§fIce`, 15, "ice_group", 64, "textures/blocks/ice", false, false, true, [
        new ShopItem(`§fIce`, 15, "minecraft:ice", 64, "textures/blocks/ice", false, false, false, [], 1000),
        new ShopItem(`§bCompact Ice`, 25, "minecraft:packed_ice", 64, "textures/blocks/ice_packed", false, false, false, [], 1000),
        new ShopItem(`§bBlue Ice`, 40, "minecraft:blue_ice", 64, "textures/blocks/blue_ice", false, false, false, [], 1000),
        new ShopItem(`§fSnow Block`, 10, "minecraft:snow", 64, "textures/blocks/snow", false, false, false, [], 1000),
        new ShopItem(`§fSnow Layer`, 5, "minecraft:snow_layer", 64, "textures/blocks/snow", false, false, false, [], 1000)
      ]),
      new ShopItem(`§2Moss`, 12, "minecraft:moss_block", 64, "textures/blocks/moss_block", false, false, false, [], 1000)
    ];
    
    const weapons = [
      new ShopItem(`§fSword`, 300, "sword", 1, "textures/items/diamond_sword", false, true, false, [], 100),
      new ShopItem(`§fBattle Ax`, 250, "axe", 1, "textures/items/diamond_axe", false, true, false, [], 100),
      new ShopItem(`§fBow`, 100, "minecraft:bow", 1, "textures/items/bow_standby", false, false, false, [], 100),
      new ShopItem(`§7Crossbow`, 150, "minecraft:crossbow", 1, "textures/items/crossbow_standby", false, false, false, [], 100),
      new ShopItem(`§bTrident`, 400, "minecraft:trident", 1, "textures/items/trident", false, false, false, [], 50),
      new ShopItem(`§fArrows`, 1, "minecraft:arrow", 64, "textures/items/arrow", false, false, false, [], 500),
      new ShopItem(`§6Spectral Arrows`, 5, "minecraft:spectral_arrow", 64, "textures/items/arrow", false, false, false, [], 500)
    ];
    
    const tools_cat = [
      new ShopItem(`§fPickaxe`, 280, "pickaxe", 1, "textures/items/diamond_pickaxe", false, true, false, [], 100),
      new ShopItem(`§fShovel`, 220, "shovel", 1, "textures/items/diamond_shovel", false, true, false, [], 100),
      new ShopItem(`§fAxe`, 250, "axe", 1, "textures/items/diamond_axe", false, true, false, [], 100),
      new ShopItem(`§fHoe`, 200, "hoe", 1, "textures/items/diamond_hoe", false, true, false, [], 100),
      new ShopItem(`§eShears`, 50, "minecraft:shears", 1, "textures/items/shears", false, false, false, [], 100),
      new ShopItem(`§6Fishing rod`, 75, "minecraft:fishing_rod", 1, "textures/items/fishing_rod_uncast", false, false, false, [], 100),
      new ShopItem(`§cFlint and Steel`, 30, "minecraft:flint_and_steel", 1, "textures/items/flint_and_steel", false, false, false, [], 100),
      new ShopItem(`§aCompass`, 60, "minecraft:compass", 1, "textures/items/compass_item", false, false, false, [], 100),
      new ShopItem(`§fClock`, 80, "minecraft:clock", 1, "textures/items/clock_item", false, false, false, [], 100),
      new ShopItem(`§eSpyglass`, 100, "minecraft:spyglass", 1, "textures/items/spyglass", false, false, false, [], 100)
    ];
    
    const armor_cat = [
      new ShopItem(`§fHelmet`, 250, "helmet", 1, "textures/items/diamond_helmet", false, true, false, [], 100),
      new ShopItem(`§fChestplate`, 400, "chestplate", 1, "textures/items/diamond_chestplate", false, true, false, [], 100),
      new ShopItem(`§fPants`, 350, "leggings", 1, "textures/items/diamond_leggings", false, true, false, [], 100),
      new ShopItem(`§fBoots`, 200, "boots", 1, "textures/items/diamond_boots", false, true, false, [], 100),
      new ShopItem(`§fShield`, 80, "minecraft:shield", 1, "textures/items/shield", false, false, false, [], 100),
      new ShopItem(`§5Elytra`, 3500, "minecraft:elytra", 1, "textures/items/elytra", true, false, false, [], 20)
    ];
    
    const food_cat = [
      new ShopItem(`§cApple`, 10, "minecraft:apple", 64, "textures/items/apple", false, false, false, [], 500),
      new ShopItem(`§6Bread`, 15, "minecraft:bread", 64, "textures/items/bread", false, false, false, [], 500),
      new ShopItem(`§cCooked Meat`, 25, "minecraft:cooked_beef", 64, "textures/items/beef_cooked", false, false, false, [], 500),
      new ShopItem(`§eCooked Pork`, 25, "minecraft:cooked_porkchop", 64, "textures/items/porkchop_cooked", false, false, false, [], 500),
      new ShopItem(`§6Cooked Chicken`, 20, "minecraft:cooked_chicken", 64, "textures/items/chicken_cooked", false, false, false, [], 500),
      new ShopItem(`§bCooked Cod`, 22, "minecraft:cooked_cod", 64, "textures/items/fish_cooked", false, false, false, [], 500),
      new ShopItem(`§dCooked Salmon`, 22, "minecraft:cooked_salmon", 64, "textures/items/fish_salmon_cooked", false, false, false, [], 500),
      new ShopItem(`§6Golden Carrot`, 80, "minecraft:golden_carrot", 64, "textures/items/carrot_golden", true, false, false, [], 500),
      new ShopItem(`§6Golden Apple`, 200, "minecraft:golden_apple", 16, "textures/items/apple_golden", true, false, false, [], 200),
      new ShopItem(`§5Enchanted Apple`, 1500, "minecraft:enchanted_golden_apple", 1, "textures/items/apple_golden", true, false, false, [], 50),
      new ShopItem(`§dChorus`, 35, "minecraft:chorus_fruit", 64, "textures/items/chorus_fruit", false, false, false, [], 500),
      new ShopItem(`§eCake`, 100, "minecraft:cake", 16, "textures/items/cake", false, false, false, [], 200),
      new ShopItem(`§cWatermelon`, 12, "minecraft:melon_slice", 64, "textures/items/melon", false, false, false, [], 500),
      new ShopItem(`§6Cookies`, 8, "minecraft:cookie", 64, "textures/items/cookie", false, false, false, [], 500),
      new ShopItem(`§6Carrot`, 8, "minecraft:carrot", 64, "textures/items/carrot", false, false, false, [], 500),
      new ShopItem(`§ePotato`, 8, "minecraft:potato", 64, "textures/items/potato", false, false, false, [], 500),
      new ShopItem(`§eBaked Potato`, 12, "minecraft:baked_potato", 64, "textures/items/potato_baked", false, false, false, [], 500),
      new ShopItem(`§cBeetroot`, 10, "minecraft:beetroot", 64, "textures/items/beetroot", false, false, false, [], 500),
      new ShopItem(`§cBorscht`, 30, "minecraft:beetroot_soup", 16, "textures/items/beetroot_soup", false, false, false, [], 200),
      new ShopItem(`§cRabbit stew`, 35, "minecraft:rabbit_stew", 16, "textures/items/rabbit_stew", false, false, false, [], 200),
      new ShopItem(`§eMushroom Soup`, 25, "minecraft:mushroom_stew", 16, "textures/items/mushroom_stew", false, false, false, [], 200),
      new ShopItem(`§6Pie Pumpkin`, 40, "minecraft:pumpkin_pie", 64, "textures/items/pumpkin_pie", false, false, false, [], 500),
      new ShopItem(`§eSweet Berries`, 15, "minecraft:sweet_berries", 64, "textures/items/sweet_berries", false, false, false, [], 500),
      new ShopItem(`§5Luminous Berries`, 20, "minecraft:glow_berries", 64, "textures/items/glow_berries", false, false, false, [], 500),
      new ShopItem(`§6Honey`, 45, "minecraft:honey_bottle", 16, "textures/items/honey_bottle", false, false, false, [], 200)
    ];
    
    const potions_cat = [
      new ShopItem(`§dEnder's Pearl`, 75, "minecraft:ender_pearl", 16, "textures/items/ender_pearl", false, false, false, [], 300),
      new ShopItem(`§aEye of Ender`, 150, "minecraft:ender_eye", 16, "textures/items/ender_eye", true, false, false, [], 300),
      new ShopItem(`§bImmortality Totem`, 500, "minecraft:totem_of_undying", 4, "textures/items/totem", true, false, false, [], 100),
      new ShopItem(`§5Blaze Rod`, 90, "minecraft:blaze_rod", 64, "textures/items/blaze_rod", false, false, false, [], 300),
      new ShopItem(`§ePhantom membrane`, 85, "minecraft:phantom_membrane", 64, "textures/items/phantom_membrane", false, false, false, [], 300),
      new ShopItem(`§fShulker's Pearl`, 120, "minecraft:shulker_shell", 16, "textures/items/shulker_shell", false, false, false, [], 200),
      new ShopItem(`§aSlime`, 30, "minecraft:slime_ball", 64, "textures/items/slimeball", false, false, false, [], 300),
      new ShopItem(`§6Blaze Dust`, 45, "minecraft:blaze_powder", 64, "textures/items/blaze_powder", false, false, false, [], 300),
      new ShopItem(`§5Ghast's Tear`, 110, "minecraft:ghast_tear", 64, "textures/items/ghast_tear", false, false, false, [], 300),
      new ShopItem(`§bCrystal of the End`, 200, "minecraft:end_crystal", 4, "textures/items/end_crystal", false, false, false, [], 100),
      new ShopItem(`§6Bottle of Experience`, 50, "minecraft:experience_bottle", 64, "textures/items/experience_bottle", false, false, false, [], 300),
      new ShopItem(`§fNautilus pearl`, 140, "minecraft:nautilus_shell", 16, "textures/items/nautilus_shell", false, false, false, [], 200),
      new ShopItem(`§aSpider Eye`, 15, "minecraft:spider_eye", 64, "textures/items/spider_eye", false, false, false, [], 300),
      new ShopItem(`§6Fermented Spider Eye`, 25, "minecraft:fermented_spider_eye", 64, "textures/items/spider_eye_fermented", false, false, false, [], 300),
      new ShopItem(`§5Magma Cream`, 40, "minecraft:magma_cream", 64, "textures/items/magma_cream", false, false, false, [], 300),
      new ShopItem(`§eNether Wart`, 35, "minecraft:nether_wart", 64, "textures/items/nether_wart", false, false, false, [], 300),
      new ShopItem(`§fSugar`, 10, "minecraft:sugar", 64, "textures/items/sugar", false, false, false, [], 500),
      new ShopItem(`§6Luminous Stone Powder`, 30, "minecraft:glowstone_dust", 64, "textures/items/glowstone_dust", false, false, false, [], 300),
      new ShopItem(`§bShining Stone Dust`, 35, "minecraft:glow_ink_sac", 64, "textures/items/glow_ink_sac", false, false, false, [], 300),
      new ShopItem(`§0Ink bag`, 12, "minecraft:ink_sac", 64, "textures/items/ink_sac", false, false, false, [], 300)
    ];
    
    const redstone = [
      new ShopItem(`§cRedstone Dust`, 20, "minecraft:redstone", 64, "textures/items/redstone_dust", false, false, false, [], 500),
      new ShopItem(`§6Repeater`, 30, "minecraft:repeater", 64, "textures/items/repeater", false, false, false, [], 500),
      new ShopItem(`§6Comparator`, 35, "minecraft:comparator", 64, "textures/items/comparator", false, false, false, [], 500),
      new ShopItem(`§cRedstone Torch`, 15, "minecraft:redstone_torch", 64, "textures/blocks/redstone_torch_on", false, false, false, [], 500),
      new ShopItem(`§7Piston`, 40, "minecraft:piston", 64, "textures/blocks/piston_top_normal", false, false, false, [], 500),
      new ShopItem(`§7Sticky Piston`, 50, "minecraft:sticky_piston", 64, "textures/blocks/piston_top_sticky", false, false, false, [], 500),
      new ShopItem(`§cTNT`, 100, "minecraft:tnt", 64, "textures/blocks/tnt_side", false, false, false, [], 500),
      new ShopItem(`§7Hopper`, 60, "minecraft:hopper", 64, "textures/items/hopper", false, false, false, [], 500),
      new ShopItem(`§7Dispenser`, 45, "minecraft:dispenser", 64, "textures/blocks/dispenser_front_horizontal", false, false, false, [], 500),
      new ShopItem(`§7Dropper`, 40, "minecraft:dropper", 64, "textures/blocks/dropper_front_horizontal", false, false, false, [], 500),
      new ShopItem(`§eObserver`, 55, "minecraft:observer", 64, "textures/blocks/observer_front", false, false, false, [], 500),
      new ShopItem(`§cRedstone Lamp`, 35, "minecraft:redstone_lamp", 64, "textures/blocks/redstone_lamp_off", false, false, false, [], 500),
      new ShopItem(`§7Redstone Block`, 90, "minecraft:redstone_block", 64, "textures/blocks/redstone_block", false, false, false, [], 500),
      new ShopItem(`§6Lever`, 10, "minecraft:lever", 64, "textures/blocks/lever", false, false, false, [], 500),
      new ShopItem(`§7Stone Button`, 8, "minecraft:stone_button", 64, "textures/blocks/stone", false, false, false, [], 500),
      new ShopItem(`§6Pressure Plate`, 12, "minecraft:stone_pressure_plate", 64, "textures/blocks/stone", false, false, false, [], 500),
      new ShopItem(`§eSensor Day`, 50, "minecraft:daylight_detector", 16, "textures/blocks/daylight_detector_top", false, false, false, [], 200),
      new ShopItem(`§7Tripwire Hook`, 25, "minecraft:tripwire_hook", 64, "textures/blocks/trip_wire_source", false, false, false, [], 500),
      new ShopItem(`§cTarget`, 65, "minecraft:target", 32, "textures/blocks/target_side", false, false, false, [], 300)
    ];
    
    const decoration = [
      new ShopItem(`§fWools`, 15, "wool_group", 64, "textures/blocks/wool_colored_white", false, false, true, [
        new ShopItem(`§fWhite Wool`, 15, "minecraft:white_wool", 64, "textures/blocks/wool_colored_white", false, false, false, [], 500),
        new ShopItem(`§cRed Wool`, 15, "minecraft:red_wool", 64, "textures/blocks/wool_colored_red", false, false, false, [], 500),
        new ShopItem(`§1Blue Wool`, 15, "minecraft:blue_wool", 64, "textures/blocks/wool_colored_blue", false, false, false, [], 500),
        new ShopItem(`§2Green Wool`, 15, "minecraft:green_wool", 64, "textures/blocks/wool_colored_green", false, false, false, [], 500),
        new ShopItem(`§6Orange Wool`, 15, "minecraft:orange_wool", 64, "textures/blocks/wool_colored_orange", false, false, false, [], 500),
        new ShopItem(`§5Purple Wool`, 15, "minecraft:purple_wool", 64, "textures/blocks/wool_colored_purple", false, false, false, [], 500),
        new ShopItem(`§0Black Wool`, 15, "minecraft:black_wool", 64, "textures/blocks/wool_colored_black", false, false, false, [], 500),
        new ShopItem(`§eYellow Wool`, 15, "minecraft:yellow_wool", 64, "textures/blocks/wool_colored_yellow", false, false, false, [], 500),
        new ShopItem(`§7Gray Wool`, 15, "minecraft:gray_wool", 64, "textures/blocks/wool_colored_gray", false, false, false, [], 500),
        new ShopItem(`§7Light Gray Wool`, 15, "minecraft:light_gray_wool", 64, "textures/blocks/wool_colored_silver", false, false, false, [], 500),
        new ShopItem(`§3Cyan Wool`, 15, "minecraft:cyan_wool", 64, "textures/blocks/wool_colored_cyan", false, false, false, [], 500),
        new ShopItem(`§5Magenta Wool`, 15, "minecraft:magenta_wool", 64, "textures/blocks/wool_colored_magenta", false, false, false, [], 500),
        new ShopItem(`§9Light Blue Wool`, 15, "minecraft:light_blue_wool", 64, "textures/blocks/wool_colored_light_blue", false, false, false, [], 500),
        new ShopItem(`§eLime Wool`, 15, "minecraft:lime_wool", 64, "textures/blocks/wool_colored_lime", false, false, false, [], 500),
        new ShopItem(`§cPink Wool`, 15, "minecraft:pink_wool", 64, "textures/blocks/wool_colored_pink", false, false, false, [], 500),
        new ShopItem(`§6Brown Wool`, 15, "minecraft:brown_wool", 64, "textures/blocks/wool_colored_brown", false, false, false, [], 500)
      ]),
      new ShopItem(`§cFlowers`, 8, "flower_group", 64, "textures/blocks/flower_rose", false, false, true, [
        new ShopItem(`§eDandelion`, 8, "minecraft:dandelion", 64, "textures/blocks/flower_dandelion", false, false, false, [], 500),
        new ShopItem(`§cPoppy`, 8, "minecraft:poppy", 64, "textures/blocks/flower_rose", false, false, false, [], 500),
        new ShopItem(`§9Blue Orchid`, 8, "minecraft:blue_orchid", 64, "textures/blocks/flower_blue_orchid", false, false, false, [], 500),
        new ShopItem(`§7Allium`, 8, "minecraft:allium", 64, "textures/blocks/flower_allium", false, false, false, [], 500),
        new ShopItem(`§cRed Tulip`, 8, "minecraft:red_tulip", 64, "textures/blocks/flower_tulip_red", false, false, false, [], 500),
        new ShopItem(`§6Orange Tulip`, 8, "minecraft:orange_tulip", 64, "textures/blocks/flower_tulip_orange", false, false, false, [], 500),
        new ShopItem(`§fWhite Tulip`, 8, "minecraft:white_tulip", 64, "textures/blocks/flower_tulip_white", false, false, false, [], 500),
        new ShopItem(`§dPink Tulip`, 8, "minecraft:pink_tulip", 64, "textures/blocks/flower_tulip_pink", false, false, false, [], 500),
        new ShopItem(`§fOxeye Daisy`, 8, "minecraft:oxeye_daisy", 64, "textures/blocks/flower_oxeye_daisy", false, false, false, [], 500),
        new ShopItem(`§eCornflower`, 8, "minecraft:cornflower", 64, "textures/blocks/flower_cornflower", false, false, false, [], 500),
        new ShopItem(`§fLily of the Valley`, 8, "minecraft:lily_of_the_valley", 64, "textures/blocks/flower_lily_of_the_valley", false, false, false, [], 500),
        new ShopItem(`§5Withered Orchid`, 8, "minecraft:wither_rose", 64, "textures/blocks/flower_wither_rose", false, false, false, [], 500),
        new ShopItem(`§6Sunflower`, 10, "minecraft:sunflower", 64, "textures/blocks/double_plant_sunflower_front", false, false, false, [], 500),
        new ShopItem(`§5Lilac`, 10, "minecraft:lilac", 64, "textures/blocks/double_plant_syringa_front", false, false, false, [], 500),
        new ShopItem(`§2High Pink`, 10, "minecraft:rose_bush", 64, "textures/blocks/double_plant_rose_front", false, false, false, [], 500),
        new ShopItem(`§dPeony`, 10, "minecraft:peony", 64, "textures/blocks/double_plant_paeonia_front", false, false, false, [], 500),
        new ShopItem(`§6Torch Flower`, 12, "minecraft:torchflower", 64, "textures/blocks/torchflower", false, false, false, [], 500)
      ]),
      new ShopItem(`§ePainting`, 25, "minecraft:painting", 16, "textures/items/painting", false, false, false, [], 200),
      new ShopItem(`§6Frame`, 20, "minecraft:frame", 64, "textures/items/item_frame", false, false, false, [], 300),
      new ShopItem(`§aBright Frame`, 40, "minecraft:glow_frame", 64, "textures/items/glow_item_frame", false, false, false, [], 300),
      new ShopItem(`§eArmor Support`, 50, "minecraft:armor_stand", 16, "textures/items/armor_stand", false, false, false, [], 200),
      new ShopItem(`§dBell`, 35, "minecraft:bell", 16, "textures/items/bell", false, false, false, [], 200),
      new ShopItem(`§bChoir Flower`, 45, "minecraft:chorus_flower", 64, "textures/blocks/chorus_flower", false, false, false, [], 300),
      new ShopItem(`§6Sea Lamp`, 55, "minecraft:sea_lantern", 64, "textures/blocks/sea_lantern", false, false, false, [], 300),
      new ShopItem(`§eLuminous Stone`, 40, "minecraft:glowstone", 64, "textures/blocks/glowstone", false, false, false, [], 300),
      new ShopItem(`§5Purple Rod`, 30, "minecraft:purpur_pillar", 64, "textures/blocks/purpur_pillar", false, false, false, [], 500),
      new ShopItem(`§6Bookshelf`, 30, "minecraft:bookshelf", 64, "textures/blocks/bookshelf", false, false, false, [], 300),
      new ShopItem(`§7Anvil`, 150, "minecraft:anvil", 8, "textures/blocks/anvil_base", false, false, false, [], 100),
      new ShopItem(`§5Charms Table`, 200, "minecraft:enchanting_table", 4, "textures/blocks/enchanting_table_side", false, false, false, [], 50),
      new ShopItem(`§eLight Beacons`, 45, "minecraft:chain", 64, "textures/items/chain", false, false, false, [], 300),
      new ShopItem(`§6Barrel`, 35, "minecraft:barrel", 64, "textures/blocks/barrel_side", false, false, false, [], 300),
      new ShopItem(`§7Smoker`, 40, "minecraft:smoker", 16, "textures/blocks/smoker_front_off", false, false, false, [], 200),
      new ShopItem(`§6Blast furnace`, 45, "minecraft:blast_furnace", 16, "textures/blocks/blast_furnace_front_off", false, false, false, [], 200)
    ];
    
    const farming = [
      new ShopItem(`§aWheat Seeds`, 5, "minecraft:wheat_seeds", 64, "textures/items/wheat_seeds", false, false, false, [], 500),
      new ShopItem(`§6Carrot`, 8, "minecraft:carrot", 64, "textures/items/carrot", false, false, false, [], 500),
      new ShopItem(`§ePotato`, 8, "minecraft:potato", 64, "textures/items/potato", false, false, false, [], 500),
      new ShopItem(`§cBeetroot Seeds`, 10, "minecraft:beetroot_seeds", 64, "textures/items/beetroot_seeds", false, false, false, [], 500),
      new ShopItem(`§2Melon Seeds`, 12, "minecraft:melon_seeds", 64, "textures/items/melon_seeds", false, false, false, [], 500),
      new ShopItem(`§6Pumpkin Seeds`, 12, "minecraft:pumpkin_seeds", 64, "textures/items/pumpkin_seeds", false, false, false, [], 500),
      new ShopItem(`§3Sugarcane`, 15, "minecraft:reeds", 64, "textures/blocks/reeds", false, false, false, [], 500),
      new ShopItem(`§2Cactus`, 10, "minecraft:cactus", 64, "textures/blocks/cactus_side", false, false, false, [], 500),
      new ShopItem(`§6Bamboo`, 8, "minecraft:bamboo", 64, "textures/blocks/bamboo_stalk", false, false, false, [], 500),
      new ShopItem(`§aCocoa beans`, 15, "minecraft:cocoa_beans", 64, "textures/items/cocoa_beans", false, false, false, [], 500),
      new ShopItem(`§2Kelp`, 12, "minecraft:kelp", 64, "textures/blocks/kelp_a", false, false, false, [], 500),
      new ShopItem(`§aVines`, 10, "minecraft:vine", 64, "textures/blocks/vine", false, false, false, [], 500),
      new ShopItem(`§eSweet Berries`, 15, "minecraft:sweet_berries", 64, "textures/items/sweet_berries", false, false, false, [], 500),
      new ShopItem(`§5Luminous Berries`, 20, "minecraft:glow_berries", 64, "textures/items/glow_berries", false, false, false, [], 500),
      new ShopItem(`§cRed Mushroom`, 12, "minecraft:red_mushroom", 64, "textures/blocks/mushroom_red", false, false, false, [], 500),
      new ShopItem(`§eBrown Mushroom`, 12, "minecraft:brown_mushroom", 64, "textures/blocks/mushroom_brown", false, false, false, [], 500),
      new ShopItem(`§eBone`, 10, "minecraft:bone", 64, "textures/items/bone", false, false, false, [], 500),
      new ShopItem(`§fBone Meal`, 15, "minecraft:bone_meal", 64, "textures/items/dye_powder_white", false, false, false, [], 500),
      new ShopItem(`§6Compost`, 12, "minecraft:compost", 16, "textures/blocks/composter_side", false, false, false, [], 200),
      new ShopItem(`§aLuminous Pear`, 18, "minecraft:torchflower_seeds", 64, "textures/items/torchflower_seeds", false, false, false, [], 500)
    ];
    
    const special_cat = [
      new ShopItem(`§dDragon Egg`, 10000, "minecraft:dragon_egg", 1, "textures/blocks/dragon_egg", true, false, false, [], 10),
      new ShopItem(`§5Elytra`, 3500, "minecraft:elytra", 1, "textures/items/elytra", true, false, false, [], 20),
      new ShopItem(`§aBeacon`, 2500, "minecraft:beacon", 1, "textures/blocks/beacon", true, false, false, [], 30),
      new ShopItem(`§6Sponge`, 250, "minecraft:sponge", 64, "textures/blocks/sponge", false, false, false, [], 200),
      new ShopItem(`§eWet Sponge`, 300, "minecraft:sponge", 64, "textures/blocks/sponge_wet", false, false, false, [], 200),
      new ShopItem(`§bCreeper head`, 500, "minecraft: should", 1, "textures/blocks/mob_spawner", false, false, false, [], 50),
      new ShopItem(`§5Shulker Box`, 400, "minecraft:shulker_box", 1, "textures/blocks/shulker_top_undyed", false, false, false, [], 100),
      new ShopItem(`§6Heart of the Sea`, 1000, "minecraft:heart_of_the_sea", 1, "textures/items/heartofthesea_closed", true, false, false, [], 50),
      new ShopItem(`§bConduit`, 1500, "minecraft:conduit", 1, "textures/items/conduit", true, false, false, [], 30),
      new ShopItem(`§dSculk's Catalyst`, 800, "minecraft:sculk_catalyst", 16, "textures/blocks/sculk_catalyst_side", true, false, false, [], 100),
      new ShopItem(`§3Goat Horn`, 600, "minecraft:goat_horn", 8, "textures/items/goat_horn", true, false, false, [], 100),
      new ShopItem(`§5Amethyst Crystal`, 350, "minecraft:amethyst_cluster", 32, "textures/blocks/amethyst_cluster", false, false, false, [], 200),
      new ShopItem(`§dAmethyst Geode`, 500, "minecraft:budding_amethyst", 16, "textures/blocks/budding_amethyst", false, false, false, [], 100),
      new ShopItem(`§0Carbon Block`, 72, "minecraft:coal_block", 64, "textures/blocks/coal_block", false, false, false, [], 500),
      new ShopItem(`§6Honey`, 45, "minecraft:honey_bottle", 16, "textures/items/honey_bottle", false, false, false, [], 300),
      new ShopItem(`§6Honey Block`, 180, "minecraft:honey_block", 64, "textures/blocks/honey_side", false, false, false, [], 300),
      new ShopItem(`§6Honeycomb`, 80, "minecraft:honeycomb_block", 64, "textures/blocks/honeycomb", false, false, false, [], 300)
    ];
    
    const transport = [
      new ShopItem(`§7Boats`, 40, "boat_group", 8, "textures/items/boat_oak", false, false, true, [
        new ShopItem(`§7Oak Boat`, 40, "minecraft:oak_boat", 8, "textures/items/boat_oak", false, false, false, [], 200),
        new ShopItem(`§7Fir Boat`, 40, "minecraft:spruce_boat", 8, "textures/items/boat_spruce", false, false, false, [], 200),
        new ShopItem(`§7Birch Boat`, 40, "minecraft:birch_boat", 8, "textures/items/boat_birch", false, false, false, [], 200),
        new ShopItem(`§7Jungle Boat`, 40, "minecraft:jungle_boat", 8, "textures/items/boat_jungle", false, false, false, [], 200),
        new ShopItem(`§7Acacia boat`, 40, "minecraft:acacia_boat", 8, "textures/items/boat_acacia", false, false, false, [], 200),
        new ShopItem(`§7Dark Oak Boat`, 40, "minecraft:dark_oak_boat", 8, "textures/items/boat_darkoak", false, false, false, [], 200),
        new ShopItem(`§7Mangrove Boat`, 40, "minecraft:mangrove_boat", 8, "textures/items/boat_mangrove", false, false, false, [], 200),
        new ShopItem(`§7Bamboo Boat`, 40, "minecraft:bamboo_raft", 8, "textures/items/bamboo_raft", false, false, false, [], 200)
      ]),
      new ShopItem(`§7Minecarts`, 60, "minecart_group", 16, "textures/items/minecart_normal", false, false, true, [
        new ShopItem(`§7Minecart`, 60, "minecraft:minecart", 16, "textures/items/minecart_normal", false, false, false, [], 200),
        new ShopItem(`§6Wagon with Chest`, 80, "minecraft:chest_minecart", 8, "textures/items/minecart_chest", false, false, false, [], 200),
        new ShopItem(`§cWagon with TNT`, 100, "minecraft:tnt_minecart", 8, "textures/items/minecart_tnt", false, false, false, [], 200),
        new ShopItem(`§7Wagon with Hopper`, 90, "minecraft:hopper_minecart", 8, "textures/items/minecart_hopper", false, false, false, [], 200),
        new ShopItem(`§5Wagon with Oven`, 85, "minecraft:furnace_minecart", 8, "textures/items/minecart_furnace", false, false, false, [], 200)
      ]),
      new ShopItem(`§7Rails`, 15, "rail_group", 64, "textures/blocks/rail_normal", false, false, true, [
        new ShopItem(`§7Normal Rails`, 15, "minecraft:rail", 64, "textures/blocks/rail_normal", false, false, false, [], 500),
        new ShopItem(`§6Motorized Rails`, 25, "minecraft:golden_rail", 64, "textures/blocks/rail_golden", false, false, false, [], 500),
        new ShopItem(`§cDetector Rails`, 30, "minecraft:detector_rail", 64, "textures/blocks/rail_detector", false, false, false, [], 500),
        new ShopItem(`§7Activator Rails`, 30, "minecraft:activator_rail", 64, "textures/blocks/rail_activator", false, false, false, [], 500)
      ]),
      new ShopItem(`§7Horse Armor`, 150, "horse_armor_group", 4, "textures/items/horse_armor_iron", false, false, true, [
        new ShopItem(`§6Horse Armor (Gold)`, 200, "minecraft:golden_horse_armor", 4, "textures/items/horse_armor_gold", false, false, false, [], 100),
        new ShopItem(`§7Horse Armor (Iron)`, 150, "minecraft:iron_horse_armor", 4, "textures/items/horse_armor_iron", false, false, false, [], 100),
        new ShopItem(`§bHorse Armor (Diamond)`, 300, "minecraft:diamond_horse_armor", 4, "textures/items/horse_armor_diamond", false, false, false, [], 100)
      ]),
      new ShopItem(`§aSaddle`, 150, "minecraft:saddle", 4, "textures/items/saddle", false, false, false, [], 100),
      new ShopItem(`§6Carrot with stick`, 80, "minecraft:carrot_on_a_stick", 4, "textures/items/carrot_on_a_stick", false, false, false, [], 200),
      new ShopItem(`§cDistorted Mushroom with Stick`, 100, "minecraft:warped_fungus_on_a_stick", 4, "textures/items/warped_fungus_on_a_stick", false, false, false, [], 200)
    ];
    
    valuables.forEach(item => shop.addItem("Valuables", item));
    blocks.forEach(item => shop.addItem("Blocks", item));
    weapons.forEach(item => shop.addItem("Weapons", item));
    tools_cat.forEach(item => shop.addItem("Tools", item));
    armor_cat.forEach(item => shop.addItem("Armor", item));
    food_cat.forEach(item => shop.addItem("Food", item));
    potions_cat.forEach(item => shop.addItem("Potions", item));
    redstone.forEach(item => shop.addItem("Redstone", item));
    decoration.forEach(item => shop.addItem("Decoration", item));
    farming.forEach(item => shop.addItem("Farming", item));
    special_cat.forEach(item => shop.addItem("Special", item));
    transport.forEach(item => shop.addItem("Transport", item));
    
    StockManager.saveToStorage();
    
    return shop;
  }
}

class MaterialData {
  static getMaterialsForType(itemType) {
    if (ITEM_TYPES.TOOLS.includes(itemType)) {
      return this.processMaterials(MATERIALS.tools, itemType);
    } else if (ITEM_TYPES.ARMOR.includes(itemType)) {
      return this.processMaterials(MATERIALS.armor, itemType);
    } else if (itemType === "log" || itemType === "planks") {
      return this.processWoodMaterials(itemType);
    } else if (itemType === "stone_variants") {
      return MATERIALS.stone;
    } else if (itemType === "mineral_blocks") {
      return MATERIALS.mineral_blocks;
    }
    return [];
  }

  static processMaterials(materials, itemType) {
    return materials.map(mat => ({
      ...mat,
      texture: `textures/items/${mat.id}_${itemType}`,
      itemId: `minecraft:${mat.id}_${itemType}`
    }));
  }

  static processWoodMaterials(itemType) {
    return MATERIALS.wood.map(mat => {
      const textureType = itemType === "log" ? 
        (mat.id === "dark_oak" ? "log_big_oak" : mat.id === "mangrove" ? "mangrove_log_side" : mat.id === "cherry" ? "cherry_log_side" : `log_${mat.id}`) :
        (mat.id === "dark_oak" ? "planks_big_oak" : mat.id === "mangrove" ? "mangrove_planks" : mat.id === "cherry" ? "cherry_planks" : `planks_${mat.id}`);
      
      return {
        ...mat,
        texture: `textures/blocks/${textureType}`,
        itemId: `minecraft:${mat.id}_${itemType}`
      };
    });
  }
}

system.runTimeout(() => {
  StockManager.initialize();
  
  system.runInterval(() => {
    StockManager.saveToStorage();
  }, STOCK_CONFIG.AUTO_SAVE_INTERVAL); 
  
}, 20);

world.afterEvents.itemUse.subscribe((data) => {
  if (data.itemStack.typeId === SHOP_ITEM) {
    const shop = ShopConfig.createShop();
    shop.openShop(data.source);
  }
});
