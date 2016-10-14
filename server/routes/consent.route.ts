import {Router, Response} from "express";
import Person, {IPerson} from "../models/person.model";
import {ErrorChecker} from "../utils/errorchecker/errorchecker";
import {AuthenticationHelper} from "../utils/authentication/authenticationhelper";
import Consent, {IConsent} from "../models/consent.model";
import {AsymmetricEncryptionHelper} from "../utils/security/asymmetric-encryption-helper";
import {AuthRequest, IParams, IError} from "../app-typings/app-typings";

const consentRouter: Router = Router();


/**
 * returns all users that data access can still be granted (all possible minus the ones that are already granted)
 */
consentRouter.get('/', AuthenticationHelper.isLoggedIn, (req: AuthRequest, res: Response)=> {
    Person.find({
        username: {
            $ne: req.user.username
        }
    }, (err: IError, people: IPerson[]) => {
        ErrorChecker.check(err, res);
        var authorisableUsers = [];
        for (var i = 0; i < people.length; ++i) {
            authorisableUsers.push(people[i].username);
        }
        // //now remove all those where a consent already exists
        Consent.find({sender: req.user.username}, (err: IError, consents: IConsent[])=> {
            ErrorChecker.check(err, res);

            console.log("Possible users: [" + authorisableUsers.length + "]/" + authorisableUsers);
            console.log("Consents found: [" + consents.length + "]/" + consents);

            for (var i = 0; i < consents.length; ++i) {
                var index = authorisableUsers.indexOf(consents[i].receiver);

                console.log("consent receiver[" + consents[i].receiver + "], at index [" + index + "]");

                if (index >= 0) { // don't want to include those that we already granted access to the data
                    console.log("Found user [" + consents[i].receiver + "]");
                    authorisableUsers.splice(index, 1);
                }
            }

            console.log("Remaining users to grant access to data to: [" + authorisableUsers.length + "]/" + authorisableUsers);
            res.status(200).json({
                user: req.user.username,
                authorisableUsers: authorisableUsers
            });
        });
    });
});

/**
 * Returns all users that can access my data
 */
consentRouter.get('/sent', AuthenticationHelper.isLoggedIn, (req: AuthRequest, res: Response)=> {
    findConsents(req.user.username, 'sender', res);
});

/**
 * Returns all users that this user has data access to
 */
consentRouter.get('/received', AuthenticationHelper.isLoggedIn, (req: AuthRequest, res: Response)=> {
    findConsents(req.user.username, 'receiver', res);
});

function findConsents(user: string, userField: string, res: Response): void {
    Consent.find().where(userField).equals(user).exec((err: IError, consents: IConsent[]) => {
        ErrorChecker.check(err, res);

        var consentedUsers = [];
        if (consents) {
            for (var i = 0; i < consents.length; i++) {
                if (userField === 'receiver') {
                    consentedUsers.push(consents[i].sender);
                }
                else { //(if userField === 'sender')
                    consentedUsers.push(consents[i].receiver);
                }
            }
        }
        console.log("#findConsents:Found: " + JSON.stringify(consentedUsers));
        res.status(200).json({
            user: user,
            consentedUsers: consentedUsers
        });
    });
}

/**
 * Deletes a consens for a specified receiver
 */
consentRouter.delete('/sender/:sender/receiver/:receiver', AuthenticationHelper.isLoggedIn, (req: AuthRequest, res: Response)=> {
    let params = req.params as IParams;
    if (params.sender !== req.user.username) {
        res.status(403).json({success: false, message: "Not allowed to delete specified item"});
    }
    Consent.remove({sender: req.user.username, receiver: params.receiver}, (err: IError)=> {
        ErrorChecker.check(err, res);

        res.status(200).json({
            message: "Successfully removed consent with sender " + req.user.username + " and receiver " + params.receiver
        });
    });
});


/**
 * Creates a new consent for a specified receiver
 */
consentRouter.post('/', AuthenticationHelper.isLoggedIn, (req: AuthRequest, res: Response)=> {
    if (req.user.username === req.body.receiver) {
        //Don't create a consent for oneself.
        res.status(403).json({
            message: "could not create consent: consent for sender[" + req.user.username + "] and receiver[" + req.body.receiver + "]. They are the same!"
        });
    } else {
        /*
         * Get the other user's public key to encrypt this person's encryption key
         */
        Person.findOne({username: req.body.receiver}, (err: IError, person: IPerson)=> {
            ErrorChecker.check(err, res);
            if (person) {
                //Check if already exists. Only create if not
                Consent.findOne({
                    sender: req.user.username,
                    receiver: req.body.receiver
                }, (err: IError, consent: IConsent)=> {
                    ErrorChecker.check(err, res);
                    if (!consent) {// create a new consent
                        Consent.create({
                            sender: req.user.username,
                            receiver: person.username,
                            encryptionKeyEnc: AsymmetricEncryptionHelper.encryptStringWithRsaPublicKey(req.session.encryptionKey, person.publicKey)
                        }, (err: IError, consent: IConsent)=> {
                            ErrorChecker.check(err, res);

                            res.status(200).json({
                                message: "Successfully saved new consent for user " + consent.receiver,
                                receiver: consent.receiver
                            });
                        });
                    } else { //Consent already exists. Refuse
                        res.status(403).json({
                            message: "could not create consent: consent for sender[" + req.user.username + "] and receiver[" + req.body.receiver + "] already exists"
                        });
                    }
                });
            } else {
                res.status(404).json({
                    message: "Could not find user  " + req.body.receiver,
                    receiver: req.body.receiver
                });
            }
        });
    }
});

export default consentRouter;