# ⏱️ Cooldown

Clase `CooldownManager` para limitar habilidades, comandos o items con
"usar cada X segundos", sin repetir la lógica de Map + timestamps en cada
sistema.

---

## Archivos

| Archivo | Rol |
|---|---|
| `Cooldown.js` | Clase `CooldownManager` |

---

## Propósito general

Guarda cooldowns en memoria (`Map<id:action, tickExpiración>`), viven
mientras el servidor sigue corriendo. Pensado para casos como: cooldown de
una espada especial por jugador, cooldown de un comando por jugador, etc.

---

## API pública

```js
import { CooldownManager } from "./Classes/Cooldown/Cooldown.js";

const cooldowns = new CooldownManager();

world.afterEvents.itemUse.subscribe((event) => {
    const player = event.source;

    if (cooldowns.isOnCooldown(player.id, "fireball")) {
        const seg = Math.ceil(cooldowns.getRemaining(player.id, "fireball") / 20);
        player.sendMessage(`§cEspera ${seg}s antes de usar esto de nuevo.`);
        return;
    }

    cooldowns.start(player.id, "fireball", 5 * 20); // 5 segundos (100 ticks)
    // ... lanzar fireball
});
```

| Método | Descripción |
|---|---|
| `start(id, action, durationTicks)` | Inicia el cooldown |
| `isOnCooldown(id, action)` | `true`/`false`, y limpia la entrada si ya expiró |
| `getRemaining(id, action)` | Ticks restantes (`0` si no está en cooldown) |
| `clear(id, action)` | Cancela el cooldown manualmente |

---

<sub>Cooldown por **IIBl4z3MasterII**</sub>
