import { system } from "@minecraft/server";

/**
 * Manager de cooldowns genérico en memoria (dura mientras el server sigue
 * corriendo, se pierde en reload). Útil para limitar habilidades, comandos,
 * items con "usar cada X segundos", etc.
 *
 * @example
 * const cooldowns = new CooldownManager();
 *
 * if (cooldowns.isOnCooldown(player.id, "fireball")) {
 *     player.sendMessage("§cEspera antes de usar esto de nuevo.");
 *     return;
 * }
 * cooldowns.start(player.id, "fireball", 5 * 20); // 5 segundos (en ticks)
 */
export class CooldownManager {
    constructor() {
        /** @type {Map<string, number>} key: `${id}:${action}` -> tick de expiración */
        this._entries = new Map();
    }

    _key(id, action) {
        return `${id}:${action}`;
    }

    /**
     * @param {string} id id único (ej: player.id)
     * @param {string} action nombre de la acción en cooldown
     * @param {number} durationTicks duración en ticks (20 ticks = 1 segundo)
     */
    start(id, action, durationTicks) {
        this._entries.set(this._key(id, action), system.currentTick + durationTicks);
    }

    /**
     * @param {string} id
     * @param {string} action
     * @returns {boolean}
     */
    isOnCooldown(id, action) {
        const expires = this._entries.get(this._key(id, action));
        if (expires === undefined) return false;

        if (system.currentTick >= expires) {
            this._entries.delete(this._key(id, action));
            return false;
        }
        return true;
    }

    /**
     * Ticks restantes de cooldown (0 si no está en cooldown).
     * @param {string} id
     * @param {string} action
     * @returns {number}
     */
    getRemaining(id, action) {
        const expires = this._entries.get(this._key(id, action));
        if (expires === undefined) return 0;
        return Math.max(0, expires - system.currentTick);
    }

    clear(id, action) {
        this._entries.delete(this._key(id, action));
    }
}
