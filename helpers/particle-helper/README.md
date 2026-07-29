# ✨ ParticleHelper

Clase con métodos estáticos para dibujar formas geométricas con
partículas (línea, círculo, esfera, cubo, perímetro), más un sistema de
borde animado para zonas/claims y un trail para entidades en movimiento.

---

## Archivo

| Archivo | Rol |
|---|---|
| `index.js` | Clase `ParticleHelper` |

---

## Por qué existe

Dibujar una figura con partículas siempre es el mismo problema: calcular
N puntos sobre una curva/superficie y llamar a `spawnParticle` en cada
uno. Esta clase resuelve la matemática de las formas más comunes una sola
vez, con filtro de distancia opcional para no gastar partículas en
jugadores lejos que no las van a ver.

---

## API pública — formas geométricas

Todas reciben `dimension` (o `entity`, según el método) y `particleId`
como primeros parámetros, y devuelven `undefined` (solo tienen efecto
secundario de spawnear partículas).

| Método | Parámetros clave | Descripción |
|---|---|---|
| `spawn(dimension, particleId, location)` | `location: Vector3` | Spawnea una sola partícula (wrapper directo, para consistencia de API) |
| `line(dimension, particleId, from, to, step?, options?)` | `step: number = 1` | Línea recta entre dos puntos, un punto cada `step` bloques |
| `circle(dimension, particleId, center, radius, options?)` | `options.points = 32`, `options.axis = "y"` | Círculo horizontal (plano XZ) |
| `circleVertical(dimension, particleId, center, radius, options?)` | `options.points = 32`, `options.axis = "z" \| "x"` | Círculo vertical — `axis` define el eje de rotación |
| `sphere(dimension, particleId, center, radius, options?)` | `options.rings = 12`, `options.pointsPerRing = 24` | Esfera completa (anillos de latitud × puntos por anillo) |
| `cubeOutline(dimension, particleId, from, to, options?)` | `options.step = 1` | Contorno de un cubo/prisma (las 12 aristas, reusa `line()` internamente) |
| `perimeter(dimension, particleId, centerX, centerZ, radius, options?)` | `options.heightOffsets = [-0.5, 0.5, 1.5]` | Borde cuadrado a nivel de suelo, en varias alturas relativas (útil para marcar el límite de un terreno) |

Opciones comunes a `line`, `circle`, `sphere`, `perimeter`:

- `options.maxDistance` + `options.player`: si se pasan ambos, solo
  spawnea partículas dentro de esa distancia del jugador (optimización
  para no renderizar formas grandes completas si el jugador está lejos
  de una parte).

```js
import { ParticleHelper } from "./helpers/particle-helper/index.js";

ParticleHelper.circle(player.dimension, "minecraft:endrod", player.location, 5);

ParticleHelper.sphere(player.dimension, "minecraft:heart_particle", center, 3, {
    rings: 8, pointsPerRing: 16,
});

ParticleHelper.cubeOutline(player.dimension, "minecraft:endrod", corner1, corner2);
```

---

## `ParticleHelper.showBorder(player, center, radius, dimensionId, options?)`

Sistema completo de borde animado (cuadrado) con auto-stop y filtro de
distancia — para mostrarle a un jugador el límite de una zona (claim,
región de World Edit, safezone, etc). No depende de ningún sistema
externo: le pasás centro/radio/dimensión directo.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `player` | `Player` | A quién se le muestra el borde |
| `center` | `{ x, z }` | Centro de la zona |
| `radius` | `number` | Radio en bloques |
| `dimensionId` | `string` | ej. `"minecraft:overworld"` |
| `options.particleId` | `string` | Partícula del borde (default `"minecraft:endrod"`) |
| `options.interval` | `number` | Ticks entre frames (default `8`) |
| `options.maxDistance` | `number` | Radio de render alrededor del jugador (default `28`) |
| `options.autoStopSeconds` | `number` | Auto-apagado (default `300`) |
| `options.centerParticle` | `string` | Partícula del centro (default `"minecraft:villager_happy"`) |

```js
// Borde de claim (le pasás los datos de tu propio sistema, esta clase no lo conoce)
ParticleHelper.showBorder(
    player,
    { x: claimData.centerX, z: claimData.centerZ },
    claimData.level * 5,
    claimData.dimension,
    { particleId: "minecraft:endrod", maxDistance: 28, autoStopSeconds: 300 }
);
```

`ParticleHelper.hideBorder(playerId)` lo apaga manualmente antes de
tiempo. Se limpia solo si el jugador se desconecta (registrado en un
`static {}` init block dentro de la clase, no hace falta llamarlo).

---

## `ParticleHelper.trail(entity, particleId, options?)`

Deja un rastro de partículas detrás de una entidad en movimiento durante
un tiempo limitado.

| Opción | Default | Descripción |
|---|---|---|
| `options.interval` | `2` | Ticks entre cada partícula |
| `options.duration` | `100` | Ticks totales que dura el trail |
| `options.maxDistance` + `options.player` | — | Igual que en las formas: filtra por distancia al jugador |

Devuelve el `id` del `runInterval` (por si querés cancelarlo antes con
`system.clearRun(id)`).

---

## Notas de diseño

- Los métodos de forma son **puros respecto al mundo del juego** — no
  guardan estado propio, solo `showBorder`/`hideBorder` usan un `Map`
  interno privado (`#borderData`) para trackear qué jugadores tienen un
  borde activo.
- A propósito, ningún método asume la forma de un objeto de dominio
  específico (como un `claim`) — todos reciben coordenadas/radio/id de
  dimensión directo, para que la clase sirva en cualquier proyecto, no
  solo en el de terrenos.
- `circleVertical` con `axis: "x"` gira en el plano Y-Z; con `axis: "z"`
  (default) gira en el plano X-Y.

---

<sub>ParticleHelper por **IIBl4z3MasterII**</sub>
