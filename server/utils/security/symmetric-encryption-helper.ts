import * as  crypto from 'crypto';
import {Cipher} from "crypto";
import {Decipher} from "crypto";


// http://lollyrock.com/articles/nodejs-encryption/
// (symmetric encrypt and decrypt text)
export class SymmetricEncryptionHelper {
    /**
     * Algorithm used for symmetric encryption. Directly change it by calling SymmetricEncryptionHelper.algorithm = '..';
     * @type {string) name of the symmetric key
     */
    public static algorithm: string = "aes-256-ctr";

    /**
     * Encrypts a text item symmetrically
     * @param text the text to encrypt
     * @param encryptionkey the symmetric key to encrypt the data
     * @returns {Buffer|string} the crypted text
     */
    public static symmetricEncrypt(text: string, encryptionkey: string): string {
        let cipher: Cipher = crypto.createCipher(SymmetricEncryptionHelper.algorithm, encryptionkey);
        let crypted: string = cipher.update(text, 'utf8', 'hex');
        crypted += cipher.final('hex');
        return crypted;
    }

    /**
     * Decrypts a symmetrically encrypted data item.
     *
     * @param cryptedText the text to decrypt
     * @param encryptionkey the symmetric key used to decrypt the data item
     * @returns {Buffer|string} the decrypted text
     */
    public static symmetricDecrypt(text: string, encryptionkey: string): string {
        let decipher: Decipher = crypto.createDecipher(SymmetricEncryptionHelper.algorithm, encryptionkey)
        let dec: string = decipher.update(text, 'hex', 'utf8')
        dec += decipher.final('utf8');
        return dec;
    }

    /**
     * Creates a new random symmetric key based on the number of bytes specified.
     *
     * @param nrOfBytes the random length of the key
     * @returns {*} a random symmetric key base64 encoded used as symmetric key
     */
    public static createRandomSymmetricKeyString(nrOfBytes?: number): string {
        if (!nrOfBytes) {
            nrOfBytes = 128; //Default is 128
        }
        return crypto.randomBytes(nrOfBytes).toString('base64');
    }
}