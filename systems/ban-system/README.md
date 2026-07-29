# 🚫 Ban System

Sistema de moderación completo: reportes entre jugadores, panel de staff,
y baneos temporales/permanentes con UI integrada.

---

## Archivo

| Archivo | Rol |
|---|---|
| `index.js` | Todo el sistema — reportes + baneos, un solo módulo |

---

## Propósito general

Cubre dos flujos que suelen ir juntos en servidores con moderación
comunitaria:

1. **Reportes**: cualquier jugador reporta a otro (razón, seriedad,
   descripción, evidencia opcional) desde un form.
2. **Baneos**: el staff (identificado por un tag) resuelve esos reportes
   con advertencia o ban, o banea directamente desde un panel — con
   duración en minutos/segundos o permanente.

---

## Cómo se activa

```js
import { inicializarSistemaBaneos } from "./systems/ban-system/index.js";

inicializarSistemaBaneos(); // llamar una vez en tu main.js
```

Esto: carga los baneos existentes, arranca el verificador periódico de
expiración, y registra el chequeo de ban al conectarse un jugador.

Para abrir el flujo de reportes/panel desde algún trigger propio (item,
comando, bloque), llamá a las funciones exportadas — el módulo no decide
solo cuándo mostrar la UI de reportes, eso lo conectás vos.

---

## Config

```js
const CONFIG = {
    STAFF_TAG: "Modd",                              // tag que identifica al staff
    REDSTONE_BLOCK_ID: "minecraft:redstone_block",  // (referencia legada, no se usa como trigger acá)
};
```

Para cambiar qué tag identifica al staff, editar `CONFIG.STAFF_TAG`
directamente en `index.js`.

---

## Persistencia: tags de jugador, no Dynamic Properties

**Importante:** este sistema guarda el estado de baneo en **tags del
jugador** (`bannedUntil:...`, `permabanned`, `banReason:...`,
`bannedBy:...`, `banDate:...`), no en Dynamic Properties del mundo. Al
cargar (`cargarJugadoresBaneados` → `migrarDatosLegacyBan`), lee esos
tags de cada jugador conectado, los pasa a un `Map` en memoria
(`jugadoresBaneados`), y **borra los tags legacy** una vez migrados
(`removerTagsLegacy`).

Esto significa:
- El estado real "vive" en memoria mientras el mundo está corriendo — el
  `Map` es la fuente de verdad después de la migración inicial.
- Los tags solo importan para jugadores que **ya estaban baneados antes**
  de que este sistema corriera por primera vez, o si el mundo se
  reinicia sin que el jugador haya vuelto a conectarse (en ese caso, se
  vuelve a leer del tag al reconectarse).
- Si necesitás persistencia más robusta entre reinicios sin depender de
  que el jugador esté online, considerá migrar `jugadoresBaneados` a
  `WorldManager`/`DynamicStore` (ver `systems/world-manager/`).

---

## API pública

### Baneos

| Función | Parámetros | Descripción |
|---|---|---|
| `inicializarSistemaBaneos()` | — | Arranca todo: carga datos, verificador periódico, listener de conexión |
| `aplicarBan(player, razon, duracionSegundos, baneadoPor)` | — | Ban temporal, duración en **segundos** |
| `aplicarBanPermanente(player, razon, baneadoPor)` | — | Ban permanente |
| `estaJugadorBaneado(nombreJugador)` | `string` | `boolean` |
| `obtenerJugadoresBaneados()` | — | `string[]` — nombres de todos los baneados activos |
| `obtenerInfoBan(nombreJugador)` | `string` | Datos del ban (`{ razon, tiempoFin, baneadoPor, permanente, fechaBan }`) o `null` |
| `mostrarMenuBaneos(player)` | — | UI: banear / desbanear / ver lista (pensada para staff) |
| `mostrarFormularioBan(player)` | — | Form directo de ban (elegir jugador online + razón + duración) |
| `mostrarJugadoresBaneados(player)` | — | Lista de baneados con detalle y opción de desbanear |

### Reportes (funciones internas — se disparan mostrando el menú principal)

El flujo de reportes no expone funciones sueltas para cada paso — todo
arranca desde `mostrarMenuPrincipal(player)` (no exportada actualmente;
si necesitás dispararla desde otro archivo, exportala en `index.js`).
Internamente recorre: reportar → elegir jugador/razón/seriedad/descripción
→ notificar al staff → panel de staff → ver pendientes/historial →
resolver (advertir/banear).

---

## Flujo interno (baneos)

```
inicializarSistemaBaneos()
    ├── cargarJugadoresBaneados()       ← migra tags legacy → Map en memoria
    ├── iniciarVerificadorBaneos()      ← runInterval, limpia expirados
    └── configurarEventoJugadores()     ← playerSpawn → verificarEstadoBanJugador()
                                               ├── expirado → removerJugadorBaneado()
                                               ├── permanente → mostrarUIBanPermanente()
                                               └── temporal → mostrarUIBan() con tiempo restante
```

## Flujo interno (reportes)

```
mostrarMenuPrincipal(player)
    ├── "Reportar Jugador" → mostrarFormularioReporte()
    │       → guarda en reportes[] → notificarStaff()
    └── "Panel de Staff" (solo con STAFF_TAG) → mostrarPanelStaff()
            ├── Reportes pendientes → mostrarDetalleReporte() → advertir/banear
            ├── Historial de reportes
            ├── Jugadores baneados
            └── Ban directo → mostrarFormularioBan()
```

---

## Variables clave (estado en memoria)

| Variable | Tipo | Descripción |
|---|---|---|
| `jugadoresBaneados` | `Map<string, BanData>` | Estado de todos los bans activos, clave = nombre del jugador |
| `uiActiva` | `Set<string>` | Evita abrir formularios duplicados al mismo jugador |
| `reportes` | `Array<ReporteData>` | Reportes en memoria — **se pierden al reiniciar el servidor** |
| `RAZONES_REPORTE` | `string[]` | 10 razones predefinidas seleccionables en el dropdown de reporte |

### Forma de `BanData`

```js
{
  razon: string,
  baneadoPor: string,
  tiempoFin: number,     // Date.now() + duracion*1000, o -1 si es permanente
  permanente: boolean,
  fechaBan: number,      // Date.now() al momento del ban
}
```

---

## Eventos utilizados

| Evento | Cuándo |
|---|---|
| `world.afterEvents.playerSpawn` | Verifica y aplica ban al conectarse (con `initialSpawn`) |
| `system.runInterval` (verificador) | Limpia baneos temporales ya expirados |

---

## Consideraciones de rendimiento

- `jugadoresBaneados` es un `Map` recorrido linealmente — sin problema en
  servidores normales (decenas/cientos de baneos).
- `reportes[]` **no persiste** — si necesitás historial entre
  reinicios, hay que migrarlo a `DynamicStore` (`systems/world-manager/`)
  o a `VaultDB` (`systems/drops-in-inventory/vault-db.js`).
- `aplicarRestriccionesBan` cambia el gamemode a Spectator y bloquea
  input categories 1 y 2 — revisar que no choque con otro sistema que
  también gestione gamemode del jugador.

---

## Posibles mejoras

- Persistir `reportes[]` (VaultDB o DynamicStore) para que sobrevivan un
  reinicio.
- Cooldown entre reportes del mismo jugador, para evitar spam de
  reportes falsos.
- Paginación en `mostrarJugadoresBaneados` para listas grandes.
- Exportar `mostrarMenuPrincipal` explícitamente si necesitás dispararla
  desde otro módulo (item, comando, etc).

---

<sub>Ban System por **IIBl4z3MasterII**</sub>
