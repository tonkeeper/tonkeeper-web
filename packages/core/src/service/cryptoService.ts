/**
 * Service methods to decrypt and encrypt values
 * Original code: https://github.com/toncenter/ton-wallet/blob/82d8a66736d25e5a37b45654b17caf9755252792/src/js/Controller.js#L68
 *
 * @author: KuznetsovNikita
 * @since: 0.0.1
 */

/**
 * @param plaintext {string}
 * @param password {string}
 * @return {Promise<string>}
 */
export async function encrypt(plaintext: string, password: string) {
    const pwUtf8 = new TextEncoder().encode(password); // encode password as UTF-8
    const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8); // hash the password

    const iv = crypto.getRandomValues(new Uint8Array(12)); // get 96-bit random iv

    const alg = { name: 'AES-GCM', iv: iv }; // specify algorithm to use

    const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['encrypt']); // generate key from pw

    const ptUint8 = new TextEncoder().encode(plaintext); // encode plaintext as UTF-8
    const ctBuffer = await crypto.subtle.encrypt(alg, key, ptUint8); // encrypt plaintext using key

    const ctArray = Array.from(new Uint8Array(ctBuffer)); // ciphertext as byte array
    const ctStr = ctArray.map(byte => String.fromCharCode(byte)).join(''); // ciphertext as string
    const ctBase64 = btoa(ctStr); // encode ciphertext as base64

    const ivHex = Array.from(iv)
        .map(b => ('00' + b.toString(16)).slice(-2))
        .join(''); // iv as hex string

    return ivHex + ctBase64; // return iv+ciphertext
}

/**
 * @param ciphertext {string}
 * @param password {string}
 * @return {Promise<string>}
 */
export async function decrypt(ciphertext: string, password: string) {
    const pwUtf8 = new TextEncoder().encode(password); // encode password as UTF-8
    const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8); // hash the password

    const iv = ciphertext
        .slice(0, 24)
        .match(/.{2}/g)!
        .map(byte => parseInt(byte, 16)); // get iv from ciphertext

    const alg = { name: 'AES-GCM', iv: new Uint8Array(iv) }; // specify algorithm to use

    const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['decrypt']); // use pw to generate key

    const ctStr = atob(ciphertext.slice(24)); // decode base64 ciphertext
    const ctUint8 = new Uint8Array(ctStr.match(/[\s\S]/g)!.map(ch => ch.charCodeAt(0))); // ciphertext as Uint8Array
    // note: why doesn't ctUint8 = new TextEncoder().encode(ctStr) work?

    const plainBuffer = await crypto.subtle.decrypt(alg, key, ctUint8); // decrypt ciphertext using key
    const plaintext = new TextDecoder().decode(plainBuffer); // decode password from UTF-8

    return plaintext; // return the plaintext
}
