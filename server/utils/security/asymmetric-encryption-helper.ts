//Example for Public/Private Key taken from
//https://github.com/rzcoder/node-rsa
//https://www.npmjs.com/package/keypair for RSA key pairs

//dont forget npm install nodeforge!
//only use import crypt from 'crypto' if crypto had a default export.
import * as crypto from "crypto";
import * as nodeforge from "node-forge";
import {IKeyPair} from "../../app-typings/app-typings";

export class AsymmetricEncryptionHelper {

    /**
     * Encrypts a string with a public key
     *
     * @param textToEncrypt data to be encrypted
     * @param publicKey RSA public key, needs to have an according private key
     * @returns encrypted text
     */
    public static encryptStringWithRsaPublicKey(textToEncrypt: string, publicKey: string): string {
        let buffer: Buffer = new Buffer(textToEncrypt);
        let encrypted: Buffer = crypto.publicEncrypt(publicKey, buffer);
        return encrypted.toString("base64");
    }

    /**
     * Decrypts a string with a private key
     * @param textToDecrypt encrypted text to decrypt
     * @param privateKey RSA private key, needs to have an according public key
     * @returns {*}
     */
    public static decryptStringWithRsaPrivateKey(textToDecrypt: string, privateKey: string): string {
        let buffer: Buffer = new Buffer(textToDecrypt, "base64");
        let decrypted: Buffer = crypto.privateDecrypt(privateKey, buffer);
        return decrypted.toString("utf8");
    }

    /**
     * Creates a new RSA Public/Private key pair and returns them as an object
     *
     * @returns {{privateKey: the private key, publicKey: the public key}}
     */
    public static createKeyPair(): IKeyPair {
        let pair: IKeyPair = nodeforge.pki.rsa.generateKeyPair();
        let publicKey: string = nodeforge.pki.publicKeyToPem(pair.publicKey);
        let privateKey: string = nodeforge.pki.privateKeyToPem(pair.privateKey);
        return {"privateKey": privateKey, "publicKey": publicKey};
    }
}

