import {Response} from "express";
import {IError} from "../../app-typings/app-typings";



export class ErrorChecker {
    static check(err: IError, res: Response): void {
        if (err) {
            console.error(err);
            res.status(err.status || 500);
            res.json({
                message: err.message,
                error: err
            });
        }
    }
}