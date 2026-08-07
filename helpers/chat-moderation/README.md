# 💬ChatModeration

Class with static text moderation methods. For now it covers
detection of excessive capital letters (anti-caps), designed to catch
to the chat event and clean/filter messages before they reach the
rest of the world.

---

## Archive

| Archive | Role |
|---|---|
| `index.js` | Class `ChatModeration` |

---

## Why does it exist

Write "how many capital letters does this string have?" by hand every time
You want an anti-spam caps it is repetitive. This class solves it in two
stateless methods (nothing needs to be instantiated).

---

## Public API

| Method | Parameters | Returns | Description |
|---|---|---|---|
| `countUppercase(text)` | `text: string` | `number` | Counts uppercase letters A-Z in the string |
| `isExcessiveCaps(text, threshold?)` | `text: string`, `threshold: number = 5` | `boolean` | `true` si `countUppercase(text) > threshold` |

---

## Usage example

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

## Grades

- Does not detect or filter insults, spam with repeated characters or links —
only capital letters. For more complete moderation, combine with another
own logic.
- `threshold` defaults to `5`; in short messages (e.g. "OK") can give
false positive if the threshold is lowered too much.

---

<sub>ChatModerationby **IIBl4z3MasterII**</sub>
