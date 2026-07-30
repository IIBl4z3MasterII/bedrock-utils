# ✨ EnchantHelper

Clase con un método estático para encantar un `ItemStack` validando que
el encantamiento exista, en vez de fallar silenciosamente o tirar un
error críptico de la API nativa.

---

## Archivo

| Archivo | Rol |
|---|---|
| `index.js` | Clase `EnchantHelper` |

---

## Por qué existe

`ItemStack.getComponent("enchantable").addEnchantment(...)` no valida que
el `enchantId` que le pasás realmente exista en `EnchantmentTypes` — si
te equivocás de string, falla de forma poco clara. `EnchantHelper` valida
ambas cosas (encantamiento válido + item encantable) antes de aplicar, y
tira un `Error` con mensaje explícito si algo está mal.

---

## API pública

| Método | Parámetros | Devuelve | Excepciones |
|---|---|---|---|
| `enchant(itemStack, enchantId, level)` | `itemStack: ItemStack`, `enchantId: string`, `level: number` | El mismo `itemStack`, ya encantado | `Error` si `enchantId` no existe o el item no es encantable |

---

## Ejemplo de uso

```js
import { EnchantHelper } from "./helpers/enchant-helper/index.js";
import { ItemStack } from "@minecraft/server";

const sword = new ItemStack("minecraft:diamond_sword", 1);

try {
    EnchantHelper.enchant(sword, "sharpness", 5);
} catch (error) {
    console.warn(`No se pudo encantar: ${error.message}`);
}
```

---

## Notas

- No valida el nivel máximo permitido por encantamiento (ej. Sharpness
  tope vanilla es 5, pero si le pasás 10 la API puede aceptarlo sin
  aviso según la versión) — si tu addon depende de topes exactos,
  validalo antes de llamar a `enchant()`.
- `level` acepta cualquier número entero; no hay clamp automático.

---

<sub>EnchantHelper por **IIBl4z3MasterII**</sub>
