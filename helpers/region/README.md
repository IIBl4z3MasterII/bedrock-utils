# 📐 Region

Clase `Region` — cuboide entre dos esquinas, con métodos para saber si un
punto está adentro, si se superpone con otra región, su centro, volumen,
y persistencia como JSON.

---

## Archivo

| Archivo | Rol |
|---|---|
| `index.js` | Clase `Region` |

---

## Por qué existe

Es la pieza base que necesitan sistemas como un land-claim, un World Edit
o una safezone: en vez de reimplementar "¿está este punto dentro de
estas dos esquinas?" en cada script, la lógica vive en un solo lugar,
instanciable e independiente de cualquier sistema de negocio específico.

---

## API pública

| Método | Parámetros | Devuelve | Descripción |
|---|---|---|---|
| `constructor(corner1, corner2, dimensionId?)` | `corner1, corner2: Vector3`, `dimensionId: string = "minecraft:overworld"` | `Region` | Normaliza las esquinas (no importa el orden en que las pases — calcula min/max solo) |
| `contains(location, dimensionId?)` | `location: Vector3`, `dimensionId?: string` | `boolean` | `true` si el punto está dentro del cuboide. Si pasás `dimensionId`, también valida que coincida |
| `overlaps(other)` | `other: Region` | `boolean` | `true` si dos regiones se solapan (mismo eje X/Y/Z y misma dimensión) |
| `getCenter()` | — | `Vector3` | Punto central del cuboide |
| `getVolume()` | — | `number` | Volumen en bloques (`ancho × alto × profundidad`, inclusive) |
| `getCorners()` | — | `[Vector3, Vector3]` | Las dos esquinas normalizadas `[min, max]` |
| `toJSON()` | — | `string` | Serializa la región (para guardar en una Dynamic Property) |
| `Region.fromJSON(json)` *(estático)* | `json: string` | `Region` | Reconstruye una `Region` desde el string generado por `toJSON()` |

---

## Ejemplo de uso

```js
import { Region } from "./helpers/region/index.js";

const claim = new Region(
    { x: 100, y: 0, z: 200 },
    { x: 150, y: 255, z: 250 },
    player.dimension.id
);

// ¿El jugador está dentro de su claim?
if (claim.contains(player.location, player.dimension.id)) {
    player.sendMessage("§aEstás dentro de tu terreno.");
}

// ¿Se superpone con un claim ya existente? (para bloquear la compra de uno nuevo)
if (claim.overlaps(otroClaimExistente)) {
    player.sendMessage("§cEste terreno se superpone con uno existente.");
}

// Guardar en una Dynamic Property
world.setDynamicProperty("claim:player123", claim.toJSON());

// Recuperarla después
const saved = Region.fromJSON(world.getDynamicProperty("claim:player123"));
```

---

## Notas

- `contains()` y `overlaps()` son inclusivas en los bordes (`>=`/`<=`),
  no exclusivas — un punto exactamente sobre el límite cuenta como
  "dentro".
- `overlaps()` devuelve `false` de entrada si las dos regiones están en
  dimensiones distintas — no hace falta chequearlo por separado.
- Pensada para combinarse con `WorldManager`/`DynamicStore` para
  persistir claims/zonas entre sesiones (`toJSON`/`fromJSON` existen
  justamente para eso).

---

<sub>Region por **IIBl4z3MasterII**</sub>
