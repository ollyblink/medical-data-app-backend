import {model, PassportLocalDocument, PassportLocalSchema, PassportLocalModel, Schema} from "mongoose";
import * as passportLocalMongoose from "passport-local-mongoose";

var accountSchema: PassportLocalSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String
    }
});

accountSchema.plugin(passportLocalMongoose);

export interface IAccount extends PassportLocalDocument {
    username: string;
    password: string;
}
export interface IAccountModel<T extends PassportLocalDocument> extends PassportLocalModel<T> {

}


var Account: IAccountModel<IAccount> = model<IAccount, IAccountModel<IAccount>>('Account', accountSchema);
export default Account;