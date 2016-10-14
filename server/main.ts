import {App} from "./app";
import * as express from 'express';

let DEFAULT_MONGO_URI: string = 'mongodb://localhost:27017';
let DEFAULT_DB_NAME: string = 'mean2';
/** To allow cors access to */
let DEFAULT_FRONTEND_URLS: string[] = ['http://localhost:3000'];
let DEFAULT_PORT: number = 8080;

let keyPemPath: string = './server/key.pem';
let certPemPath: string = './server/cert.pem';

let app: express.Application = express();

//Run the app
App.create()
    .mongoURL(DEFAULT_MONGO_URI)
    .dbName(DEFAULT_DB_NAME)
    .frontendURLs(DEFAULT_FRONTEND_URLS)
    .port(DEFAULT_PORT)
    .keyPemPath(keyPemPath)
    .certPemPath(certPemPath)
    .start(app);

