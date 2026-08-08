import { world, system } from "@minecraft/server";
import { action, modal, message, buildAndShow, registerActionMenu, registerModalForm, showMenu } from "./index.js";

registerActionMenu("demo", {
  title: "§6Demo Template UI",
  body: "Choose a type of form",
  buttons: [
    {
      text: "§aActionForm",
      callback: (p, back) => {
        buildAndShow(action("ActionForm", "This is aActionForm", [
          { text: "Option 1" },
          { text: "Option 2", icon: "textures/ui/icon_steve" },
        ]), { player: p }).then((r) => {
          if (!r.canceled) p.sendMessage(`§aYou chose:§e${r.selection}`);
          back();
        });
      },
    },
    {
      text: "§bModalForm",
      modal: "demo_modal",
    },
    {
      text: "§dMessageForm",
      callback: (p, back) => {
        buildAndShow(message("MessageForm", "Do you like this?", "§aYes", "§cNo"), { player: p }).then((r) => {
          if (!r.canceled) p.sendMessage(r.selection === 0 ? "§aYou said yes!" : "§cyou said no");
          back();
        });
      },
    },
    {
      text: "§7Cerrar",
      callback: (p) => p.sendMessage("§7Closed menu"),
    },
  ],
});

registerModalForm("demo_modal", {
  title: "§bModal Form",
  fields: [
    { type: "toggle", label: "Enable", defaultValue: true },
    { type: "textField", label: "Name", placeholder: "write your name" },
    { type: "slider", label: "Age", min: 0, max: 100, step: 1, defaultValue: 18 },
  ],
  submitButton: "§aSubmit",
  onSubmit: (p, values, back) => {
    p.sendMessage(`§aToggle:§e${values[0]} §7| §aName:§e${values[1]} §7| §aAge:§e${values[2]}`);
    back();
  },
});

world.beforeEvents.chatSend.subscribe((ev) => {
  if (ev.message === "!menu") {
    ev.cancel = true;
    system.run(() => showMenu(ev.sender, "demo"));
  }
});
