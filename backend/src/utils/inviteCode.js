const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateCode(length = 8) {
    let out = "";
    for (let i = 0; i < length; i++)
        out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    return out;
}
