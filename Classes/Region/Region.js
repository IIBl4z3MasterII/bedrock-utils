/**
 * Región cuboide entre dos esquinas (X/Z, con Y opcional). Pensada para
 * claims de terreno, zonas seguras, world edit, detección de "¿este punto
 * está dentro de este área?", etc.
 */
export class Region {
    /**
     * @param {import("@minecraft/server").Vector3} corner1
     * @param {import("@minecraft/server").Vector3} corner2
     * @param {string} [dimensionId] ej: "minecraft:overworld"
     */
    constructor(corner1, corner2, dimensionId = "minecraft:overworld") {
        this.minX = Math.min(corner1.x, corner2.x);
        this.maxX = Math.max(corner1.x, corner2.x);
        this.minY = Math.min(corner1.y, corner2.y);
        this.maxY = Math.max(corner1.y, corner2.y);
        this.minZ = Math.min(corner1.z, corner2.z);
        this.maxZ = Math.max(corner1.z, corner2.z);
        this.dimensionId = dimensionId;
    }

    /**
     * @param {import("@minecraft/server").Vector3} location
     * @param {string} [dimensionId] si se pasa, también valida que coincida la dimensión
     * @returns {boolean}
     */
    contains(location, dimensionId) {
        if (dimensionId && dimensionId !== this.dimensionId) return false;

        return (
            location.x >= this.minX && location.x <= this.maxX &&
            location.y >= this.minY && location.y <= this.maxY &&
            location.z >= this.minZ && location.z <= this.maxZ
        );
    }

    /**
     * Si esta región se superpone con otra (útil para evitar que dos claims
     * se solapen).
     * @param {Region} other
     * @returns {boolean}
     */
    overlaps(other) {
        if (other.dimensionId !== this.dimensionId) return false;

        return (
            this.minX <= other.maxX && this.maxX >= other.minX &&
            this.minY <= other.maxY && this.maxY >= other.minY &&
            this.minZ <= other.maxZ && this.maxZ >= other.minZ
        );
    }

    /**
     * @returns {import("@minecraft/server").Vector3} centro de la región
     */
    getCenter() {
        return {
            x: (this.minX + this.maxX) / 2,
            y: (this.minY + this.maxY) / 2,
            z: (this.minZ + this.maxZ) / 2,
        };
    }

    /**
     * @returns {number} volumen en bloques
     */
    getVolume() {
        return (
            (this.maxX - this.minX + 1) *
            (this.maxY - this.minY + 1) *
            (this.maxZ - this.minZ + 1)
        );
    }

    /**
     * Las dos esquinas que definen la región.
     * @returns {[import("@minecraft/server").Vector3, import("@minecraft/server").Vector3]}
     */
    getCorners() {
        return [
            { x: this.minX, y: this.minY, z: this.minZ },
            { x: this.maxX, y: this.maxY, z: this.maxZ },
        ];
    }

    /**
     * Serializa la región para guardarla en una Dynamic Property.
     * @returns {string}
     */
    toJSON() {
        return JSON.stringify({
            minX: this.minX, maxX: this.maxX,
            minY: this.minY, maxY: this.maxY,
            minZ: this.minZ, maxZ: this.maxZ,
            dimensionId: this.dimensionId,
        });
    }

    /**
     * Reconstruye una Region desde el string generado por `toJSON`.
     * @param {string} json
     * @returns {Region}
     */
    static fromJSON(json) {
        const data = JSON.parse(json);
        return new Region(
            { x: data.minX, y: data.minY, z: data.minZ },
            { x: data.maxX, y: data.maxY, z: data.maxZ },
            data.dimensionId
        );
    }
}
