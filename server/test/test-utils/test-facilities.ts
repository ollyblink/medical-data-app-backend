import {App} from "../../app";

import * as express from 'express';
export class AppConfiguration {
    private static DEFAULT_MONGO_URI: string = 'mongodb://localhost:27017';
    private static DEFAULT_DB_NAME: string = 'mean_testdb';
    /** To allow cors access to */
    private static DEFAULT_FRONTEND_URLS: string[] = [];
    private static DEFAULT_PORT: number = 8090;
    private static keyPemPath: string = './server/test/test-utils/key.pem';
    private static certPemPath: string = './server/test/test-utils/cert.pem';

    public static createTestApp(): TestApp {
        let exp: express.Application = express();
        let app: App = App.create();
        app.mongoURL(AppConfiguration.DEFAULT_MONGO_URI)
            .dbName(AppConfiguration.DEFAULT_DB_NAME)
            .frontendURLs(AppConfiguration.DEFAULT_FRONTEND_URLS)
            .port(AppConfiguration.DEFAULT_PORT)
            .keyPemPath(AppConfiguration.keyPemPath)
            .certPemPath(AppConfiguration.certPemPath)
            .isCookieSecure(false)
            .start(exp);
        return new TestApp(app, exp);
    }
}

export class TestApp {
    public app: App;
    public exp: express.Application;

    public constructor(app: App, exp: express.Application) {
        this.app = app;
        this.exp = exp;
    }
}
export interface IRegisteredTestStrategy {
    executeTest(testSession: any, done: MochaDone, testStrategies?: IRegisteredTestStrategy[]): void;
}

export class TestData {
    public username: string;
    public password: string;
    public title: string;
    public fvc: number;
    public fev1: number;

    public constructor(username: string, password: string, title: string, fvc: number, fev1: number) {
        this.username = username;
        this.password = password;
        this.title = title;
        this.fvc = fvc;
        this.fev1 = fev1;
    }
}

