/**
 * Métodos estáticos de moderación de texto (anti-caps, formato de chat, etc).
 */
export class ChatModeration {
    /**
     * Cuenta cuántas letras mayúsculas tiene un texto.
     * @param {string} text
     * @returns {number}
     */
    static countUppercase(text) {
        let count = 0;
        for (const char of text) {
            if (char >= "A" && char <= "Z") count++;
        }
        return count;
    }

    /**
     * Determina si un mensaje tiene mayúsculas excesivas (útil para
     * anti-spam/anti-caps en el chat).
     * @param {string} text
     * @param {number} threshold cantidad de mayúsculas a partir de la cual se considera excesivo (default 5)
     * @returns {boolean}
     */
    static isExcessiveCaps(text, threshold = 5) {
        return ChatModeration.countUppercase(text) > threshold;
    }
}
