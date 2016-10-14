import {AuthenticationHelper} from "../utils/authentication/authenticationhelper";
import {Response, Router} from "express";
import {ErrorChecker} from "../utils/errorchecker/errorchecker";
import Consent, {IConsent} from "../models/consent.model";
import Person, {IPerson} from "../models/person.model";
import {AsymmetricEncryptionHelper} from "../utils/security/asymmetric-encryption-helper";
import {SymmetricEncryptionHelper} from "../utils/security/symmetric-encryption-helper";
import {AuthRequest, IParams, IError} from "../app-typings/app-typings";

const dataRouter: Router = Router();

dataRouter.get('/username/:username', AuthenticationHelper.isLoggedIn, (req: AuthRequest, res: Response)=> {
    var userToFind = (req.params as IParams).username;
    var encryptionKey;

    //Means that you need to have a consent to access this data item.
    if (userToFind !== req.user.username) {
        console.log("User to find data for: [" + userToFind + "]");
        //external user specified in link
        Consent.findOne()
            .where('sender').equals(userToFind)
            .where('receiver').equals(req.user.username)
            .select('encryptionKeyEnc').exec((err: IError, consent: IConsent)=> {
            ErrorChecker.check(err, res);
            if (consent) {
                encryptionKey = AsymmetricEncryptionHelper.decryptStringWithRsaPrivateKey(consent.encryptionKeyEnc, req.session.privateKey);
                console.log("decrypted enc key " + encryptionKey);
                FindUserData.findDataForUser(userToFind, encryptionKey, res);
            } else {
                var notFoundMsg = "Could not find matching consent for user " + userToFind;
                console.error(notFoundMsg);
                res.status(404).json({
                    message: notFoundMsg
                });
            }
        });
    } else { // no user name specified --> display own data
        encryptionKey = req.session.encryptionKey;
        FindUserData.findDataForUser(userToFind, encryptionKey, res);
    }
});


export class FindUserData {
    /**
     * Retrieves the data for a specified user (specified by username)
     *
     * @param username the user to retrieve the data from
     * @param encryptionKey the user's encryption key to decrypt the data
     * @param userToFind
     * @param res
     */
    static findDataForUser(userToFind: string, encryptionKey: string, res: Response): void {
        Person.findOne()
            .where('username').equals(userToFind)
            .select('spirometryData').exec((err: IError, person: IPerson)=> {

            ErrorChecker.check(err, res);

            console.log("Found data for user[" + userToFind + "]");
            var decryptedData = [];
            for (var i = 0; i < person.spirometryData.length; ++i) {
                var decryptedDataItem = SymmetricEncryptionHelper.symmetricDecrypt(person.spirometryData[i], encryptionKey);
                var asJson = JSON.parse(decryptedDataItem);
                decryptedData.push(asJson);
            }
            console.log("All data items found for user [" + userToFind + "]: " + JSON.stringify(decryptedData));

            res.status(200).json({
                user: userToFind,
                spirometryData: decryptedData
            });
        });
    };
}

dataRouter.delete('/user/:user/item/:itemtitle', AuthenticationHelper.isLoggedIn, (req: AuthRequest, res: Response)=> {
        //Can only remove if the user is the same as the logged in user
        let params = (<IParams> req.params);

        if (params.user !== req.user.username) {
            res.status(403).json({success: false, message: "Not allowed to delete specified item"});
        }
        console.log("delete data " + params.itemtitle);
        let username = params.user;
        console.log("user: " + username);

        Person.findOne({username: username}).exec((err: IError, person: IPerson)=> {
            ErrorChecker.check(err, res);

            console.log("#data items: " + person.spirometryData.length);
            for (var i = 0; i < person.spirometryData.length; ++i) {
                var decryptedDataItem = SymmetricEncryptionHelper.symmetricDecrypt(person.spirometryData[i], req.session.encryptionKey);
                var asJSON = JSON.parse(decryptedDataItem);
                console.log("Json: " + JSON.stringify(asJSON));
                if (asJSON.title === params.itemtitle) {
                    console.log("item: " + person.spirometryData[i]);
                    person.spirometryData.splice(i, 1); //removes item at index i
                }
            }
            person.save((err: IError, person: IPerson)=> {
                    ErrorChecker.check(err, res);

                    res.status(200).json({
                        message: "Successfully removed data item with title [" + params.itemtitle + "] for user " + username
                    });
                }
            );
        });
    }
);

dataRouter.post('/', AuthenticationHelper.isLoggedIn, (req: AuthRequest, res: Response) => {
    Person.findOne({username: req.user.username}).exec((err: IError, person: IPerson) => {
        ErrorChecker.check(err, res);
        var title = req.body.title;
        var dateTime = new Date().toJSON();
        var fvc = req.body.fvc;
        var fev1 = req.body.fev1;

        var toEncrypt = {
            title: title,
            dateTime: dateTime,
            fvc: fvc,
            fev1: fev1
        };
        var dataToEncrypt = JSON.stringify(toEncrypt);
        var encryptedData = SymmetricEncryptionHelper.symmetricEncrypt(dataToEncrypt, req.session.encryptionKey);
        person.spirometryData.push(encryptedData);

        person.save((err: IError, person: IPerson)=> {
            ErrorChecker.check(err, res);
            console.log("to encrypt: " + JSON.stringify(toEncrypt));
            console.log("encKey: " + req.session.encryptionKey);
            console.log("Datastring:" + dataToEncrypt);
            console.log("encData: " + encryptedData);
            res.status(201).json({
                message: "Successfully stored item with title " + title
            });

        });
    });
});
export default dataRouter;