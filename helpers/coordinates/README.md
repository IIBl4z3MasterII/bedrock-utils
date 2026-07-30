# 🧭 Coordinates

Clase estática con métodos para resolver coordenadas de forma equivalente
a la notación vanilla de `/execute`: local (`^ ^ ^`), relativa (`~ ~ ~`) y
absoluta.

---

## Archivo

| Archivo | Rol |
|---|---|
| `index.js` | Clase `Coordinates` |

---

## Por qué existe

Cuando necesitás posicionar algo relativo a la vista/orientación de una
entidad (ej: spawnear un proyectil "adelante" del jugador, un efecto "a
la izquierda", una partícula "arriba de la cabeza mirando hacia donde
mira"), replicar esa matemática de vectores a mano es repetitivo y fácil
de romper. `Coordinates` encapsula esa lógica una sola vez, igual que
`/execute anchored ... run ... ^ ^ ^` lo hace en comandos.

---

## API pública

### `Coordinates.local(entity, x, y, z, anchor)`

Equivalente a `^X ^Y ^Z`. Usa la dirección de vista de la entidad como
eje: `+x` = izquierda, `+y` = arriba, `+z` = adelante.

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `entity` | `Entity` | — | Entidad de referencia |
| `x, y, z` | `number` | `0` | Offsets locales |
| `anchor` | `"feet" \| "eyes"` | `"feet"` | Desde dónde se calcula el origen |

```js
import { Coordinates } from "./helpers/coordinates/index.js";

// Punto 2 bloques adelante y 1 arriba de la vista del jugador
const spawnPoint = Coordinates.local(player, 0, 1, 2);
player.dimension.spawnEntity("minecraft:arrow", spawnPoint);
```

### `Coordinates.relative(entity, x, y, z, anchor)`

Equivalente a `~X ~Y ~Z`. Suma el offset directo a los ejes del mundo,
sin rotar según hacia dónde mira la entidad.

```js
// 3 bloques arriba de la posición actual, sin importar hacia dónde mira
const above = Coordinates.relative(player, 0, 3, 0);
```

### `Coordinates.absolute(x, y, z)`

Devuelve `{ x, y, z }` tal cual — solo por consistencia de API con los
otros dos métodos (para no mezclar objetos armados a mano con los que
genera esta clase).

---

## Cómo funciona por dentro

`local()` arma una base ortonormal (`forward`, `right`, `up`) a partir de
la dirección de vista de la entidad usando producto cruz (`#cross`) y
normalización (`#normalize`) — ambos métodos privados, no forman parte de
la API pública.

---

## Notas

- `local()` con `y` distinto de 0 puede dar resultados poco intuitivos si
  la entidad mira muy hacia arriba/abajo (el "up" calculado se vuelve
  inestable cerca de los polos — problema clásico de bases ortonormales
  desde un solo vector). Para la mayoría de casos de juego (spawnear
  cosas frente al jugador) no es un problema perceptible.

---

<sub>Coordinates por **IIBl4z3MasterII**</sub>
