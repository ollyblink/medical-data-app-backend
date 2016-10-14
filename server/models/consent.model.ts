/**
 * Consent schema
 */
import * as mongoose from "mongoose";


/**
 * A consent is required to allow another user to access own data items.
 * To do so, the encryption key of the sending user is encrypted with the public key of the receiving user,
 * so that only the receiving user can decrypt it using his or her private key
 */
var ConsentSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true
    }, //username of the person giving the consent for her/his data
    receiver: {
        type: String,
        required: true
    }, //username of the person getting the consent for the other user's data
    encryptionKeyEnc: {
        type: String,
        required: true
    } //Encrypted encryption key used to decrypt the other users data. Encrypted with public key of the receiver
});

//Make sure the consent can only exist once for each sender and receiver
//ConsentSchema.index({sender: 1, receiver: 1}, {unique: true});
export interface IConsent {
    sender?: string,
    receiver?: string,
    encryptionKeyEnc?: string
}
const Consent = mongoose.model('Consent', ConsentSchema);
export default Consent;