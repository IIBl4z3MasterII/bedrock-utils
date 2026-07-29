import { system } from "@minecraft/server";

/**
 * Cuenta regresiva reusable con callbacks `onTick` y `onFinish`, y
 * `pause`/`resume`/`cancel`. Reemplaza el patrón repetido de armar un
 * `system.runInterval` a mano por cada script que necesita un temporizador
 * (elevadores, transformaciones con delay, rondas de minijuego, etc).
 */
export class Timer {
    /**
     * @param {number} durationSeconds duración total en segundos
     * @param {object} [callbacks]
     * @param {(secondsRemaining: number) => void} [callbacks.onTick] se llama una vez por segundo
     * @param {() => void} [callbacks.onFinish] se llama al terminar la cuenta regresiva
     */
    constructor(durationSeconds, { onTick, onFinish } = {}) {
        this.duration = durationSeconds;
        this.remaining = durationSeconds;
        this.onTick = onTick;
        this.onFinish = onFinish;

        this._runId = undefined;
        this._paused = false;
    }

    /**
     * Arranca (o reinicia) la cuenta regresiva.
     */
    start() {
        this.cancel();
        this.remaining = this.duration;
        this._paused = false;

        this._runId = system.runInterval(() => {
            if (this._paused) return;

            this.onTick?.(this.remaining);

            if (this.remaining <= 0) {
                this.cancel();
                this.onFinish?.();
                return;
            }

            this.remaining--;
        }, 20); // cada segundo
    }

    pause() {
        this._paused = true;
    }

    resume() {
        this._paused = false;
    }

    /**
     * Detiene el timer sin disparar `onFinish`.
     */
    cancel() {
        if (this._runId !== undefined) {
            system.clearRun(this._runId);
            this._runId = undefined;
        }
    }

    /**
     * @returns {boolean}
     */
    isRunning() {
        return this._runId !== undefined && !this._paused;
    }
}
