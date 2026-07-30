# 🖼️ TemplateUI

Builder declarativo sobre `ActionFormData`, `ModalFormData` y
`MessageFormData`: en vez de armar cada form imperativamente, describís
la estructura como un objeto (o función que devuelve un objeto) y esta
capa la traduce a llamadas reales de la Forms API. Incluye también un
sistema de navegación entre menús registrados por id.

---

## Archivo

| Archivo | Rol |
|---|---|
| `index.js` | Funciones `forceShow`, `action`, `modal`, `message`, `buildForm`, `buildAndShow`, `registerActionMenu`, `registerModalForm`, `mostrarMenu`, `mostrarModal` |

A diferencia del resto de `helpers/`, este módulo exporta **funciones
sueltas**, no una clase — porque modela un lenguaje declarativo de
templates, no un objeto con estado propio.

---

## Por qué existe

Armar UIs de Bedrock a mano significa repetir `new ActionFormData().title(...).body(...).button(...)`
en cada menú, y manejar el `.then()/.catch()` de cada `.show()` por
separado. `TemplateUI` separa **qué se muestra** (el template, un
objeto plano) de **cómo se muestra** (`buildForm`/`buildAndShow`), y
agrega un router simple para menús que se abren unos a otros por id.

---

## Templates: `action`, `modal`, `message`

Son solo constructores de objetos planos — no llaman a la Forms API
todavía.

| Función | Forma que produce | Campos |
|---|---|---|
| `action(title, body, buttons)` | `ActionFormData` | `buttons: Array<{ text, icon? }>` |
| `modal(title, fields, submitButton)` | `ModalFormData` | `fields: Array<FieldSpec>` (ver abajo) |
| `message(title, body, button1, button2)` | `MessageFormData` | dos botones simples |

`title`, `body` y cualquier campo de `fields` pueden ser un valor fijo
**o una función `(ctx) => valor`** — se resuelven en el momento de
construir el form, recibiendo el `ctx` que le pases a `buildForm`. Esto
permite templates reusables con datos dinámicos (ej. mostrar el nombre
del jugador o su saldo actual sin tener que recrear el objeto template
cada vez).

### `FieldSpec` (para `modal`)

| `type` | Campos propios | Mapea a |
|---|---|---|
| `"dropdown"` | `label`, `options`, `defaultIndex?` | `form.dropdown(...)` |
| `"textField"` | `label`, `placeholder?`, `defaultValue?` | `form.textField(...)` |
| `"toggle"` | `label`, `defaultValue?` | `form.toggle(...)` |
| `"slider"` | `label`, `min?`, `max?`, `step?`, `defaultValue?` | `form.slider(...)` |

---

## Mostrar sin que se cancele por UserBusy: `forceShow`

```js
export async function forceShow(form, player, maximumRetries = 300)
```

Wrapper sobre `form.show(player)` que reintenta automáticamente cuando
el form se cancela por `FormCancelationReason.UserBusy` (el jugador
tenía otra UI abierta en el mismo tick, típico al abrir un form desde
un evento). Si supera `maximumRetries` intentos, loguea un warning y
devuelve la última respuesta (cancelada). `buildAndShow`, `mostrarMenu`
y `mostrarModal` lo usan internamente — no hace falta llamarlo a mano
salvo que muestres un form fuera de esas funciones.

## Construcción: `buildForm`, `buildAndShow`

| Función | Parámetros | Devuelve | Descripción |
|---|---|---|---|
| `buildForm(tpl, ctx?)` | `tpl: Template \| (ctx) => Template`, `ctx: object = {}` | `ActionFormData \| ModalFormData \| MessageFormData` | Resuelve el template y arma el form real, sin mostrarlo |
| `buildAndShow(tpl, ctx?)` | igual que arriba, `ctx.player` requerido | `Promise<FormResponse>` | Arma el form y lo muestra a `ctx.player` vía `forceShow` (reintenta si el form se cancela por `UserBusy`) |

```js
import { action, buildAndShow } from "./helpers/template-ui/index.js";

const confirmTemplate = (ctx) => action(
    "Confirmar compra",
    `¿Comprar por ${ctx.price} monedas?`,
    [{ text: "Sí" }, { text: "No" }]
);

buildAndShow(confirmTemplate, { player, price: 250 }).then((res) => {
    if (!res.canceled && res.selection === 0) {
        // procesar compra
    }
});
```

---

## Navegación: menús y modals registrados por id

Para flujos con varias pantallas que se abren entre sí (menú → submenú
→ modal → vuelta atrás), en vez de encadenar `.then()` a mano, registrás
cada pantalla una vez con un id y dejás que el router las abra:

| Función | Parámetros | Descripción |
|---|---|---|
| `registerActionMenu(id, config)` | `id: string`, `config: MenuConfig` | Registra un menú de botones bajo ese id |
| `registerModalForm(id, config)` | `id: string`, `config: ModalConfig` | Registra un modal bajo ese id |
| `mostrarMenu(player, menuId, onBack?)` | `async` | Muestra el menú registrado (vía `forceShow`); si se cancela, llama a `onBack` |
| `mostrarModal(player, formId, onBack?)` | `async` | Muestra el modal registrado (vía `forceShow`); si se cancela, llama a `onBack` |

### `MenuConfig`

```js
registerActionMenu("tienda_principal", {
    title: "§6Tienda",
    body: "Elegí una sección:",
    buttons: [
        { text: "Armas", action: "tienda_armas" },       // abre otro menú registrado
        { text: "Config", modal: "tienda_config" },      // abre un modal registrado
        { text: "Comprar espada", callback: (player, reopen) => {
            InventoryHelper.giveItem(player, new ItemStack("minecraft:iron_sword"));
            reopen(); // vuelve a mostrar este mismo menú
        }},
    ],
});
```

Cada botón puede tener **una** de tres propiedades: `action` (id de otro
menú), `modal` (id de un modal) o `callback(player, reopen)` (lógica
custom, con `reopen()` para volver a mostrar el menú actual).

### `ModalConfig`

```js
registerModalForm("tienda_config", {
    title: "Configuración",
    fields: [{ type: "toggle", label: "Notificaciones", defaultValue: true }],
    submitButton: "Guardar",
    onSubmit: (player, formValues, onBack) => {
        // formValues[0] = valor del toggle
        onBack?.();
    },
});
```

---

## Notas

- `mostrarMenu`/`mostrarModal` son ahora `async` y tragan errores de
  `forceShow()` con un `try/catch` silencioso (ej. si el jugador se
  desconecta a mitad de la animación del form) — si necesitás loguear
  esos casos, hacer tu propio wrapper alrededor.
- Los registros (`MENU_STRUCTURE`, `MODAL_STRUCTURE`) son objetos a nivel
  de módulo — se comparten entre todos los jugadores; no hay estado por
  jugador acá (eso lo maneja quien use `TemplateUI`, no esta capa).
- Ningún template llama a `.show()` por sí solo — siempre pasa por
  `buildAndShow` o por el router (`mostrarMenu`/`mostrarModal`).

---

<sub>TemplateUI por **IIBl4z3MasterII**</sub>
