import { world, system, GameMode, ItemStack, BlockPermutation } from "@minecraft/server";
import { ModalFormData, ActionFormData, MessageFormData } from "@minecraft/server-ui";

let jugadoresBaneados = new Map();
let uiActiva = new Set();
let intervaloBaneos = null;
let reportes = [];

const CONFIG = {
    STAFF_TAG: "Modd",
    REDSTONE_BLOCK_ID: "minecraft:redstone_block"
};

const RAZONES_REPORTE = [
    "Griefing", "Spam en chat", "Lenguaje inapropiado", "Hacks/Cheats",
    "Comportamiento tóxico", "Abuso de exploits", "Acoso a otros jugadores",
    "Construcciones inapropiadas", "Trolling", "Otro (especificar)"
];

/* ====== Report System (from Main.js) ====== */

function esStaff(player) { return player.hasTag(CONFIG.STAFF_TAG); }

function obtenerJugadoresOnline(excluirPlayer = null) {
    const jugadores = world.getPlayers();
    const nombres = [];
    for (let i = 0; i < jugadores.length; i++) {
        const jugador = jugadores[i];
        if (jugador !== excluirPlayer) {
            try { if (jugador.name && jugador.name.length > 0) nombres.push(jugador.name); } catch { continue; }
        }
    }
    return nombres;
}

function mostrarMenuPrincipal(player) {
    const form = new ActionFormData();
    form.title("§6§lSistema de Reportes");
    form.body("§7Selecciona una opción:");
    form.button("§cReportar Jugador", "textures/ui/report_player");
    if (esStaff(player)) form.button("§aPanel de Staff", "textures/ui/admin_panel");
    form.button("§8Cerrar", "textures/ui/cancel");
    form.show(player).then((response) => {
        if (response.canceled) return;
        switch (response.selection) {
            case 0: mostrarFormularioReporte(player); break;
            case 1: if (esStaff(player)) mostrarPanelStaff(player); break;
        }
    }).catch((error) => { console.warn("Error en mostrarMenuPrincipal:", error); });
}

function mostrarFormularioReporte(player) {
    const jugadoresOnline = obtenerJugadoresOnline(player);
    if (jugadoresOnline.length === 0) {
        const errorForm = new MessageFormData();
        errorForm.title("§cError");
        errorForm.body("§cNo hay otros jugadores online para reportar.");
        errorForm.button1("§7Entendido");
        errorForm.show(player).catch((error) => { console.warn("Error mostrando formulario de error:", error); });
        return;
    }
    const form = new ModalFormData();
    form.title("§c📝 Reportar Jugador");
    form.dropdown("§7Jugador a reportar:", jugadoresOnline);
    form.dropdown("§7Razón del reporte:", RAZONES_REPORTE);
    form.slider("§7Seriedad (1-10):", 1, 10, 1, 5);
    form.textField("§7Descripción adicional:", "Describe lo que pasó...");
    form.textField("§7Evidencia (opcional):", "Enlaces, coordenadas, etc.");
    form.show(player).then((response) => {
        if (response.canceled) return;
        const jugadorReportado = jugadoresOnline[response.formValues[0]];
        const razon = RAZONES_REPORTE[response.formValues[1]];
        const seriedad = response.formValues[2];
        const descripcion = response.formValues[3] || "Sin descripción";
        const evidencia = response.formValues[4] || "Sin evidencia";
        const reporte = { id: reportes.length + 1, fecha: new Date().toLocaleString(), reportador: player.name, reportado: jugadorReportado, razon, seriedad, descripcion, evidencia, estado: "Pendiente", gestionadoPor: null };
        reportes.push(reporte);
        const confirmForm = new MessageFormData();
        confirmForm.title("§aReporte Enviado");
        confirmForm.body(`§7Tu reporte contra §c${jugadorReportado}§7 ha sido enviado.\n§7ID del reporte: §e#${reporte.id}\n§7Seriedad: §6${seriedad}/10`);
        confirmForm.button1("§aEntendido");
        confirmForm.show(player).catch((error) => { console.warn("Error mostrando confirmación:", error); });
        notificarStaff(reporte);
    }).catch((error) => { console.warn("Error en mostrarFormularioReporte:", error); });
}

function mostrarPanelStaff(player) {
    if (!esStaff(player)) { player.sendMessage("§cNo tienes permisos para acceder al panel de staff."); return; }
    let reportesPendientes = 0;
    for (let i = 0; i < reportes.length; i++) { if (reportes[i].estado === "Pendiente") reportesPendientes++; }
    const jugadoresBaneadosArr = obtenerJugadoresBaneados();
    const form = new ActionFormData();
    form.title("§aPanel de Staff");
    form.body(`§7Reportes pendientes: §e${reportesPendientes}\n§7Total de reportes: §6${reportes.length}\n§7Jugadores baneados: §c${jugadoresBaneadosArr.length}`);
    form.button("§eVer Reportes Pendientes", "textures/ui/book_edit_default");
    form.button("§6Historial de Reportes", "textures/ui/book_normal_default");
    form.button("§cJugadores Baneados", "textures/ui/hammer");
    form.button("§4Ban Directo", "textures/ui/redX1");
    form.button("§8Volver", "textures/ui/back");
    form.show(player).then((response) => {
        if (response.canceled) return;
        switch (response.selection) {
            case 0: mostrarReportesPendientes(player); break;
            case 1: mostrarHistorialReportes(player); break;
            case 2: mostrarJugadoresBaneados(player); break;
            case 3: mostrarFormularioBan(player); break;
            case 4: mostrarMenuPrincipal(player); break;
        }
    }).catch((error) => { console.warn("Error en mostrarPanelStaff:", error); });
}

function mostrarReportesPendientes(player) {
    const reportesPendientes = [];
    for (let i = 0; i < reportes.length; i++) { if (reportes[i].estado === "Pendiente") reportesPendientes.push(reportes[i]); }
    if (reportesPendientes.length === 0) {
        const form = new MessageFormData();
        form.title("§aSin Reportes Pendientes");
        form.body("§7No hay reportes pendientes por revisar.");
        form.button1("§7Volver");
        form.show(player).then(() => mostrarPanelStaff(player)).catch((error) => { console.warn("Error mostrando reportes pendientes vacío:", error); });
        return;
    }
    const form = new ActionFormData();
    form.title("§eReportes Pendientes");
    form.body("§7Selecciona un reporte para revisar:");
    for (let i = 0; i < reportesPendientes.length; i++) {
        const r = reportesPendientes[i];
        const severidadColor = r.seriedad >= 8 ? "§c" : r.seriedad >= 5 ? "§6" : "§e";
        form.button(`§f#${r.id} - §c${r.reportado}\n${severidadColor}Seriedad: ${r.seriedad}/10 §8| §7${r.razon}`);
    }
    form.button("§8Volver", "textures/ui/back");
    form.show(player).then((response) => {
        if (response.canceled) return;
        if (response.selection === reportesPendientes.length) { mostrarPanelStaff(player); return; }
        mostrarDetalleReporte(player, reportesPendientes[response.selection]);
    }).catch((error) => { console.warn("Error en mostrarReportesPendientes:", error); });
}

function mostrarDetalleReporte(player, reporte) {
    const form = new ActionFormData();
    form.title(`§6Reporte #${reporte.id}`);
    const severidadColor = reporte.seriedad >= 8 ? "§c" : reporte.seriedad >= 5 ? "§6" : "§e";
    form.body(`§7Reportado: §c${reporte.reportado}\n§7Reportador: §a${reporte.reportador}\n§7Fecha: §f${reporte.fecha}\n§7Razón: §e${reporte.razon}\n${severidadColor}Seriedad: ${reporte.seriedad}/10\n\n§7Descripción:\n§f${reporte.descripcion}\n\n§7Evidencia:\n§f${reporte.evidencia}`);
    form.button("§cBanear Jugador", "textures/ui/hammer");
    form.button("§6Advertir Jugador", "textures/ui/warning");
    form.button("§aMarcar como Resuelto", "textures/ui/check");
    form.button("§8Rechazar Reporte", "textures/ui/cancel");
    form.button("§7Volver", "textures/ui/back");
    form.show(player).then((response) => {
        if (response.canceled) return;
        switch (response.selection) {
            case 0: mostrarFormularioBanReporte(player, reporte); break;
            case 1: advertirJugador(player, reporte); break;
            case 2: resolverReporte(player, reporte, "Resuelto"); break;
            case 3: resolverReporte(player, reporte, "Rechazado"); break;
            case 4: mostrarReportesPendientes(player); break;
        }
    }).catch((error) => { console.warn("Error en mostrarDetalleReporte:", error); });
}

function mostrarFormularioBanReporte(player, reporte) {
    const jugadorReportado = world.getPlayers().find(p => p.name === reporte.reportado);
    if (!jugadorReportado) {
        const errorForm = new MessageFormData();
        errorForm.title("§cError");
        errorForm.body(`§cEl jugador ${reporte.reportado} no está online.`);
        errorForm.button1("§7Entendido");
        errorForm.show(player).then(() => mostrarDetalleReporte(player, reporte)).catch((error) => { console.warn("Error mostrando error de jugador offline:", error); });
        return;
    }
    const razonFinal = reporte.razon === "Otro (especificar)" ? reporte.descripcion : reporte.razon;
    const form = new ModalFormData()
        .title("§c🔨 Banear Jugador - Reporte")
        .textField("§7Jugador:", reporte.reportado, reporte.reportado)
        .textField("§7Razón del ban:", "Ingresa la razón del ban", razonFinal)
        .textField("§7Minutos:", "0", "0")
        .textField("§7Segundos:", "0", "0")
        .toggle("§7¿Ban permanente?");
    form.show(player).then((result) => {
        if (result.canceled) return;
        const razon = result.formValues[1] || razonFinal;
        const minutos = Math.max(0, parseInt(result.formValues[2]) || 0);
        const segundos = Math.max(0, parseInt(result.formValues[3]) || 0);
        const permanente = result.formValues[4];
        if (permanente) { aplicarBanPermanente(jugadorReportado, razon, player.name); reporte.estado = "Resuelto - Ban Permanente"; reporte.gestionadoPor = player.name; }
        else {
            if (minutos === 0 && segundos === 0) { player.sendMessage("§cDebes especificar una duración válida para el ban."); return; }
            const totalSegundos = minutos * 60 + segundos;
            aplicarBan(jugadorReportado, razon, totalSegundos, player.name);
            reporte.estado = "Resuelto - Ban Temporal"; reporte.gestionadoPor = player.name;
        }
    }).catch((error) => { console.warn(`Error en formulario de ban para reporte: ${error}`); });
}

function advertirJugador(staff, reporte) {
    const jugadores = world.getPlayers();
    let jugadorOnline = null;
    for (let i = 0; i < jugadores.length; i++) { try { if (jugadores[i].name === reporte.reportado) { jugadorOnline = jugadores[i]; break; } } catch { continue; } }
    if (jugadorOnline) {
        jugadorOnline.sendMessage(`§6ADVERTENCIA OFICIAL`);
        jugadorOnline.sendMessage(`§7Has recibido una advertencia del staff.`);
        jugadorOnline.sendMessage(`§7Razón: §e${reporte.razon}`);
        jugadorOnline.sendMessage(`§7Reportado por: §c${reporte.reportador}`);
        jugadorOnline.sendMessage(`§7Gestionado por: §a${staff.name}`);
        jugadorOnline.sendMessage(`§cFuturas infracciones pueden resultar en un ban.`);
    }
    reporte.estado = "Resuelto - Advertencia";
    reporte.gestionadoPor = staff.name;
    world.sendMessage(`§6${reporte.reportado} ha recibido una advertencia del staff por: ${reporte.razon}`);
    const confirmForm = new MessageFormData();
    confirmForm.title("§aAdvertencia Enviada");
    confirmForm.body(`§7Se ha enviado una advertencia a §c${reporte.reportado}§7.`);
    confirmForm.button1("§aEntendido");
    confirmForm.show(staff).then(() => mostrarPanelStaff(staff)).catch((error) => { console.warn("Error mostrando confirmación de advertencia:", error); });
}

function resolverReporte(staff, reporte, estado) {
    reporte.estado = estado;
    reporte.gestionadoPor = staff.name;
    const mensaje = estado === "Resuelto" ? "resuelto" : "rechazado";
    const confirmForm = new MessageFormData();
    confirmForm.title(`§aReporte ${mensaje}`);
    confirmForm.body(`§7El reporte #${reporte.id} ha sido marcado como §e${mensaje}§7.`);
    confirmForm.button1("§aEntendido");
    confirmForm.show(staff).then(() => mostrarPanelStaff(staff)).catch((error) => { console.warn("Error mostrando confirmación de resolución:", error); });
}

function mostrarHistorialReportes(player) {
    if (reportes.length === 0) {
        const form = new MessageFormData();
        form.title("§7Historial Vacío");
        form.body("§7No hay reportes en el historial.");
        form.button1("§7Volver");
        form.show(player).then(() => mostrarPanelStaff(player)).catch((error) => { console.warn("Error mostrando historial vacío:", error); });
        return;
    }
    const form = new ActionFormData();
    form.title("§6Historial de Reportes");
    form.body(`§7Total de reportes: §e${reportes.length}`);
    const ultimosReportes = reportes.slice(-10).reverse();
    for (let i = 0; i < ultimosReportes.length; i++) {
        const r = ultimosReportes[i];
        const estadoColor = r.estado === "Pendiente" ? "§e" : r.estado.includes("Resuelto") ? "§a" : "§c";
        form.button(`§f#${r.id} - §c${r.reportado}\n${estadoColor}${r.estado} §8| §7${r.fecha}`);
    }
    form.button("§8Volver", "textures/ui/back");
    form.show(player).then((response) => {
        if (response.canceled) return;
        if (response.selection === Math.min(10, reportes.length)) { mostrarPanelStaff(player); return; }
        mostrarDetalleReporte(player, reportes[reportes.length - 1 - response.selection]);
    }).catch((error) => { console.warn("Error en mostrarHistorialReportes:", error); });
}

function notificarStaff(reporte) {
    const jugadores = world.getPlayers();
    for (let i = 0; i < jugadores.length; i++) {
        const jugador = jugadores[i];
        try {
            if (esStaff(jugador)) {
                jugador.sendMessage(`§6NUEVO REPORTE`);
                jugador.sendMessage(`§7ID: §e#${reporte.id} §8| §7Seriedad: §6${reporte.seriedad}/10`);
                jugador.sendMessage(`§7Reportado: §c${reporte.reportado} §8| §7Por: §a${reporte.reportador}`);
                jugador.sendMessage(`§7Razón: §e${reporte.razon}`);
            }
        } catch (error) { console.warn("Error notificando a staff:", error); continue; }
    }
}

/* ====== Ban System Core (from ban-system.js) ====== */

export function inicializarSistemaBaneos() {
    cargarJugadoresBaneados();
    iniciarVerificadorBaneos();
    configurarEventoJugadores();
    system.runTimeout(() => { world.getAllPlayers().forEach((player) => { verificarEstadoBanJugador(player); }); }, 20);
}

function configurarEventoJugadores() {
    world.afterEvents.playerSpawn.subscribe((event) => {
        const player = event.player;
        if (event.initialSpawn) { system.runTimeout(() => { verificarEstadoBanJugador(player); }, 40); }
    });
}

function verificarEstadoBanJugador(player) {
    const nombreJugador = player.name;
    const datosBan = jugadoresBaneados.get(nombreJugador);
    if (!datosBan) return;
    const tiempoActual = Date.now();
    if (!datosBan.permanente && datosBan.tiempoFin <= tiempoActual) { removerJugadorBaneado(player); return; }
    aplicarRestriccionesBan(player);
    if (datosBan.permanente) { mostrarUIBanPermanente(player, datosBan.razon, datosBan.baneadoPor); }
    else { const tiempoRestante = Math.max(0, datosBan.tiempoFin - tiempoActual); mostrarUIBan(player, datosBan.razon, tiempoRestante / 1000, datosBan.baneadoPor); }
}

function cargarJugadoresBaneados() {
    try {
        jugadoresBaneados.clear();
        const jugadores = world.getAllPlayers();
        jugadores.forEach((player) => { migrarDatosLegacyBan(player); });
    } catch (error) { console.warn(`Error cargando jugadores baneados: ${error}`); }
}

function migrarDatosLegacyBan(player) {
    const tags = player.getTags();
    let tiempoFin = -1;
    let permanente = false;
    let razon = "";
    let baneadoPor = "";
    let fechaBan = 0;
    const tagBaneadoHasta = tags.find((tag) => tag.startsWith("bannedUntil:"));
    const tagPermabanedo = tags.includes("permabanned");
    const tagRazon = tags.find((tag) => tag.startsWith("banReason:"));
    const tagBaneadoPor = tags.find((tag) => tag.startsWith("bannedBy:"));
    const tagFechaBan = tags.find((tag) => tag.startsWith("banDate:"));
    if (tagBaneadoHasta) tiempoFin = parseInt(tagBaneadoHasta.split(":")[1]) || -1;
    if (tagPermabanedo) permanente = true;
    if (tagRazon) razon = tagRazon.split(":").slice(1).join(":") || "";
    if (tagBaneadoPor) baneadoPor = tagBaneadoPor.split(":").slice(1).join(":") || "";
    if (tagFechaBan) fechaBan = parseInt(tagFechaBan.split(":")[1]) || Date.now();
    if (tiempoFin !== -1 || permanente) {
        jugadoresBaneados.set(player.name, { tiempoFin, permanente, razon, baneadoPor, fechaBan });
        removerTagsLegacy(player);
    }
}

function removerTagsLegacy(player) {
    const tagsARemover = ["bannedUntil:", "permabanned", "banReason:", "bannedBy:", "banDate:", "baneado"];
    const tags = player.getTags();
    tags.forEach((tag) => {
        if (tagsARemover.some((prefix) => tag.startsWith(prefix)) || tag === "permabanned" || tag === "baneado") player.removeTag(tag);
    });
}

function aplicarRestriccionesBan(player) {
    try {
        player.setGameMode(GameMode.Spectator);
        player.inputPermissions.setPermissionCategory(1, false);
        player.inputPermissions.setPermissionCategory(2, false);
    } catch (error) { console.warn(`Error aplicando restricciones de ban a ${player.name}: ${error}`); }
}

function removerRestriccionesBan(player) {
    try {
        player.setGameMode(GameMode.Survival);
        player.inputPermissions.setPermissionCategory(1, true);
        player.inputPermissions.setPermissionCategory(2, true);
    } catch (error) { console.warn(`Error removiendo restricciones de ban de ${player.name}: ${error}`); }
}

function guardarJugadorBaneado(player, razon, tiempoFin, baneadoPor, permanente = false) {
    const fechaBan = Date.now();
    const datosBan = { razon: razon || "Sin razón especificada", tiempoFin: permanente ? -1 : tiempoFin, baneadoPor: baneadoPor || "Sistema", permanente, fechaBan };
    jugadoresBaneados.set(player.name, datosBan);
    player.addTag("baneado");
    aplicarRestriccionesBan(player);
}

function removerJugadorBaneado(player) {
    jugadoresBaneados.delete(player.name);
    uiActiva.delete(player.name);
    player.removeTag("baneado");
    removerRestriccionesBan(player);
}

export function mostrarMenuBaneos(player) {
    const form = new ActionFormData()
        .title("§cSistema de Baneos")
        .button("§cBanear Jugador", "textures/ui/redX1")
        .button("§aDesbanear Jugador", "textures/ui/check")
        .button("§eVer Jugadores Baneados", "textures/ui/book_metatag_default");
    form.show(player).then((result) => {
        if (result.canceled) return;
        if (result.selection === 0) mostrarFormularioBan(player);
        else if (result.selection === 1) mostrarFormularioDesban(player);
        else if (result.selection === 2) mostrarJugadoresBaneados(player);
    }).catch((error) => { console.warn(`Error mostrando menú de baneos a ${player.name}: ${error}`); });
}

export function mostrarFormularioBan(player) {
    const jugadores = Array.from(world.getPlayers());
    const nombresJugadores = jugadores.map((jugador) => jugador.name);
    const form = new ModalFormData()
        .title("§cBanear Jugador")
        .dropdown("§7Seleccionar jugador:", nombresJugadores)
        .textField("§7Razón del ban:", "Escribe la razón...")
        .textField("§7Minutos:", "0")
        .textField("§7Segundos:", "0")
        .toggle("§7¿Ban permanente?");
    form.show(player).then((result) => {
        if (result.canceled) return;
        const jugadorSeleccionado = jugadores[result.formValues[0]];
        if (!jugadorSeleccionado) return;
        const razon = result.formValues[1] || "Sin razón especificada";
        const minutos = Math.max(0, parseInt(result.formValues[2]) || 0);
        const segundos = Math.max(0, parseInt(result.formValues[3]) || 0);
        const permanente = result.formValues[4];
        if (permanente) aplicarBanPermanente(jugadorSeleccionado, razon, player.name);
        else {
            if (minutos === 0 && segundos === 0) { player.sendMessage("§cDebes especificar una duración válida para el ban."); return; }
            aplicarBan(jugadorSeleccionado, razon, minutos * 60 + segundos, player.name);
        }
    }).catch((error) => { console.warn(`Error en formulario de ban para ${player.name}: ${error}`); });
}

function aplicarBanInterno(player, razon, duracion, baneadoPor, esPermanente) {
    const tiempoFin = esPermanente ? -1 : Date.now() + duracion * 1000;
    guardarJugadorBaneado(player, razon, tiempoFin, baneadoPor, esPermanente);
    const tipoBan = esPermanente ? "baneado permanentemente" : "baneado";
    notificarBanAJugadores(baneadoPor, player.name, tipoBan, razon);
    if (esPermanente) mostrarUIBanPermanente(player, razon, baneadoPor);
    else mostrarUIBan(player, razon, duracion, baneadoPor);
}

function notificarBanAJugadores(baneadoPor, nombreJugador, tipoBan, razon) {
    const mensaje = `§c${baneadoPor} ha ${tipoBan} a ${nombreJugador}. Razón: ${razon}`;
    world.getPlayers().forEach((p) => { try { p.sendMessage(mensaje); } catch (error) { console.warn(`Error enviando notificación de ban a ${p.name}: ${error}`); } });
}

function mostrarUIBanPermanente(player, razon, baneadoPor) {
    if (uiActiva.has(player.name)) return;
    uiActiva.add(player.name);
    const mostrarUI = () => {
        const infoBan = jugadoresBaneados.get(player.name);
        if (!infoBan || !infoBan.permanente) { uiActiva.delete(player.name); return; }
        const fechaBan = new Date(infoBan.fechaBan);
        const form = new ActionFormData()
            .title("§cBANEADO PERMANENTEMENTE")
            .body(`§7Razón: §c${razon}\n§7Baneado por: §e${baneadoPor}\n§7Fecha: §f${fechaBan.toLocaleDateString()}\n\n§c¡Este ban es permanente!`)
            .button("§7Aceptar");
        form.show(player).then(() => {
            if (jugadoresBaneados.has(player.name) && jugadoresBaneados.get(player.name).permanente) {
                system.runTimeout(mostrarUI, 60);
            } else uiActiva.delete(player.name);
        }).catch((error) => { uiActiva.delete(player.name); console.warn(`Error mostrando UI de ban permanente a ${player.name}: ${error}`); });
    };
    mostrarUI();
}

function mostrarUIBan(player, razon, duracion, baneadoPor) {
    if (uiActiva.has(player.name)) return;
    uiActiva.add(player.name);
    const actualizarUI = () => {
        const datosJugador = jugadoresBaneados.get(player.name);
        if (!datosJugador || datosJugador.permanente) { uiActiva.delete(player.name); return; }
        const tiempoRestante = Math.max(0, datosJugador.tiempoFin - Date.now());
        if (tiempoRestante <= 0) { removerJugadorBaneado(player); player.sendMessage("§aTu ban ha expirado. ¡Bienvenido de vuelta!"); return; }
        const minutos = Math.floor(tiempoRestante / 60000);
        const segundos = Math.floor((tiempoRestante % 60000) / 1000);
        const fechaBan = new Date(datosJugador.fechaBan);
        const form = new ActionFormData()
            .title("§cBANEADO TEMPORALMENTE")
            .body(`§7Fecha del ban: §f${fechaBan.toLocaleDateString()}\n§7Tiempo restante: §e${minutos}m ${segundos}s\n§7Razón: §c${razon}\n§7Baneado por: §e${baneadoPor}`)
            .button("§7Aceptar");
        form.show(player).then(() => {
            if (jugadoresBaneados.has(player.name) && !jugadoresBaneados.get(player.name).permanente) system.runTimeout(actualizarUI);
            else uiActiva.delete(player.name);
        }).catch((error) => { uiActiva.delete(player.name); console.warn(`Error mostrando UI de ban temporal a ${player.name}: ${error}`); });
    };
    actualizarUI();
}

function iniciarVerificadorBaneos() {
    if (intervaloBaneos) system.clearRun(intervaloBaneos);
    intervaloBaneos = system.runInterval(verificarBaneos, 200);
}

function verificarBaneos() {
    const tiempoActual = Date.now();
    const jugadoresADesbanear = [];
    jugadoresBaneados.forEach((infoBan, nombreJugador) => {
        const player = world.getPlayers().find((p) => p.name === nombreJugador);
        if (!player) return;
        if (!infoBan.permanente && infoBan.tiempoFin <= tiempoActual) jugadoresADesbanear.push(player);
    });
    jugadoresADesbanear.forEach((player) => { removerJugadorBaneado(player); try { player.sendMessage("§aTu ban ha expirado. ¡Bienvenido de vuelta!"); } catch (error) { console.warn(`Error enviando mensaje de desban a ${player.name}: ${error}`); } });
}

function mostrarFormularioDesban(player) {
    const nombresJugadoresBaneados = Array.from(jugadoresBaneados.keys());
    if (nombresJugadoresBaneados.length === 0) { player.sendMessage("§aNo hay jugadores baneados actualmente."); return; }
    const form = new ModalFormData()
        .title("§aDesbanear Jugador")
        .dropdown("§7Seleccionar jugador:", nombresJugadoresBaneados);
    form.show(player).then((result) => {
        if (result.canceled) return;
        const nombreJugadorSeleccionado = nombresJugadoresBaneados[result.formValues[0]];
        if (!nombreJugadorSeleccionado) return;
        const jugadorSeleccionado = world.getPlayers().find((p) => p.name === nombreJugadorSeleccionado);
        if (!jugadorSeleccionado) { player.sendMessage(`§cEl jugador ${nombreJugadorSeleccionado} no está en línea.`); return; }
        mostrarConfirmacionDesban(player, jugadorSeleccionado);
    }).catch((error) => { console.warn(`Error en formulario de desban para ${player.name}: ${error}`); });
}

function mostrarConfirmacionDesban(player, jugadorBaneado) {
    const datosJugador = jugadoresBaneados.get(jugadorBaneado.name);
    if (!datosJugador) return;
    const { razon, baneadoPor, permanente, tiempoFin } = datosJugador;
    let duracionBan;
    if (permanente) duracionBan = "Ban Permanente";
    else { const tiempoRestante = Math.max(0, tiempoFin - Date.now()); duracionBan = `${Math.floor(tiempoRestante / 60000)} minutos y ${Math.floor((tiempoRestante % 60000) / 1000)} segundos`; }
    const form = new MessageFormData()
        .title("§aConfirmar Desban")
        .body(`§7¿Deseas desbanear a §c${jugadorBaneado.name}§7?\n\n§7Baneado por: §e${baneadoPor}\n§7Razón: §c${razon}\n§7Duración restante: §f${duracionBan}`)
        .button1("§cCancelar")
        .button2("§aDesbanear");
    form.show(player).then((result) => {
        if (result.selection === 1) { desbanearJugador(jugadorBaneado); player.sendMessage(`§a${jugadorBaneado.name} ha sido desbaneado exitosamente.`); }
    }).catch((error) => { console.warn(`Error en confirmación de desban para ${player.name}: ${error}`); });
}

function desbanearJugador(player) { removerJugadorBaneado(player); try { player.sendMessage("§aHas sido desbaneado. ¡Bienvenido de vuelta!"); } catch (error) { console.warn(`Error enviando mensaje de desban a ${player.name}: ${error}`); } }

export function mostrarJugadoresBaneados(player) {
    if (jugadoresBaneados.size === 0) {
        const form = new MessageFormData().title("§aSin Jugadores Baneados").body("§7No hay jugadores baneados actualmente.").button1("§7Entendido");
        form.show(player).catch((error) => { console.warn("Error mostrando jugadores baneados vacío:", error); });
        return;
    }
    const form = new ActionFormData().title("§cJugadores Baneados").body(`§7Total de jugadores baneados: §e${jugadoresBaneados.size}`);
    jugadoresBaneados.forEach((ban, nombre) => { form.button(`${ban.permanente ? "§c[PERMANENTE]" : "§e[TEMPORAL]"} §f${nombre}\n§7${ban.razon}`); });
    form.show(player).then((result) => {
        if (result.canceled) return;
        const nombres = Array.from(jugadoresBaneados.keys());
        mostrarDetalleBan(player, nombres[result.selection], jugadoresBaneados.get(nombres[result.selection]));
    }).catch((error) => { console.warn("Error en mostrarJugadoresBaneados:", error); });
}

function mostrarDetalleBan(player, nombre, ban) {
    const fechaBan = new Date(ban.fechaBan);
    let duracion = ban.permanente ? "§cPermanente" : "§eExpira pronto";
    if (!ban.permanente) { const t = Math.max(0, ban.tiempoFin - Date.now()); duracion = `§e${Math.floor(t / 60000)}m ${Math.floor((t % 60000) / 1000)}s restantes`; }
    const form = new ActionFormData().title(`§cDetalles: ${nombre}`)
        .body(`§7Jugador: §c${nombre}\n§7Razón: §f${ban.razon}\n§7Duración: ${duracion}\n§7Fecha: §f${fechaBan.toLocaleDateString()}\n§7Baneado por: §a${ban.baneadoPor}`)
        .button("§aDesbanear", "textures/ui/check").button("§7⬅️ Volver", "textures/ui/arrow_left");
    form.show(player).then((result) => {
        if (result.canceled) return;
        switch (result.selection) {
            case 0:
                const j = world.getPlayers().find(p => p.name === nombre);
                if (j) { desbanearJugador(j); player.sendMessage(`§a${nombre} ha sido desbaneado.`); }
                else player.sendMessage(`§c${nombre} no está en línea.`);
                break;
            case 1: mostrarJugadoresBaneados(player); break;
        }
    }).catch((error) => { console.warn("Error en mostrarDetalleBan:", error); });
}

export function obtenerJugadoresBaneados() { return Array.from(jugadoresBaneados.keys()); }
export function estaJugadorBaneado(nombreJugador) { return jugadoresBaneados.has(nombreJugador); }
export function obtenerInfoBan(nombreJugador) { return jugadoresBaneados.get(nombreJugador) || null; }
export function aplicarBanPermanente(player, razon, baneadoPor) { aplicarBanInterno(player, razon, -1, baneadoPor, true); }
export function aplicarBan(player, razon, duracion, baneadoPor) { aplicarBanInterno(player, razon, duracion, baneadoPor, false); }

/* ====== Event Listener (from Main.js) ====== */
world.afterEvents.itemUse.subscribe((evd) => {
    try { if (evd.itemStack && evd.itemStack.typeId === "minecraft:redstone_block") mostrarMenuPrincipal(evd.source); }
    catch (error) { console.warn("Error en event listener itemUse:", error); }
});
