import {Response, NextFunction} from "express";
import {AuthRequest} from "../../app-typings/app-typings";

export class AuthenticationHelper {
    static isLoggedIn(req: AuthRequest, res: Response, next: NextFunction): void {
        if (!req.isAuthenticated()) {

            console.log(req.isAuthenticated()+": Not authenticated");
            res.status(401).json({message: "Unauthorized"});
        } else {
            next();
        }
    }
}