# 🚫 Ban System

Carpeta con el sistema completo de moderación: baneos, panel de reportes y gestión de staff.

---

## Archivos

| Archivo | Rol |
|---|---|
| `ban-system.js` | Core del sistema — gestiona baneos, persistencia y UI de ban |
| `Main.js` | Panel de reportes — jugadores reportan, staff gestiona |

---

## Propósito general

Sistema de moderación completo para servidores Bedrock. Permite banear jugadores de forma temporal o permanente con UI integrada, y un sistema de reportes donde los jugadores normales pueden reportar a otros y el staff los gestiona desde un panel.

---

## Cómo interactúa con el resto del addon

```
Main.js ──── importa ────► ban-system.js
                              │
                              ├── Dynamic Properties  (persistencia de baneos entre sesiones)
                              └── @minecraft/server-ui (ModalFormData, ActionFormData, MessageFormData)
```

---

## ban-system.js

**Responsabilidad:** Core de baneos. Gestiona el estado de jugadores baneados, aplica restricciones y persiste datos.

### Flujo interno

```
inicializarSistemaBaneos()
    ├── cargarJugadoresBaneados()        ← deserializa dynamic property "banSystem:bans"
    ├── iniciarVerificadorBaneos()        ← runInterval cada 20 ticks, limpia expirados
    └── configurarEventoJugadores()       ← playerSpawn → verificarEstadoBanJugador()
                                                  ├── expirado → removerJugadorBaneado()
                                                  ├── permanente → mostrarUIBanPermanente()
                                                  └── temporal → mostrarUIBanTemporal()
```

### Exports (API pública)

| Función | Descripción |
|---|---|
| `inicializarSistemaBaneos()` | Inicializa todo; llamar una vez en `main.js` |
| `mostrarMenuBaneos(player)` | Abre UI de gestión de baneos (solo staff) |
| `mostrarFormularioBan(player, target)` | Abre form para banear a un jugador específico |
| `aplicarBan(target, razon, duracionMin, banner)` | Ban temporal en minutos |
| `aplicarBanPermanente(target, razon, banner)` | Ban permanente |
| `estaJugadorBaneado(name)` | `true` si el jugador está baneado |
| `obtenerJugadoresBaneados()` | Retorna `Map` completo de baneos activos |
| `mostrarJugadoresBaneados(player)` | UI que lista baneados con opción de desbanear |

### Estado interno

```js
// Estructura de cada entrada en jugadoresBaneados Map:
{
  razon: string,
  baneadoPor: string,
  tiempoInicio: number,   // Date.now()
  tiempoFin: number,      // Date.now() + duracion * 60000
  permanente: boolean
}
```

### Variables clave

| Variable | Tipo | Descripción |
|---|---|---|
| `jugadoresBaneados` | `Map<string, BanData>` | Estado en memoria de todos los bans |
| `uiActiva` | `Set<string>` | Evita abrir múltiples UIs al mismo jugador |
| `intervaloBaneos` | `number` | ID del interval del verificador periódico |

---

## Main.js

**Responsabilidad:** Panel de reportes para jugadores y staff. Jugadores reportan via redstone_block; staff gestiona con opciones de advertir o banear.

### Flujo interno

```
itemUse (minecraft:redstone_block)
    ├── tiene tag "Modd" → mostrarPanelStaff()
    │       └── ver reportes → gestionar → advertir / banear (via ban-system.js)
    └── no tiene tag → mostrarFormularioReporte()
                └── selecciona víctima + razón → guardado en reportes[]
```

### Config

```js
const CONFIG = {
    STAFF_TAG: "Modd",                        // tag que identifica al staff
    REDSTONE_BLOCK_ID: "minecraft:redstone_block"  // item que abre el panel
};
```

### Variables clave

| Variable | Tipo | Descripción |
|---|---|---|
| `reportes` | `Array<ReporteData>` | Reportes en memoria (se pierden al reiniciar) |
| `RAZONES_REPORTE` | `string[]` | 10 razones predefinidas para reportar |

---

## Uso

```js
// main.js
import { inicializarSistemaBaneos } from "./Ban System/ban-system.js";
import "./Ban System/Main.js"; // se autoregistra

inicializarSistemaBaneos();
// Cualquier jugador puede usar un redstone_block para reportar
// El staff (tag "Modd") abre el panel de gestión
```

---

## Eventos utilizados

| Evento | Archivo | Cuándo |
|---|---|---|
| `world.afterEvents.playerSpawn` | `ban-system.js` | Verifica ban al entrar |
| `system.runInterval` | `ban-system.js` | Limpia baneos expirados cada 20 ticks |
| `world.afterEvents.itemUse` | `Main.js` | Detecta uso del redstone_block |

---

## Consideraciones de rendimiento

- `jugadoresBaneados` es un Map lineal — en servidores normales (<100 jugadores) sin problema.
- `reportes[]` solo vive en memoria — se pierde al reiniciar. Para persistencia real, migrar a dynamic properties.
- `uiActiva` evita stack de formularios al mismo jugador.

---

## Posibles mejoras

- Persistir reportes en dynamic properties.
- Cooldown entre reportes para evitar spam.
- Paginación en la lista de baneados para listas grandes.
- Sistema de apelaciones desde la pantalla de ban.
