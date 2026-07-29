# 🏷️ Lore Durability

Script "instalar y olvidar" que mantiene actualizado el lore de los
items del jugador: muestra la durabilidad restante en tiempo real para
items que se gastan, y agrega una firma de lore fija a los que no tienen
componente de durabilidad.

---

## Archivo

| Archivo | Rol |
|---|---|
| `index.js` | Toda la lógica — sin exports, se autoejecuta al importarlo |

---

## Por qué existe

Bedrock no muestra la durabilidad numérica en el tooltip del item de
forma nativa y visible como texto — solo la barra de color. Este script
escribe `§7Durabilidad: X/Y` como primera línea del lore, actualizándola
sola a medida que el item se gasta, y evita reescribir el lore si el
texto no cambió (para no generar updates innecesarios de item).

---

## Cómo funciona por dentro

Corre dos `system.runInterval` independientes apenas se importa el
archivo — **no hay que llamar a ninguna función para activarlo**:

| Interval | Frecuencia | Qué actualiza |
|---|---|---|
| Equipo | cada `20` ticks (~1s) | Armadura y offhand (`getComponent("minecraft:equippable")`) |
| Inventario | cada `40` ticks (~2s) | Todos los slots del inventario principal |

Por cada item revisado (`updateItemLore`):

```
¿tiene componente "minecraft:durability"?
    sí → calcular durabilidad actual = max - damage
         ¿el lore ya dice ese texto? → no tocar
         si no → reescribir lore con el nuevo valor
    no → ¿ya tiene el lore por defecto ("by @bl4z3master")?
         no → agregarlo al final del lore existente
```

---

## Config interna

```js
const CONFIG = {
    EQUIPMENT_UPDATE_INTERVAL: 20,   // ticks entre updates de equipo
    INVENTORY_UPDATE_INTERVAL: 40,   // ticks entre updates de inventario
    DEFAULT_LORE: "by @bl4z3master", // firma para items sin durabilidad
    DURABILITY_FORMAT: "§7Durabilidad: %current%/%max%",
};
```

Para cambiar el texto de durabilidad o la firma, editar esta constante
directamente en `index.js` (no está expuesta como parámetro configurable
desde afuera — es un script de instalación directa, no una clase).

---

## Uso

```js
import "./helpers/lore-durability/index.js";
// No hay nada más que hacer — se activa solo al importarlo.
```

---

## Notas

- **No exporta nada** — a diferencia del resto de `helpers/`, este módulo
  es un script de efecto secundario, no una clase con API. Solo se
  importa una vez en el `main.js` del addon.
- Si el item ya tenía otro lore antes de recibir la firma por defecto, se
  agrega al final del array (`[...lore, DEFAULT_LORE]`), no lo
  reemplaza.
- El check `item.getLore()?.[0] !== durabilityText` evita reescribir el
  lore en cada tick si no cambió — importante para no generar carga
  extra en inventarios grandes.

---

<sub>Lore Durability por **IIBl4z3MasterII**</sub>
