/// <reference path="../../../../typings/globals/mocha/index.d.ts" />

import {AsymmetricEncryptionHelper} from "../../../utils/security/asymmetric-encryption-helper";
import {assert} from "chai";
import {IKeyPair} from "../../../app-typings/app-typings";

describe('AsymmetricEncryptionHelper', function () {
    describe('#asymmetric en- and decryption', function () {

        it('should encrypt a data item using an asymmetric RSA key pair, and then decrypt it again, such that the decrypted data is the same as the input', function (done: MochaDone) {
            this.timeout(30000); //may take time to create the PKI

            let data: string = "Hello World";
            let keyPair: IKeyPair = AsymmetricEncryptionHelper.createKeyPair();
            let encryptedAsym: string = AsymmetricEncryptionHelper.encryptStringWithRsaPublicKey(data, keyPair.publicKey);
            let decryptedAsym: string = AsymmetricEncryptionHelper.decryptStringWithRsaPrivateKey(encryptedAsym, keyPair.privateKey);
            assert(data === decryptedAsym, "input data is the same encrypted and decrypted input data");
            done();
        });
    });
});
