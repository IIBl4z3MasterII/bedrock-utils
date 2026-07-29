# ⏱️ Cooldown

Clase `CooldownManager` para limitar habilidades, comandos o items con
"usar cada X segundos", sin repetir la lógica de `Map` + timestamps en
cada sistema que la necesite.

---

## Archivo

| Archivo | Rol |
|---|---|
| `index.js` | Clase `CooldownManager` |

---

## Por qué existe

Cualquier sistema con una acción limitada por tiempo (espada especial,
comando `/kit`, botón de teletransporte) termina reimplementando el mismo
patrón: guardar un timestamp, compararlo con el tick actual, limpiarlo si
ya venció. `CooldownManager` centraliza eso en una sola clase reusable en
memoria, con cooldowns independientes por `id` + `action`.

---

## Cómo funciona por dentro

Guarda cada cooldown activo en un `Map` interno con clave `` `${id}:${action}` ``
y valor = tick de expiración (`system.currentTick + duración`). Vive
mientras el servidor sigue corriendo — no persiste entre reinicios (para
eso, combinar con `WorldManager`/`DynamicStore`).

---

## API pública

| Método | Parámetros | Devuelve | Descripción |
|---|---|---|---|
| `start(id, action, durationTicks)` | `id: string`, `action: string`, `durationTicks: number` | `void` | Inicia (o reinicia) el cooldown |
| `isOnCooldown(id, action)` | `id, action: string` | `boolean` | `true` si sigue activo; limpia la entrada sola si ya expiró |
| `getRemaining(id, action)` | `id, action: string` | `number` | Ticks restantes (`0` si no está en cooldown) |
| `clear(id, action)` | `id, action: string` | `void` | Cancela el cooldown manualmente antes de que expire |

`20 ticks = 1 segundo`.

---

## Ejemplo de uso

```js
import { CooldownManager } from "./helpers/cooldown/index.js";
import { world } from "@minecraft/server";

const cooldowns = new CooldownManager();

world.afterEvents.itemUse.subscribe((event) => {
    const player = event.source;

    if (cooldowns.isOnCooldown(player.id, "fireball")) {
        const seg = Math.ceil(cooldowns.getRemaining(player.id, "fireball") / 20);
        player.sendMessage(`§cEspera ${seg}s antes de usar esto de nuevo.`);
        return;
    }

    cooldowns.start(player.id, "fireball", 5 * 20); // 5 segundos
    // ... lanzar fireball
});
```

---

## Notas

- Un `id` puede tener varios cooldowns simultáneos siempre que usen
  `action` distinto (ej. `"fireball"` y `"heal"` para el mismo jugador).
- No es thread-safe ni pensado para multi-servidor — es memoria local a
  la instancia del script.

---

<sub>Cooldown por **IIBl4z3MasterII**</sub>
