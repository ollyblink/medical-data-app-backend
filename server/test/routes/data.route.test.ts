import {App} from "../../app";
import {DBCleaner} from "../test-utils/dbcleaner";
import {
    IRegisteredTestStrategy,
    AppConfiguration,
    TestApp, TestData
} from "../test-utils/test-facilities";
import {expect} from "chai";
import {IError, AuthResponse} from "../../app-typings/app-typings";
import {IPerson, default as Person, ISpirometryData} from "../../models/person.model";
import {SymmetricEncryptionHelper} from "../../utils/security/symmetric-encryption-helper";
import {AsymmetricEncryptionHelper} from "../../utils/security/asymmetric-encryption-helper";
import {
    RegisterRegisteredTestStrategy, LoginRegisteredTestStrategy,
    LogoutRegisteredTestStrategy
} from "./index.route.test";
import {GrantConsentToDataRegisteredTestStrategy} from "./consent.route.test";
var session = require('supertest-session');
var mongoose = require('mongoose');


describe('Data test', function () {


    let app: App;
    let testSession: any;


    let testData: TestData = new TestData("u3", "u3", "data_test", 123, 456);
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

    //Todo somehow doesn't work when run with other tests. no idea why. Works when run alone.
    xit('should NOT be possible to retrieve the data for oneself if not logged in', function (done: MochaDone) {
        testSession
            .get('/data/username/u1')
            .expect(403)
            .end(function (err: IError, res: AuthResponse) {
                expect(res.body.message).to.equal("Unauthorized");
                done();
            });
    });

    //Todo somehow doesn't work when run with other tests. no idea why. Works when run alone.
    xit('should be possible to add and get a data item and delete it again', function (done: MochaDone) {


        new RegisterRegisteredTestStrategy(testData.username, testData.password).executeTest(testSession, done, [
            new LoginRegisteredTestStrategy(testData.username, testData.password),
            new AddDataRegisteredTestStrategy(testData),
            new GetDataRegisteredTestStrategy(testData),
            new DeleteDataRegisteredTestStrategy(testData),

        ]);
    });

    it("should be possible to view data of a user that gave consent", function (done: MochaDone) {

        let testData2: TestData = new TestData("u4", "u4", "data_test2", 123, 456);

        new RegisterRegisteredTestStrategy(testData2.username, testData2.password).executeTest(testSession, done, [
            new RegisterRegisteredTestStrategy(testData.username, testData.password), // register second user
            new LoginRegisteredTestStrategy(testData.username, testData.password), // login second user
            new AddDataRegisteredTestStrategy(testData),//create data to share with first user
            new GrantConsentToDataRegisteredTestStrategy(testData.username, testData2.username), // add consent
            new LogoutRegisteredTestStrategy(), //log second user out
            new LoginRegisteredTestStrategy(testData2.username, testData2.password), //login first user again
            new GetDataRegisteredTestStrategy(testData) // first user tries to access data from second user --> should succeed

        ]);
    });

});


class AddDataRegisteredTestStrategy implements IRegisteredTestStrategy {
    private testData: TestData;

    public constructor(testData: TestData) {
        this.testData = testData;
    }

    executeTest(testSession: any, done: MochaDone, testStrategies?: IRegisteredTestStrategy[]): void {
        const testData2: TestData = this.testData;
        testSession
            .post('/data/')
            .send({
                title: testData2.title,
                fvc: testData2.fvc,
                fev1: testData2.fev1
            })
            .expect(201)
            .end(function (err: IError, res: AuthResponse) {

                expect(res.body.message).to.equal("Successfully stored item with title " + testData2.title);

                Person.findOne({username: testData2.username}, function (err: IError, person: IPerson) {
                    expect(person.spirometryData).to.exist;
                    expect(person.spirometryData).to.have.length(1);
                    let privateKey: string = SymmetricEncryptionHelper.symmetricDecrypt(person.privateKeyEnc, testData2.password);
                    console.log("PK: " + privateKey);
                    let encryptionKey: string = AsymmetricEncryptionHelper.decryptStringWithRsaPrivateKey(person.encryptionKeyEnc, privateKey);
                    console.log("Enc key: " + encryptionKey);
                    let decryptedData: ISpirometryData = JSON.parse(SymmetricEncryptionHelper.symmetricDecrypt(person.spirometryData[0], encryptionKey));
                    console.log("Decrypted data: " + JSON.stringify(decryptedData));

                    expect(decryptedData.title).to.equal(testData2.title);
                    expect(decryptedData.fev1).to.equal(testData2.fev1);
                    expect(decryptedData.fvc).to.equal(testData2.fvc);
                    expect(decryptedData.dateTime).to.exist;

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

class GetDataRegisteredTestStrategy implements IRegisteredTestStrategy {
    private testData: TestData;

    public constructor(testData: TestData) {
        this.testData = testData;
    }


    executeTest(testSession: any, done: MochaDone, testStrategies?: IRegisteredTestStrategy[]): void {
        const testData2: TestData = this.testData;

        testSession
            .get('/data/username/' + testData2.username)
            .expect(200)
            .end(function (err: IError, res: AuthResponse) {
                expect(res.body.user).to.equal(testData2.username);
                expect(res.body.spirometryData).to.exist;

                expect(res.body.spirometryData[0].title).to.equal(testData2.title);
                expect(res.body.spirometryData[0].fev1).to.equal(testData2.fev1);
                expect(res.body.spirometryData[0].fvc).to.equal(testData2.fvc);
                expect(res.body.spirometryData[0].dateTime).to.exist;
                console.log("After get");
                if (testStrategies && testStrategies.length > 0) {
                    //If there is another test strategy: invoke!
                    testStrategies.shift().executeTest(testSession, done, testStrategies);
                } else {
                    done();
                }
            });
    }
}

class DeleteDataRegisteredTestStrategy implements IRegisteredTestStrategy {
    private testData: TestData;

    public constructor(testData: TestData) {
        this.testData = testData;
    }

    executeTest(testSession: any, done: MochaDone, testStrategies?: IRegisteredTestStrategy[]): void {
        const testData2: TestData = this.testData;

        testSession
            .delete('/data/user/' + testData2.username + "/item/" + testData2.title)
            .expect(200)
            .end(function (err, res) {
                console.log(res.body.message);
                expect(res.body.message).to.equal("Successfully removed data item with title [" + testData2.title + "] for user " + testData2.username);
                Person.findOne({username: testData2.username}, function (err: IError, person: IPerson) {
                    expect(person.spirometryData).to.exist;
                    expect(person.spirometryData).to.have.length(0);
                    console.log("After delete")
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
