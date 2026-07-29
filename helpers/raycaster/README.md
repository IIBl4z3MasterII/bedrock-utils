# 🎯 Raycaster

Clase con métodos estáticos para saber a qué entidad o bloque está
mirando un jugador, sin repetir la configuración de
`getEntitiesFromViewDirection`/`getBlockFromViewDirection` en cada
script.

---

## Archivo

| Archivo | Rol |
|---|---|
| `index.js` | Clase `Raycaster` |

---

## Por qué existe

Ambos métodos nativos devuelven arrays/objetos con más info de la que
casi siempre necesitás (distancia, cara del bloque golpeada, etc). Para
el caso común — "¿a qué está mirando este jugador ahora mismo?" — esta
clase devuelve directamente la entidad o el bloque, o `undefined` si no
hay nada en rango.

---

## API pública

| Método | Parámetros | Devuelve | Descripción |
|---|---|---|---|
| `getEntityLookingAt(player, maxDistance?)` | `player: Player`, `maxDistance: number = 10` | `Entity \| undefined` | Primera entidad en la línea de vista, dentro del rango |
| `getBlockLookingAt(player, maxDistance?)` | `player: Player`, `maxDistance: number = 10` | `Block \| undefined` | Bloque en la línea de vista, dentro del rango |

---

## Ejemplo de uso

```js
import { Raycaster } from "./helpers/raycaster/index.js";

const entity = Raycaster.getEntityLookingAt(player, 10);
if (entity) {
    player.sendMessage(`§a¡Estás mirando a un ${entity.typeId.split(":").pop()}!`);
}

const block = Raycaster.getBlockLookingAt(player);
if (block?.typeId === "minecraft:chest") {
    player.sendMessage("§eHay un cofre frente a vos.");
}
```

---

## Notas

- Si hay varias entidades en la línea de vista, `getEntityLookingAt`
  devuelve la primera del array que retorna la API nativa (normalmente
  la más cercana, pero no está garantizado en todos los casos —
  verificar si el orden importa para tu caso de uso).
- `maxDistance` por defecto es 10 bloques en ambos métodos — subirlo
  tiene costo de rendimiento marginal, no es un raycast pesado.

---

<sub>Raycaster por **IIBl4z3MasterII**</sub>
