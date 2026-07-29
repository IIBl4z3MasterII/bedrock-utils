# 🎯 Raycaster

Clase con métodos estáticos para saber a qué entidad o bloque está mirando
un jugador, sin repetir la config de `getEntitiesFromViewDirection` /
`getBlockFromViewDirection` en cada script.

---

## Archivos

| Archivo | Rol |
|---|---|
| `Raycaster.js` | Clase `Raycaster` |

---

## API pública

```js
import { Raycaster } from "./Classes/Raycaster/Raycaster.js";

const entity = Raycaster.getEntityLookingAt(player, 10);
if (entity) {
    player.sendMessage(`§a¡Estás mirando a un ${entity.typeId.split(":").pop()}!`);
}

const block = Raycaster.getBlockLookingAt(player);
```

| Método | Descripción |
|---|---|
| `getEntityLookingAt(player, maxDistance = 10)` | Primera entidad en la mira, o `undefined` |
| `getBlockLookingAt(player, maxDistance = 10)` | Bloque en la mira, o `undefined` |

---

<sub>Raycaster por **IIBl4z3MasterII**</sub>
