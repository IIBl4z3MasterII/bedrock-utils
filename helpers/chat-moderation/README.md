# 💬 ChatModeration

Clase con métodos estáticos de moderación de texto. Por ahora cubre
detección de mayúsculas excesivas (anti-caps), pensada para engancharse
al evento de chat y limpiar/filtrar mensajes antes de que lleguen al
resto del mundo.

---

## Archivo

| Archivo | Rol |
|---|---|
| `index.js` | Clase `ChatModeration` |

---

## Por qué existe

Escribir "¿cuántas mayúsculas tiene este string?" a mano cada vez que
querés un anti-spam de caps es repetitivo. Esta clase lo resuelve en dos
métodos sin estado (no hay que instanciar nada).

---

## API pública

| Método | Parámetros | Devuelve | Descripción |
|---|---|---|---|
| `countUppercase(text)` | `text: string` | `number` | Cuenta letras A-Z mayúsculas en el string |
| `isExcessiveCaps(text, threshold?)` | `text: string`, `threshold: number = 5` | `boolean` | `true` si `countUppercase(text) > threshold` |

---

## Ejemplo de uso

```js
import { ChatModeration } from "./helpers/chat-moderation/index.js";
import { world } from "@minecraft/server";

world.beforeEvents.chatSend.subscribe((event) => {
    if (ChatModeration.isExcessiveCaps(event.message, 6)) {
        event.cancel = true;
        world.sendMessage(`<${event.sender.name}> ${event.message.toLowerCase()}`);
    }
});
```

---

## Notas

- No detecta ni filtra insultos, spam de caracteres repetidos ni links —
  solo mayúsculas. Para moderación más completa, combinar con otra
  lógica propia.
- `threshold` por defecto es `5`; en mensajes cortos (ej. "OK") puede dar
  falso positivo si se baja demasiado el umbral.

---

<sub>ChatModeration por **IIBl4z3MasterII**</sub>
