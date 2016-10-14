import * as mongoose from "mongoose";

export class DBCleaner {
    public static clearDB(): void {
        for (var i in mongoose.connection.collections) {
            mongoose.connection.collections[i].remove(function () {
                console.log("Clearing db");
            });
        }
    }
}