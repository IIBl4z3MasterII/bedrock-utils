/* 

██████╗ ██╗██╗  ██╗███████╗██████╗     ███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗ 
██╔══██╗██║██║  ██║╚══███╔╝╚════██╗    ████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗
██████╔╝██║███████║  ███╔╝  █████╔╝    ██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝
██╔══██╗██║╚════██║ ███╔╝   ╚═══██╗    ██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗
██████╔╝███████╗██║███████╗██████╔╝    ██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║
╚═════╝ ╚══════╝╚═╝╚══════╝╚═════╝     ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
                                                                                           
          Main •  By: @bl4z3master
*/

import { world, system, ItemStack, BlockPermutation } from "@minecraft/server";
import { ModalFormData, ActionFormData, MessageFormData } from "@minecraft/server-ui";
import { 
    mostrarFormularioBan, 
    mostrarJugadoresBaneados, 
    obtenerJugadoresBaneados 
} from "./ban-system.js";

let reportes = [];

const CONFIG = {
    STAFF_TAG: "Modd",
    REDSTONE_BLOCK_ID: "minecraft:redstone_block"
};

const RAZONES_REPORTE = [
    "Griefing",
    "Spam en chat",
    "Lenguaje inapropiado",
    "Hacks/Cheats",
    "Comportamiento tóxico",
    "Abuso de exploits",
    "Acoso a otros jugadores",
    "Construcciones inapropiadas",
    "Trolling",
    "Otro (especificar)"
];

function esStaff(player) {
    return player.hasTag(CONFIG.STAFF_TAG);
}

function obtenerJugadoresOnline(excluirPlayer = null) {
    const jugadores = world.getPlayers();
    const nombres = [];
    
    for (let i = 0; i < jugadores.length; i++) {
        const jugador = jugadores[i];
        if (jugador !== excluirPlayer) {
            try {
                if (jugador.name && jugador.name.length > 0) {
                    nombres.push(jugador.name);
                }
            } catch (error) {
                continue;
            }
        }
    }
    
    return nombres;
}

function mostrarMenuPrincipal(player) {
    const form = new ActionFormData();
    form.title("§6§lSistema de Reportes");
    form.body("§7Selecciona una opción:");
    
    form.button("§cReportar Jugador", "textures/ui/report_player");
    
    if (esStaff(player)) {
        form.button("§aPanel de Staff", "textures/ui/admin_panel");
    }
    
    form.button("§8Cerrar", "textures/ui/cancel");
    
    form.show(player).then((response) => {
        if (response.canceled) return;
        
        switch (response.selection) {
            case 0:
                mostrarFormularioReporte(player);
                break;
            case 1:
                if (esStaff(player)) {
                    mostrarPanelStaff(player);
                }
                break;
        }
    }).catch((error) => {
        console.warn("Error en mostrarMenuPrincipal:", error);
    });
}

function mostrarFormularioReporte(player) {
    const jugadoresOnline = obtenerJugadoresOnline(player);
    
    if (jugadoresOnline.length === 0
        ) {
        const errorForm = new MessageFormData();
        errorForm.title("§cError");
        errorForm.body("§cNo hay otros jugadores online para reportar.");
        errorForm.button1("§7Entendido");
        errorForm.show(player).catch((error) => {
            console.warn("Error mostrando formulario de error:", error);
        });
        return;
    }
    
    const form = new ModalFormData();
    form.title("§c📝 Reportar Jugador");
    
    form.dropdown("§7Jugador a reportar:", jugadoresOnline);
    form.dropdown("§7Razón del reporte:", RAZONES_REPORTE);
    form.slider("§7Seriedad (1-10):", 1, 10, { defaultValue: 5 });
    form.textField("§7Descripción adicional:", "Describe lo que pasó...");
    form.textField("§7Evidencia (opcional):", "Enlaces, coordenadas, etc.");
    
    form.show(player).then((response) => {
        if (response.canceled) return;
        
        const jugadorReportado = jugadoresOnline[response.formValues[0]];
        const razon = RAZONES_REPORTE[response.formValues[1]];
        const seriedad = response.formValues[2];
        const descripcion = response.formValues[3] || "Sin descripción";
        const evidencia = response.formValues[4] || "Sin evidencia";
        
        const reporte = {
            id: reportes.length + 1,
            fecha: new Date().toLocaleString(),
            reportador: player.name,
            reportado: jugadorReportado,
            razon: razon,
            seriedad: seriedad,
            descripcion: descripcion,
            evidencia: evidencia,
            estado: "Pendiente",
            gestionadoPor: null
        };
        
        reportes.push(reporte);
        
        const confirmForm = new MessageFormData();
        confirmForm.title("§aReporte Enviado");
        confirmForm.body(`§7Tu reporte contra §c${jugadorReportado}§7 ha sido enviado.\n§7ID del reporte: §e#${reporte.id}\n§7Seriedad: §6${seriedad}/10`);
        confirmForm.button1("§aEntendido");
        confirmForm.show(player).catch((error) => {
            console.warn("Error mostrando confirmación:", error);
        });
        
        notificarStaff(reporte);
    }).catch((error) => {
        console.warn("Error en mostrarFormularioReporte:", error);
    });
}

function mostrarPanelStaff(player) {
    if (!esStaff(player)) {
        player.sendMessage("§cNo tienes permisos para acceder al panel de staff.");
        return;
    }
    
    let reportesPendientes = 0;
    for (let i = 0; i < reportes.length; i++) {
        if (reportes[i].estado === "Pendiente") {
            reportesPendientes++;
        }
    }
    
    const jugadoresBaneados = obtenerJugadoresBaneados();
    
    const form = new ActionFormData();
    form.title("§aPanel de Staff");
    form.body(`§7Reportes pendientes: §e${reportesPendientes}\n§7Total de reportes: §6${reportes.length}\n§7Jugadores baneados: §c${jugadoresBaneados.length}`);
    
    form.button("§eVer Reportes Pendientes", "textures/ui/book_edit_default");
    form.button("§6Historial de Reportes", "textures/ui/book_normal_default");
    form.button("§cJugadores Baneados", "textures/ui/hammer");
    form.button("§4Ban Directo", "textures/ui/redX1");
    form.button("§8Volver", "textures/ui/back");
    
    form.show(player).then((response) => {
        if (response.canceled) return;
        
        switch (response.selection) {
            case 0:
                mostrarReportesPendientes(player);
                break;
            case 1:
                mostrarHistorialReportes(player);
                break;
            case 2:
                mostrarJugadoresBaneados(player);
                break;
            case 3:
                mostrarFormularioBan(player);
                break;
            case 4:
                mostrarMenuPrincipal(player);
                break;
        }
    }).catch((error) => {
        console.warn("Error en mostrarPanelStaff:", error);
    });
}

function mostrarReportesPendientes(player) {
    const reportesPendientes = [];
    
    for (let i = 0; i < reportes.length; i++) {
        if (reportes[i].estado === "Pendiente") {
            reportesPendientes.push(reportes[i]);
        }
    }
    
    if (reportesPendientes.length === 0) {
        const form = new MessageFormData();
        form.title("§aSin Reportes Pendientes");
        form.body("§7No hay reportes pendientes por revisar.");
        form.button1("§7Volver");
        form.show(player).then(() => mostrarPanelStaff(player)).catch((error) => {
            console.warn("Error mostrando reportes pendientes vacío:", error);
        });
        return;
    }
    
    const form = new ActionFormData();
    form.title("§eReportes Pendientes");
    form.body("§7Selecciona un reporte para revisar:");
    
    for (let i = 0; i < reportesPendientes.length; i++) {
        const reporte = reportesPendientes[i];
        const severidadColor = reporte.seriedad >= 8 ? "§c" : reporte.seriedad >= 5 ? "§6" : "§e";
        form.button(`§f#${reporte.id} - §c${reporte.reportado}\n${severidadColor}Seriedad: ${reporte.seriedad}/10 §8| §7${reporte.razon}`);
    }
    
    form.button("§8Volver", "textures/ui/back");
    
    form.show(player).then((response) => {
        if (response.canceled) return;
        
        if (response.selection === reportesPendientes.length) {
            mostrarPanelStaff(player);
            return;
        }
        
        const reporteSeleccionado = reportesPendientes[response.selection];
        mostrarDetalleReporte(player, reporteSeleccionado);
    }).catch((error) => {
        console.warn("Error en mostrarReportesPendientes:", error);
    });
}

function mostrarDetalleReporte(player, reporte) {
    const form = new ActionFormData();
    form.title(`§6Reporte #${reporte.id}`);
    
    const severidadColor = reporte.seriedad >= 8 ? "§c" : reporte.seriedad >= 5 ? "§6" : "§e";
    
    form.body(
        `§7Reportado: §c${reporte.reportado}\n` +
        `§7Reportador: §a${reporte.reportador}\n` +
        `§7Fecha: §f${reporte.fecha}\n` +
        `§7Razón: §e${reporte.razon}\n` +
        `${severidadColor}Seriedad: ${reporte.seriedad}/10\n\n` +
        `§7Descripción:\n§f${reporte.descripcion}\n\n` +
        `§7Evidencia:\n§f${reporte.evidencia}`
    );
    
    form.button("§cBanear Jugador", "textures/ui/hammer");
    form.button("§6Advertir Jugador", "textures/ui/warning");
    form.button("§aMarcar como Resuelto", "textures/ui/check");
    form.button("§8Rechazar Reporte", "textures/ui/cancel");
    form.button("§7Volver", "textures/ui/back");
    
    form.show(player).then((response) => {
        if (response.canceled) return;
        
        switch (response.selection) {
            case 0:
                mostrarFormularioBanReporte(player, reporte);
                break;
            case 1:
                advertirJugador(player, reporte);
                break;
            case 2:
                resolverReporte(player, reporte, "Resuelto");
                break;
            case 3:
                resolverReporte(player, reporte, "Rechazado");
                break;
            case 4:
                mostrarReportesPendientes(player);
                break;
        }
    }).catch((error) => {
        console.warn("Error en mostrarDetalleReporte:", error);
    });
}

 function mostrarFormularioBanReporte(player, reporte) {
    const jugadorReportado = world.getPlayers().find(p => p.name === reporte.reportado);
    
    if (!jugadorReportado) {
        const errorForm = new MessageFormData();
        errorForm.title("§cError");
        errorForm.body(`§cEl jugador ${reporte.reportado} no está online.`);
        errorForm.button1("§7Entendido");
        errorForm.show(player).then(() => mostrarDetalleReporte(player, reporte)).catch((error) => {
            console.warn("Error mostrando error de jugador offline:", error);
        });
        return;
    }
    
    const razonFinal = reporte.razon === "Otro (especificar)" ? reporte.descripcion : reporte.razon;
    
    const form = new ModalFormData()
        .title("§c🔨 Banear Jugador - Reporte")
        .textField("§7Jugador:", reporte.reportado, { defaultValue: reporte.reportado })
        .textField("§7Razón del ban:", "Ingresa la razón del ban", { defaultValue: razonFinal })
        .textField("§7Minutos:", "0", { defaultValue: "0" })
        .textField("§7Segundos:", "0", { defaultValue: "0" })
        .toggle("§7¿Ban permanente?");
    
    form.show(player).then((result) => {
        if (result.canceled) return;
        
        const razon = result.formValues[1] || razonFinal;
        const minutos = Math.max(0, parseInt(result.formValues[2]) || 0);
        const segundos = Math.max(0, parseInt(result.formValues[3]) || 0);
        const permanente = result.formValues[4];
        
        if (permanente) {
            import("./ban-system.js").then(banSystem => {
                banSystem.aplicarBanPermanente(jugadorReportado, razon, player.name);
                reporte.estado = "Resuelto - Ban Permanente";
                reporte.gestionadoPor = player.name;
            });
        } else {
            if (minutos === 0 && segundos === 0) {
                player.sendMessage("§cDebes especificar una duración válida para el ban.");
                return;
            }
            const totalSegundos = minutos * 60 + segundos;
            import("./ban-system.js").then(banSystem => {
                banSystem.aplicarBan(jugadorReportado, razon, totalSegundos, player.name);
                reporte.estado = "Resuelto - Ban Temporal";
                reporte.gestionadoPor = player.name;
            });
        }
    }).catch((error) => {
        console.warn(`Error en formulario de ban para reporte: ${error}`);
    });
}

function advertirJugador(staff, reporte) {
    const jugadores = world.getPlayers();
    let jugadorOnline = null;
    
    for (let i = 0; i < jugadores.length; i++) {
        try {
            if (jugadores[i].name === reporte.reportado) {
                jugadorOnline = jugadores[i];
                break;
            }
        } catch (error) {
            continue;
        }
    }
    
    if (jugadorOnline) {
        jugadorOnline.sendMessage(`§6ADVERTENCIA OFICIAL §6`);
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
    confirmForm.show(staff).then(() => mostrarPanelStaff(staff)).catch((error) => {
        console.warn("Error mostrando confirmación de advertencia:", error);
    });
}

function resolverReporte(staff, reporte, estado) {
    reporte.estado = estado;
    reporte.gestionadoPor = staff.name;
    
    const mensaje = estado === "Resuelto" ? "resuelto" : "rechazado";
    
    const confirmForm = new MessageFormData();
    confirmForm.title(`§aReporte ${mensaje}`);
    confirmForm.body(`§7El reporte #${reporte.id} ha sido marcado como §e${mensaje}§7.`);
    confirmForm.button1("§aEntendido");
    confirmForm.show(staff).then(() => mostrarPanelStaff(staff)).catch((error) => {
        console.warn("Error mostrando confirmación de resolución:", error);
    });
}

function mostrarHistorialReportes(player) {
    if (reportes.length === 0) {
        const form = new MessageFormData();
        form.title("§7Historial Vacío");
        form.body("§7No hay reportes en el historial.");
        form.button1("§7Volver");
        form.show(player).then(() => mostrarPanelStaff(player)).catch((error) => {
            console.warn("Error mostrando historial vacío:", error);
        });
        return;
    }
    
    const form = new ActionFormData();
    form.title("§6Historial de Reportes");
    form.body(`§7Total de reportes: §e${reportes.length}`);
    
    const ultimosReportes = reportes.slice(-10).reverse();
    
    for (let i = 0; i < ultimosReportes.length; i++) {
        const reporte = ultimosReportes[i];
        const estadoColor = reporte.estado === "Pendiente" ? "§e" : 
                           reporte.estado.includes("Resuelto") ? "§a" : "§c";
        form.button(`§f#${reporte.id} - §c${reporte.reportado}\n${estadoColor}${reporte.estado} §8| §7${reporte.fecha}`);
    }
    
    form.button("§8Volver", "textures/ui/back");
    
    form.show(player).then((response) => {
        if (response.canceled) return;
        
        if (response.selection === Math.min(10, reportes.length)) {
            mostrarPanelStaff(player);
            return;
        }
        
        const reporteIndex = reportes.length - 1 - response.selection;
        const reporteSeleccionado = reportes[reporteIndex];
        mostrarDetalleReporte(player, reporteSeleccionado);
    }).catch((error) => {
        console.warn("Error en mostrarHistorialReportes:", error);
    });
}

function notificarStaff(reporte) {
    const jugadores = world.getPlayers();
    
    for (let i = 0; i < jugadores.length; i++) {
        const jugador = jugadores[i];
        try {
            if (esStaff(jugador)) {
                jugador.sendMessage(`§6NUEVO REPORTE §6`);
                jugador.sendMessage(`§7ID: §e#${reporte.id} §8| §7Seriedad: §6${reporte.seriedad}/10`);
                jugador.sendMessage(`§7Reportado: §c${reporte.reportado} §8| §7Por: §a${reporte.reportador}`);
                jugador.sendMessage(`§7Razón: §e${reporte.razon}`);
            }
        } catch (error) {
            console.warn("Error notificando a staff:", error);
            continue;
        }
    }
}

world.afterEvents.itemUse.subscribe((evd) => {
    try {
        if (evd.itemStack && evd.itemStack.typeId === "minecraft:dirt") {
            mostrarMenuPrincipal(evd.source);
        }
    } catch (error) {
        console.warn("Error en event listener itemUse:", error);
    }
});
