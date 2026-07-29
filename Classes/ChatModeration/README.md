# 💬 ChatModeration

Clase con métodos estáticos de moderación de texto (por ahora, anti-caps).

---

## Archivos

| Archivo | Rol |
|---|---|
| `ChatModeration.js` | Clase `ChatModeration` |

---

## API pública

```js
import { ChatModeration } from "./Classes/ChatModeration/ChatModeration.js";

world.beforeEvents.chatSend.subscribe((event) => {
    if (ChatModeration.isExcessiveCaps(event.message)) {
        event.cancel = true;
        world.sendMessage(`<${event.sender.name}> ${event.message.toLowerCase()}`);
    }
});
```

| Método | Descripción |
|---|---|
| `countUppercase(text)` | Cantidad de letras mayúsculas |
| `isExcessiveCaps(text, threshold = 5)` | `true` si supera el umbral de mayúsculas |

---

<sub>ChatModeration por **IIBl4z3MasterII**</sub>
