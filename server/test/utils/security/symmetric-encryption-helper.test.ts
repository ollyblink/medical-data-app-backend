/// <reference path="../../../../typings/globals/mocha/index.d.ts" />
//see also node-rsa
import {SymmetricEncryptionHelper} from "../../../utils/security/symmetric-encryption-helper";
import {assert} from "chai";

describe('SymmetricEncryptionHelper', ()=> {
    describe('#symmetric', ()=> {
        let data: string = "Hello World";
        let password: string = "1234";


        it('should encrypt a data item using a symmetric key and the decrypted data item should be the same as the input data item', (done)=> {
            var encryptedSym = SymmetricEncryptionHelper.symmetricEncrypt(data, password);
            var decryptedSym = SymmetricEncryptionHelper.symmetricDecrypt(encryptedSym, password);
            assert(data === decryptedSym, "input data is the same encrypted and decrypted input data");
            done();
        });
    });
});
