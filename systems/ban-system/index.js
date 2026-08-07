import { world, system, GameMode, ItemStack, BlockPermutation } from "@minecraft/server";
import { ModalFormData, ActionFormData, MessageFormData } from "@minecraft/server-ui";

let bannedPlayers = new Map();
let activeUI = new Set();
let banInterval = null;
let reports = [];

const CONFIG = {
    STAFF_TAG: "Modd",
    REDSTONE_BLOCK_ID: "minecraft:redstone_block"
};

const REPORT_REASONS = [
    "Griefing", "Spam in chat", "Inappropriate language", "Hacks/Cheats",
    "toxic behavior", "Exploit abuse", "Harassment of other players",
    "Inappropriate constructions", "Trolling", "Other (specify)"
];

/* ====== Report System (from Main.js) ====== */

function isStaff(player) { return player.hasTag(CONFIG.STAFF_TAG); }

function getOnlinePlayers(excludePlayer = null) {
    const players = world.getPlayers();
    const names = [];
    for (let i = 0; i < players.length; i++) {
        const targetPlayer = players[i];
        if (targetPlayer !== excludePlayer) {
            try { if (targetPlayer.name && targetPlayer.name.length > 0) names.push(targetPlayer.name); } catch { continue; }
        }
    }
    return names;
}

function showMainMenu(player) {
    const form = new ActionFormData();
    form.title("§6§lReporting System");
    form.body("§7Select an option:");
    form.button("§cReport Player", "textures/ui/report_player");
    if (isStaff(player)) form.button("§aStaff Panel", "textures/ui/admin_panel");
    form.button("§8Close", "textures/ui/cancel");
    form.show(player).then((response) => {
        if (response.canceled) return;
        switch (response.selection) {
            case 0: showReportForm(player); break;
            case 1: if (isStaff(player)) showStaffPanel(player); break;
        }
    }).catch((error) => { console.warn("Error in showMainMenu:", error); });
}

function showReportForm(player) {
    const onlinePlayers = getOnlinePlayers(player);
    if (onlinePlayers.length === 0) {
        const errorForm = new MessageFormData();
        errorForm.title("§cError");
        errorForm.body("§cThere are no other players online to report.");
        errorForm.button1("§7Understood");
        errorForm.show(player).catch((error) => { console.warn("Error showing error form:", error); });
        return;
    }
    const form = new ModalFormData();
    form.title("§c📝 Report Player");
    form.dropdown("§7Player to report:", onlinePlayers);
    form.dropdown("§7Reason for the report:", REPORT_REASONS);
    form.slider("§7Seriousness (1-10):", 1, 10, 1, 5);
    form.textField("§7Additional description:", "Describe what happened...");
    form.textField("§7Evidence (optional):", "Links, coordinates, etc.");
    form.show(player).then((response) => {
        if (response.canceled) return;
        const reportedPlayer = onlinePlayers[response.formValues[0]];
        const reason = REPORT_REASONS[response.formValues[1]];
        const severity = response.formValues[2];
        const description = response.formValues[3] || "No description";
        const evidence = response.formValues[4] || "No evidence";
        const report = { id: reports.length + 1, date: new Date().toLocaleString(), reporter: player.name, reported: reportedPlayer, reason, severity, description, evidence, status: "Pending", handledBy: null };
        reports.push(report);
        const confirmForm = new MessageFormData();
        confirmForm.title("§aReport Sent");
        confirmForm.body(`§7Your report against§c${reportedPlayer}§7has been sent.\n§7Report ID:§e#${report.id}\n§7Seriedad: §6${severity}/10`);
        confirmForm.button1("§aUnderstood");
        confirmForm.show(player).catch((error) => { console.warn("Error showing confirmation:", error); });
        notifyStaff(report);
    }).catch((error) => { console.warn("Error in showReportForm:", error); });
}

function showStaffPanel(player) {
    if (!isStaff(player)) { player.sendMessage("§cYou do not have permissions to access the staff panel."); return; }
    let pendingReports = 0;
    for (let i = 0; i < reports.length; i++) { if (reports[i].status === "Pending") pendingReports++; }
    const bannedPlayersArr = getBannedPlayers();
    const form = new ActionFormData();
    form.title("§aStaff Panel");
    form.body(`§7Pending reports:§e${pendingReports}\n§7Total de reports: §6${reports.length}\n§7Jugadores baneados: §c${bannedPlayersArr.length}`);
    form.button("§eView Pending Reports", "textures/ui/book_edit_default");
    form.button("§6Report History", "textures/ui/book_normal_default");
    form.button("§cBanned Players", "textures/ui/hammer");
    form.button("§4Direct Ban", "textures/ui/redX1");
    form.button("§8Back", "textures/ui/back");
    form.show(player).then((response) => {
        if (response.canceled) return;
        switch (response.selection) {
            case 0: showPendingReports(player); break;
            case 1: showReportHistory(player); break;
            case 2: showBannedPlayers(player); break;
            case 3: showBanForm(player); break;
            case 4: showMainMenu(player); break;
        }
    }).catch((error) => { console.warn("Error in showStaffPanel:", error); });
}

function showPendingReports(player) {
    const pendingReports = [];
    for (let i = 0; i < reports.length; i++) { if (reports[i].status === "Pending") pendingReports.push(reports[i]); }
    if (pendingReports.length === 0) {
        const form = new MessageFormData();
        form.title("§aNo Pending Reports");
        form.body("§7There are no pending reports to review.");
        form.button1("§7Back");
        form.show(player).then(() => showStaffPanel(player)).catch((error) => { console.warn("Error showing empty pending reports:", error); });
        return;
    }
    const form = new ActionFormData();
    form.title("§ePending Reports");
    form.body("§7Select a report to review:");
    for (let i = 0; i < pendingReports.length; i++) {
        const r = pendingReports[i];
        const severityColor = r.severity >= 8 ? "§c" : r.severity >= 5 ? "§6" : "§e";
        form.button(`§f#${r.id} - §c${r.reported}\n${severityColor}Seriousness:${r.severity}/10 §8| §7${r.reason}`);
    }
    form.button("§8Back", "textures/ui/back");
    form.show(player).then((response) => {
        if (response.canceled) return;
        if (response.selection === pendingReports.length) { showStaffPanel(player); return; }
        showReportDetails(player, pendingReports[response.selection]);
    }).catch((error) => { console.warn("Error in showPendingReports:", error); });
}

function showReportDetails(player, report) {
    const form = new ActionFormData();
    form.title(`§6Report #${report.id}`);
    const severityColor = report.severity >= 8 ? "§c" : report.severity >= 5 ? "§6" : "§e";
    form.body(`§7Reported:§c${report.reported}\n§7Reporter: §a${report.reporter}\n§7Date: §f${report.date}\n§7Reason: §e${report.reason}\n${severityColor}Seriousness:${report.severity}/10\n\n§7Description:\n§f${report.description}\n\n§7Evidence:\n§f${report.evidence}`);
    form.button("§cBan Player", "textures/ui/hammer");
    form.button("§6Warn Player", "textures/ui/warning");
    form.button("§aMark as Solved", "textures/ui/check");
    form.button("§8Reject Report", "textures/ui/cancel");
    form.button("§7Back", "textures/ui/back");
    form.show(player).then((response) => {
        if (response.canceled) return;
        switch (response.selection) {
            case 0: showBanFormFromReport(player, report); break;
            case 1: warnPlayer(player, report); break;
            case 2: resolveReport(player, report, "Resolved"); break;
            case 3: resolveReport(player, report, "Rejected"); break;
            case 4: showPendingReports(player); break;
        }
    }).catch((error) => { console.warn("Error in showReportDetails:", error); });
}

function showBanFormFromReport(player, report) {
    const reportedPlayer = world.getPlayers().find(p => p.name === report.reported);
    if (!reportedPlayer) {
        const errorForm = new MessageFormData();
        errorForm.title("§cError");
        errorForm.body(`§cThe player${report.reported}It is not online.`);
        errorForm.button1("§7Understood");
        errorForm.show(player).then(() => showReportDetails(player, report)).catch((error) => { console.warn("Error showing offline player error:", error); });
        return;
    }
    const finalReason = report.reason === "Other (specify)" ? report.description : report.reason;
    const form = new ModalFormData()
        .title("§c🔨 Ban Player - Report")
        .textField("§7Player:", report.reported, report.reported)
        .textField("§7Reason for ban:", "Enter the reason for the ban", finalReason)
        .textField("§7Minutes:", "0", "0")
        .textField("§7Seconds:", "0", "0")
        .toggle("§7Permanent ban?");
    form.show(player).then((result) => {
        if (result.canceled) return;
        const reason = result.formValues[1] || finalReason;
        const minutes = Math.max(0, parseInt(result.formValues[2]) || 0);
        const seconds = Math.max(0, parseInt(result.formValues[3]) || 0);
        const permanent = result.formValues[4];
        if (permanent) { applyPermanentBan(reportedPlayer, reason, player.name); report.status = "Resolved - Permanent Ban"; report.handledBy = player.name; }
        else {
            if (minutes === 0 && seconds === 0) { player.sendMessage("§cYou must specify a valid duration for the ban."); return; }
            const totalSeconds = minutes * 60 + seconds;
            applyBan(reportedPlayer, reason, totalSeconds, player.name);
            report.status = "Resolved - Temporary Ban"; report.handledBy = player.name;
        }
    }).catch((error) => { console.warn(`Error in ban form for reporting:${error}`); });
}

function warnPlayer(staff, report) {
    const players = world.getPlayers();
    let onlinePlayer = null;
    for (let i = 0; i < players.length; i++) { try { if (players[i].name === report.reported) { onlinePlayer = players[i]; break; } } catch { continue; } }
    if (onlinePlayer) {
        onlinePlayer.sendMessage(`§6OFFICIAL WARNING`);
        onlinePlayer.sendMessage(`§7You have received a warning from the staff.`);
        onlinePlayer.sendMessage(`§7Reason:§e${report.reason}`);
        onlinePlayer.sendMessage(`§7Reported by:§c${report.reporter}`);
        onlinePlayer.sendMessage(`§7Managed by:§a${staff.name}`);
        onlinePlayer.sendMessage(`§cFuture infractions may result in a ban.`);
    }
    report.status = "Solved - Warning";
    report.handledBy = staff.name;
    world.sendMessage(`§6${report.reported}has received a warning from staff for:${report.reason}`);
    const confirmForm = new MessageFormData();
    confirmForm.title("§aWarning Sent");
    confirmForm.body(`§7A warning has been sent to§c${report.reported}§7.`);
    confirmForm.button1("§aUnderstood");
    confirmForm.show(staff).then(() => showStaffPanel(staff)).catch((error) => { console.warn("Error showing warning confirmation:", error); });
}

function resolveReport(staff, report, status) {
    report.status = status;
    report.handledBy = staff.name;
    const message = status === "Resolved" ? "resolved" : "rejected";
    const confirmForm = new MessageFormData();
    confirmForm.title(`§aReporte ${message}`);
    confirmForm.body(`§7The report #${report.id}has been marked as§e${message}§7.`);
    confirmForm.button1("§aUnderstood");
    confirmForm.show(staff).then(() => showStaffPanel(staff)).catch((error) => { console.warn("Error showing resolution confirmation:", error); });
}

function showReportHistory(player) {
    if (reports.length === 0) {
        const form = new MessageFormData();
        form.title("§7History Empty");
        form.body("§7There are no reports in history.");
        form.button1("§7Back");
        form.show(player).then(() => showStaffPanel(player)).catch((error) => { console.warn("Error showing empty history:", error); });
        return;
    }
    const form = new ActionFormData();
    form.title("§6Report History");
    form.body(`§7Total reports:§e${reports.length}`);
    const recentReports = reports.slice(-10).reverse();
    for (let i = 0; i < recentReports.length; i++) {
        const r = recentReports[i];
        const statusColor = r.status === "Pending" ? "§e" : r.status.includes("Resolved") ? "§a" : "§c";
        form.button(`§f#${r.id} - §c${r.reported}\n${statusColor}${r.status} §8| §7${r.date}`);
    }
    form.button("§8Back", "textures/ui/back");
    form.show(player).then((response) => {
        if (response.canceled) return;
        if (response.selection === Math.min(10, reports.length)) { showStaffPanel(player); return; }
        showReportDetails(player, reports[reports.length - 1 - response.selection]);
    }).catch((error) => { console.warn("Error in showReportHistory:", error); });
}

function notifyStaff(report) {
    const players = world.getPlayers();
    for (let i = 0; i < players.length; i++) {
        const targetPlayer = players[i];
        try {
            if (isStaff(targetPlayer)) {
                targetPlayer.sendMessage(`§6NEW REPORT`);
                targetPlayer.sendMessage(`§7ID:§e#${report.id} §8| §7Seriousness:§6${report.severity}/10`);
                targetPlayer.sendMessage(`§7Reported:§c${report.reported} §8| §7By:§a${report.reporter}`);
                targetPlayer.sendMessage(`§7Reason:§e${report.reason}`);
            }
        } catch (error) { console.warn("Error notifying staff:", error); continue; }
    }
}

/* ====== Ban System Core (from ban-system.js) ====== */

export function initBanSystem() {
    loadBannedPlayers();
    startBanChecker();
    setupPlayerEvents();
    system.runTimeout(() => { world.getAllPlayers().forEach((player) => { checkPlayerBanStatus(player); }); }, 20);
}

function setupPlayerEvents() {
    world.afterEvents.playerSpawn.subscribe((event) => {
        const player = event.player;
        if (event.initialSpawn) { system.runTimeout(() => { checkPlayerBanStatus(player); }, 40); }
    });
}

function checkPlayerBanStatus(player) {
    const playerName = player.name;
    const banData = bannedPlayers.get(playerName);
    if (!banData) return;
    const currentTime = Date.now();
    if (!banData.permanent && banData.endTime <= currentTime) { removeBannedPlayer(player); return; }
    applyBanRestrictions(player);
    if (banData.permanent) { showPermanentBanUI(player, banData.reason, banData.bannedBy); }
    else { const timeRemaining = Math.max(0, banData.endTime - currentTime); showBanUI(player, banData.reason, timeRemaining / 1000, banData.bannedBy); }
}

function loadBannedPlayers() {
    try {
        bannedPlayers.clear();
        const players = world.getAllPlayers();
        players.forEach((player) => { migrateLegacyBanData(player); });
    } catch (error) { console.warn(`Error loading banned players:${error}`); }
}

function migrateLegacyBanData(player) {
    const tags = player.getTags();
    let endTime = -1;
    let permanent = false;
    let reason = "";
    let bannedBy = "";
    let banDate = 0;
    const tagBannedUntil = tags.find((tag) => tag.startsWith("bannedUntil:"));
    const tagIsPermabanned = tags.includes("permabanned");
    const tagReason = tags.find((tag) => tag.startsWith("banReason:"));
    const tagBannedBy = tags.find((tag) => tag.startsWith("bannedBy:"));
    const tagBanDate = tags.find((tag) => tag.startsWith("banDate:"));
    if (tagBannedUntil) endTime = parseInt(tagBannedUntil.split(":")[1]) || -1;
    if (tagIsPermabanned) permanent = true;
    if (tagReason) reason = tagReason.split(":").slice(1).join(":") || "";
    if (tagBannedBy) bannedBy = tagBannedBy.split(":").slice(1).join(":") || "";
    if (tagBanDate) banDate = parseInt(tagBanDate.split(":")[1]) || Date.now();
    if (endTime !== -1 || permanent) {
        bannedPlayers.set(player.name, { endTime, permanent, reason, bannedBy, banDate });
        removeLegacyTags(player);
    }
}

function removeLegacyTags(player) {
    const tagsToRemove = ["bannedUntil:", "permabanned", "banReason:", "bannedBy:", "banDate:", "banned"];
    const tags = player.getTags();
    tags.forEach((tag) => {
        if (tagsToRemove.some((prefix) => tag.startsWith(prefix)) || tag === "permabanned" || tag === "banned") player.removeTag(tag);
    });
}

function applyBanRestrictions(player) {
    try {
        player.setGameMode(GameMode.Spectator);
        player.inputPermissions.setPermissionCategory(1, false);
        player.inputPermissions.setPermissionCategory(2, false);
    } catch (error) { console.warn(`Error applying ban restrictions to${player.name}: ${error}`); }
}

function removeBanRestrictions(player) {
    try {
        player.setGameMode(GameMode.Survival);
        player.inputPermissions.setPermissionCategory(1, true);
        player.inputPermissions.setPermissionCategory(2, true);
    } catch (error) { console.warn(`Error removing ban restrictions${player.name}: ${error}`); }
}

function saveBannedPlayer(player, reason, endTime, bannedBy, permanent = false) {
    const banDate = Date.now();
    const banData = { reason: reason || "No specified reason", endTime: permanent ? -1 : endTime, bannedBy: bannedBy || "System", permanent, banDate };
    bannedPlayers.set(player.name, banData);
    player.addTag("banned");
    applyBanRestrictions(player);
}

function removeBannedPlayer(player) {
    bannedPlayers.delete(player.name);
    activeUI.delete(player.name);
    player.removeTag("banned");
    removeBanRestrictions(player);
}

export function showBanMenu(player) {
    const form = new ActionFormData()
        .title("§cBanning System")
        .button("§cBan Player", "textures/ui/redX1")
        .button("§aUnban Player", "textures/ui/check")
        .button("§eView Banned Players", "textures/ui/book_metatag_default");
    form.show(player).then((result) => {
        if (result.canceled) return;
        if (result.selection === 0) showBanForm(player);
        else if (result.selection === 1) showUnbanForm(player);
        else if (result.selection === 2) showBannedPlayers(player);
    }).catch((error) => { console.warn(`Error showing ban menu${player.name}: ${error}`); });
}

export function showBanForm(player) {
    const players = Array.from(world.getPlayers());
    const playerNames = players.map((targetPlayer) => targetPlayer.name);
    const form = new ModalFormData()
        .title("§cBan Player")
        .dropdown("§7Select player:", playerNames)
        .textField("§7Reason for ban:", "Write the reason...")
        .textField("§7Minutes:", "0")
        .textField("§7Seconds:", "0")
        .toggle("§7Permanent ban?");
    form.show(player).then((result) => {
        if (result.canceled) return;
        const selectedPlayer = players[result.formValues[0]];
        if (!selectedPlayer) return;
        const reason = result.formValues[1] || "No specified reason";
        const minutes = Math.max(0, parseInt(result.formValues[2]) || 0);
        const seconds = Math.max(0, parseInt(result.formValues[3]) || 0);
        const permanent = result.formValues[4];
        if (permanent) applyPermanentBan(selectedPlayer, reason, player.name);
        else {
            if (minutes === 0 && seconds === 0) { player.sendMessage("§cYou must specify a valid duration for the ban."); return; }
            applyBan(selectedPlayer, reason, minutes * 60 + seconds, player.name);
        }
    }).catch((error) => { console.warn(`Error in ban form for${player.name}: ${error}`); });
}

function applyBanInternal(player, reason, duration, bannedBy, isPermanent) {
    const endTime = isPermanent ? -1 : Date.now() + duration * 1000;
    saveBannedPlayer(player, reason, endTime, bannedBy, isPermanent);
    const banType = isPermanent ? "permanently banned" : "banned";
    notifyPlayersOfBan(bannedBy, player.name, banType, reason);
    if (isPermanent) showPermanentBanUI(player, reason, bannedBy);
    else showBanUI(player, reason, duration, bannedBy);
}

function notifyPlayersOfBan(bannedBy, playerName, banType, reason) {
    const message = `§c${bannedBy} has ${banType} ${playerName}. Reason: ${reason}`;
    world.getPlayers().forEach((p) => { try { p.sendMessage(message); } catch (error) { console.warn(`Error sending ban notification to${p.name}: ${error}`); } });
}

function showPermanentBanUI(player, reason, bannedBy) {
    if (activeUI.has(player.name)) return;
    activeUI.add(player.name);
    const showUI = () => {
        const banInfo = bannedPlayers.get(player.name);
        if (!banInfo || !banInfo.permanent) { activeUI.delete(player.name); return; }
        const banDate = new Date(banInfo.banDate);
        const form = new ActionFormData()
            .title("§cPERMANENTLY BANNED")
            .body(`§7Reason:§c${reason}\n§7Banned by: §e${bannedBy}\n§7Date: §f${banDate.toLocaleDateString()}\n\n§cThis ban is permanent!`)
            .button("§7Accept");
        form.show(player).then(() => {
            if (bannedPlayers.has(player.name) && bannedPlayers.get(player.name).permanent) {
                system.runTimeout(showUI, 60);
            } else activeUI.delete(player.name);
        }).catch((error) => { activeUI.delete(player.name); console.warn(`Error showing permanent ban UI${player.name}: ${error}`); });
    };
    showUI();
}

function showBanUI(player, reason, duration, bannedBy) {
    if (activeUI.has(player.name)) return;
    activeUI.add(player.name);
    const updateUI = () => {
        const playerData = bannedPlayers.get(player.name);
        if (!playerData || playerData.permanent) { activeUI.delete(player.name); return; }
        const timeRemaining = Math.max(0, playerData.endTime - Date.now());
        if (timeRemaining <= 0) { removeBannedPlayer(player); player.sendMessage("§aYour ban has expired. Welcome back!"); return; }
        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);
        const banDate = new Date(playerData.banDate);
        const form = new ActionFormData()
            .title("§cTEMPORARILY BANNED")
            .body(`§7Ban date:§f${banDate.toLocaleDateString()}\n§7Tiempo restante: §e${minutes}m ${seconds}s\n§7Reason:§c${reason}\n§7Baneado por: §e${bannedBy}`)
            .button("§7Accept");
        form.show(player).then(() => {
            if (bannedPlayers.has(player.name) && !bannedPlayers.get(player.name).permanent) system.runTimeout(updateUI);
            else activeUI.delete(player.name);
        }).catch((error) => { activeUI.delete(player.name); console.warn(`Error showing UI from temporary ban to${player.name}: ${error}`); });
    };
    updateUI();
}

function startBanChecker() {
    if (banInterval) system.clearRun(banInterval);
    banInterval = system.runInterval(checkBans, 200);
}

function checkBans() {
    const currentTime = Date.now();
    const playersToUnban = [];
    bannedPlayers.forEach((banInfo, playerName) => {
        const player = world.getPlayers().find((p) => p.name === playerName);
        if (!player) return;
        if (!banInfo.permanent && banInfo.endTime <= currentTime) playersToUnban.push(player);
    });
    playersToUnban.forEach((player) => { removeBannedPlayer(player); try { player.sendMessage("§aYour ban has expired. Welcome back!"); } catch (error) { console.warn(`Error sending desban message to${player.name}: ${error}`); } });
}

function showUnbanForm(player) {
    const bannedPlayerNames = Array.from(bannedPlayers.keys());
    if (bannedPlayerNames.length === 0) { player.sendMessage("§aThere are no currently banned players."); return; }
    const form = new ModalFormData()
        .title("§aUnban Player")
        .dropdown("§7Select player:", bannedPlayerNames);
    form.show(player).then((result) => {
        if (result.canceled) return;
        const selectedPlayerName = bannedPlayerNames[result.formValues[0]];
        if (!selectedPlayerName) return;
        const selectedPlayer = world.getPlayers().find((p) => p.name === selectedPlayerName);
        if (!selectedPlayer) { player.sendMessage(`§cThe player${selectedPlayerName}is not online.`); return; }
        showUnbanConfirmation(player, selectedPlayer);
    }).catch((error) => { console.warn(`Error in deban form for${player.name}: ${error}`); });
}

function showUnbanConfirmation(player, bannedPlayer) {
    const playerData = bannedPlayers.get(bannedPlayer.name);
    if (!playerData) return;
    const { reason, bannedBy, permanent, endTime } = playerData;
    let banDuration;
    if (permanent) banDuration = "Permanent Ban";
    else { const timeRemaining = Math.max(0, endTime - Date.now()); banDuration = `${Math.floor(timeRemaining / 60000)}minutes and${Math.floor((timeRemaining % 60000) / 1000)} seconds`; }
    const form = new MessageFormData()
        .title("§aConfirm Desban")
        .body(`§7Do you want to unban§c${bannedPlayer.name}§7?\n\n§7Banned by:§e${bannedBy}\n§7Reason: §c${reason}\n§7Remaining duration: §f${banDuration}`)
        .button1("§cCancel")
        .button2("§aUnban");
    form.show(player).then((result) => {
        if (result.selection === 1) { unbanPlayer(bannedPlayer); player.sendMessage(`§a${bannedPlayer.name}has been successfully unbanned.`); }
    }).catch((error) => { console.warn(`Deban confirmation error for${player.name}: ${error}`); });
}

function unbanPlayer(player) { removeBannedPlayer(player); try { player.sendMessage("§aYou have been unbanned. Welcome back!"); } catch (error) { console.warn(`Error sending desban message to${player.name}: ${error}`); } }

export function showBannedPlayers(player) {
    if (bannedPlayers.size === 0) {
        const form = new MessageFormData().title("§aNo Banned Players").body("§7There are no currently banned players.").button1("§7Understood");
        form.show(player).catch((error) => { console.warn("Error showing empty banned players:", error); });
        return;
    }
    const form = new ActionFormData().title("§cBanned Players").body(`§7Total banned players:§e${bannedPlayers.size}`);
    bannedPlayers.forEach((ban, name) => { form.button(`${ban.permanent ? "§c[PERMANENT]" : "§e[TEMPORARY]"} §f${name}\n§7${ban.reason}`); });
    form.show(player).then((result) => {
        if (result.canceled) return;
        const names = Array.from(bannedPlayers.keys());
        showBanDetails(player, names[result.selection], bannedPlayers.get(names[result.selection]));
    }).catch((error) => { console.warn("Error in showBannedPlayers:", error); });
}

function showBanDetails(player, name, ban) {
    const banDate = new Date(ban.banDate);
    let duration = ban.permanent ? "§cPermanent" : "§eExpires soon";
    if (!ban.permanent) { const t = Math.max(0, ban.endTime - Date.now()); duration = `§e${Math.floor(t / 60000)}m ${Math.floor((t % 60000) / 1000)}remaining s`; }
    const form = new ActionFormData().title(`§cDetails:${name}`)
        .body(`§7Player:§c${name}\n§7Reason: §f${ban.reason}\n§7Duration: ${duration}\n§7Date: §f${banDate.toLocaleDateString()}\n§7Banned by: §a${ban.bannedBy}`)
        .button("§aUnban", "textures/ui/check").button("§7⬅️ Back", "textures/ui/arrow_left");
    form.show(player).then((result) => {
        if (result.canceled) return;
        switch (result.selection) {
            case 0:
                const j = world.getPlayers().find(p => p.name === name);
                if (j) { unbanPlayer(j); player.sendMessage(`§a${name}has been unbanned.`); }
                else player.sendMessage(`§c${name}is not online.`);
                break;
            case 1: showBannedPlayers(player); break;
        }
    }).catch((error) => { console.warn("Error in showBanDetails:", error); });
}

export function getBannedPlayers() { return Array.from(bannedPlayers.keys()); }
export function isPlayerBanned(playerName) { return bannedPlayers.has(playerName); }
export function getBanInfo(playerName) { return bannedPlayers.get(playerName) || null; }
export function applyPermanentBan(player, reason, bannedBy) { applyBanInternal(player, reason, -1, bannedBy, true); }
export function applyBan(player, reason, duration, bannedBy) { applyBanInternal(player, reason, duration, bannedBy, false); }

/* ====== Event Listener (from Main.js) ====== */
world.afterEvents.itemUse.subscribe((evd) => {
    try { if (evd.itemStack && evd.itemStack.typeId === "minecraft:redstone_block") showMainMenu(evd.source); }
    catch (error) { console.warn("Error in event listeneritemUse:", error); }
});
