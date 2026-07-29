# ✨ EnchantHelper

Clase con un método estático para encantar un `ItemStack` validando que el
encantamiento exista, en vez de que falle silenciosamente o tire un error
críptico de la API.

---

## Archivos

| Archivo | Rol |
|---|---|
| `EnchantHelper.js` | Clase `EnchantHelper` |

---

## API pública

```js
import { EnchantHelper } from "./Classes/EnchantHelper/EnchantHelper.js";
import { ItemStack } from "@minecraft/server";

const sword = new ItemStack("minecraft:diamond_sword", 1);
EnchantHelper.enchant(sword, "sharpness", 5);
```

| Método | Descripción |
|---|---|
| `enchant(itemStack, enchantId, level)` | Aplica el encantamiento; lanza `Error` si el id no existe o el item no es encantable |

---

<sub>EnchantHelper por **IIBl4z3MasterII**</sub>
