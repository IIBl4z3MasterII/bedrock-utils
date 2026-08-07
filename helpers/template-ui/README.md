#🖼️TemplateUI

Declarative Builder on `ActionFormData`, `ModalFormData` and
`MessageFormData`: instead of compiling each form imperatively, you describe
the structure as an object (or function that returns an object) and this
layer translates it into actual Forms API calls. Also includes a
navigation system between menus registered by ID.

---

## Archive

| Archive | Role |
|---|---|
| `index.js` | Functions `forceShow`, `action`, `modal`, `message`, `buildForm`, `buildAndShow`, `registerActionMenu`, `registerModalForm`, `showMenu`, `showModal` |

Unlike the rest of `helpers/`, this module exports **functions
loose**, not a class — because it models a declarative language of
templates, not an object with its own state.

---

## Why does it exist

Building Bedrock UIs by hand means repeating `newActionFormData().title(...).body(...).button(...)`
in each menu, and handle the `.then()/.catch()` of each `.show()` by
separate. `TemplateUI` separates **what is shown** (the template, a
flat object) from **as shown** (`buildForm`/`buildAndShow`), and
adds a simple router for menus that open to each other by id.

---

## Templates: `action`, `modal`, `message`

They are just flat object constructors — they don't call the Forms API
still.

| Function | Form that produces | Fields |
|---|---|---|
| `action(title, body, buttons)` | `ActionFormData` | `buttons: Array<{ text, icon? }>` |
| `modal(title, fields,submitButton)` | `ModalFormData` | `fields: Array<FieldSpec>` (see below) |
| `message(title, body, button1, button2)` | `MessageFormData` | two simple buttons |

`title`, `body` and any field in `fields` can be a fixed value
**or a function `(ctx) => value`** — are resolved at call time
build the form, receiving the `ctx` that you pass to `buildForm`. This
allows reusable templates with dynamic data (e.g. display name
of the player or their current balance without having to recreate the template object
every time).

### `FieldSpec` (for `modal`)

| `type` | Own fields | Maps to |
|---|---|---|
| `"dropdown"` | `label`, `options`, `defaultIndex?` | `form.dropdown(...)` |
| `"textField"` | `label`, `placeholder?`, `defaultValue?` | `form.textField(...)` |
| `"toggle"` | `label`, `defaultValue?` | `form.toggle(...)` |
| `"slider"` | `label`, `min?`, `max?`, `step?`, `defaultValue?` | `form.slider(...)` |

---

## Show without being canceled byUserBusy:`forceShow`

```js
export async function forceShow(form, player, maximumRetries = 300)
```

Wrapper over `form.show(player)` that automatically retries when
the form is canceled by `FormCancelationReason.UserBusy` (the player
I had another UI open on the same tick, typical when opening a form from
an event). If it exceeds `maximumRetries` attempts, log a warning and
returns the last response (canceled). `buildAndShow`, `showMenu`
and `showModal` they use it internally — no need to call it manually
unless you show a form outside of those functions.

## Construction: `buildForm`, `buildAndShow`

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `buildForm(tpl, ctx?)` | `tpl: Template \| (ctx) => Template`, `ctx: object = {}` | `ActionFormData \| ModalFormData \| MessageFormData` | Resolve the template and create the real form, without showing it |
| `buildAndShow(tpl, ctx?)` | same as above, `ctx.player` required | `Promise<FormResponse>` | Create the form and show it to `ctx.player` via `forceShow` (retry if form is canceled by `UserBusy`) |

```js
import { action, buildAndShow } from "./helpers/template-ui/index.js";

const confirmTemplate = (ctx) => action(
    "Confirm purchase",
    `Buy for ${ctx.price} coins?`,
    [{ text: "Yes" }, { text: "No" }]
);

buildAndShow(confirmTemplate, { player, price: 250 }).then((res) => {
    if (!res.canceled && res.selection === 0) {
        // process purchase
    }
});
```

---

## Navigation: menus and modals registered by id

For flows with multiple screens that open to each other (menu → submenu
→ modal → backtrack), instead of chaining `.then()` by hand, you register
each screen once with an id and you let the router open them:

| Function | Parameters | Description |
|---|---|---|
| `registerActionMenu(id, config)` | `id: string`, `config:MenuConfig` | Register a button menu under that id |
| `registerModalForm(id, config)` | `id: string`, `config:ModalConfig` | Register a modal under that id |
| `showMenu(player,menuId, onBack?)` | `async` | Shows the registered menu (via `forceShow`); if cancelled, call `onBack` |
| `showModal(player,formId, onBack?)` | `async` | Shows the registered modal (via `forceShow`); if cancelled, call `onBack` |

### `MenuConfig`

```js
registerActionMenu("main_shop", {
    title: "§6Shop",
    body: "Choose a section:",
    buttons: [
        { text: "Weapons", action: "weapons_shop" },     // opens another registered menu
        { text: "Config", modal: "shop_config" },        // opens a registered modal
        { text: "Buy sword", callback: (player, reopen) => {
            InventoryHelper.giveItem(player, new ItemStack("minecraft:iron_sword"));
            reopen(); // shows this same menu again
        }},
    ],
});
```

Each button can have **one** of three properties: `action` (id of another
menu), `modal` (id of a modal) or `callback(player, reopen)` (logic
custom, with `reopen()` to redisplay the current menu).

### `ModalConfig`

```js
registerModalForm("shop_config", {
    title: "Settings",
    fields: [{ type: "toggle", label: "Notifications", defaultValue: true }],
    submitButton: "Save",
    onSubmit: (player, formValues, onBack) => {
        // formValues[0] = toggle value
        onBack?.();
    },
});
```

---

## Grades

-`showMenu`/`showModal` are now `async` and swallow errors
  `forceShow()` with a silent `try/catch` (i.e. if the player
disconnect in the middle of the form animation) — if you need to log in
In those cases, make your own wrapper around it.
- The records (`MENU_STRUCTURE`, `MODAL_STRUCTURE`) are level objects
module — are shared among all players; there is no state
player here (that is handled by whoever uses `TemplateUI`, not this layer).
- No template calls `.show()` on its own — it always goes through
  `buildAndShow` or by the router (`showMenu`/`showModal`).

---

<sub>TemplateUIby **IIBl4z3MasterII**</sub>
