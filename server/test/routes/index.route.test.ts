import {App} from "../../app";
import {DBCleaner} from "../test-utils/dbcleaner";
import {IError, AuthResponse} from "../../app-typings/app-typings";
import {expect} from "chai";
import Person from "../../models/person.model";
import {IPerson} from "../../models/person.model";
import {
    IRegisteredTestStrategy,
    AppConfiguration,
    TestApp
} from "../test-utils/test-facilities";
var session = require('supertest-session');
var mongoose = require('mongoose');

describe('Index test', function () {


    let app: App;
    let testSession: any;

    let username: string = 'u1';
    let password: string = 'u1';
    this.timeout(30000); //may take time to create the PKI

    beforeEach(function () {
        delete require.cache[require.resolve('../../app')]; //needed to have a clear server with every unit test
        let tA: TestApp = AppConfiguration.createTestApp();
        this.app = tA.app;
        testSession = session(tA.exp);
    });

    afterEach(function () {
        DBCleaner.clearDB();
        this.app.server().close();
        mongoose.connection.close();
    });


    it('should be possible to add a new user', function (done: MochaDone) {
        let register: IRegisteredTestStrategy = new RegisterRegisteredTestStrategy(username, password);
        register.executeTest(testSession, done);
    });

    it('should be possible to log in and out', function (done: MochaDone) {
        new RegisterRegisteredTestStrategy(username, password).executeTest(testSession, done, [
            new LoginRegisteredTestStrategy(username, password),
            new LogoutRegisteredTestStrategy()
        ]);
    });


});

//Actual tests
export class RegisterRegisteredTestStrategy implements IRegisteredTestStrategy {
    private password: string;
    private username: string;

    public constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
    }

    public executeTest(testSession: any, done: MochaDone, testStrategies?: IRegisteredTestStrategy[]): void {
        const u = this.username;
        const p = this.password;
        testSession
            .post('/register')
            .send({username:u , password: p})
            .expect(200).end(function (err: IError, res: AuthResponse) {
            if (!err) {
                expect(res.body.message).to.equal("Successfully created user with username " + u);
                //Now invoke the specific test only possible when registered

                Person.findOne({username: u}, function (err: IError, person: IPerson) {
                    console.log("found person! " + u);
                    expect(person.username).to.equal(u);
                    expect(person.publicKey).to.exist; // cannot say more about it
                    expect(person.privateKeyEnc).to.exist; // cannot say more about it
                    expect(person.encryptionKeyEnc).to.exist; // cannot say more about it
                    expect(person.spirometryData).to.exist;
                    expect(person.spirometryData).to.have.length(0);

                    if (testStrategies && testStrategies.length > 0) {
                        //If there is another test strategy: invoke!
                        testStrategies.shift().executeTest(testSession, done, testStrategies);
                    } else {
                        done();
                    }
                });


            } else {
                console.log(err.message);
                expect.fail();
                done();
            }
        });
    }
}


export class LoginRegisteredTestStrategy implements IRegisteredTestStrategy {
    private username: string;
    private password: string;

    constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
    }

    public executeTest(testSession: any, done: MochaDone, testStrategies?: IRegisteredTestStrategy[]): void {
        const u2 = this.username;
        const p2 = this.password;
        testSession
            .post('/')
            .send({username: u2, password: p2})
            .expect(200).end(function (err: IError, res: AuthResponse) {
            if (!err) {
                console.log("Login: " + res.body.message);
                expect(res.body.message).to.equal("user " + u2 + " logged in");
                expect(res.body.user).to.equal(u2);

                //In case there are more
                if (testStrategies && testStrategies.length > 0) {
                    //If there is another test strategy: invoke!
                    testStrategies.shift().executeTest(testSession, done, testStrategies);
                } else {
                    done();
                }
            } else {
                console.log(err.message);
                expect.fail();
                done();
            }
        });
    }
}

export class LogoutRegisteredTestStrategy implements IRegisteredTestStrategy {
    public executeTest(testSession: any, done: MochaDone, testStrategies?: IRegisteredTestStrategy[]): void {
        testSession
            .get('/logout')
            .expect(200).end(function (err: IError, res: AuthResponse) {
            if (!err) {
                expect(res.body.message).to.equal("Successfully logged out. ");

                console.log("After logout");
                //In case there are more
                if (testStrategies && testStrategies.length > 0) {
                    //If there is another test strategy: invoke!
                    testStrategies.shift().executeTest(testSession, done, testStrategies);
                } else {
                    done();
                }
            } else {
                console.log(err.message);
                expect.fail();
                done();
            }
        });
    }
}


//Actual tests end