import { system } from "@minecraft/server";

export class Timer {
    constructor(durationSeconds, { onTick, onFinish } = {}) {
        this.duration = durationSeconds;
        this.remaining = durationSeconds;
        this.onTick = onTick;
        this.onFinish = onFinish;
        this._runId = undefined;
        this._paused = false;
    }

    start() {
        this.cancel();
        this.remaining = this.duration;
        this._paused = false;
        this._runId = system.runInterval(() => {
            if (this._paused) return;
            this.onTick?.(this.remaining);
            if (this.remaining <= 0) { this.cancel(); this.onFinish?.(); return; }
            this.remaining--;
        }, 20);
    }

    pause() { this._paused = true; }
    resume() { this._paused = false; }

    cancel() {
        if (this._runId !== undefined) {
            system.clearRun(this._runId);
            this._runId = undefined;
        }
    }

    isRunning() { return this._runId !== undefined && !this._paused; }
}
