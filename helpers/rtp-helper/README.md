# 🌀 RtpHelper

Sistema de Random Teleport (RTP) autocontenido: fase de "quedate quieto",
búsqueda de ubicación segura en múltiples dimensiones, cooldown,
cancelación si el jugador se mueve, efectos de teletransporte y limpieza
automática de estado al desconectarse o al apagar el servidor.

---

## Archivo

| Archivo | Rol |
|---|---|
| `index.js` | Clase `RtpHelper` |

---

## Por qué existe

Un RTP "bien hecho" no es solo `player.teleport(random)` — hay que evitar
teletransportar a alguien a lava, a media pared, o a un punto ya ocupado;
dar feedback visual mientras busca; permitir cancelar si el jugador se
mueve durante la cuenta regresiva; y limpiar todo si el jugador se
desconecta a mitad del proceso. Esta clase resuelve las cuatro fases
(espera → búsqueda → teletransporte → cooldown) como una sola unidad
configurable.

---

## Config (constructor)

```js
const rtp = new RtpHelper({
    cooldownMs: 60000,        // tiempo entre usos por jugador
    stillTimeMs: 5000,        // segundos que hay que quedarse quieto antes de buscar
    searchRadius: 2000,       // radio de búsqueda alrededor de startX/startZ
    startX: 0,
    startZ: 0,
    maxSearchTicks: 6000,     // límite de ticks buscando antes de cancelar
    safeBlockIds: [ /* bloques donde SÍ puede aparecer */ ],
    unsafeBlockIds: [ /* bloques donde NUNCA debe aparecer */ ],
    dimensionConfigs: {
        "minecraft:overworld": { minY: -60, maxY: 319, name: "Overworld" },
        "minecraft:nether":    { minY: 0,   maxY: 127, name: "Nether" },
        "minecraft:the_end":   { minY: 0,   maxY: 255, name: "End" },
    },
    onNotify: (player, title, message) => player.sendMessage(`§8[§6RTP§8] §7${title}: §f${message}`),
});
```

Todos los campos son opcionales — los valores de arriba son los
defaults. `onNotify` es lo que te permite cambiar el idioma/formato de
los mensajes sin tocar el código interno de la clase.

---

## API pública

| Método | Parámetros | Devuelve | Descripción |
|---|---|---|---|
| `rtp(player, targetDimension?)` | `player: Player`, `targetDimension?: Dimension \| string` | `boolean` | Inicia el RTP. `targetDimension` acepta ahora una instancia `Dimension` **o** un id (`"minecraft:the_end"`) — se resuelve con `world.getDimension()`. `false` si está en cooldown o ya hay un RTP en curso para ese jugador |
| `cancel(player)` | `player: Player` | `void` | Cancela manualmente un RTP en curso (fase de espera o de búsqueda) |

---

## Fases internas

```
rtp(player)
  ├── ¿en cooldown? → onNotify("Cooldown", ...) y aborta
  ├── fase de espera (stillTimeMs)
  │     tag "rtp_waiting" · si se mueve → cancela con "movimiento detectado"
  ├── fase de búsqueda (system.runJob, generador)
  │     tag "rtp" · cámara libre mirando hacia abajo mientras busca
  │     cada 100 ticks reintenta un nuevo punto aleatorio si no encontró nada
  │     si supera maxSearchTicks → cancela con "no se encontró ubicación segura"
  └── teletransporte final
        limpia cámara · teleport · partículas + sonido · onNotify("RTP exitoso", ...)
        arranca cooldown
```

La búsqueda de "ubicación segura" (`#isLocationSafe`/`#findSafeLocation`)
exige: bloque sólido debajo, dos bloques de aire libres arriba, que el
bloque no esté en `unsafeBlockIds`, y que sí esté en `safeBlockIds`. En
el Nether escanea de `minY` a `maxY`; en el resto, intenta primero
`getTopmostBlock` y si no es seguro escanea de arriba hacia abajo.

---

## Limpieza automática

Se registra sola en el constructor (`#initCleanup`), no hace falta
llamarla:

| Evento | Acción |
|---|---|
| `playerSpawn` (spawn inicial) | Limpia estado previo y tags residuales |
| `playerLeave` | Limpia estado y cancela cualquier timer/job activo |
| `system.beforeEvents.shutdown` | Cancela todos los jobs/intervals activos de todos los jugadores |

---

## Ejemplo de uso

```js
import { RtpHelper } from "./helpers/rtp-helper/index.js";

const rtp = new RtpHelper({ cooldownMs: 30000, searchRadius: 5000 });

world.afterEvents.itemUse.subscribe((event) => {
    if (event.itemStack.typeId === "minecraft:ender_pearl") {
        rtp.rtp(event.source, event.source.dimension);
    }
});

// Cancelar manualmente (ej. desde un botón de UI)
rtp.cancel(player);
```

---

## Notas

- Una sola instancia de `RtpHelper` puede manejar a todos los jugadores
  del servidor a la vez (el estado se guarda por `player.id` en un `Map`
  interno) — no hace falta una instancia por jugador.
- Durante la búsqueda, el jugador es teletransportado internamente en
  cada tick de escaneo, pero con la cámara en modo libre (`minecraft:free`)
  mirando hacia abajo, para que no sienta el movimiento — es un efecto
  visual de "cámara buscando desde el cielo", no el jugador viendo su
  propio personaje temblar.
- Los mensajes de `onNotify` están hardcodeados en español dentro de la
  clase (`"Preparando RTP"`, `"Buscando ubicación"`, etc.) — si necesitás
  otro idioma, se resuelve pasando tu propio `onNotify` en la config.

---

<sub>RtpHelper por **IIBl4z3MasterII**</sub>
