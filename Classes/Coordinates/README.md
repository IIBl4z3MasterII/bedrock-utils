# 🧭 Coordinates

Clase estática con métodos para resolver coordenadas de forma equivalente
a la notación vanilla de `/execute`: local (`^ ^ ^`), relativa (`~ ~ ~`) y
absoluta.

---

## Archivos

| Archivo | Rol |
|---|---|
| `Coordinates.js` | Clase `Coordinates` — métodos estáticos de conversión de coordenadas |

---

## Propósito general

Cuando necesitás posicionar algo relativo a la vista/orientación de una
entidad (ej: spawnear un proyectil "adelante" del jugador, o un efecto
"a la izquierda"), replicar esa lógica a mano con vectores es repetitivo
y fácil de romper. `Coordinates` encapsula esa matemática una sola vez.

---

## API pública

### `Coordinates.local(entity, x, y, z, anchor)`

Equivalente a `^X ^Y ^Z` de `/execute anchored`. Usa la dirección de vista
de la entidad como eje: `+x` = izquierda, `+y` = arriba, `+z` = adelante.

```js
import { Coordinates } from "./Classes/Coordinates/Coordinates.js";

// Punto 2 bloques adelante y 1 arriba de la vista del jugador
const spawnPoint = Coordinates.local(player, 0, 1, 2);
player.dimension.spawnEntity("minecraft:arrow", spawnPoint);
```

- `entity`: entidad de referencia (jugador, mob, etc).
- `x, y, z`: offsets locales (default `0`).
- `anchor`: `"feet"` (default) o `"eyes"` — desde dónde se calcula el origen.

### `Coordinates.relative(entity, x, y, z, anchor)`

Equivalente a `~X ~Y ~Z`. Suma el offset directamente a los ejes del mundo,
sin rotar según hacia dónde mira la entidad.

```js
// 3 bloques arriba de la posición actual del jugador, sin importar hacia dónde mira
const above = Coordinates.relative(player, 0, 3, 0);
```

### `Coordinates.absolute(x, y, z)`

Devuelve `{ x, y, z }` tal cual — solo por consistencia de API con los
otros dos métodos (para no mezclar objetos `Vector3` armados a mano con
los generados acá).

---

## Nota

Los métodos `#cross` y `#normalize` son privados (álgebra vectorial interna),
no forman parte de la API pública de la clase.

---

<sub>Coordinates por **IIBl4z3MasterII**</sub>
