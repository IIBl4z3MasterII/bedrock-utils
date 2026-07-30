import { world, system } from "@minecraft/server";
import { RtpHelper } from "./index";

let rtpInstance;

function getRtp() {
  if (!rtpInstance) {
    rtpInstance = new RtpHelper({
      cooldownMs: 30000,
      stillTimeMs: 3000,
      searchRadius: 1500,
    });
  }
  return rtpInstance;
}

world.beforeEvents.chatSend.subscribe((ev) => {
  const msg = ev.message;
  const player = ev.sender;

  if (msg === "!rtp") {
    ev.cancel = true;
    system.run(() => {
      getRtp().rtp(player);
    });
  }

  if (msg === "!rtp overworld") {
    ev.cancel = true;
    system.run(() => {
      getRtp().rtp(player, "minecraft:overworld");
    });
  }

  if (msg === "!rtp nether") {
    ev.cancel = true;
    system.run(() => {
      getRtp().rtp(player, "minecraft:nether");
    });
  }

  if (msg === "!rtp end") {
    ev.cancel = true;
    system.run(() => {
      getRtp().rtp(player, "minecraft:the_end");
    });
  }

  if (msg === "!rtp cancel") {
    ev.cancel = true;
    system.run(() => {
      getRtp().cancel(player);
    });
  }
});
