import { world, system } from "@minecraft/server";
import { action, modal, message, buildAndShow, registerActionMenu, registerModalForm, mostrarMenu } from "./index.js";

registerActionMenu("demo", {
  title: "§6Demo Template UI",
  body: "Elige un tipo de formulario",
  buttons: [
    {
      text: "§aActionForm",
      callback: (p, back) => {
        buildAndShow(action("ActionForm", "Esto es un ActionForm", [
          { text: "Opción 1" },
          { text: "Opción 2", icon: "textures/ui/icon_steve" },
        ]), { player: p }).then((r) => {
          if (!r.canceled) p.sendMessage(`§aElegiste: §e${r.selection}`);
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
        buildAndShow(message("MessageForm", "¿Te gusta esto?", "§aSí", "§cNo"), { player: p }).then((r) => {
          if (!r.canceled) p.sendMessage(r.selection === 0 ? "§aDijiste que sí!" : "§cDijiste que no");
          back();
        });
      },
    },
    {
      text: "§7Cerrar",
      callback: (p) => p.sendMessage("§7Menú cerrado"),
    },
  ],
});

registerModalForm("demo_modal", {
  title: "§bFormulario Modal",
  fields: [
    { type: "toggle", label: "Activar", defaultValue: true },
    { type: "textField", label: "Nombre", placeholder: "Escribe tu nombre" },
    { type: "slider", label: "Edad", min: 0, max: 100, step: 1, defaultValue: 18 },
  ],
  submitButton: "§aEnviar",
  onSubmit: (p, values, back) => {
    p.sendMessage(`§aToggle: §e${values[0]} §7| §aNombre: §e${values[1]} §7| §aEdad: §e${values[2]}`);
    back();
  },
});

world.beforeEvents.chatSend.subscribe((ev) => {
  if (ev.message === "!menu") {
    ev.cancel = true;
    system.run(() => mostrarMenu(ev.sender, "demo"));
  }
});
