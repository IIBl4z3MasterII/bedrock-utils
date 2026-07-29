# ⏳ Timer

Clase `Timer` — cuenta regresiva con `onTick`/`onFinish` y control de
pausa/resume/cancel. Reemplaza el `system.runInterval` armado a mano que
se repite en scripts con temporizador (ascensores, transformaciones con
delay, rondas de minijuego, eventos con countdown).

---

## Archivos

| Archivo | Rol |
|---|---|
| `Timer.js` | Clase `Timer` |

---

## API pública

```js
import { Timer } from "./Classes/Timer/Timer.js";

const countdown = new Timer(10, {
    onTick: (secondsRemaining) => {
        if (secondsRemaining <= 5 || secondsRemaining % 5 === 0) {
            player.sendMessage(`§e${secondsRemaining}s restantes...`);
        }
    },
    onFinish: () => {
        player.sendMessage("§2¡Tiempo cumplido!");
        swapEntities(player);
    },
});

countdown.start();

// countdown.pause();
// countdown.resume();
// countdown.cancel(); // detiene sin disparar onFinish
```

| Método | Descripción |
|---|---|
| `start()` | Arranca (o reinicia) la cuenta regresiva |
| `pause()` / `resume()` | Pausa/reanuda sin perder el tiempo restante |
| `cancel()` | Detiene sin disparar `onFinish` |
| `isRunning()` | `true` si está corriendo y no pausado |

---

<sub>Timer por **IIBl4z3MasterII**</sub>
