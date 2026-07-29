export class Raycaster {
    static getEntityLookingAt(player, maxDistance = 10) {
        const hits = player.getEntitiesFromViewDirection({ maxDistance });
        return hits[0]?.entity;
    }

    static getBlockLookingAt(player, maxDistance = 10) {
        const hit = player.getBlockFromViewDirection({ maxDistance });
        return hit?.block;
    }
}
