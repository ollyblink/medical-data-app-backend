import {AuthenticationHelper} from "../utils/authentication/authenticationhelper";
import {Router, Response, NextFunction} from "express";
import Person, {IPerson} from "../models/person.model";
import {ErrorChecker} from "../utils/errorchecker/errorchecker";
import {SymmetricEncryptionHelper} from "../utils/security/symmetric-encryption-helper";
import {AsymmetricEncryptionHelper} from "../utils/security/asymmetric-encryption-helper";
import Account, {IAccount} from "../models/account.model";
import {AuthRequest, IKeyPair, IError} from "../app-typings/app-typings";

const indexRouter: Router = Router();
const passport = require('passport');

indexRouter.get('/logout', AuthenticationHelper.isLoggedIn, (req: AuthRequest, res: Response, next: NextFunction)=> {
    req.logout();
    res.status(200).json({
        message: "Successfully logged out. "
    });
});

indexRouter.post('/register', (req: AuthRequest, res: Response, next: NextFunction)=> {
    let username: string = req.body.username;
    let password: string = req.body.password;

    let account: IAccount = new Account({username: username});
    Account.register(account, password, (err: Error)=> {
        ErrorChecker.check(err, res);
        //Create the new public and private keys
        let keyPair: IKeyPair = AsymmetricEncryptionHelper.createKeyPair();
        //Create a new random symmetric key of length 128
        let encryptionKey: string = SymmetricEncryptionHelper.createRandomSymmetricKeyString();
        Person.create({
                //Assign the username
                username: username,
                //Store the public key without encrypting
                publicKey: keyPair.publicKey,
                //Encrypt the private key with the password
                privateKeyEnc: SymmetricEncryptionHelper.symmetricEncrypt(keyPair.privateKey, password),
                //Encrypt the encryption key using the public key
                encryptionKeyEnc: AsymmetricEncryptionHelper.encryptStringWithRsaPublicKey(encryptionKey, keyPair.publicKey)
            }, (err: any, person: IPerson) => {
                if (err) {
                    console.error(err);
                    res.status(err.status || 500);
                    res.json({
                        message: err.message,
                        error: err
                    });
                } else {
                    console.log("Successfully saved new person with username " + person.username);
                    passport.authenticate('local')(req, res, () => {
                        res.status(200).json({
                            message: "Successfully created user with username " + username
                        });
                    });
                }
            }
        );
    });
});


indexRouter.post('/', passport.authenticate('local', {session: true}), (req: AuthRequest, res: Response, next: NextFunction)=> {
    let username: string = req.body.username;
    let password: string = req.body.password;
    console.log("user " + username + " tries to log in");

    Person.findOne({username: username}, (err: IError, user: IPerson) => {
        ErrorChecker.check(err, res);

        //Decrypt the private key using the password in clear text
        let privateKey: string = SymmetricEncryptionHelper.symmetricDecrypt(user.privateKeyEnc, password);
        //Decrypt the encryption key using the decrypted private key
        let encryptionKey: string = AsymmetricEncryptionHelper.decryptStringWithRsaPrivateKey(user.encryptionKeyEnc, privateKey);
        //Store the private key in the session for later use
        req.session.privateKey = privateKey;
        //Store the encryption key in the session for later use
        req.session.encryptionKey = encryptionKey;

        console.log("user " + username + " logged in");
        res.status(200).json({
            user: username,
            message: "user " + username + " logged in"
        });
    });
});

export default indexRouter;