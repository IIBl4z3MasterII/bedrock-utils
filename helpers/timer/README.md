# ⏳ Timer

Clase `Timer` — cuenta regresiva con callbacks `onTick`/`onFinish` y
control de `pause`/`resume`/`cancel`. Reemplaza el `system.runInterval`
armado a mano que se repite en scripts con temporizador (ascensores,
transformaciones con delay, rondas de minijuego, eventos con countdown).

---

## Archivo

| Archivo | Rol |
|---|---|
| `index.js` | Clase `Timer` |

---

## Por qué existe

Un countdown "a mano" implica guardar el tiempo restante en una
variable, armar un `runInterval` de 20 ticks, decrementar, chequear si
llegó a cero, y limpiar el interval al terminar o cancelar. `Timer`
empaqueta ese patrón completo, con pausa incluida (algo que a mano se
suele terminar sin implementar por lo tedioso que es).

---

## API pública

| Miembro | Tipo | Descripción |
|---|---|---|
| `constructor(durationSeconds, { onTick?, onFinish? })` | — | `durationSeconds: number`; `onTick(secondsRemaining)` se llama una vez por segundo; `onFinish()` al llegar a 0 |
| `start()` | método | Arranca (o reinicia desde el total) la cuenta regresiva |
| `pause()` | método | Pausa sin perder el tiempo restante |
| `resume()` | método | Reanuda desde donde quedó |
| `cancel()` | método | Detiene el timer **sin** disparar `onFinish` |
| `isRunning()` | método → `boolean` | `true` si está corriendo y no pausado |

---

## Ejemplo de uso

```js
import { Timer } from "./helpers/timer/index.js";

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

---

## Notas

- Llamar a `start()` de nuevo mientras ya está corriendo lo **reinicia**
  desde el total (llama a `cancel()` internamente antes de arrancar de
  nuevo) — no acumula intervals duplicados.
- `pause()` no cancela el interval interno, solo ignora los ticks
  mientras `_paused` es `true` — así `resume()` es instantáneo, sin
  tener que recrear nada.
- Una instancia de `Timer` maneja **un solo** countdown — para varios
  countdowns simultáneos (ej. uno por jugador), crear una instancia por
  cada uno.

---

<sub>Timer por **IIBl4z3MasterII**</sub>
