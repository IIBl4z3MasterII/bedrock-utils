/* 

██████╗ ██╗██╗  ██╗███████╗██████╗     ███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗ 
██╔══██╗██║██║  ██║╚══███╔╝╚════██╗    ████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗
██████╔╝██║███████║  ███╔╝  █████╔╝    ██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝
██╔══██╗██║╚════██║ ███╔╝   ╚═══██╗    ██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗
██████╔╝███████╗██║███████╗██████╔╝    ██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║
╚═════╝ ╚══════╝╚═╝╚══════╝╚═════╝     ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
                                                                                           
          Ban System •  By: @bl4z3master
*/

import { world, system, GameMode } from "@minecraft/server";
import { ModalFormData, MessageFormData, ActionFormData } from "@minecraft/server-ui";

let jugadoresBaneados = new Map();
let uiActiva = new Set();
let intervaloBaneos = null;

export function inicializarSistemaBaneos() {
    cargarJugadoresBaneados();
    iniciarVerificadorBaneos();
    configurarEventoJugadores();
    
    system.runTimeout(() => {
        world.getAllPlayers().forEach((player) => {
            verificarEstadoBanJugador(player);
        });
    }, 20);
}

function configurarEventoJugadores() {
    world.afterEvents.playerSpawn.subscribe((event) => {
        const player = event.player;
        if (event.initialSpawn) {
            system.runTimeout(() => {
                verificarEstadoBanJugador(player);
            }, 40);
        }
    });
}

function verificarEstadoBanJugador(player) {
    const nombreJugador = player.name;
    const datosBan = jugadoresBaneados.get(nombreJugador);

    if (!datosBan) return;

    const tiempoActual = Date.now();

    if (!datosBan.permanente && datosBan.tiempoFin <= tiempoActual) {
        removerJugadorBaneado(player);
        return;
    }

    aplicarRestriccionesBan(player);

    if (datosBan.permanente) {
        mostrarUIBanPermanente(player, datosBan.razon, datosBan.baneadoPor);
    } else {
        const tiempoRestante = Math.max(0, datosBan.tiempoFin - tiempoActual);
        mostrarUIBan(player, datosBan.razon, tiempoRestante / 1000, datosBan.baneadoPor);
    }
}

function cargarJugadoresBaneados() {
    try {
        jugadoresBaneados.clear();
        const jugadores = world.getAllPlayers();
        jugadores.forEach((player) => {
            migrarDatosLegacyBan(player);
        });
    } catch (error) {
        console.warn(`Error cargando jugadores baneados: ${error}`);
    }
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

    if (tagBaneadoHasta) {
        tiempoFin = parseInt(tagBaneadoHasta.split(":")[1]) || -1;
    }
    if (tagPermabanedo) {
        permanente = true;
    }
    if (tagRazon) {
        razon = tagRazon.split(":").slice(1).join(":") || "";
    }
    if (tagBaneadoPor) {
        baneadoPor = tagBaneadoPor.split(":").slice(1).join(":") || "";
    }
    if (tagFechaBan) {
        fechaBan = parseInt(tagFechaBan.split(":")[1]) || Date.now();
    }

    if (tiempoFin !== -1 || permanente) {
        jugadoresBaneados.set(player.name, {
            tiempoFin,
            permanente,
            razon,
            baneadoPor,
            fechaBan,
        });

        removerTagsLegacy(player);
    }
}

function removerTagsLegacy(player) {
    const tagsARemover = [
        "bannedUntil:",
        "permabanned",
        "banReason:",
        "bannedBy:",
        "banDate:",
        "baneado",
    ];

    const tags = player.getTags();
    tags.forEach((tag) => {
        if (
            tagsARemover.some((prefix) => tag.startsWith(prefix)) ||
            tag === "permabanned" ||
            tag === "baneado"
        ) {
            player.removeTag(tag);
        }
    });
}

function aplicarRestriccionesBan(player) {
    try {
        player.setGameMode(GameMode.Spectator); 
        player.inputPermissions.setPermissionCategory(1, false);
        player.inputPermissions.setPermissionCategory(2, false);
    } catch (error) {
        console.warn(`Error aplicando restricciones de ban a ${player.name}: ${error}`);
    }
}

function removerRestriccionesBan(player) {
    try {
        player.setGameMode(GameMode.Survival); 
        player.inputPermissions.setPermissionCategory(1, true);
        player.inputPermissions.setPermissionCategory(2, true);
    } catch (error) {
        console.warn(`Error removiendo restricciones de ban de ${player.name}: ${error}`);
    }
}

function guardarJugadorBaneado(player, razon, tiempoFin, baneadoPor, permanente = false) {
    const fechaBan = Date.now();
    const datosBan = {
        razon: razon || "Sin razón especificada",
        tiempoFin: permanente ? -1 : tiempoFin,
        baneadoPor: baneadoPor || "Sistema",
        permanente,
        fechaBan,
    };

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

        if (result.selection === 0) {
            mostrarFormularioBan(player);
        } else if (result.selection === 1) {
            mostrarFormularioDesban(player);
        } else if (result.selection === 2) {
            mostrarJugadoresBaneados(player);
        }
    }).catch((error) => {
        console.warn(`Error mostrando menú de baneos a ${player.name}: ${error}`);
    });
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

        if (permanente) {
            aplicarBanPermanente(jugadorSeleccionado, razon, player.name);
        } else {
            if (minutos === 0 && segundos === 0) {
                player.sendMessage("§cDebes especificar una duración válida para el ban.");
                return;
            }

            const totalSegundos = minutos * 60 + segundos;
            aplicarBan(jugadorSeleccionado, razon, totalSegundos, player.name);
        }
    }).catch((error) => {
        console.warn(`Error en formulario de ban para ${player.name}: ${error}`);
    });
}

function aplicarBanInterno(player, razon, duracion, baneadoPor, esPermanente) {
    const tiempoFin = esPermanente ? -1 : Date.now() + duracion * 1000;
    guardarJugadorBaneado(player, razon, tiempoFin, baneadoPor, esPermanente);

    const tipoBan = esPermanente ? "baneado permanentemente" : "baneado";
    notificarBanAJugadores(baneadoPor, player.name, tipoBan, razon);

    if (esPermanente) {
        mostrarUIBanPermanente(player, razon, baneadoPor);
    } else {
        mostrarUIBan(player, razon, duracion, baneadoPor);
    }
}

function notificarBanAJugadores(baneadoPor, nombreJugador, tipoBan, razon) {
    const mensaje = `§c${baneadoPor} ha ${tipoBan} a ${nombreJugador}. Razón: ${razon}`;
    world.getPlayers().forEach((p) => {
        try {
            p.sendMessage(mensaje);
        } catch (error) {
            console.warn(`Error enviando notificación de ban a ${p.name}: ${error}`);
        }
    });
}

function mostrarUIBanPermanente(player, razon, baneadoPor) {
    if (uiActiva.has(player.name)) {
        return;
    }

    uiActiva.add(player.name);

    const mostrarUI = () => {
        const infoBan = jugadoresBaneados.get(player.name);
        if (!infoBan || !infoBan.permanente) {
            uiActiva.delete(player.name);
            return;
        }

        const fechaBan = new Date(infoBan.fechaBan);
        const form = new ActionFormData()
            .title("§cBANEADO PERMANENTEMENTE")
            .body(
                `§7Razón: §c${razon}\n§7Baneado por: §e${baneadoPor}\n§7Fecha: §f${fechaBan.toLocaleDateString()}\n\n§c¡Este ban es permanente!`
            )
            .button("§7Aceptar");

        form.show(player).then(() => {
            if (
                jugadoresBaneados.has(player.name) &&
                jugadoresBaneados.get(player.name).permanente
            ) {
                system.runTimeout(() => {
                    mostrarUI();
                }, 60);
            } else {
                uiActiva.delete(player.name);
            }
        }).catch((error) => {
            uiActiva.delete(player.name);
            console.warn(`Error mostrando UI de ban permanente a ${player.name}: ${error}`);
        });
    };

    mostrarUI();
}

function mostrarUIBan(player, razon, duracion, baneadoPor) {
    if (uiActiva.has(player.name)) {
        return;
    }

    uiActiva.add(player.name);

    const actualizarUI = () => {
        const datosJugador = jugadoresBaneados.get(player.name);
        if (!datosJugador || datosJugador.permanente) {
            uiActiva.delete(player.name);
            return;
        }

        const tiempoRestante = Math.max(0, datosJugador.tiempoFin - Date.now());
        if (tiempoRestante <= 0) {
            removerJugadorBaneado(player); 
            player.sendMessage("§aTu ban ha expirado. ¡Bienvenido de vuelta!");
            return;
        }

        const minutos = Math.floor(tiempoRestante / 60000);
        const segundos = Math.floor((tiempoRestante % 60000) / 1000);
        const fechaBan = new Date(datosJugador.fechaBan);

        const form = new ActionFormData()
            .title("§cBANEADO TEMPORALMENTE")
            .body(
                `§7Fecha del ban: §f${fechaBan.toLocaleDateString()}\n§7Tiempo restante: §e${minutos}m ${segundos}s\n§7Razón: §c${razon}\n§7Baneado por: §e${baneadoPor}`
            )
            .button("§7Aceptar");

        form.show(player).then(() => {
            if (
                jugadoresBaneados.has(player.name) &&
                !jugadoresBaneados.get(player.name).permanente
            ) {
                system.runTimeout(() => {
                    actualizarUI();
                });
            } else {
                uiActiva.delete(player.name);
            }
        }).catch((error) => {
            uiActiva.delete(player.name);
            console.warn(`Error mostrando UI de ban temporal a ${player.name}: ${error}`);
        });
    };

    actualizarUI();
}

function iniciarVerificadorBaneos() {
    if (intervaloBaneos) {
        system.clearRun(intervaloBaneos);
    }

    intervaloBaneos = system.runInterval(() => {
        verificarBaneos();
    }, 200);
}

function verificarBaneos() {
    const tiempoActual = Date.now();
    const jugadoresADesbanear = [];

    jugadoresBaneados.forEach((infoBan, nombreJugador) => {
        const player = world.getPlayers().find((p) => p.name === nombreJugador);
        if (!player) return;

        if (!infoBan.permanente && infoBan.tiempoFin <= tiempoActual) {
            jugadoresADesbanear.push(player);
        }
    });

    jugadoresADesbanear.forEach((player) => {
        removerJugadorBaneado(player); 
        try {
            player.sendMessage("§aTu ban ha expirado. ¡Bienvenido de vuelta!");
        } catch (error) {
            console.warn(`Error enviando mensaje de desban a ${player.name}: ${error}`);
        }
    });
}

function mostrarFormularioDesban(player) {
    const nombresJugadoresBaneados = Array.from(jugadoresBaneados.keys());

    if (nombresJugadoresBaneados.length === 0) {
        player.sendMessage("§aNo hay jugadores baneados actualmente.");
        return;
    }

    const form = new ModalFormData()
        .title("§aDesbanear Jugador")
        .dropdown("§7Seleccionar jugador:", nombresJugadoresBaneados);

    form.show(player).then((result) => {
        if (result.canceled) return;

        const nombreJugadorSeleccionado = nombresJugadoresBaneados[result.formValues[0]];
        if (!nombreJugadorSeleccionado) return;

        const jugadorSeleccionado = world.getPlayers().find((p) => p.name === nombreJugadorSeleccionado);
        if (!jugadorSeleccionado) {
            player.sendMessage(`§cEl jugador ${nombreJugadorSeleccionado} no está en línea.`);
            return;
        }

        mostrarConfirmacionDesban(player, jugadorSeleccionado);
    }).catch((error) => {
        console.warn(`Error en formulario de desban para ${player.name}: ${error}`);
    });
}

function mostrarConfirmacionDesban(player, jugadorBaneado) {
    const datosJugador = jugadoresBaneados.get(jugadorBaneado.name);
    if (!datosJugador) return;

    const { razon, baneadoPor, permanente, tiempoFin } = datosJugador;
    let duracionBan;

    if (permanente) {
        duracionBan = "Ban Permanente";
    } else {
        const tiempoRestante = Math.max(0, tiempoFin - Date.now());
        const minutos = Math.floor(tiempoRestante / 60000);
        const segundos = Math.floor((tiempoRestante % 60000) / 1000);
        duracionBan = `${minutos} minutos y ${segundos} segundos`;
    }

    const form = new MessageFormData()
        .title("§aConfirmar Desban")
        .body(
            `§7¿Deseas desbanear a §c${jugadorBaneado.name}§7?\n\n§7Baneado por: §e${baneadoPor}\n§7Razón: §c${razon}\n§7Duración restante: §f${duracionBan}`
        )
        .button1("§cCancelar")
        .button2("§aDesbanear");

    form.show(player).then((result) => {
        if (result.selection === 1) {
            desbanearJugador(jugadorBaneado);
            player.sendMessage(`§a${jugadorBaneado.name} ha sido desbaneado exitosamente.`);
        }
    }).catch((error) => {
        console.warn(`Error en confirmación de desban para ${player.name}: ${error}`);
    });
}

function desbanearJugador(player) {
    removerJugadorBaneado(player);
    try {
        player.sendMessage("§aHas sido desbaneado. ¡Bienvenido de vuelta!");
    } catch (error) {
        console.warn(`Error enviando mensaje de desban a ${player.name}: ${error}`);
    }
}

export function mostrarJugadoresBaneados(player) {
    if (jugadoresBaneados.size === 0) {
        const form = new MessageFormData()
            .title("§aSin Jugadores Baneados")
            .body("§7No hay jugadores baneados actualmente.")
            .button1("§7Entendido");
        
        form.show(player).catch((error) => {
            console.warn("Error mostrando jugadores baneados vacío:", error);
        });
        return;
    }

    const form = new ActionFormData()
        .title("§cJugadores Baneados")
        .body(`§7Total de jugadores baneados: §e${jugadoresBaneados.size}`);

    jugadoresBaneados.forEach((ban, nombre) => {
        const tipo = ban.permanente ? "§c[PERMANENTE]" : "§e[TEMPORAL]";
        form.button(`${tipo} §f${nombre}\n§7${ban.razon}`);
    });

    form.show(player).then((result) => {
        if (result.canceled) return;

        const nombres = Array.from(jugadoresBaneados.keys());
        const banSeleccionado = jugadoresBaneados.get(nombres[result.selection]);
        mostrarDetalleBan(player, nombres[result.selection], banSeleccionado);
    }).catch((error) => {
        console.warn("Error en mostrarJugadoresBaneados:", error);
    });
}

function mostrarDetalleBan(player, nombre, ban) {
    const fechaBan = new Date(ban.fechaBan);
    let duracion = ban.permanente ? "§cPermanente" : "§eExpira pronto";
    
    if (!ban.permanente) {
        const tiempoRestante = Math.max(0, ban.tiempoFin - Date.now());
        const minutos = Math.floor(tiempoRestante / 60000);
        const segundos = Math.floor((tiempoRestante % 60000) / 1000);
        duracion = `§e${minutos}m ${segundos}s restantes`;
    }

    const form = new ActionFormData()
        .title(`§cDetalles: ${nombre}`)
        .body(
            `§7Jugador: §c${nombre}\n` +
            `§7Razón: §f${ban.razon}\n` +
            `§7Duración: ${duracion}\n` +
            `§7Fecha: §f${fechaBan.toLocaleDateString()}\n` +
            `§7Baneado por: §a${ban.baneadoPor}`
        )
        .button("§aDesbanear", "textures/ui/check")
        .button("§7⬅️ Volver", "textures/ui/arrow_left");

    form.show(player).then((result) => {
        if (result.canceled) return;

        switch (result.selection) {
            case 0:
                const jugadorBaneado = world.getPlayers().find(p => p.name === nombre);
                if (jugadorBaneado) {
                    desbanearJugador(jugadorBaneado);
                    player.sendMessage(`§a${nombre} ha sido desbaneado.`);
                } else {
                    player.sendMessage(`§c${nombre} no está en línea.`);
                }
                break;
            case 1:
                mostrarJugadoresBaneados(player);
                break;
        }
    }).catch((error) => {
        console.warn("Error en mostrarDetalleBan:", error);
    });
}

export function obtenerJugadoresBaneados() {
    return Array.from(jugadoresBaneados.keys());
}

export function estaJugadorBaneado(nombreJugador) {
    return jugadoresBaneados.has(nombreJugador);
}

export function obtenerInfoBan(nombreJugador) {
    return jugadoresBaneados.get(nombreJugador) || null;
}

export function aplicarBanPermanente(player, razon, baneadoPor) {
    aplicarBanInterno(player, razon, -1, baneadoPor, true);
}

export function aplicarBan(player, razon, duracion, baneadoPor) {
    aplicarBanInterno(player, razon, duracion, baneadoPor, false);
}
