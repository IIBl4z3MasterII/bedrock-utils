import { ActionFormData, ModalFormData, MessageFormData } from "@minecraft/server-ui";

function resolve(v, ctx) {
  return typeof v === "function" ? v(ctx) : v;
}

export function action(title, body, buttons) {
  return { type: "action", title, body, buttons };
}

export function modal(title, fields, submitButton) {
  return { type: "modal", title, fields, submitButton };
}

export function message(title, body, button1, button2) {
  return { type: "message", title, body, button1, button2 };
}

export function buildForm(tpl, ctx = {}) {
  if (typeof tpl === "function") tpl = tpl(ctx);
  const title = resolve(tpl.title, ctx);
  const body = resolve(tpl.body, ctx);

  switch (tpl.type) {
    case "action": {
      const form = new ActionFormData().title(title);
      if (body) form.body(body);
      const buttons = resolve(tpl.buttons, ctx);
      for (const b of buttons) form.button(b.text, b.icon);
      return form;
    }
    case "modal": {
      const form = new ModalFormData().title(title);
      const fields = resolve(tpl.fields, ctx);
      for (const f of fields) {
        const label = resolve(f.label, ctx);
        const opts = resolve(f.options, ctx);
        const def = resolve(f.defaultValue, ctx);
        switch (f.type) {
          case "dropdown": form.dropdown(label, opts || [], { defaultValueIndex: f.defaultIndex ?? 0 }); break;
          case "textField": form.textField(label, f.placeholder || "", { defaultValue: def ?? "" }); break;
          case "toggle": form.toggle(label, { defaultValue: def ?? false }); break;
          case "slider": form.slider(label, f.min ?? 0, f.max ?? 100, { valueStep: f.step ?? 1, defaultValue: def ?? 0 }); break;
        }
      }
      if (tpl.submitButton) form.submitButton(tpl.submitButton);
      return form;
    }
    case "message": {
      const form = new MessageFormData().title(title).body(body || "");
      if (tpl.button1) form.button1(resolve(tpl.button1, ctx));
      if (tpl.button2) form.button2(resolve(tpl.button2, ctx));
      return form;
    }
    default: throw new Error(`Unknown form type: ${tpl.type}`);
  }
}

export function buildAndShow(tpl, ctx = {}) {
  const form = buildForm(tpl, ctx);
  return form.show(ctx.player);
}

const MENU_STRUCTURE = {};
const MODAL_STRUCTURE = {};

export function registerActionMenu(id, config) { MENU_STRUCTURE[id] = config; }
export function registerModalForm(id, config) { MODAL_STRUCTURE[id] = config; }

export function mostrarMenu(player, menuId, onBack) {
  const menu = MENU_STRUCTURE[menuId];
  if (!menu) return;
  const form = buildForm({
    type: "action",
    title: menu.title,
    body: menu.body,
    buttons: menu.buttons.map((b) => ({ text: typeof b === "string" ? b : b.text, icon: b.icon })),
  }, { player });
  form.show(player).then(({ canceled, selection }) => {
    if (canceled) return onBack?.();
    const btn = menu.buttons[selection];
    if (!btn) return;
    if (btn.action) mostrarMenu(player, btn.action, onBack);
    else if (btn.modal) mostrarModal(player, btn.modal, onBack);
    else if (btn.callback) btn.callback(player, () => mostrarMenu(player, menuId, onBack));
  }).catch(() => {});
}

export function mostrarModal(player, formId, onBack) {
  const config = MODAL_STRUCTURE[formId];
  if (!config) return;
  const form = buildForm({
    type: "modal", title: config.title, fields: config.fields, submitButton: config.submitButton,
  }, { player });
  form.show(player).then(({ canceled, formValues }) => {
    if (canceled) return onBack?.();
    config.onSubmit?.(player, formValues, onBack);
  }).catch(() => {});
}
