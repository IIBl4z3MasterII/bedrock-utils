import { world, system } from "@minecraft/server";

// propiedades dinamicas con dirty flag :3
// cada vez que algo cambia se marca al jugador, y al siguiente tick se guarda
// si nadie hizo nada → 0 escrituras

const MAX_STR_LEN = 32_000; // bedrock explota arriba de 32KB, le dejamos margen

const KEYS = {
    WORLD_CONFIG: "myApp:config",
    PLAYER_STATS: "myApp:stats"
};

const DEFAULT_CONFIG = {
    difficulty: 1,
    enableNotifications: true,
    gameTime: 300,
    maxPlayers: 10
};

const DEFAULT_PLAYER_STATS = {
    loginCount:   0,
    lastLogin:    null,
    crouchCount:  0,
    walkDistance: 0
};

let worldLoaded    = false;
let configSettings = { ...DEFAULT_CONFIG };

// todo esto vive solo en RAM, nunca se guarda directo :3
const sessionCrouches = new Map(); // playerId → agachadas de esta sesion
const sessionDistance  = new Map(); // playerId → bloques caminados esta sesion
const sneakState       = new Map(); // para detectar el flanco (tick anterior)
const lastPosition     = new Map(); // para calcular distancia entre ticks

// el corazon del sistema — si estas aqui es pq tienes cambios sin guardar :0
const dirtyPlayers = new Set();

function initSession(player) {
    sessionCrouches.set(player.id, 0);
    sessionDistance.set(player.id,  0);
    sneakState.set(player.id,       false);
    lastPosition.set(player.id,     player.location);
}

function clearSession(playerId) {
    sessionCrouches.delete(playerId);
    sessionDistance.delete(playerId);
    sneakState.delete(playerId);
    lastPosition.delete(playerId);
    dirtyPlayers.delete(playerId);
}

// ── config global (se guarda en el mundo) ─────────────────────

function saveConfig() {
    if (!worldLoaded) return false;
    try {
        const json = JSON.stringify(configSettings);
        if (json.length > MAX_STR_LEN) { console.warn("[Config] muy grande, no se guardo"); return false; }
        world.setDynamicProperty(KEYS.WORLD_CONFIG, json);
        return true;
    } catch (e) { console.error("[Config] error al guardar:", e); return false; }
}

function loadConfig() {
    if (!worldLoaded) return false;
    try {
        const raw = world.getDynamicProperty(KEYS.WORLD_CONFIG);
        configSettings = raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_CONFIG };
        console.warn("[Config] cargada :D");
        return true;
    } catch (e) { console.error("[Config] error al cargar:", e); configSettings = { ...DEFAULT_CONFIG }; return false; }
}

export function getConfig()             { return { ...configSettings }; }
export function getSetting(key)         { return configSettings[key]; }
export function setSetting(key, value)  { configSettings[key] = value; saveConfig(); }
export function updateConfig(changes)   { configSettings = { ...configSettings, ...changes }; saveConfig(); }

// ── stats del jugador (se guardan EN EL JUGADOR, no en el mundo) ──
// esto es importante: cada jugador tiene su propio storage de 32KB
// separado, asi no compiten entre si :3

function loadHistoric(player) {
    try {
        const raw = player.getDynamicProperty(KEYS.PLAYER_STATS);
        return raw ? { ...DEFAULT_PLAYER_STATS, ...JSON.parse(raw) } : { ...DEFAULT_PLAYER_STATS };
    } catch (e) {
        console.error(`[Stats] no se pudo cargar el historial de ${player.name}:`, e);
        return { ...DEFAULT_PLAYER_STATS };
    }
}

function saveHistoric(player, data) {
    try {
        const json = JSON.stringify(data);
        if (json.length > MAX_STR_LEN) { console.warn(`[Stats] json de ${player.name} muy grande`); return false; }
        player.setDynamicProperty(KEYS.PLAYER_STATS, json);
        return true;
    } catch (e) {
        console.error(`[Stats] no se pudo guardar el historial de ${player.name}:`, e);
        return false;
    }
}

// suma la sesion al historial, guarda, y resetea los contadores
// el reset es clave — sin esto sumaria doble en el siguiente flush ;_;
function flushPlayer(player) {
    const hist = loadHistoric(player);

    hist.crouchCount  += sessionCrouches.get(player.id) ?? 0;
    hist.walkDistance += sessionDistance.get(player.id)  ?? 0;

    sessionCrouches.set(player.id, 0);
    sessionDistance.set(player.id,  0);

    saveHistoric(player, hist);
    dirtyPlayers.delete(player.id);
}

// devuelve historial + sesion actual combinados
// asi siempre ves el numero real aunque no se haya guardado todavia :D
export function getPlayerStats(player) {
    const hist = loadHistoric(player);
    return {
        loginCount:   hist.loginCount,
        lastLogin:    hist.lastLogin,
        crouchCount:  hist.crouchCount  + (sessionCrouches.get(player.id) ?? 0),
        walkDistance: Math.round((hist.walkDistance + (sessionDistance.get(player.id) ?? 0)) * 10) / 10
    };
}

export function getSessionStats(playerId) {
    return {
        crouchCount:  sessionCrouches.get(playerId) ?? 0,
        walkDistance: Math.round((sessionDistance.get(playerId) ?? 0) * 10) / 10
    };
}

export function clearPlayerStats(player) {
    try {
        player.setDynamicProperty(KEYS.PLAYER_STATS, undefined);
        initSession(player);
        dirtyPlayers.delete(player.id);
        console.warn(`[Stats] stats de ${player.name} borradas`);
        return true;
    } catch (e) { console.error(`[Stats] error borrando (${player.name}):`, e); return false; }
}

// solo cuenta cuando EMPIEZA a agacharse (flanco positivo)
// si contaramos mientras esta agachado dispararia miles de veces xd
function startCrouchTracker() {
    system.runInterval(() => {
        for (const player of world.getPlayers()) {
            const isSneaking  = player.isSneaking;
            const wasSneaking = sneakState.get(player.id) ?? false;

            if (isSneaking && !wasSneaking) {
                sessionCrouches.set(player.id, (sessionCrouches.get(player.id) ?? 0) + 1);
                dirtyPlayers.add(player.id);
            }

            sneakState.set(player.id, isSneaking);
        }
    }, 1);
}

// cada 5 ticks mide cuanto se movio en horizontal
// ignoramos Y a proposito — no queremos contar caidas como caminar
function startWalkTracker() {
    system.runInterval(() => {
        for (const player of world.getPlayers()) {
            const pos  = player.location;
            const prev = lastPosition.get(player.id);

            if (prev) {
                const dx   = pos.x - prev.x;
                const dz   = pos.z - prev.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                if (dist > 0.1) { // filtro de ruido para cuando esta quieto
                    sessionDistance.set(player.id, (sessionDistance.get(player.id) ?? 0) + dist);
                    dirtyPlayers.add(player.id);
                }
            }

            lastPosition.set(player.id, { x: pos.x, y: pos.y, z: pos.z });
        }
    }, 5);
}

// el save loop — corre cada tick pero casi siempre no hace nada
// cuando dirtyPlayers esta vacio es literalmente un if y ya, cero costo <3
function startSaveLoop() {
    system.runInterval(() => {
        if (!worldLoaded || dirtyPlayers.size === 0) return;

        for (const playerId of dirtyPlayers) {
            const player = world.getPlayers().find(p => p.id === playerId);
            if (!player) {
                // flag huerfano, el jugador ya no existe
                dirtyPlayers.delete(playerId);
                continue;
            }
            flushPlayer(player);
        }
    }, 1);
}

system.runTimeout(() => {
    worldLoaded = true;
    initialize();
}, 20);

function initialize() {
    console.warn("[Sistema] iniciando...");
    loadConfig();

    // fix para el /reload: los jugadores que ya estaban online no disparan
    // playerSpawn con initialSpawn=true, asi que toca iniciarlos aqui a mano
    for (const player of world.getPlayers()) {
        if (!sessionCrouches.has(player.id)) {
            console.warn(`[Sistema] sesion restaurada para ${player.name} (viene de /reload)`);
            initSession(player);
        }
    }

    startCrouchTracker();
    startWalkTracker();
    startSaveLoop();
    console.warn("[Sistema] listo :D save loop activo");
}

world.afterEvents.playerSpawn.subscribe((event) => {
    const { player, initialSpawn } = event;
    if (!initialSpawn) return;

    // si ya tiene sesion (ej: vino de /reload) no la pisamos
    if (!sessionCrouches.has(player.id)) {
        initSession(player);
    }

    const hist = loadHistoric(player);
    hist.loginCount++;
    hist.lastLogin = new Date().toISOString();
    saveHistoric(player, hist);

    if (getSetting("enableNotifications")) {
        const stats = getPlayerStats(player);
        player.sendMessage(
            `§aHola, §e${player.name}§a! Login #${hist.loginCount}\n` +
            `§7Agachadas: §f${stats.crouchCount} §7| Bloques caminados: §f${Math.round(stats.walkDistance)}`
        );
    }
});

// beforeEvents porque aqui el jugador todavia existe :)
// en afterEvents ya salio y player.setDynamicProperty falla en silencio
world.beforeEvents.playerLeave.subscribe((event) => {
    const player = event.player;
    try {
        flushPlayer(player);
        console.warn(`[Players] ${player.name} guardado al salir`);
    } catch (e) {
        console.error(`[Players] error guardando a ${player.name}:`, e);
    } finally {
        clearSession(player.id);
    }
});

world.beforeEvents.chatSend.subscribe((event) => {
    const { message, sender: player } = event;

    if (message === "!stats") {
        event.cancel = true;
        system.run(() => {
            const total = getPlayerStats(player);
            const sess  = getSessionStats(player.id);
            player.sendMessage(
                `§6=== Stats de §e${player.name} §6===\n` +
                `§7Logins: §f${total.loginCount}\n` +
                `§7Agachadas  — §ftotal: ${total.crouchCount}  §7sesion: §f${sess.crouchCount}\n` +
                `§7Caminado   — §ftotal: ${total.walkDistance} bl  §7sesion: §f${sess.walkDistance} bl\n` +
                `§7Estado: §f${dirtyPlayers.has(player.id) ? "pendiente de guardar" : "guardado"}`
            );
        });
    }

    if (message === "!storage") {
        event.cancel = true;
        system.run(() => {
            const configSize = JSON.stringify(configSettings).length;
            const raw        = player.getDynamicProperty(KEYS.PLAYER_STATS);
            const playerSize = typeof raw === "string" ? raw.length : 0;
            player.sendMessage(
                `§6=== Storage ===\n` +
                `§7Config:  §f${configSize}§7/${MAX_STR_LEN} (§f${Math.round(configSize / MAX_STR_LEN * 100)}%§7)\n` +
                `§7Tus datos: §f${playerSize}§7/${MAX_STR_LEN} (§f${Math.round(playerSize / MAX_STR_LEN * 100)}%§7)\n` +
                `§7En cola para guardar: §f${dirtyPlayers.size} jugadores`
            );
        });
    }

    if (message === "!resetstats") {
        event.cancel = true;
        system.run(() => {
            clearPlayerStats(player);
            player.sendMessage("§cStats reseteadas");
        });
    }
});

export {
    saveConfig,
    loadConfig,
    flushPlayer  as flushPlayerStats,
    loadHistoric as loadPlayerStats,
    saveHistoric as savePlayerStats
};


/*
=============================================================
  BLOQUE DE PERSISTENCIA — los que evitan que se pierdan datos ( Por si quieres usarlo en algun codigo jiji )
=============================================================

  CARGA (al entrar al mundo / iniciar)
  -------------------------------------
  loadConfig()
    → lee world.getDynamicProperty y mete la config en memoria
    → se llama una sola vez dentro de initialize()

  loadHistoric(player)
    → lee player.getDynamicProperty con las stats guardadas del jugador
    → se usa dentro de flushPlayer() y getPlayerStats()
    → si no hay nada guardado devuelve los DEFAULT_PLAYER_STATS, no explota :3

  initialize()  ← el que orquesta todo al arrancar
    → espera a que worldLoaded sea true (20 ticks despues del inicio)
    → llama loadConfig() y tambien revisa si habia jugadores online
      antes de un /reload para no perderles la sesion


  GUARDADO (mientras juega / al salir)
  -------------------------------------
  saveHistoric(player, data)
    → escribe en player.setDynamicProperty, persistente entre sesiones
    → lo llama flushPlayer() cada vez que hay algo en dirtyPlayers

  flushPlayer(player)
    → suma la sesion actual (RAM) al historial guardado
    → resetea los contadores de sesion a 0 para no sumar doble
    → borra al jugador de dirtyPlayers

  startSaveLoop()
    → corre cada tick, pero si dirtyPlayers esta vacio no hace nada
    → cuando hay cambios pendientes llama flushPlayer() por cada uno
    → esto reemplaza el autoguardado cada X segundos, es inmediato <3

  beforeEvents.playerLeave  ← el guardado de emergencia al salir
    → llama flushPlayer() justo antes de que el jugador desconecte
    → usamos beforeEvents y NO afterEvents porque en after el jugador
      ya no existe y setDynamicProperty falla silenciosamente
    → aunque el saveLoop ya guardo casi todo, este es el seguro final


  FLUJO COMPLETO de una sesion normal
  -------------------------------------
  entra al mundo
    → playerSpawn dispara → initSession() → loadHistoric() → loginCount++

  jugador (camina, se agacha)
    → trackers detectan cambio → dirtyPlayers.add()
    → saveLoop del siguiente tick → flushPlayer() → saveHistoric()

  escribe !stats
    → getPlayerStats() = loadHistoric() + sessionCrouches/Distance en RAM
    → siempre muestra el valor real aunque no se haya guardado todavia :D

  sale del mundo
    → beforeEvents.playerLeave → flushPlayer() → saveHistoric()
    → clearSession() limpia la RAM de ese jugador

=============================================================
*/