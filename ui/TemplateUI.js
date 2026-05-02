/* 

██████╗ ██╗██╗  ██╗███████╗██████╗     ███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗ 
██╔══██╗██║██║  ██║╚══███╔╝╚════██╗    ████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗
██████╔╝██║███████║  ███╔╝  █████╔╝    ██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝
██╔══██╗██║╚════██║ ███╔╝   ╚═══██╗    ██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗
██████╔╝███████╗██║███████╗██████╔╝    ██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║
╚═════╝ ╚══════╝╚═╝╚══════╝╚═════╝     ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
                                                                                           
          UI Template  •  By: @bl4z3master
*/

import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

//UI Template By @bl4z3master :D Free use but leave credit to the creator of the template XD, then don't say that you made it
// Aca definir menus y opciones ok? (ActionFormData)
const MENU_STRUCTURE = {
    main: {
        title: "§l§bMenú Principal",
        body: "§7Selecciona una opción:",
        buttons: [
            {
                text: "§l§6Opción 1\n§r§7Descripción de la opción 1",
                action: "showSubMenu1"
            },
            {
                text: "§l§aOpción 2\n§r§7Descripción de la opción 2",
                action: "showSubMenu2"
            },
            {
                text: "§l§eConfiguración\n§r§7Ajusta las opciones",
                action: "showConfig"
            }
        ]
    },
    subMenu1: {
        title: "§l§6Submenú 1",
        body: "§7Selecciona una opción:",
        buttons: [
            {
                text: "§aOpción 1.1\n§7Descripción 1.1",
                action: (player) => {
                    player.sendMessage("§aEjecutada opción 1.1");
                }
            },
            {
                text: "§bOpción 1.2\n§7Descripción 1.2",
                action: (player) => {
                    player.sendMessage("§bEjecutada opción 1.2");
                }
            }
        ]
    }
};

// Modal Form 
const MODAL_FORM_STRUCTURE = {
    config: {
        title: "§lFormulario de Configuración",
        elements: [
            {
                type: "toggle",
                label: "§aOpción 1",
                defaultValue: true
            },
            {
                type: "toggle",
                label: "§bOpción 2",
                defaultValue: false
            },
            {
                type: "slider",
                label: "§eValor",
                min: 0,
                max: 100,
                valueStep: 1,
                defaultValue: 50
            },
            {
                type: "textField",
                label: "§7Nombre",
                placeholder: "Ingresa un nombre..."
            }
        ],
        onSubmit: (player, values) => {
            const [option1, option2, sliderValue, textValue] = values;
            player.sendMessage(
                `§aOpciones seleccionadas:\n` +
                `§7- Opción 1: ${option1 ? "§aActivada" : "§cDesactivada"}\n` +
                `§7- Opción 2: ${option2 ? "§aActivada" : "§cDesactivada"}\n` +
                `§7- Valor: §e${sliderValue}\n` +
                `§7- Texto: §f${textValue}`
            );
        }
    },
    settings: {
        title: "§lConfiguración Adicional",
        elements: [
            {
                type: "toggle",
                label: "§dModo Nocturno",
                defaultValue: false
            },
            {
                type: "slider",
                label: "§bVolumen",
                min: 0,
                max: 100,
                valueStep: 10,
                defaultValue: 70
            }
        ],
        onSubmit: (player, values) => {
            const [darkMode, volume] = values;
            player.sendMessage(
                `§aAjustes guardados:\n` +
                `§7- Modo Nocturno: ${darkMode ? "§aActivado" : "§cDesactivado"}\n` +
                `§7- Volumen: §b${volume}%`
            );
        }
    }
};

class UIManager {
    constructor() {
        this.menuActions = {
            showSubMenu1: (player) => this.showMenu(player, "subMenu1"),
            showSubMenu2: (player) => this.showModalForm(player, "config"),
            showConfig:   (player) => this.showModalForm(player, "settings")
        };
    }

    showMenu(player, menuType = "main") {
        const menuData = MENU_STRUCTURE[menuType];
        if (!menuData) return;

        const form = new ActionFormData()
            .title(menuData.title)
            .body(menuData.body);

        menuData.buttons.forEach(btn => form.button(btn.text));

        form.show(player).then(response => {
            if (!response || response.canceled) return;

            const selected = menuData.buttons[response.selection];
            if (!selected) return;

            if (typeof selected.action === "string") {
                const fn = this.menuActions[selected.action];
                if (fn) fn(player);
            } else if (typeof selected.action === "function") {
                selected.action(player);
            }
        }).catch(() => {});
    }

    showModalForm(player, formType) {
        const formData = MODAL_FORM_STRUCTURE[formType];
        if (!formData) return;

        const form = new ModalFormData().title(formData.title);

        formData.elements.forEach(el => {
            switch (el.type) {
                case "toggle":
                    form.toggle(el.label, { defaultValue: el.defaultValue ?? false });
                    break;
                case "slider":
                    form.slider(el.label, el.min, el.max, {
                        defaultValue: el.defaultValue,
                        valueStep:    el.valueStep ?? 1
                    });
                    break;
                case "textField":
                    form.textField(el.label, el.placeholder ?? "", { defaultValue: el.defaultValue ?? "" });
                    break;
                case "dropdown":
                    form.dropdown(el.label, el.items, { defaultValueIndex: el.defaultValue ?? 0 });
                    break;
            }
        });

        form.show(player).then(response => {
            if (!response || response.canceled) return;
            formData.onSubmit(player, response.formValues);
        }).catch(() => {});
    }

    showConfigMenu(player) {
        const form = new ActionFormData()
            .title("§l§eConfiguración")
            .body("§7Selecciona qué quieres configurar:")
            .button("§3Opción de Configuración 1\n§7Descripción de la configuración")
            .button("§bOpción de Configuración 2\n§7Descripción de la configuración");

        form.show(player).then(response => {
            if (!response || response.canceled) return;
            switch (response.selection) {
                case 0: player.sendMessage("§aSeleccionaste la configuración 1"); break;
                case 1: player.sendMessage("§bSeleccionaste la configuración 2"); break;
            }
        }).catch(() => {});
    }
}

const uiManager = new UIManager();

//Usa un palo para abrir la UI ;3
world.afterEvents.itemUse.subscribe(ev => {
    if (ev.itemStack?.typeId === "minecraft:stick") {
        uiManager.showMenu(ev.source);
    }
});
