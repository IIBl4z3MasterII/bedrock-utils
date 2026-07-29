import { system, world } from "@minecraft/server";

const DEG = Math.PI / 180;

export class ParticleHelper {
    static spawn(dimension, particleId, location) {
        dimension.spawnParticle(particleId, location);
    }

    static line(dimension, particleId, from, to, step = 1, options = {}) {
        const { maxDistance, player } = options;
        const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (len === 0) return;
        const steps = Math.max(1, Math.floor(len / step));
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const pos = { x: from.x + dx * t, y: from.y + dy * t, z: from.z + dz * t };
            if (maxDistance && player && !this.#inRange(player, pos, maxDistance)) continue;
            dimension.spawnParticle(particleId, pos);
        }
    }

    static circle(dimension, particleId, center, radius, options = {}) {
        const { points = 32, axis = "y", maxDistance, player } = options;
        const step = (360 / points) * DEG;
        for (let i = 0; i < points; i++) {
            const a = i * step;
            const pos = { x: center.x + radius * Math.cos(a), y: center.y, z: center.z + radius * Math.sin(a) };
            if (maxDistance && player && !this.#inRange(player, pos, maxDistance)) continue;
            dimension.spawnParticle(particleId, pos);
        }
    }

    static circleVertical(dimension, particleId, center, radius, options = {}) {
        const { points = 32, axis = "z", maxDistance, player } = options;
        const step = (360 / points) * DEG;
        for (let i = 0; i < points; i++) {
            const a = i * step;
            const x = center.x + radius * Math.cos(a);
            const y = center.y + radius * Math.sin(a);
            const pos = axis === "z"
                ? { x, y, z: center.z }
                : { x: center.x, y, z: center.z + radius * Math.cos(a) };
            if (maxDistance && player && !this.#inRange(player, pos, maxDistance)) continue;
            dimension.spawnParticle(particleId, pos);
        }
    }

    static sphere(dimension, particleId, center, radius, options = {}) {
        const { rings = 12, pointsPerRing = 24, maxDistance, player } = options;
        for (let r = 0; r < rings; r++) {
            const phi = (r / rings) * Math.PI;
            const ringRadius = radius * Math.sin(phi);
            const y = center.y + radius * Math.cos(phi);
            for (let p = 0; p < pointsPerRing; p++) {
                const theta = (p / pointsPerRing) * Math.PI * 2;
                const pos = { x: center.x + ringRadius * Math.cos(theta), y, z: center.z + ringRadius * Math.sin(theta) };
                if (maxDistance && player && !this.#inRange(player, pos, maxDistance)) continue;
                dimension.spawnParticle(particleId, pos);
            }
        }
    }

    static cubeOutline(dimension, particleId, from, to, options = {}) {
        const { step = 1, maxDistance, player } = options;
        const edges = [
            [from, { x: to.x, y: from.y, z: from.z }],
            [from, { x: from.x, y: to.y, z: from.z }],
            [from, { x: from.x, y: from.y, z: to.z }],
            [{ x: to.x, y: from.y, z: from.z }, { x: to.x, y: to.y, z: from.z }],
            [{ x: to.x, y: from.y, z: from.z }, { x: to.x, y: from.y, z: to.z }],
            [{ x: from.x, y: to.y, z: from.z }, { x: to.x, y: to.y, z: from.z }],
            [{ x: from.x, y: to.y, z: from.z }, { x: from.x, y: to.y, z: to.z }],
            [{ x: from.x, y: from.y, z: to.z }, { x: to.x, y: from.y, z: to.z }],
            [{ x: from.x, y: from.y, z: to.z }, { x: from.x, y: to.y, z: to.z }],
            [{ x: to.x, y: from.y, z: to.z }, { x: to.x, y: to.y, z: to.z }],
            [{ x: to.x, y: to.y, z: from.z }, { x: to.x, y: to.y, z: to.z }],
            [{ x: from.x, y: to.y, z: to.z }, { x: to.x, y: to.y, z: to.z }],
        ];
        for (const [a, b] of edges) {
            this.line(dimension, particleId, a, b, step, { maxDistance, player });
        }
    }

    static perimeter(dimension, particleId, centerX, centerZ, radius, options = {}) {
        const { step = 2, heightOffsets = [-0.5, 0.5, 1.5], playerY, maxDistance, player } = options;
        const minX = centerX - radius, maxX = centerX + radius + 1;
        const minZ = centerZ - radius, maxZ = centerZ + radius + 1;
        const pts = [];
        for (let x = minX; x <= maxX; x += step) { pts.push({ x, z: minZ }); pts.push({ x, z: maxZ }); }
        for (let z = minZ + step; z < maxZ; z += step) { pts.push({ x: minX, z }); pts.push({ x: maxX, z }); }
        const yBase = playerY ?? 0;
        for (const pt of pts) {
            if (maxDistance && player && !this.#inRange(player, pt, maxDistance)) continue;
            for (const off of heightOffsets) {
                dimension.spawnParticle(particleId, { x: pt.x, y: yBase + off, z: pt.z });
            }
        }
    }

    static showBorder(player, center, radius, dimensionId, options = {}) {
        const { particleId = "minecraft:endrod", interval = 8, maxDistance = 28, autoStopSeconds = 300, centerParticle = "minecraft:villager_happy" } = options;
        this.#stopBorder(player.id);
        const cx = center.x, cz = center.z;
        const pts = this.#buildPerimeterPoints(cx, cz, radius);
        const MAX_DIST_SQ = maxDistance * maxDistance;
        const intervalId = system.runInterval(() => {
            if (!player.isValid) { this.#stopBorder(player.id); return; }
            const y = player.location.y;
            const px = player.location.x;
            const pz = player.location.z;
            const dim = world.getDimension(dimensionId);
            const hr = dim.heightRange;
            const minY = hr.min, maxY = hr.max - 1;
            const heights = [y - 0.5, y + 0.5, y + 1.5].filter(h => h >= minY && h <= maxY);
            for (const pt of pts) {
                const dx = pt.x - px, dz = pt.z - pz;
                if (dx * dx + dz * dz > MAX_DIST_SQ) continue;
                for (const h of heights) { dim.spawnParticle(particleId, { x: pt.x, y: h, z: pt.z }); }
            }
            const cdx = cx + 0.5 - px, cdz = cz + 0.5 - pz;
            if (cdx * cdx + cdz * cdz <= MAX_DIST_SQ) {
                const centerHeights = [y + 0.5, y + 1.5, y + 2.5].filter(h => h >= minY && h <= maxY);
                for (const ch of centerHeights) { dim.spawnParticle(centerParticle, { x: cx + 0.5, y: ch, z: cz + 0.5 }); }
            }
        }, interval);
        const timeoutId = system.runTimeout(() => {
            if (player.isValid) player.sendMessage("Borders desactivados automaticamente.");
            this.#stopBorder(player.id);
        }, interval * autoStopSeconds);
        this.#borderData.set(player.id, { intervalId, timeoutId });
    }

    static hideBorder(playerId) { this.#stopBorder(playerId); }

    static #borderData = new Map();

    static #stopBorder(playerId) {
        const data = this.#borderData.get(playerId);
        if (data) {
            try { system.clearRun(data.intervalId); } catch { }
            try { system.clearRun(data.timeoutId); } catch { }
            this.#borderData.delete(playerId);
        }
    }

    static #buildPerimeterPoints(cx, cz, radius) {
        const minX = cx - radius, maxX = cx + radius + 1;
        const minZ = cz - radius, maxZ = cz + radius + 1;
        const step = 2;
        const pts = [];
        for (let x = minX; x <= maxX; x += step) { pts.push({ x, z: minZ }); pts.push({ x, z: maxZ }); }
        for (let z = minZ + step; z < maxZ; z += step) { pts.push({ x: minX, z }); pts.push({ x: maxX, z }); }
        return pts;
    }

    static #inRange(player, pos, maxDistance) {
        const loc = player.location;
        const dx = pos.x - loc.x, dz = pos.z - loc.z;
        return (dx * dx + dz * dz) <= maxDistance * maxDistance;
    }

    static trail(entity, particleId, options = {}) {
        const { interval = 2, duration = 100, maxDistance, player } = options;
        let ticks = 0;
        const id = system.runInterval(() => {
            if (!entity.isValid || ticks >= duration) { try { system.clearRun(id); } catch { } return; }
            const pos = entity.location;
            if (maxDistance && player && !this.#inRange(player, pos, maxDistance)) return;
            entity.dimension.spawnParticle(particleId, pos);
            ticks++;
        }, interval);
        return id;
    }

    static #onPlayerLeave({ playerId }) { ParticleHelper.#stopBorder(playerId); }

    static { world.afterEvents.playerLeave.subscribe(ParticleHelper.#onPlayerLeave); }
}
