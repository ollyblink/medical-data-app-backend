import {Request} from "express";
import {IPerson, ISpirometryData} from "../models/person.model";
import {Response} from "~express/lib/response";
/**
 * File contains all typings defined for the application only
 */

export interface BodyContent {
    title?: string,
    fvc?: number,
    fev1?: number,
    username?: string,
    password?: string,
    receiver?: string,
    success?: boolean,
    message?: string,
    user?: string,
    spirometryData?:ISpirometryData[],
    authorisableUsers?: string[],
    consentedUsers?: string[]
}


export interface Session {
    encryptionKey?: string
    privateKey?: string
}

export interface IParams {
    user?: string,
    itemtitle?: string,
    username?: string,
    receiver?: string,
    sender?: string
}

export interface AuthRequest extends Request {
    body?: BodyContent,
    user?: IPerson,
    session?: Session,

    logout(): void
    isAuthenticated(): boolean;
}

export interface IKeyPair {
    privateKey: string;
    publicKey: string;
}
export interface IError extends Error{
    status?: number,
    code?: string,
    syscall?: string
 }

 export interface AuthResponse extends Response{
     body: BodyContent;
 }