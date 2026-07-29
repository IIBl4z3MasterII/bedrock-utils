
const LEVELS = { DEBUG: "DEBUG", INFO: "INFO", WARN: "WARN", ERROR: "ERROR" };
const ENABLED = { DEBUG: false, INFO: true, WARN: true, ERROR: true };

function ts() {
  const d = new Date();
  return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}:${d.getUTCSeconds().toString().padStart(2, "0")}`;
}

function resolveMsg(msgOrErr) {
  return msgOrErr instanceof Error ? msgOrErr.message : String(msgOrErr);
}

function resolveStack(msgOrErr) {
  return msgOrErr instanceof Error ? `\n${msgOrErr.stack}` : "";
}

export const logger = {
  debug(system, msg) { if (!ENABLED.DEBUG) return; console.debug(`[${LEVELS.DEBUG}][${ts()}][${system}] ${msg}`); },
  info(system, msg)  { if (!ENABLED.INFO) return;  console.log(`[${LEVELS.INFO}][${ts()}][${system}] ${msg}`); },
  warn(system, msg)  { if (!ENABLED.WARN) return;  console.warn(`[${LEVELS.WARN}][${ts()}][${system}] ${msg}`); },
  error(system, msgOrErr, extraMsg) {
    if (!ENABLED.ERROR) return;
    const parts = [resolveMsg(msgOrErr)];
    if (extraMsg) parts.push(extraMsg);
    console.error(`[${LEVELS.ERROR}][${ts()}][${system}] ${parts.join(" | ")}${resolveStack(msgOrErr)}`);
  },
};
