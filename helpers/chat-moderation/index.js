export class ChatModeration {
    static countUppercase(text) {
        let count = 0;
        for (const char of text) {
            if (char >= "A" && char <= "Z") count++;
        }
        return count;
    }

    static isExcessiveCaps(text, threshold = 5) {
        return ChatModeration.countUppercase(text) > threshold;
    }
}
