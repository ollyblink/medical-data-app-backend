import {App} from "../../app";
import {DBCleaner} from "../test-utils/dbcleaner";
import {IRegisteredTestStrategy, AppConfiguration, TestApp, TestData} from "../test-utils/test-facilities";
import {expect} from "chai";
import {IError, AuthResponse} from "../../app-typings/app-typings";
import {RegisterRegisteredTestStrategy, LoginRegisteredTestStrategy} from "./index.route.test";
import Consent, {IConsent} from "../../models/consent.model";
var session = require('supertest-session');
var mongoose = require('mongoose');


describe('Consent test', function () {


    let app: App;
    let testSession: any;


    let testData: TestData = new TestData("u1", "u1", "data_test", 123, 456);
    this.timeout(60000); //may take time to create the PKI

    beforeEach(function () {
        delete require.cache[require.resolve('../../app')]; //needed to have a clear server with every unit test
        let tA: TestApp = AppConfiguration.createTestApp();
        this.app = tA.app;
        testSession = session(tA.exp);
    });

    afterEach(function () {
        DBCleaner.clearDB();
        mongoose.connection.close();
        this.app.server().close();
    });

    it('should be possible to create a new consent for an existing user', function (done) {
        let testData2: TestData = new TestData("u2", "u2", "data_test", 123, 456);


        new RegisterRegisteredTestStrategy(testData2.username, testData2.password).executeTest(testSession, done, [
            new RegisterRegisteredTestStrategy(testData.username, testData.password), // register second user
            new LoginRegisteredTestStrategy(testData.username, testData.password), // login second user
            new GrantConsentToDataRegisteredTestStrategy(testData.username, testData2.username), // add consent

        ]);
    });

    it('should be possible to retrieve all users one has access to their data and all those that can still be granted access to the data', function (done) {

        new RegisterRegisteredTestStrategy("u1", "u1").executeTest(testSession, done, [
            new RegisterRegisteredTestStrategy("u2", "u2"), // register second user
            new RegisterRegisteredTestStrategy("u3", "u3"), // register third user
            new LoginRegisteredTestStrategy("u1", "u1"), // login first user
            new GetAllAuthorisableUsersRegisteredTestStrategy("u1", ["u2", "u3"]), //Get all users that can be granted access to u1's data (should be u2, u3)
            new GetAllAuthorisedUsersRegisteredTestStrategy("u1", []),
            new GrantConsentToDataRegisteredTestStrategy("u1", "u2"), // add consent for u2
            new GetAllAuthorisableUsersRegisteredTestStrategy("u1", ["u3"]), //Get all users that can be granted access to u1's data (should be u2, u3)
            new GetAllAuthorisedUsersRegisteredTestStrategy("u1", ["u2"]),
            new GrantConsentToDataRegisteredTestStrategy("u1", "u3"), // add consent for u2
            new GetAllAuthorisableUsersRegisteredTestStrategy("u1", []), //Get all users that can be granted access to u1's data (should be u2, u3)
            new GetAllAuthorisedUsersRegisteredTestStrategy("u1", ["u2", "u3"]),
            new DeleteConsentRegisteredTestStrategy("u1", "u2"),//Delete consents again
            new GetAllAuthorisableUsersRegisteredTestStrategy("u1", ["u2"]), //Get all users that can be granted access to u1's data (should be u2 )
            new GetAllAuthorisedUsersRegisteredTestStrategy("u1", ["u3"]),
            new DeleteConsentRegisteredTestStrategy("u1", "u3"),
            new GetAllAuthorisableUsersRegisteredTestStrategy("u1", ["u2", "u3"]), //Get all users that can be granted access to u1's data (should be u2, u3)
            new GetAllAuthorisedUsersRegisteredTestStrategy("u1", []),
        ]);
    });
});


class GetAllAuthorisableUsersRegisteredTestStrategy implements IRegisteredTestStrategy {
    private sender: string;
    private authorisableUsers: string[];

    constructor(sender: string, authorisableUsers: string[]) {
        this.sender = sender;
        this.authorisableUsers = authorisableUsers;
    }

    executeTest(testSession: any, done: MochaDone, testStrategies?: IRegisteredTestStrategy[]): void {
        const s = this.sender;
        const a = this.authorisableUsers;

        testSession
            .get('/consents/')
            .expect(200)
            .end(function (err: IError, res: AuthResponse) {
                console.log("aut users: " + res.body.authorisableUsers);
                expect(res.body.user).to.equal(s);
                for (let i = 0; i < a.length; ++i) {
                    expect(res.body.authorisableUsers).to.contain(a[i]);
                }
                if (testStrategies && testStrategies.length > 0) {
                    //If there is another test strategy: invoke!
                    testStrategies.shift().executeTest(testSession, done, testStrategies);
                } else {
                    done();
                }
            });
    }
}

class GetAllAuthorisedUsersRegisteredTestStrategy implements IRegisteredTestStrategy {
    private sender: string;
    private authorisedUsers: string[];

    constructor(sender: string, authorisedUsers: string[]) {
        this.sender = sender;
        this.authorisedUsers = authorisedUsers;
    }

    executeTest(testSession: any, done: MochaDone, testStrategies?: IRegisteredTestStrategy[]): void {
        const s = this.sender;
        const a = this.authorisedUsers;

        testSession
            .get('/consents/sent')
            .expect(200)
            .end(function (err: IError, res: AuthResponse) {
                console.log("received consented users: " + res.body.consentedUsers);

                expect(res.body.user).to.equal(s);
                for (let i = 0; i < a.length; ++i) {
                    expect(res.body.consentedUsers).to.contain(a[i]);
                }
                if (testStrategies && testStrategies.length > 0) {
                    //If there is another test strategy: invoke!
                    testStrategies.shift().executeTest(testSession, done, testStrategies);
                } else {
                    done();
                }
            });

    }
}

class DeleteConsentRegisteredTestStrategy implements IRegisteredTestStrategy {
    private sender: string;
    private receiver: string;

    constructor(sender: string, receiver: string) {
        this.sender = sender;
        this.receiver = receiver;
    }

    executeTest(testSession: any, done: MochaDone, testStrategies?: IRegisteredTestStrategy[]): void {
        const s = this.sender;
        const r = this.receiver;

        testSession
            .delete('/consents/sender/' + s + '/receiver/' + r)
            .expect(200)
            .end(function (err: IError, res: AuthResponse) {
                console.log("deleted "+res.body.message);
                expect(res.body.message).to.equal("Successfully removed consent with sender " + s + " and receiver " + r);

                if (testStrategies && testStrategies.length > 0) {
                    //If there is another test strategy: invoke!
                    testStrategies.shift().executeTest(testSession, done, testStrategies);
                } else {
                    done();
                }
            });
    }
}
export class GrantConsentToDataRegisteredTestStrategy implements IRegisteredTestStrategy {
    private receiver: string;
    private sender: string;

    constructor(sender: string, receiver: string) {
        this.sender = sender;
        this.receiver = receiver;
    }

    executeTest(testSession: any, done: MochaDone, testStrategies?: IRegisteredTestStrategy[]): void {
        const r: string = this.receiver;
        const s: string = this.sender;
        console.log("In Grant Consent Test");
        testSession
            .post('/consents/')
            .send({receiver: r})
            .expect(200)
            .end(function (err: IError, res: AuthResponse) {
                expect(res.body.message).to.equal('Successfully saved new consent for user ' + r);
                expect(res.body.receiver).to.equal(r);

                Consent.findOne({sender: s, receiver: r}, (err: IError, consent: IConsent)=> {
                    console.log(consent.sender + ", " + consent.receiver + ", " + consent.encryptionKeyEnc);
                    expect(consent.receiver).to.equal(r);
                    expect(consent.sender).to.equal(s);
                    expect(consent.encryptionKeyEnc).to.exist; //TODO not gonna check its content now...

                    if (testStrategies && testStrategies.length > 0) {
                        //If there is another test strategy: invoke!
                        testStrategies.shift().executeTest(testSession, done, testStrategies);
                    } else {
                        done();
                    }
                });
            });
    }
}