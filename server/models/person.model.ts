import * as mongoose from "mongoose";
import {Query} from "mongoose";

/**
 * Schema definition for a new user. It's not the same as the Account used to authenticate
 * (although the username is the same in both cases).
 * The fields are explained in the @see storeUser function, see PersonSchema#storeUser
 */
var PersonSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    }, // username is the same as in the account
    publicKey: {
        type: String,
        required: true
    }, //Public key of the PKI
    privateKeyEnc: {
        type: String,
        required: true
    }, //Encrypted private key of the PKI, encrypted using password (symmetric encryption currently)
    encryptionKeyEnc: {
        type: String,
        required: true
    }, //Encrypted encryption key used to encrypt data, encrypted using the public key
    spirometryData: [String]  // measurements
});

export interface IPerson extends Document {

    username?: string,
    publicKey?: string,
    privateKeyEnc?: string,
    encryptionKeyEnc?: string,
    spirometryData?: string[]

    save(callback?: (err: any, result: IPerson, numberAffected: number) => void): Query<IPerson>;
}

export interface ISpirometryData {
    title: string,
    fev1: number,
    fvc: number,
    dateTime: any
}

const Person = mongoose.model('Person', PersonSchema);

export default Person;