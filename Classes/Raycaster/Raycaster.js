/**
 * Métodos estáticos de raycast / detección de a qué entidad o bloque está
 * mirando un jugador.
 */
export class Raycaster {
    /**
     * Devuelve la primera entidad a la que un jugador está mirando, o
     * undefined si no hay ninguna dentro del rango.
     * @param {import("@minecraft/server").Player} player
     * @param {number} maxDistance en bloques (default 10)
     * @returns {import("@minecraft/server").Entity | undefined}
     */
    static getEntityLookingAt(player, maxDistance = 10) {
        const hits = player.getEntitiesFromViewDirection({ maxDistance });
        return hits[0]?.entity;
    }

    /**
     * Devuelve el bloque al que un jugador está mirando, o undefined.
     * @param {import("@minecraft/server").Player} player
     * @param {number} maxDistance en bloques (default 10)
     * @returns {import("@minecraft/server").Block | undefined}
     */
    static getBlockLookingAt(player, maxDistance = 10) {
        const hit = player.getBlockFromViewDirection({ maxDistance });
        return hit?.block;
    }
}
