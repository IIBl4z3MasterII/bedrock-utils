import { system } from "@minecraft/server";

export class CooldownManager {
    constructor() {
        this._entries = new Map();
    }

    _key(id, action) {
        return `${id}:${action}`;
    }

    start(id, action, durationTicks) {
        this._entries.set(this._key(id, action), system.currentTick + durationTicks);
    }

    isOnCooldown(id, action) {
        const expires = this._entries.get(this._key(id, action));
        if (expires === undefined) return false;
        if (system.currentTick >= expires) {
            this._entries.delete(this._key(id, action));
            return false;
        }
        return true;
    }

    getRemaining(id, action) {
        const expires = this._entries.get(this._key(id, action));
        if (expires === undefined) return 0;
        return Math.max(0, expires - system.currentTick);
    }

    clear(id, action) {
        this._entries.delete(this._key(id, action));
    }
}
