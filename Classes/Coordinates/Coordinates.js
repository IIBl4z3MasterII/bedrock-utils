import { Vector3 } from "@minecraft/server";

/**
 * Coordinates
 * ^ (local), ~ (relative)
 */
export class Coordinates {
    /**
     * Local coordinates (^X ^Y ^Z), matching `execute anchored <anchor> run ... ^x ^y ^z`.
     * +x = left, +y = up, +z = forward (same as vanilla caret notation).
     * @param {import("@minecraft/server").Entity} entity
     * @param {number} x  ^X local (left/right, + = left)
     * @param {number} y  ^Y local (up/down)
     * @param {number} z  ^Z local (forward/backward, + = forward)
     * @param {"feet"|"eyes"} anchor
     * @returns {Vector3}
     */
    static local(entity, x = 0, y = 0, z = 0, anchor = "feet") {
        const origin = anchor === "eyes" ? entity.getHeadLocation() : entity.location;
        const forward = entity.getViewDirection();

        const worldUp = { x: 0, y: 1, z: 0 };

        let right = Coordinates.#cross(forward, worldUp);
        right = Coordinates.#normalize(right);

        let up = Coordinates.#cross(right, forward);
        up = Coordinates.#normalize(up);

        return {
            x: origin.x - right.x * x + up.x * y + forward.x * z,
            y: origin.y - right.y * x + up.y * y + forward.y * z,
            z: origin.z - right.z * x + up.z * y + forward.z * z,
        };
    }

    /**
     * Relative coordinates (~X ~Y ~Z).
     * @param {import("@minecraft/server").Entity} entity
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {"feet"|"eyes"} anchor
     * @returns {Vector3}
     */
    static relative(entity, x = 0, y = 0, z = 0, anchor = "feet") {
        const origin = anchor === "eyes" ? entity.getHeadLocation() : entity.location;
        return {
            x: origin.x + x,
            y: origin.y + y,
            z: origin.z + z,
        };
    }

    /**
     * Absolute coordinates.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {Vector3}
     */
    static absolute(x, y, z) {
        return { x, y, z };
    }

    static #cross(a, b) {
        return {
            x: a.y * b.z - a.z * b.y,
            y: a.z * b.x - a.x * b.z,
            z: a.x * b.y - a.y * b.x,
        };
    }

    static #normalize(v) {
        const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        if (len === 0) return { x: 0, y: 0, z: 0 };
        return { x: v.x / len, y: v.y / len, z: v.z / len };
    }
}