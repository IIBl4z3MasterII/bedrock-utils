/* 

██████╗ ██╗██╗  ██╗███████╗██████╗     ███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗ 
██╔══██╗██║██║  ██║╚══███╔╝╚════██╗    ████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗
██████╔╝██║███████║  ███╔╝  █████╔╝    ██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝
██╔══██╗██║╚════██║ ███╔╝   ╚═══██╗    ██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗
██████╔╝███████╗██║███████╗██████╔╝    ██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║
╚═════╝ ╚══════╝╚═╝╚══════╝╚═════╝     ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
                                                                                           
          Main •  By: @bl4z3master
*/

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
} from './shop_config.js';

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
      return `${this.name}\n§7Ver variantes disponibles`;
    }
    
    const currentTime = Date.now();
    if (this._cachedDisplayText && currentTime - this._lastStockCheck < 1000) {
      return this._cachedDisplayText;
    }
    
    const stock = StockManager.getStock(this.uniqueId);
    const stockColor = stock > 10 ? "§a" : stock > 0 ? "§e" : "§c";
    this._cachedDisplayText = `${this.name}\n§7Precio: §6${this.price} §eCoins §7x1\n${stockColor}Stock: ${stock}/${this.maxStock}`;
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
    player.sendMessage(`§7Necesitas §6${needed} §eCoins §7más`);
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
  constructor(title = "§6§lTIENDA", description = "§7Selecciona una categoría") {
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
    
    form.title(UIManager.createTitle("§6§lTIENDA - ENTRADA", coins));
    
    form.button(`${UI_CONFIG.CATEGORY_PREFIX}§a§lENTRAR A LA TIENDA\n§7Ver categorías y comprar items`);
    
    const allItems = this.getAllItems();
    const stockParts = ["§e§l━━━━━━━ STOCKS DISPONIBLES ━━━━━━━\n\n"];
    
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
      `§a§lPróximo reinicio en: ${StockManager.formatTime(timeUntilReset)}\n`,
      `§7Los stocks se reinician cada 30 minutos`
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
    
    form.button(`${UI_CONFIG.CATEGORY_PREFIX}§c§lVOLVER A LA TIENDA\n§7Regresar al menú principal`);
    
    form.body(UIManager.createBody(1, `§7Selecciona una variante de §f${groupItem.name}`));
    
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
    form.button(`${UI_CONFIG.CATEGORY_PREFIX}§c§lVOLVER A LA TIENDA\n§7Regresar al menú principal`);
    
    materials.forEach(mat => {
      form.button(`${UI_CONFIG.CATEGORY_PREFIX}§8 ${mat.name}`);
    });
    
    form.body(UIManager.createBody(materials.length + 1, `§7Selecciona el material para tu §f${item.name}`));
    
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
        UIManager.showInsufficientStock(player, `${item.name} de ${material.name}`);
      } else {
        UIManager.showInsufficientFunds(player, finalPrice, coins);
      }
      system.runTimeout(() => this.showMaterialSelector(player, item, previousCategory), 5);
      return;
    }
    
    const modal = new ModalFormData();
    modal.title("Seleccionar Cantidad");
    
    modal.slider(
      `§6Cantidad §7(Tienes: §6${coins} §eCoins§7)\n§f${item.name} de ${material.name}\n§7Precio unitario: §6${finalPrice} §eCoins\n§aStock disponible: §f${currentStock}`,
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
      UIManager.showInsufficientStock(player, `${item.name} de ${material.name}`);
      system.runTimeout(() => this.showMaterialSelector(player, item, previousCategory), 10);
      return;
    }
    
    if (Economy.deductCoins(player, totalPrice)) {
      item.deductStock(quantity);
      const itemStack = new ItemStack(finalItemId, quantity);
      player.getComponent("inventory").container.addItem(itemStack);
      
      const message = MESSAGES.PURCHASE_SUCCESS
        .replace('{quantity}', quantity)
        .replace('{item}', `${item.name} §7de §f${material.name}`)
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
    modal.title("Seleccionar Cantidad");
    const currentStock = StockManager.getStock(item.uniqueId);
    
    modal.slider(
      `§6Cantidad §7(Tienes: §6${coins} §eCoins§7)\n§f${item.name}\n§7Precio unitario: §6${item.price} §eCoins\n§aStock disponible: §f${currentStock}`,
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
    
    const valiosos = [
      new ShopItem(`§bDiamante`, 100, "minecraft:diamond", 64, "textures/items/diamond", true, false, false, [], 500),
      new ShopItem(`§aEsmeralda`, 150, "minecraft:emerald", 64, "textures/items/emerald", true, false, false, [], 500),
      new ShopItem(`§6Oro en Bruto`, 60, "minecraft:raw_gold", 64, "textures/items/raw_gold", false, false, false, [], 500),
      new ShopItem(`§6Lingote de Oro`, 80, "minecraft:gold_ingot", 64, "textures/items/gold_ingot", true, false, false, [], 500),
      new ShopItem(`§7Hierro en Bruto`, 25, "minecraft:raw_iron", 64, "textures/items/raw_iron", false, false, false, [], 500),
      new ShopItem(`§7Lingote de Hierro`, 40, "minecraft:iron_ingot", 64, "textures/items/iron_ingot", true, false, false, [], 500),
      new ShopItem(`§8Lingote de Netherite`, 1000, "minecraft:netherite_ingot", 4, "textures/items/netherite_ingot", true, false, false, [], 100),
      new ShopItem(`§5Amatista`, 120, "minecraft:amethyst_shard", 64, "textures/items/amethyst_shard", true, false, false, [], 500),
      new ShopItem(`§3Fragmento de Netherite`, 500, "minecraft:netherite_scrap", 16, "textures/items/netherite_scrap", true, false, false, [], 200),
      new ShopItem(`§dEstrella del Nether`, 2000, "minecraft:nether_star", 1, "textures/items/nether_star", true, false, false, [], 50),
      new ShopItem(`§bCobre en Bruto`, 15, "minecraft:raw_copper", 64, "textures/items/raw_copper", false, false, false, [], 500),
      new ShopItem(`§bLingote de Cobre`, 20, "minecraft:copper_ingot", 64, "textures/items/copper_ingot", false, false, false, [], 500),
      new ShopItem(`§4Carbón`, 8, "minecraft:coal", 64, "textures/items/coal", false, false, false, [], 500),
      new ShopItem(`§1Lapislázuli`, 25, "minecraft:lapis_lazuli", 64, "textures/items/dye_powder_blue", false, false, false, [], 500),
      new ShopItem(`§cRedstone`, 20, "minecraft:redstone", 64, "textures/items/redstone_dust", false, false, false, [], 500),
      new ShopItem(`§fCuarzo del Nether`, 30, "minecraft:quartz", 64, "textures/items/quartz", false, false, false, [], 500),
      new ShopItem(`§ePepita de Oro`, 10, "minecraft:gold_nugget", 64, "textures/items/gold_nugget", false, false, false, [], 500),
      new ShopItem(`§7Pepita de Hierro`, 5, "minecraft:iron_nugget", 64, "textures/items/iron_nugget", false, false, false, [], 500),
      new ShopItem(`§dPrismarina Cristalina`, 80, "minecraft:prismarine_crystals", 64, "textures/items/prismarine_crystals", false, false, false, [], 500),
      new ShopItem(`§bFragmento de Prismarina`, 50, "minecraft:prismarine_shard", 64, "textures/items/prismarine_shard", false, false, false, [], 500)
    ];
    
    const bloques = [
      new ShopItem(`§7Piedra`, 5, "stone_group", 64, "textures/blocks/stone", false, false, true, [
        new ShopItem(`§7Piedra`, 5, "minecraft:stone", 64, "textures/blocks/stone", false, false, false, [], 1000),
        new ShopItem(`§cGranito`, 6, "minecraft:granite", 64, "textures/blocks/stone_granite", false, false, false, [], 1000),
        new ShopItem(`§fDiorita`, 6, "minecraft:diorite", 64, "textures/blocks/stone_diorite", false, false, false, [], 1000),
        new ShopItem(`§7Andesita`, 6, "minecraft:andesite", 64, "textures/blocks/stone_andesite", false, false, false, [], 1000),
        new ShopItem(`§7Piedra Lisa`, 7, "minecraft:smooth_stone", 64, "textures/blocks/stone_slab_top", false, false, false, [], 1000),
        new ShopItem(`§8Adoquín`, 4, "minecraft:cobblestone", 64, "textures/blocks/cobblestone", false, false, false, [], 1000),
        new ShopItem(`§8Pizarra`, 8, "minecraft:deepslate", 64, "textures/blocks/deepslate", false, false, false, [], 1000),
        new ShopItem(`§7Toba`, 5, "minecraft:tuff", 64, "textures/blocks/tuff", false, false, false, [], 1000),
        new ShopItem(`§8Calcita`, 9, "minecraft:calcite", 64, "textures/blocks/calcite", false, false, false, [], 1000),
        new ShopItem(`§8Basalto`, 6, "minecraft:basalt", 64, "textures/blocks/basalt_side", false, false, false, [], 1000),
        new ShopItem(`§8Basalto Liso`, 7, "minecraft:smooth_basalt", 64, "textures/blocks/smooth_basalt", false, false, false, [], 1000)
      ]),
      new ShopItem(`§2Tierra y Pasto`, 5, "dirt_group", 64, "textures/blocks/grass_side_carried", false, false, true, [
        new ShopItem(`§2Pasto`, 8, "minecraft:grass_block", 64, "textures/blocks/grass_side_carried", false, false, false, [], 1000),
        new ShopItem(`§6Tierra`, 2, "minecraft:dirt", 64, "textures/blocks/dirt", false, false, false, [], 1000),
        new ShopItem(`§6Tierra Gruesa`, 3, "minecraft:coarse_dirt", 64, "textures/blocks/coarse_dirt", false, false, false, [], 1000),
        new ShopItem(`§8Tierra Enraizada`, 4, "minecraft:rooted_dirt", 64, "textures/blocks/dirt_with_roots", false, false, false, [], 1000),
        new ShopItem(`§2Podzol`, 6, "minecraft:podzol", 64, "textures/blocks/dirt_podzol_side", false, false, false, [], 1000),
        new ShopItem(`§6Micelio`, 8, "minecraft:mycelium", 64, "textures/blocks/mycelium_side", false, false, false, [], 1000),
        new ShopItem(`§6Camino de Tierra`, 3, "minecraft:grass_path", 64, "textures/blocks/grass_path_side", false, false, false, [], 1000),
        new ShopItem(`§6Tierra de Cultivo`, 5, "minecraft:farmland", 64, "textures/blocks/farmland_wet", false, false, false, [], 1000)
      ]),
      new ShopItem(`§6Madera`, 15, "planks_group", 64, "textures/blocks/planks_oak", false, false, true, [
        new ShopItem(`§6Tablas de Roble`, 15, "minecraft:oak_planks", 64, "textures/blocks/planks_oak", false, false, false, [], 1000),
        new ShopItem(`§6Tablas de Abeto`, 17, "minecraft:spruce_planks", 64, "textures/blocks/planks_spruce", false, false, false, [], 1000),
        new ShopItem(`§fTablas de Abedul`, 17, "minecraft:birch_planks", 64, "textures/blocks/planks_birch", false, false, false, [], 1000),
        new ShopItem(`§2Tablas de Jungla`, 18, "minecraft:jungle_planks", 64, "textures/blocks/planks_jungle", false, false, false, [], 1000),
        new ShopItem(`§6Tablas de Acacia`, 18, "minecraft:acacia_planks", 64, "textures/blocks/planks_acacia", false, false, false, [], 1000),
        new ShopItem(`§8Tablas de Roble Oscuro`, 20, "minecraft:dark_oak_planks", 64, "textures/blocks/planks_big_oak", false, false, false, [], 1000),
        new ShopItem(`§cTablas de Manglar`, 20, "minecraft:mangrove_planks", 64, "textures/blocks/mangrove_planks", false, false, false, [], 1000),
        new ShopItem(`§dTablas de Cerezo`, 21, "minecraft:cherry_planks", 64, "textures/blocks/cherry_planks", false, false, false, [], 1000),
        new ShopItem(`§6Tablas de Bambú`, 19, "minecraft:bamboo_planks", 64, "textures/blocks/bamboo_planks", false, false, false, [], 1000),
        new ShopItem(`§cTablas Carmesí`, 22, "minecraft:crimson_planks", 64, "textures/blocks/crimson_planks", false, false, false, [], 1000),
        new ShopItem(`§bTablas Distorsionadas`, 22, "minecraft:warped_planks", 64, "textures/blocks/warped_planks", false, false, false, [], 1000)
      ]),
      new ShopItem(`§6Tronco`, 20, "log_group", 64, "textures/blocks/log_oak", false, false, true, [
        new ShopItem(`§6Tronco de Roble`, 20, "minecraft:oak_log", 64, "textures/blocks/log_oak", false, false, false, [], 1000),
        new ShopItem(`§6Tronco de Abeto`, 22, "minecraft:spruce_log", 64, "textures/blocks/log_spruce", false, false, false, [], 1000),
        new ShopItem(`§fTronco de Abedul`, 22, "minecraft:birch_log", 64, "textures/blocks/log_birch", false, false, false, [], 1000),
        new ShopItem(`§2Tronco de Jungla`, 24, "minecraft:jungle_log", 64, "textures/blocks/log_jungle", false, false, false, [], 1000),
        new ShopItem(`§6Tronco de Acacia`, 24, "minecraft:acacia_log", 64, "textures/blocks/log_acacia", false, false, false, [], 1000),
        new ShopItem(`§8Tronco de Roble Oscuro`, 26, "minecraft:dark_oak_log", 64, "textures/blocks/log_big_oak", false, false, false, [], 1000),
        new ShopItem(`§cTronco de Manglar`, 26, "minecraft:mangrove_log", 64, "textures/blocks/mangrove_log_side", false, false, false, [], 1000),
        new ShopItem(`§dTronco de Cerezo`, 28, "minecraft:cherry_log", 64, "textures/blocks/cherry_log_side", false, false, false, [], 1000),
        new ShopItem(`§6Tronco de Bambú`, 25, "minecraft:bamboo_block", 64, "textures/blocks/bamboo_block", false, false, false, [], 1000),
        new ShopItem(`§cTronco Carmesí`, 30, "minecraft:crimson_stem", 64, "textures/blocks/crimson_stem_side", false, false, false, [], 1000),
        new ShopItem(`§bTronco Distorsionado`, 30, "minecraft:warped_stem", 64, "textures/blocks/warped_stem_side", false, false, false, [], 1000)
      ]),
      new ShopItem(`§eArena`, 12, "sand_group", 64, "textures/blocks/sand", false, false, true, [
        new ShopItem(`§eArena`, 12, "minecraft:sand", 64, "textures/blocks/sand", false, false, false, [], 1000),
        new ShopItem(`§cArena Roja`, 14, "minecraft:red_sand", 64, "textures/blocks/red_sand", false, false, false, [], 1000),
        new ShopItem(`§7Grava`, 5, "minecraft:gravel", 64, "textures/blocks/gravel", false, false, false, [], 1000),
        new ShopItem(`§fAlma de Arena`, 20, "minecraft:soul_sand", 64, "textures/blocks/soul_sand", false, false, false, [], 1000),
        new ShopItem(`§8Tierra de Almas`, 22, "minecraft:soul_soil", 64, "textures/blocks/soul_soil", false, false, false, [], 1000)
      ]),
      new ShopItem(`§6Arenisca`, 20, "sandstone_group", 64, "textures/blocks/sandstone_normal", false, false, true, [
        new ShopItem(`§6Arenisca`, 20, "minecraft:sandstone", 64, "textures/blocks/sandstone_normal", false, false, false, [], 1000),
        new ShopItem(`§6Arenisca Lisa`, 22, "minecraft:smooth_sandstone", 64, "textures/blocks/sandstone_smooth", false, false, false, [], 1000),
        new ShopItem(`§6Arenisca Cortada`, 21, "minecraft:cut_sandstone", 64, "textures/blocks/sandstone_carved", false, false, false, [], 1000),
        new ShopItem(`§6Arenisca Cincelada`, 23, "minecraft:chiseled_sandstone", 64, "textures/blocks/sandstone_carved", false, false, false, [], 1000),
        new ShopItem(`§cArenisca Roja`, 22, "minecraft:red_sandstone", 64, "textures/blocks/red_sandstone_normal", false, false, false, [], 1000),
        new ShopItem(`§cArenisca Roja Lisa`, 24, "minecraft:smooth_red_sandstone", 64, "textures/blocks/red_sandstone_smooth", false, false, false, [], 1000),
        new ShopItem(`§cArenisca Roja Cortada`, 23, "minecraft:cut_red_sandstone", 64, "textures/blocks/red_sandstone_carved", false, false, false, [], 1000),
        new ShopItem(`§cArenisca Roja Cincelada`, 25, "minecraft:chiseled_red_sandstone", 64, "textures/blocks/red_sandstone_carved", false, false, false, [], 1000)
      ]),
      new ShopItem(`§fVidrio`, 25, "minecraft:glass", 64, "textures/blocks/glass", false, false, false, [], 1000),
      new ShopItem(`§cLadrillos`, 35, "brick_group", 64, "textures/blocks/brick", false, false, true, [
        new ShopItem(`§cLadrillo`, 40, "minecraft:bricks", 64, "textures/blocks/brick", false, false, false, [], 1000),
        new ShopItem(`§cLadrillo del Nether`, 35, "minecraft:nether_brick", 64, "textures/blocks/nether_brick", false, false, false, [], 1000),
        new ShopItem(`§cLadrillo Rojo del Nether`, 40, "minecraft:red_nether_brick", 64, "textures/blocks/red_nether_brick", false, false, false, [], 1000),
        new ShopItem(`§5Ladrillo del End`, 65, "minecraft:end_stone_bricks", 64, "textures/blocks/end_bricks", false, false, false, [], 1000),
        new ShopItem(`§8Ladrillo de Pizarra`, 45, "minecraft:deepslate_bricks", 64, "textures/blocks/deepslate_bricks", false, false, false, [], 1000),
        new ShopItem(`§8Baldosas de Pizarra`, 50, "minecraft:deepslate_tiles", 64, "textures/blocks/deepslate_tiles", false, false, false, [], 1000),
        new ShopItem(`§7Ladrillo de Piedra`, 30, "minecraft:stone_bricks", 64, "textures/blocks/stonebrick", false, false, false, [], 1000),
        new ShopItem(`§7Ladrillo Musgoso`, 32, "minecraft:mossy_stone_bricks", 64, "textures/blocks/stonebrick_mossy", false, false, false, [], 1000),
        new ShopItem(`§7Ladrillo Agrietado`, 28, "minecraft:cracked_stone_bricks", 64, "textures/blocks/stonebrick_cracked", false, false, false, [], 1000),
        new ShopItem(`§7Ladrillo Cincelado`, 35, "minecraft:chiseled_stone_bricks", 64, "textures/blocks/stonebrick_carved", false, false, false, [], 1000),
        new ShopItem(`§cLadrillo de Barro`, 25, "minecraft:mud_bricks", 64, "textures/blocks/mud_bricks", false, false, false, [], 1000)
      ]),
      new ShopItem(`§5Purpur`, 50, "minecraft:purpur_block", 64, "textures/blocks/purpur_block", false, false, false, [], 1000),
      new ShopItem(`§3Prismarina`, 45, "minecraft:prismarine", 64, "textures/blocks/prismarine_rough", false, false, false, [], 1000),
      new ShopItem(`§0Obsidiana`, 100, "minecraft:obsidian", 64, "textures/blocks/obsidian", false, false, false, [], 500),
      new ShopItem(`§5Obsidiana Llorosa`, 150, "minecraft:crying_obsidian", 64, "textures/blocks/crying_obsidian", false, false, false, [], 500),
      new ShopItem(`§fBloque de Mineral`, 360, "mineral_block_group", 64, "textures/blocks/iron_block", false, false, true, [
        new ShopItem(`§7Bloque de Hierro`, 360, "minecraft:iron_block", 64, "textures/blocks/iron_block", false, false, false, [], 500),
        new ShopItem(`§6Bloque de Oro`, 720, "minecraft:gold_block", 64, "textures/blocks/gold_block", false, false, false, [], 500),
        new ShopItem(`§bBloque de Diamante`, 900, "minecraft:diamond_block", 64, "textures/blocks/diamond_block", false, false, false, [], 500),
        new ShopItem(`§aBloque de Esmeralda`, 1350, "minecraft:emerald_block", 64, "textures/blocks/emerald_block", false, false, false, [], 500),
        new ShopItem(`§8Bloque de Netherite`, 9000, "minecraft:netherite_block", 4, "textures/blocks/netherite_block", false, false, false, [], 100),
        new ShopItem(`§1Bloque de Lapislázuli`, 225, "minecraft:lapis_block", 64, "textures/blocks/lapis_block", false, false, false, [], 500),
        new ShopItem(`§cBloque de Redstone`, 180, "minecraft:redstone_block", 64, "textures/blocks/redstone_block", false, false, false, [], 500),
        new ShopItem(`§bBloque de Cobre`, 180, "minecraft:copper_block", 64, "textures/blocks/copper_block", false, false, false, [], 500),
        new ShopItem(`§fBloque de Cuarzo`, 270, "minecraft:quartz_block", 64, "textures/blocks/quartz_block_side", false, false, false, [], 500),
        new ShopItem(`§0Bloque de Carbón`, 72, "minecraft:coal_block", 64, "textures/blocks/coal_block", false, false, false, [], 500),
        new ShopItem(`§5Bloque de Amatista`, 1080, "minecraft:amethyst_block", 64, "textures/blocks/amethyst_block", false, false, false, [], 500)
      ]),
      new ShopItem(`§6Terracota`, 18, "terracotta_group", 64, "textures/blocks/hardened_clay", false, false, true, [
        new ShopItem(`§6Terracota`, 18, "minecraft:terracotta", 64, "textures/blocks/hardened_clay", false, false, false, [], 1000),
        new ShopItem(`§fTerracota Blanca`, 20, "minecraft:white_terracotta", 64, "textures/blocks/hardened_clay_stained_white", false, false, false, [], 1000),
        new ShopItem(`§7Terracota Gris Claro`, 20, "minecraft:light_gray_terracotta", 64, "textures/blocks/hardened_clay_stained_silver", false, false, false, [], 1000),
        new ShopItem(`§8Terracota Gris`, 20, "minecraft:gray_terracotta", 64, "textures/blocks/hardened_clay_stained_gray", false, false, false, [], 1000),
        new ShopItem(`§0Terracota Negra`, 20, "minecraft:black_terracota", 64, "textures/blocks/hardened_clay_stained_black", false, false, false, [], 1000),
        new ShopItem(`§6Terracota Café`, 20, "minecraft:brown_terracotta", 64, "textures/blocks/hardened_clay_stained_brown", false, false, false, [], 1000),
        new ShopItem(`§cTerracota Roja`, 20, "minecraft:red_terracotta", 64, "textures/blocks/hardened_clay_stained_red", false, false, false, [], 1000),
        new ShopItem(`§6Terracota Naranja`, 20, "minecraft:orange_terracotta", 64, "textures/blocks/hardened_clay_stained_orange", false, false, false, [], 1000),
        new ShopItem(`§eTerracota Amarilla`, 20, "minecraft:yellow_terracotta", 64, "textures/blocks/hardened_clay_stained_yellow", false, false, false, [], 1000),
        new ShopItem(`§eTerracota Lima`, 20, "minecraft:lime_terracotta", 64, "textures/blocks/hardened_clay_stained_lime", false, false, false, [], 1000),
        new ShopItem(`§2Terracota Verde`, 20, "minecraft:green_terracotta", 64, "textures/blocks/hardened_clay_stained_green", false, false, false, [], 1000),
        new ShopItem(`§bTerracota Cian`, 20, "minecraft:cyan_terracotta", 64, "textures/blocks/hardened_clay_stained_cyan", false, false, false, [], 1000),
        new ShopItem(`§9Terracota Azul Claro`, 20, "minecraft:light_blue_terracotta", 64, "textures/blocks/hardened_clay_stained_light_blue", false, false, false, [], 1000),
        new ShopItem(`§1Terracota Azul`, 20, "minecraft:blue_terracotta", 64, "textures/blocks/hardened_clay_stained_blue", false, false, false, [], 1000),
        new ShopItem(`§5Terracota Morada`, 20, "minecraft:purple_terracotta", 64, "textures/blocks/hardened_clay_stained_purple", false, false, false, [], 1000),
        new ShopItem(`§dTerracota Magenta`, 20, "minecraft:magenta_terracotta", 64, "textures/blocks/hardened_clay_stained_magenta", false, false, false, [], 1000),
        new ShopItem(`§dTerracota Rosa`, 20, "minecraft:pink_terracotta", 64, "textures/blocks/hardened_clay_stained_pink", false, false, false, [], 1000)
      ]),
      new ShopItem(`§5Piedra del End`, 55, "minecraft:end_stone", 64, "textures/blocks/end_stone", false, false, false, [], 1000),
      new ShopItem(`§fHielo`, 15, "ice_group", 64, "textures/blocks/ice", false, false, true, [
        new ShopItem(`§fHielo`, 15, "minecraft:ice", 64, "textures/blocks/ice", false, false, false, [], 1000),
        new ShopItem(`§bHielo Compacto`, 25, "minecraft:packed_ice", 64, "textures/blocks/ice_packed", false, false, false, [], 1000),
        new ShopItem(`§bHielo Azul`, 40, "minecraft:blue_ice", 64, "textures/blocks/blue_ice", false, false, false, [], 1000),
        new ShopItem(`§fBloque de Nieve`, 10, "minecraft:snow", 64, "textures/blocks/snow", false, false, false, [], 1000),
        new ShopItem(`§fCapa de Nieve`, 5, "minecraft:snow_layer", 64, "textures/blocks/snow", false, false, false, [], 1000)
      ]),
      new ShopItem(`§2Musgo`, 12, "minecraft:moss_block", 64, "textures/blocks/moss_block", false, false, false, [], 1000)
    ];
    
    const armas = [
      new ShopItem(`§fEspada`, 300, "sword", 1, "textures/items/diamond_sword", false, true, false, [], 100),
      new ShopItem(`§fHacha de Combate`, 250, "axe", 1, "textures/items/diamond_axe", false, true, false, [], 100),
      new ShopItem(`§fArco`, 100, "minecraft:bow", 1, "textures/items/bow_standby", false, false, false, [], 100),
      new ShopItem(`§7Ballesta`, 150, "minecraft:crossbow", 1, "textures/items/crossbow_standby", false, false, false, [], 100),
      new ShopItem(`§bTridente`, 400, "minecraft:trident", 1, "textures/items/trident", false, false, false, [], 50),
      new ShopItem(`§fFlechas`, 1, "minecraft:arrow", 64, "textures/items/arrow", false, false, false, [], 500),
      new ShopItem(`§6Flechas Espectrales`, 5, "minecraft:spectral_arrow", 64, "textures/items/arrow", false, false, false, [], 500)
    ];
    
    const herramientas = [
      new ShopItem(`§fPico`, 280, "pickaxe", 1, "textures/items/diamond_pickaxe", false, true, false, [], 100),
      new ShopItem(`§fPala`, 220, "shovel", 1, "textures/items/diamond_shovel", false, true, false, [], 100),
      new ShopItem(`§fHacha`, 250, "axe", 1, "textures/items/diamond_axe", false, true, false, [], 100),
      new ShopItem(`§fAzada`, 200, "hoe", 1, "textures/items/diamond_hoe", false, true, false, [], 100),
      new ShopItem(`§eTijeras`, 50, "minecraft:shears", 1, "textures/items/shears", false, false, false, [], 100),
      new ShopItem(`§6Caña de Pescar`, 75, "minecraft:fishing_rod", 1, "textures/items/fishing_rod_uncast", false, false, false, [], 100),
      new ShopItem(`§cPedernal y Acero`, 30, "minecraft:flint_and_steel", 1, "textures/items/flint_and_steel", false, false, false, [], 100),
      new ShopItem(`§aBrújula`, 60, "minecraft:compass", 1, "textures/items/compass_item", false, false, false, [], 100),
      new ShopItem(`§fReloj`, 80, "minecraft:clock", 1, "textures/items/clock_item", false, false, false, [], 100),
      new ShopItem(`§eCatalejo`, 100, "minecraft:spyglass", 1, "textures/items/spyglass", false, false, false, [], 100)
    ];
    
    const armadura = [
      new ShopItem(`§fCasco`, 250, "helmet", 1, "textures/items/diamond_helmet", false, true, false, [], 100),
      new ShopItem(`§fPeto`, 400, "chestplate", 1, "textures/items/diamond_chestplate", false, true, false, [], 100),
      new ShopItem(`§fPantalón`, 350, "leggings", 1, "textures/items/diamond_leggings", false, true, false, [], 100),
      new ShopItem(`§fBotas`, 200, "boots", 1, "textures/items/diamond_boots", false, true, false, [], 100),
      new ShopItem(`§fEscudo`, 80, "minecraft:shield", 1, "textures/items/shield", false, false, false, [], 100),
      new ShopItem(`§5Élitros`, 3500, "minecraft:elytra", 1, "textures/items/elytra", true, false, false, [], 20)
    ];
    
    const comida = [
      new ShopItem(`§cManzana`, 10, "minecraft:apple", 64, "textures/items/apple", false, false, false, [], 500),
      new ShopItem(`§6Pan`, 15, "minecraft:bread", 64, "textures/items/bread", false, false, false, [], 500),
      new ShopItem(`§cCarne Cocida`, 25, "minecraft:cooked_beef", 64, "textures/items/beef_cooked", false, false, false, [], 500),
      new ShopItem(`§eCerdo Cocido`, 25, "minecraft:cooked_porkchop", 64, "textures/items/porkchop_cooked", false, false, false, [], 500),
      new ShopItem(`§6Pollo Cocido`, 20, "minecraft:cooked_chicken", 64, "textures/items/chicken_cooked", false, false, false, [], 500),
      new ShopItem(`§bBacalao Cocido`, 22, "minecraft:cooked_cod", 64, "textures/items/fish_cooked", false, false, false, [], 500),
      new ShopItem(`§dSalmón Cocido`, 22, "minecraft:cooked_salmon", 64, "textures/items/fish_salmon_cooked", false, false, false, [], 500),
      new ShopItem(`§6Zanahoria Dorada`, 80, "minecraft:golden_carrot", 64, "textures/items/carrot_golden", true, false, false, [], 500),
      new ShopItem(`§6Manzana Dorada`, 200, "minecraft:golden_apple", 16, "textures/items/apple_golden", true, false, false, [], 200),
      new ShopItem(`§5Manzana Encantada`, 1500, "minecraft:enchanted_golden_apple", 1, "textures/items/apple_golden", true, false, false, [], 50),
      new ShopItem(`§dChorus`, 35, "minecraft:chorus_fruit", 64, "textures/items/chorus_fruit", false, false, false, [], 500),
      new ShopItem(`§ePastel`, 100, "minecraft:cake", 16, "textures/items/cake", false, false, false, [], 200),
      new ShopItem(`§cSandía`, 12, "minecraft:melon_slice", 64, "textures/items/melon", false, false, false, [], 500),
      new ShopItem(`§6Galletas`, 8, "minecraft:cookie", 64, "textures/items/cookie", false, false, false, [], 500),
      new ShopItem(`§6Zanahoria`, 8, "minecraft:carrot", 64, "textures/items/carrot", false, false, false, [], 500),
      new ShopItem(`§ePapa`, 8, "minecraft:potato", 64, "textures/items/potato", false, false, false, [], 500),
      new ShopItem(`§ePapa Horneada`, 12, "minecraft:baked_potato", 64, "textures/items/potato_baked", false, false, false, [], 500),
      new ShopItem(`§cRemolacha`, 10, "minecraft:beetroot", 64, "textures/items/beetroot", false, false, false, [], 500),
      new ShopItem(`§cSopa de Remolacha`, 30, "minecraft:beetroot_soup", 16, "textures/items/beetroot_soup", false, false, false, [], 200),
      new ShopItem(`§cEstofado de Conejo`, 35, "minecraft:rabbit_stew", 16, "textures/items/rabbit_stew", false, false, false, [], 200),
      new ShopItem(`§eSopa de Champiñones`, 25, "minecraft:mushroom_stew", 16, "textures/items/mushroom_stew", false, false, false, [], 200),
      new ShopItem(`§6Calabaza de Pastel`, 40, "minecraft:pumpkin_pie", 64, "textures/items/pumpkin_pie", false, false, false, [], 500),
      new ShopItem(`§eBayas Dulces`, 15, "minecraft:sweet_berries", 64, "textures/items/sweet_berries", false, false, false, [], 500),
      new ShopItem(`§5Bayas Luminosas`, 20, "minecraft:glow_berries", 64, "textures/items/glow_berries", false, false, false, [], 500),
      new ShopItem(`§6Miel`, 45, "minecraft:honey_bottle", 16, "textures/items/honey_bottle", false, false, false, [], 200)
    ];
    
    const pociones = [
      new ShopItem(`§dPerla de Ender`, 75, "minecraft:ender_pearl", 16, "textures/items/ender_pearl", false, false, false, [], 300),
      new ShopItem(`§aOjo de Ender`, 150, "minecraft:ender_eye", 16, "textures/items/ender_eye", true, false, false, [], 300),
      new ShopItem(`§bTotem de Inmortalidad`, 500, "minecraft:totem_of_undying", 4, "textures/items/totem", true, false, false, [], 100),
      new ShopItem(`§5Vara de Blaze`, 90, "minecraft:blaze_rod", 64, "textures/items/blaze_rod", false, false, false, [], 300),
      new ShopItem(`§eMembrana de Phantom`, 85, "minecraft:phantom_membrane", 64, "textures/items/phantom_membrane", false, false, false, [], 300),
      new ShopItem(`§fPerla de Shulker`, 120, "minecraft:shulker_shell", 16, "textures/items/shulker_shell", false, false, false, [], 200),
      new ShopItem(`§aSlime`, 30, "minecraft:slime_ball", 64, "textures/items/slimeball", false, false, false, [], 300),
      new ShopItem(`§6Polvo de Blaze`, 45, "minecraft:blaze_powder", 64, "textures/items/blaze_powder", false, false, false, [], 300),
      new ShopItem(`§5Lágrima de Ghast`, 110, "minecraft:ghast_tear", 64, "textures/items/ghast_tear", false, false, false, [], 300),
      new ShopItem(`§bCristal del End`, 200, "minecraft:end_crystal", 4, "textures/items/end_crystal", false, false, false, [], 100),
      new ShopItem(`§6Botella de Experiencia`, 50, "minecraft:experience_bottle", 64, "textures/items/experience_bottle", false, false, false, [], 300),
      new ShopItem(`§fPerla de Nautilus`, 140, "minecraft:nautilus_shell", 16, "textures/items/nautilus_shell", false, false, false, [], 200),
      new ShopItem(`§aOjo de Araña`, 15, "minecraft:spider_eye", 64, "textures/items/spider_eye", false, false, false, [], 300),
      new ShopItem(`§6Ojo de Araña Fermentado`, 25, "minecraft:fermented_spider_eye", 64, "textures/items/spider_eye_fermented", false, false, false, [], 300),
      new ShopItem(`§5Crema de Magma`, 40, "minecraft:magma_cream", 64, "textures/items/magma_cream", false, false, false, [], 300),
      new ShopItem(`§eVerruga del Nether`, 35, "minecraft:nether_wart", 64, "textures/items/nether_wart", false, false, false, [], 300),
      new ShopItem(`§fAzúcar`, 10, "minecraft:sugar", 64, "textures/items/sugar", false, false, false, [], 500),
      new ShopItem(`§6Polvo de Piedra Luminosa`, 30, "minecraft:glowstone_dust", 64, "textures/items/glowstone_dust", false, false, false, [], 300),
      new ShopItem(`§bPolvo de Piedra Brillante`, 35, "minecraft:glow_ink_sac", 64, "textures/items/glow_ink_sac", false, false, false, [], 300),
      new ShopItem(`§0Bolsa de Tinta`, 12, "minecraft:ink_sac", 64, "textures/items/ink_sac", false, false, false, [], 300)
    ];
    
    const redstone = [
      new ShopItem(`§cPolvo de Redstone`, 20, "minecraft:redstone", 64, "textures/items/redstone_dust", false, false, false, [], 500),
      new ShopItem(`§6Repetidor`, 30, "minecraft:repeater", 64, "textures/items/repeater", false, false, false, [], 500),
      new ShopItem(`§6Comparador`, 35, "minecraft:comparator", 64, "textures/items/comparator", false, false, false, [], 500),
      new ShopItem(`§cAntorcha de Redstone`, 15, "minecraft:redstone_torch", 64, "textures/blocks/redstone_torch_on", false, false, false, [], 500),
      new ShopItem(`§7Pistón`, 40, "minecraft:piston", 64, "textures/blocks/piston_top_normal", false, false, false, [], 500),
      new ShopItem(`§7Pistón Pegajoso`, 50, "minecraft:sticky_piston", 64, "textures/blocks/piston_top_sticky", false, false, false, [], 500),
      new ShopItem(`§cTNT`, 100, "minecraft:tnt", 64, "textures/blocks/tnt_side", false, false, false, [], 500),
      new ShopItem(`§7Tolva`, 60, "minecraft:hopper", 64, "textures/items/hopper", false, false, false, [], 500),
      new ShopItem(`§7Dispensador`, 45, "minecraft:dispenser", 64, "textures/blocks/dispenser_front_horizontal", false, false, false, [], 500),
      new ShopItem(`§7Dropper`, 40, "minecraft:dropper", 64, "textures/blocks/dropper_front_horizontal", false, false, false, [], 500),
      new ShopItem(`§eObservador`, 55, "minecraft:observer", 64, "textures/blocks/observer_front", false, false, false, [], 500),
      new ShopItem(`§cLámpara de Redstone`, 35, "minecraft:redstone_lamp", 64, "textures/blocks/redstone_lamp_off", false, false, false, [], 500),
      new ShopItem(`§7Bloque de Redstone`, 90, "minecraft:redstone_block", 64, "textures/blocks/redstone_block", false, false, false, [], 500),
      new ShopItem(`§6Palanca`, 10, "minecraft:lever", 64, "textures/blocks/lever", false, false, false, [], 500),
      new ShopItem(`§7Botón de Piedra`, 8, "minecraft:stone_button", 64, "textures/blocks/stone", false, false, false, [], 500),
      new ShopItem(`§6Placa de Presión`, 12, "minecraft:stone_pressure_plate", 64, "textures/blocks/stone", false, false, false, [], 500),
      new ShopItem(`§eDía Sensor`, 50, "minecraft:daylight_detector", 16, "textures/blocks/daylight_detector_top", false, false, false, [], 200),
      new ShopItem(`§7Trampa`, 25, "minecraft:tripwire_hook", 64, "textures/blocks/trip_wire_source", false, false, false, [], 500),
      new ShopItem(`§cBlanco`, 65, "minecraft:target", 32, "textures/blocks/target_side", false, false, false, [], 300)
    ];
    
    const decoracion = [
      new ShopItem(`§fLanas`, 15, "wool_group", 64, "textures/blocks/wool_colored_white", false, false, true, [
        new ShopItem(`§fLana Blanca`, 15, "minecraft:white_wool", 64, "textures/blocks/wool_colored_white", false, false, false, [], 500),
        new ShopItem(`§cLana Roja`, 15, "minecraft:red_wool", 64, "textures/blocks/wool_colored_red", false, false, false, [], 500),
        new ShopItem(`§1Lana Azul`, 15, "minecraft:blue_wool", 64, "textures/blocks/wool_colored_blue", false, false, false, [], 500),
        new ShopItem(`§2Lana Verde`, 15, "minecraft:green_wool", 64, "textures/blocks/wool_colored_green", false, false, false, [], 500),
        new ShopItem(`§6Lana Naranja`, 15, "minecraft:orange_wool", 64, "textures/blocks/wool_colored_orange", false, false, false, [], 500),
        new ShopItem(`§5Lana Morada`, 15, "minecraft:purple_wool", 64, "textures/blocks/wool_colored_purple", false, false, false, [], 500),
        new ShopItem(`§0Lana Negra`, 15, "minecraft:black_wool", 64, "textures/blocks/wool_colored_black", false, false, false, [], 500),
        new ShopItem(`§eLana Amarilla`, 15, "minecraft:yellow_wool", 64, "textures/blocks/wool_colored_yellow", false, false, false, [], 500),
        new ShopItem(`§7Lana Gris`, 15, "minecraft:gray_wool", 64, "textures/blocks/wool_colored_gray", false, false, false, [], 500),
        new ShopItem(`§7Lana Gris Claro`, 15, "minecraft:light_gray_wool", 64, "textures/blocks/wool_colored_silver", false, false, false, [], 500),
        new ShopItem(`§3Lana Cian`, 15, "minecraft:cyan_wool", 64, "textures/blocks/wool_colored_cyan", false, false, false, [], 500),
        new ShopItem(`§5Lana Magenta`, 15, "minecraft:magenta_wool", 64, "textures/blocks/wool_colored_magenta", false, false, false, [], 500),
        new ShopItem(`§9Lana Azul Claro`, 15, "minecraft:light_blue_wool", 64, "textures/blocks/wool_colored_light_blue", false, false, false, [], 500),
        new ShopItem(`§eLana Lima`, 15, "minecraft:lime_wool", 64, "textures/blocks/wool_colored_lime", false, false, false, [], 500),
        new ShopItem(`§cLana Rosa`, 15, "minecraft:pink_wool", 64, "textures/blocks/wool_colored_pink", false, false, false, [], 500),
        new ShopItem(`§6Lana Café`, 15, "minecraft:brown_wool", 64, "textures/blocks/wool_colored_brown", false, false, false, [], 500)
      ]),
      new ShopItem(`§cFlores`, 8, "flower_group", 64, "textures/blocks/flower_rose", false, false, true, [
        new ShopItem(`§eDiente de León`, 8, "minecraft:dandelion", 64, "textures/blocks/flower_dandelion", false, false, false, [], 500),
        new ShopItem(`§cAmapola`, 8, "minecraft:poppy", 64, "textures/blocks/flower_rose", false, false, false, [], 500),
        new ShopItem(`§9Orquídea Azul`, 8, "minecraft:blue_orchid", 64, "textures/blocks/flower_blue_orchid", false, false, false, [], 500),
        new ShopItem(`§7Allium`, 8, "minecraft:allium", 64, "textures/blocks/flower_allium", false, false, false, [], 500),
        new ShopItem(`§cTulipán Rojo`, 8, "minecraft:red_tulip", 64, "textures/blocks/flower_tulip_red", false, false, false, [], 500),
        new ShopItem(`§6Tulipán Naranja`, 8, "minecraft:orange_tulip", 64, "textures/blocks/flower_tulip_orange", false, false, false, [], 500),
        new ShopItem(`§fTulipán Blanco`, 8, "minecraft:white_tulip", 64, "textures/blocks/flower_tulip_white", false, false, false, [], 500),
        new ShopItem(`§dTulipán Rosa`, 8, "minecraft:pink_tulip", 64, "textures/blocks/flower_tulip_pink", false, false, false, [], 500),
        new ShopItem(`§fMargarita`, 8, "minecraft:oxeye_daisy", 64, "textures/blocks/flower_oxeye_daisy", false, false, false, [], 500),
        new ShopItem(`§eCornflower`, 8, "minecraft:cornflower", 64, "textures/blocks/flower_cornflower", false, false, false, [], 500),
        new ShopItem(`§fLirio del Valle`, 8, "minecraft:lily_of_the_valley", 64, "textures/blocks/flower_lily_of_the_valley", false, false, false, [], 500),
        new ShopItem(`§5Orquídea Marchita`, 8, "minecraft:wither_rose", 64, "textures/blocks/flower_wither_rose", false, false, false, [], 500),
        new ShopItem(`§6Girasol`, 10, "minecraft:sunflower", 64, "textures/blocks/double_plant_sunflower_front", false, false, false, [], 500),
        new ShopItem(`§5Lila`, 10, "minecraft:lilac", 64, "textures/blocks/double_plant_syringa_front", false, false, false, [], 500),
        new ShopItem(`§2Rosa Alta`, 10, "minecraft:rose_bush", 64, "textures/blocks/double_plant_rose_front", false, false, false, [], 500),
        new ShopItem(`§dPeonía`, 10, "minecraft:peony", 64, "textures/blocks/double_plant_paeonia_front", false, false, false, [], 500),
        new ShopItem(`§6Flor de Antorcha`, 12, "minecraft:torchflower", 64, "textures/blocks/torchflower", false, false, false, [], 500)
      ]),
      new ShopItem(`§eCuadro`, 25, "minecraft:painting", 16, "textures/items/painting", false, false, false, [], 200),
      new ShopItem(`§6Marco`, 20, "minecraft:frame", 64, "textures/items/item_frame", false, false, false, [], 300),
      new ShopItem(`§aMarco Brillante`, 40, "minecraft:glow_frame", 64, "textures/items/glow_item_frame", false, false, false, [], 300),
      new ShopItem(`§eSoporte de Armadura`, 50, "minecraft:armor_stand", 16, "textures/items/armor_stand", false, false, false, [], 200),
      new ShopItem(`§dCampana`, 35, "minecraft:bell", 16, "textures/items/bell", false, false, false, [], 200),
      new ShopItem(`§bFlor de Coro`, 45, "minecraft:chorus_flower", 64, "textures/blocks/chorus_flower", false, false, false, [], 300),
      new ShopItem(`§6Lámpara de Mar`, 55, "minecraft:sea_lantern", 64, "textures/blocks/sea_lantern", false, false, false, [], 300),
      new ShopItem(`§ePiedra Luminosa`, 40, "minecraft:glowstone", 64, "textures/blocks/glowstone", false, false, false, [], 300),
      new ShopItem(`§5Vara de Púrpur`, 30, "minecraft:purpur_pillar", 64, "textures/blocks/purpur_pillar", false, false, false, [], 500),
      new ShopItem(`§6Estante`, 30, "minecraft:bookshelf", 64, "textures/blocks/bookshelf", false, false, false, [], 300),
      new ShopItem(`§7Yunque`, 150, "minecraft:anvil", 8, "textures/blocks/anvil_base", false, false, false, [], 100),
      new ShopItem(`§5Mesa de Encantamientos`, 200, "minecraft:enchanting_table", 4, "textures/blocks/enchanting_table_side", false, false, false, [], 50),
      new ShopItem(`§eBalizas de Luz`, 45, "minecraft:chain", 64, "textures/items/chain", false, false, false, [], 300),
      new ShopItem(`§6Barril`, 35, "minecraft:barrel", 64, "textures/blocks/barrel_side", false, false, false, [], 300),
      new ShopItem(`§7Ahumador`, 40, "minecraft:smoker", 16, "textures/blocks/smoker_front_off", false, false, false, [], 200),
      new ShopItem(`§6Alto Horno`, 45, "minecraft:blast_furnace", 16, "textures/blocks/blast_furnace_front_off", false, false, false, [], 200)
    ];
    
    const agricultura = [
      new ShopItem(`§aSeeds de Trigo`, 5, "minecraft:wheat_seeds", 64, "textures/items/wheat_seeds", false, false, false, [], 500),
      new ShopItem(`§6Zanahoria`, 8, "minecraft:carrot", 64, "textures/items/carrot", false, false, false, [], 500),
      new ShopItem(`§ePapa`, 8, "minecraft:potato", 64, "textures/items/potato", false, false, false, [], 500),
      new ShopItem(`§cRemolacha`, 10, "minecraft:beetroot_seeds", 64, "textures/items/beetroot_seeds", false, false, false, [], 500),
      new ShopItem(`§2Semillas de Melón`, 12, "minecraft:melon_seeds", 64, "textures/items/melon_seeds", false, false, false, [], 500),
      new ShopItem(`§6Semillas de Calabaza`, 12, "minecraft:pumpkin_seeds", 64, "textures/items/pumpkin_seeds", false, false, false, [], 500),
      new ShopItem(`§3Caña de Azúcar`, 15, "minecraft:reeds", 64, "textures/blocks/reeds", false, false, false, [], 500),
      new ShopItem(`§2Cactus`, 10, "minecraft:cactus", 64, "textures/blocks/cactus_side", false, false, false, [], 500),
      new ShopItem(`§6Bambú`, 8, "minecraft:bamboo", 64, "textures/blocks/bamboo_stalk", false, false, false, [], 500),
      new ShopItem(`§aGranos de Cacao`, 15, "minecraft:cocoa_beans", 64, "textures/items/cocoa_beans", false, false, false, [], 500),
      new ShopItem(`§2Kelp`, 12, "minecraft:kelp", 64, "textures/blocks/kelp_a", false, false, false, [], 500),
      new ShopItem(`§aVides`, 10, "minecraft:vine", 64, "textures/blocks/vine", false, false, false, [], 500),
      new ShopItem(`§eBayas Dulces`, 15, "minecraft:sweet_berries", 64, "textures/items/sweet_berries", false, false, false, [], 500),
      new ShopItem(`§5Bayas Luminosas`, 20, "minecraft:glow_berries", 64, "textures/items/glow_berries", false, false, false, [], 500),
      new ShopItem(`§cChampiñón Rojo`, 12, "minecraft:red_mushroom", 64, "textures/blocks/mushroom_red", false, false, false, [], 500),
      new ShopItem(`§eChampiñón Café`, 12, "minecraft:brown_mushroom", 64, "textures/blocks/mushroom_brown", false, false, false, [], 500),
      new ShopItem(`§eHueso`, 10, "minecraft:bone", 64, "textures/items/bone", false, false, false, [], 500),
      new ShopItem(`§fHarina de Hueso`, 15, "minecraft:bone_meal", 64, "textures/items/dye_powder_white", false, false, false, [], 500),
      new ShopItem(`§6Abono`, 12, "minecraft:composter", 16, "textures/blocks/composter_side", false, false, false, [], 200),
      new ShopItem(`§aPera Luminosa`, 18, "minecraft:torchflower_seeds", 64, "textures/items/torchflower_seeds", false, false, false, [], 500)
    ];
    
    const especial = [
      new ShopItem(`§dDragon Egg`, 10000, "minecraft:dragon_egg", 1, "textures/blocks/dragon_egg", true, false, false, [], 10),
      new ShopItem(`§5Elytra`, 3500, "minecraft:elytra", 1, "textures/items/elytra", true, false, false, [], 20),
      new ShopItem(`§aBeacon`, 2500, "minecraft:beacon", 1, "textures/blocks/beacon", true, false, false, [], 30),
      new ShopItem(`§6Esponja`, 250, "minecraft:sponge", 64, "textures/blocks/sponge", false, false, false, [], 200),
      new ShopItem(`§eEsponja Húmeda`, 300, "minecraft:sponge", 64, "textures/blocks/sponge_wet", false, false, false, [], 200),
      new ShopItem(`§bCabeza de Creeper`, 500, "minecraft:skull", 1, "textures/blocks/mob_spawner", false, false, false, [], 50),
      new ShopItem(`§5Shulker Box`, 400, "minecraft:shulker_box", 1, "textures/blocks/shulker_top_undyed", false, false, false, [], 100),
      new ShopItem(`§6Corazón del Mar`, 1000, "minecraft:heart_of_the_sea", 1, "textures/items/heartofthesea_closed", true, false, false, [], 50),
      new ShopItem(`§bConducto`, 1500, "minecraft:conduit", 1, "textures/items/conduit", true, false, false, [], 30),
      new ShopItem(`§dCatalyst de Sculk`, 800, "minecraft:sculk_catalyst", 16, "textures/blocks/sculk_catalyst_side", true, false, false, [], 100),
      new ShopItem(`§3Cuerno de Cabra`, 600, "minecraft:goat_horn", 8, "textures/items/goat_horn", true, false, false, [], 100),
      new ShopItem(`§5Cristal de Amatista`, 350, "minecraft:amethyst_cluster", 32, "textures/blocks/amethyst_cluster", false, false, false, [], 200),
      new ShopItem(`§dGeoda de Amatista`, 500, "minecraft:budding_amethyst", 16, "textures/blocks/budding_amethyst", false, false, false, [], 100),
      new ShopItem(`§0Bloque de Carbón`, 72, "minecraft:coal_block", 64, "textures/blocks/coal_block", false, false, false, [], 500),
      new ShopItem(`§6Miel`, 45, "minecraft:honey_bottle", 16, "textures/items/honey_bottle", false, false, false, [], 300),
      new ShopItem(`§6Bloque de Miel`, 180, "minecraft:honey_block", 64, "textures/blocks/honey_side", false, false, false, [], 300),
      new ShopItem(`§6Panal`, 80, "minecraft:honeycomb_block", 64, "textures/blocks/honeycomb", false, false, false, [], 300)
    ];
    
    const transporte = [
      new ShopItem(`§7Barcas`, 40, "boat_group", 8, "textures/items/boat_oak", false, false, true, [
        new ShopItem(`§7Barca de Roble`, 40, "minecraft:oak_boat", 8, "textures/items/boat_oak", false, false, false, [], 200),
        new ShopItem(`§7Barca de Abeto`, 40, "minecraft:spruce_boat", 8, "textures/items/boat_spruce", false, false, false, [], 200),
        new ShopItem(`§7Barca de Abedul`, 40, "minecraft:birch_boat", 8, "textures/items/boat_birch", false, false, false, [], 200),
        new ShopItem(`§7Barca de Jungla`, 40, "minecraft:jungle_boat", 8, "textures/items/boat_jungle", false, false, false, [], 200),
        new ShopItem(`§7Barca de Acacia`, 40, "minecraft:acacia_boat", 8, "textures/items/boat_acacia", false, false, false, [], 200),
        new ShopItem(`§7Barca de Roble Oscuro`, 40, "minecraft:dark_oak_boat", 8, "textures/items/boat_darkoak", false, false, false, [], 200),
        new ShopItem(`§7Barca de Manglar`, 40, "minecraft:mangrove_boat", 8, "textures/items/boat_mangrove", false, false, false, [], 200),
        new ShopItem(`§7Barca de Bambú`, 40, "minecraft:bamboo_raft", 8, "textures/items/bamboo_raft", false, false, false, [], 200)
      ]),
      new ShopItem(`§7Vagonetas`, 60, "minecart_group", 16, "textures/items/minecart_normal", false, false, true, [
        new ShopItem(`§7Vagoneta`, 60, "minecraft:minecart", 16, "textures/items/minecart_normal", false, false, false, [], 200),
        new ShopItem(`§6Vagoneta con Cofre`, 80, "minecraft:chest_minecart", 8, "textures/items/minecart_chest", false, false, false, [], 200),
        new ShopItem(`§cVagoneta con TNT`, 100, "minecraft:tnt_minecart", 8, "textures/items/minecart_tnt", false, false, false, [], 200),
        new ShopItem(`§7Vagoneta con Tolva`, 90, "minecraft:hopper_minecart", 8, "textures/items/minecart_hopper", false, false, false, [], 200),
        new ShopItem(`§5Vagoneta con Horno`, 85, "minecraft:furnace_minecart", 8, "textures/items/minecart_furnace", false, false, false, [], 200)
      ]),
      new ShopItem(`§7Rieles`, 15, "rail_group", 64, "textures/blocks/rail_normal", false, false, true, [
        new ShopItem(`§7Rieles Normales`, 15, "minecraft:rail", 64, "textures/blocks/rail_normal", false, false, false, [], 500),
        new ShopItem(`§6Rieles Motorizados`, 25, "minecraft:golden_rail", 64, "textures/blocks/rail_golden", false, false, false, [], 500),
        new ShopItem(`§cRieles Detectores`, 30, "minecraft:detector_rail", 64, "textures/blocks/rail_detector", false, false, false, [], 500),
        new ShopItem(`§7Rieles Activadores`, 30, "minecraft:activator_rail", 64, "textures/blocks/rail_activator", false, false, false, [], 500)
      ]),
      new ShopItem(`§7Armadura de Caballo`, 150, "horse_armor_group", 4, "textures/items/horse_armor_iron", false, false, true, [
        new ShopItem(`§6Armadura de Caballo (Oro)`, 200, "minecraft:golden_horse_armor", 4, "textures/items/horse_armor_gold", false, false, false, [], 100),
        new ShopItem(`§7Armadura de Caballo (Hierro)`, 150, "minecraft:iron_horse_armor", 4, "textures/items/horse_armor_iron", false, false, false, [], 100),
        new ShopItem(`§bArmadura de Caballo (Diamante)`, 300, "minecraft:diamond_horse_armor", 4, "textures/items/horse_armor_diamond", false, false, false, [], 100)
      ]),
      new ShopItem(`§aSilla de Montar`, 150, "minecraft:saddle", 4, "textures/items/saddle", false, false, false, [], 100),
      new ShopItem(`§6Zanahoria con Palo`, 80, "minecraft:carrot_on_a_stick", 4, "textures/items/carrot_on_a_stick", false, false, false, [], 200),
      new ShopItem(`§cHongo Distorsionado con Palo`, 100, "minecraft:warped_fungus_on_a_stick", 4, "textures/items/warped_fungus_on_a_stick", false, false, false, [], 200)
    ];
    
    valiosos.forEach(item => shop.addItem("Valiosos", item));
    bloques.forEach(item => shop.addItem("Bloques", item));
    armas.forEach(item => shop.addItem("Armas", item));
    herramientas.forEach(item => shop.addItem("Herramientas", item));
    armadura.forEach(item => shop.addItem("Armadura", item));
    comida.forEach(item => shop.addItem("Comida", item));
    pociones.forEach(item => shop.addItem("Pociones", item));
    redstone.forEach(item => shop.addItem("Redstone", item));
    decoracion.forEach(item => shop.addItem("Decoracion", item));
    agricultura.forEach(item => shop.addItem("Agricultura", item));
    especial.forEach(item => shop.addItem("Especial", item));
    transporte.forEach(item => shop.addItem("Transporte", item));
    
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
