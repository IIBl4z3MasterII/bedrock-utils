# ⏳ Timer

`Timer` class — countdown with callbacks `onTick`/`onFinish` and
`pause`/`resume`/`cancel` control. Replaces `system.runInterval`
hand-assembled that is repeated in timer scripts (elevators,
transformations with delay, minigame rounds, events with countdown).

---

## Archive

| Archive | Role |
|---|---|
| `index.js` | `Timer` class |

---

## Why does it exist

A "hand" countdown involves saving the remaining time in a
variable, create a `runInterval` of 20 ticks, decrement, check if
reached zero, and clear the interval upon completion or cancel. `Timer`
packs that complete pattern, with pause included (something that can be done by hand).
usually ends up not implemented because it is so tedious).

---

## Public API

| Member | Type | Description |
|---|---|---|
| `constructor(durationSeconds, {onTick?, onFinish? })` | — | `durationSeconds: number`; `onTick(secondsRemaining)` is called once per second; `onFinish()` upon reaching 0 |
| `start()` | method | Start (or restart from total) the countdown |
| `pause()` | method | Pause without wasting the remaining time |
| `resume()` | method | Resume from where you left off |
| `cancel()` | method | Stops the timer **without** firing `onFinish` |
| `isRunning()` | method → ​​`boolean` | `true` if running and not paused |

---

## Usage example

```js
import { Timer } from "./helpers/timer/index.js";

const countdown = new Timer(10, {
    onTick: (secondsRemaining) => {
        if (secondsRemaining <= 5 || secondsRemaining % 5 === 0) {
            player.sendMessage(`§e${secondsRemaining}s restantes...`);
        }
    },
    onFinish: () => {
        player.sendMessage("§2Time's up!");
        swapEntities(player);
    },
});

countdown.start();

// countdown.pause();
// countdown.resume();
// countdown.cancel(); // detiene sin disparar onFinish
```

---

## Grades

- Calling `start()` again while it is already running **restarts it**
from total (calls `cancel()` internally before booting from
new) — does not accumulate duplicate intervals.
- `pause()` does not cancel the internal interval, it just ignores the ticks
while `_paused` is `true` — so `resume()` is instantaneous, without
having to recreate anything.
- An instance of `Timer` handles **a single** countdown — for several
simultaneous countdowns (e.g. one per player), create one instance per
each.

---

<sub>Timer by **IIBl4z3MasterII**</sub>
