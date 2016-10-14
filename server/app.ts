import * as express from "express";
import {Application} from "express";
import * as path from "path";
import * as mongoose from "mongoose";
import {json, urlencoded} from "body-parser";
import consentRouter from "./routes/consent.route";
import indexRouter from "./routes/index.route";
import dataRouter from "./routes/data.route";
import Account from "./models/account.model";
import {SymmetricEncryptionHelper} from "./utils/security/symmetric-encryption-helper";
import {AuthRequest, IError} from "./app-typings/app-typings";
import {Response} from "~express/lib/response";
import {NextFunction} from "~express/lib/router/index";
import * as https from "https";
import {Server} from "https";
import * as fs from "fs";
import * as passport from "passport";
import * as cors from "cors";

import Passport = require("passport");


export class App {
    private _mongoURL: string;
    private _dbName: string;
    private _frontendURLs: string[];
    private _port: number;
    private _keyPemPath: string;
    private _certPemPath: string;
    private _isCookieSecure: boolean = true;

    private _server: Server;

    /**
     * Constructor function
     * @returns {App}
     */
    public static create(): App {
        return new App();
    }

    public start(app: express.Application): void {

        this.connectDB();

        this.configureBasics(app);
        this.configureCors(app);
        this.configurePassport(app);

        this.addRoutes(app);
        this.addDevelopmentErrorHandler(app);
        this.addProductionErrorHandler(app);

        this.createHTTPSServer(app);
        // });
    }

    //
    private connectDB(): void {

        mongoose.connect(this._mongoURL + '/' + this._dbName, (err: IError) => {
            if (err) return err;

            console.log('The mongodb has been connected on: ', this._mongoURL);
        });
    }

    private configureBasics(app: Application): void {
        app.use(json());
        app.use(urlencoded({extended: false}));
        app.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));
    }


    private configureCors(app: Application): void {
        let originsWhitelist = this._frontendURLs; //this is my front-end url for development
        let corsOptions = {
            origin: function (origin, callback) {
                var isWhitelisted = originsWhitelist.indexOf(origin) !== -1;
                callback(null, isWhitelisted);
            },
            credentials: true
        }
        app.use(cors(corsOptions));
        app.options('*', cors(corsOptions)); // include before other routes
    }

    private configurePassport(app: Application): void {
        let LocalStrategy = require('passport-local').Strategy;
        app.use(require('express-session')({
            secret: SymmetricEncryptionHelper.createRandomSymmetricKeyString(),
            resave: false,
            saveUninitialized: false,
            cookie: {secure: this._isCookieSecure, httpOnly: true}
        }));
        app.use(passport.initialize());
        app.use(passport.session());
        passport.use(new LocalStrategy(Account.authenticate()));
        passport.serializeUser(Account.serializeUser());
        passport.deserializeUser(Account.deserializeUser());
    }

    /**
     * Routes
     * @param app
     */
    private addRoutes(app: Application): void {
        app.use('/', indexRouter);
        app.use('/data', dataRouter);
        app.use('/consents', consentRouter);
    }

    private addDevelopmentErrorHandler(app: Application): void {
        // development error handler
        // will print stacktrace
        if (app.get('env') === 'development') {
            app.use((err: IError, req: AuthRequest, res: Response, next: NextFunction) => {
                res.status(err.status || 500);
                res.json({
                    message: err.message,
                    error: err
                });
            });
        }
    }

    private addProductionErrorHandler(app: Application): void {
        // production error handler
        // no stacktraces leaked to user
        app.use((err: IError, req: AuthRequest, res: Response, next: NextFunction) => {
            res.status(err.status || 500);
            res.json({
                message: err.message,
                error: err
            });
        });
    }

    /**
     */
    private createHTTPSServer(app: Application): void {

        //for https
        var options = {
            key: fs.readFileSync(this._keyPemPath),
            cert: fs.readFileSync(this._certPemPath)
        };

        // use this instead to access the whole app in https
        this._server = https.createServer(options, app);
        this._server.listen(this._port);

        this._server.on('error', (error: IError)=> {
            if (error.syscall !== 'listen') {
                throw error;
            }

            let bind: string = typeof this._port === 'string'
                ? 'Pipe ' + this._port
                : 'Port ' + this._port;

            // handle specific listen errors with friendly messages
            switch (error.code) {
                case 'EACCES':
                    console.error(bind + ' requires elevated privileges');
                    process.exit(1);
                    break;
                case 'EADDRINUSE':
                    console.error(bind + ' is already in use');
                    process.exit(1);
                    break;
                default:
                    throw error;
            }
        });
        this._server.on('listening', ()=> {
            let addr: any = this._server.address();
            var bind = typeof addr === 'string'
                ? 'pipe ' + addr
                : 'port ' + addr;

        });

    }

    //Setter
    public mongoURL(mongoURL_: string): App {
        this._mongoURL = mongoURL_;
        return this;
    }

    public dbName(dbName_: string): App {
        this._dbName = dbName_;
        return this;
    }

    public frontendURLs(frontendURLs_: string[]): App {
        this._frontendURLs = frontendURLs_;
        return this;
    }

    public port(port_: number): App {
        this._port = port_;
        return this;
    }

    public keyPemPath(keyPemPath_: string): App {
        this._keyPemPath = keyPemPath_;
        return this;
    }

    public certPemPath(certPemPath_: string): App {
        this._certPemPath = certPemPath_;
        return this;
    }

    /**
     * Required to set the authentication cookie to secure. Doesn't work with tests with supertest-session (no idea why).
     * Thus, for tests, the secure flag of the cookie needs to be deactivated.
     * @param isCookieSecure_ sets the secure flag to true or false
     * @returns {App} this app
     */
    public isCookieSecure(isCookieSecure_: boolean): App {
        this._isCookieSecure = isCookieSecure_;
        return this;
    }

    //Getter
    public server(): Server {
        return this._server;
    }

}


