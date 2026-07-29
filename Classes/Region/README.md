# 📐 Region

Clase `Region` — cuboide entre dos esquinas, con métodos para saber si un
punto está adentro, si se superpone con otra región, su centro, volumen y
persistencia como JSON.

Es la pieza base que le falta a cosas como *Land Protection*, *World Edit*
o *SafeZone*: en vez de reimplementar "está este punto dentro de estas dos
esquinas" en cada script, la lógica vive en un solo lugar.

---

## Archivos

| Archivo | Rol |
|---|---|
| `Region.js` | Clase `Region` |

---

## API pública

```js
import { Region } from "./Classes/Region/Region.js";

const claim = new Region(
    { x: 100, y: 0, z: 200 },
    { x: 150, y: 255, z: 250 },
    player.dimension.id
);

// ¿El jugador está dentro de su claim?
if (claim.contains(player.location, player.dimension.id)) {
    player.sendMessage("§aEstás dentro de tu terreno.");
}

// ¿Se superpone con un claim ya existente? (para bloquear la compra)
if (claim.overlaps(otroClaimExistente)) {
    player.sendMessage("§cEste terreno se superpone con uno existente.");
}

// Guardar en una Dynamic Property
world.setDynamicProperty("claim:player123", claim.toJSON());

// Recuperarla después
const saved = Region.fromJSON(world.getDynamicProperty("claim:player123"));
```

| Método | Descripción |
|---|---|
| `contains(location, dimensionId?)` | `true` si el punto está dentro de la región |
| `overlaps(otherRegion)` | `true` si dos regiones se solapan |
| `getCenter()` | Punto central de la región |
| `getVolume()` | Volumen en bloques |
| `getCorners()` | Las dos esquinas `[min, max]` |
| `toJSON()` / `Region.fromJSON(json)` | Serializar/reconstruir para Dynamic Properties |

---

<sub>Region por **IIBl4z3MasterII**</sub>
