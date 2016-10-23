# medical-data-app-backend

##Introduction and Technology Stack
This is the backend part of the medical data app which runs on <a href="https://nodejs.org/en/" target="_blank">Node.js</a> (v. 6.8) and uses <a href="https://www.mongodb.com/download-center?jmp=nav#community">MongoDB</a> (v. 3.2) together with the <a href="http://mongoosejs.com/" target="_blank">Mongoose</a> (v. 4.6) framework for database access, <a href="http://expressjs.com/" target="_blank">ExpressJS</a> to expose resources as RESTful Webservice, and <a href="http://passportjs.org/" target="_blank">PassportJS</a> for authentication. Tests make use of the <a href="https://mochajs.org/" target="_blank">Mocha</a> framework. The current version uses sessions and Passport Local Strategy as authentication method, which could be adapted according to a user's needs. Furthermore, it is now employing  <a href="https://www.typescriptlang.org/">Typescript</a>.

An optional Angular2 frontend that reuses the provided functionality can be found at <a href="https://github.com/ollyblink/medical-data-app-frontend" target="_blank">https://github.com/ollyblink/medical-data-app-frontend</a>.

##Purpose
The purpose of this application is to allow a user to register and login to store, read, and retrieve medical data items in a secured way. Furthermore, it allows the user to share the data items with another user, such that only the authorised user can access the data items of the authorising user. Encryption and secure sharing is accomplished through a series of encryption steps.

1. Data items are symmetrically encrypted using a random 128 bit long encryption key.
2. Sharing data items is accomplished by creating a consent between two users. Such a consent stores the authorising user, the authorised user, and the symmetric encryption key of the authorising user, encrypted using the asymmetric public key of the authorised user. This way, only the authorised user can decrypt the data of the authorising user by asymmetrically decrypting the symmetric encryption key with the own private key. The private key is stored symmetrically encrypted using a user's password and is decrypted on log in and stored within a session together with the symmetric encryption key. 

## Installation  Guide

1. `git clone https://github.com/ollyblink/medical-data-app-backend.git`
2. `cd medical-data-app-backend`
3. `npm install`
4. `typings install`

For development purposes, you need to install MongoDB locally and run it. An installation guide e.g. for Windows can be found at <a target="_blank" href="https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/">the official website</a>. MongoDB can be downloaded in the <a href="https://www.mongodb.com/download-center" target="_blank">download center</a>.


## Development Guide
To run the application, several commands need to be executed, each in its own terminal.

1. `mongod`: the first terminal runs the mongo server. To be able to run the server with this command and not the complete path, the PATH variable needs to be set. The installation guide can be found <a href="https://docs.mongodb.com/v3.2/mongo/#start-the-mongo-shell" target="_blank">here</a>. 
2. `npm start`: The second terminal runs the server, which is <a href="http://nodemon.io/" target="_blank">nodemon </a> in this case. Nodemon will watch for file changes and then automatically restart the server. The server runs at https://localhost:8080. The typing warnings displayed do not affect the functioning of the server although they need to be addressed, see known issues below. The app's configuration can be found in server/main.ts. Here, also the frontend URLs can be defined that can have access to the server (which is required for the Angular2 Frontend mentionend in the introduction that runs on http://localhost:3000).

	Beware that the server uses *https* for encrypted communication between browser and website. Because the certificate is untrusted initially, it needs to be proceeded unsafe for the server to work. Open a browser and manually proceed to localhost. In Chrome, this is accomplished as follows:
	- go to https://localhost:8080
	- click advanced
	- Proceed to localhost (unsafe)
	
	Afterwards, queries can be sent via e.g. <a href="https://chrome.google.com/webstore/detail/postman/fhbjgbiflinjbdggehcddcbncdddomop">postman</a>, a handy chrome extension for querying endpoints.

3. `npm test`: runs the test suite. All tests for all routes can be found in the `test` package. An issue is that not all tests work (currently, these are `xit`'ed). They work when ran alone but not when they are run with `npm test`. The issue is listed below.

## App Structure

## Functionality and Paths
The backend provides three functionalities:

1. **Creating new users and login for these users**
	
	Three paths are provided:
	1. `POST https://localhost:8080/register`
		- Registers a new user. Requires `username` and `password` fields (x-www-form-urlencoded in postman)
	2. `POST https://localhost:8080/` 
		- Login of an existing user. requires `username` and `password` fields (x-www-form-urlencoded in postman)

	3. `GET https://localhost:8080/logout`
		- logs out any registered user.

2. **Creation, Reading and Deletion of data items that are stored encrypted on the server** 

	The data is encrypted using a personal random symmetric encryption key and the currently used algorithm is AES256-CTR. The symmetric encryption functionality is provided by Node.js' <a href="https://nodejs.org/api/crypto.html" target="_blank">crypto</a> library. 

	Several paths exist (require a login beforehand to be accessible, see login before):
	1. `POST https://localhost:8080/data/`
		- creates a new data item. Requires `title`, `fev1`, and `fvc` fields (x-www-form-urlencoded in postman). The two latter fields are representatives for spirometry data. On creation, a data item is additionally attached a date and time field. The data is added to the existing data items and encrypted using the user's encryption key. 

	2. `GET https://localhost:8080/data/username/:username`
		- retrieves all data items for a specified user (`:username`). In case the user requesting data is the same as the specified user in `:username`, the data for the user will be decrypted directly using their encryption key. In case the user specified in :username is NOT the same as the logged in user requesting the data items, the system tries to find a matching consent showing that the requesting user is indeed authorised to access the data items of the requested user. If such a consent exists, the requested user's encryption key is decrypted using the requesting user's private key, and the data of the requested user decrypted and returned to the requesting user. If no such consent exists, the data of the requested user cannot be accessed.

	3. `DELETE https://localhost:8080/data/user/:user/item/:itemtitle`
		- deletes a data item with the specified `:itemtitle` for the specified `:user`. Currently, only logged in users can delete their own data items. 
		
3. **Creation and deletion of consents, such that other registered users can read the encrypted data of a user that granted access to their data**
	
	On registration, a public/private RSA key pair provided by the <a href="https://www.npmjs.com/package/node-forge" target="_blank">Node-Forge</a> library (its generation may require some seconds). The public key is stored unencrypted for each user. The private key is stored symmetrically encrypted using the user's password, and the encryption key is stored assymmetrically encrypted using the user's public key. 

	The following paths exist (require login beforehand to be accessible, see login before):

	1. `POST https://localhost:8080/consents/`
		- requires a `receiver` field (x-www-form-urlencoded in postman). The receiver is the user that will be allowed to access this users (the sender's) data. To do so, the encryption key of the sender is asymmetrically encrypted using the receiver's public key. Only the receiver can then decrypt the sender's encryption key using the corresponding private key.

	2. `GET https://localhost:8080/consents`
		- Retrieves all user names of users the requesting user (who needs to be logged in) can grant access to the data in an array. 

	3. `GET https://localhost:8080/consents/sent` and `GET https://localhost:8080/consents/received`
		- The first one retrieves all user names of users that can access the requesting user's data. The second one retrieves all user names of those user's that allowed the requesting user access to their data.

	4. `DELETE https://localhost:8080/consents/sender/:sender/receiver/:receiver`
		- deletes a consent between two users (`:sender` and `:receiver`) if the sender is also the logged in user. Only a user that granted consent to another user can also remove that consent again. 

## Known issues
- For some reason, not all typings work for the `express` interfaces all of a sudden. This needs to be addressed asap. The application still runs, however.
- There is a typing issue with the official (downloaded from <a href="https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/passport-local-mongoose/passport-local-mongoose.d.ts" target="_blank">definitely typed</a>) `PassportLocalModel` interface: The `register` function requires a `PassportLocalModel` for its user, although it should be (as far as I can tell) a `PassportLocalDocument`. If it is changed to `PassportLocalDocument` manually, the error in the `index.route.ts` file will disappear for the `register` method. 
- The tests are slow because for each individual test, a login needs to be created, requiring public/private key generation. A better idea would be to predefine them once in an init script for all tests and reuse them.
- There is a dependency that causes the `data.route.test` tests to break with `npm test`. When they are ran individually, however, the tests succeed. Currently, these test are `xit`'ed to avoid the test to break.

## Future Work
- Assure all typings work.
- Find the dependency that causes the `data.route.test` tests to break with `npm test` although they succeed when run individually.
- Add recovery functionality in case a user loses the login password.
- Encrypt individual files, not all files together, and create a public/private key pair for every data item.
- Create public/private key pairs in advance to lower registration time.
- Create predefined public/private key pairs for the tests so they run faster.
- The app crashes when an already registered user is registered twice. Requires proper handling on both back- and frontend.
- The app crashes when an unregistered user tries to log in. Requires proper handling in both back- and frontend.
- Currently, data items can be stored multiple times. There should be checks to avoid storing data items with the same title etc. if required. Also, delete requires the item title. Instead, the id should be used. 
- When GET https://localhost:8080/consents is invoked, the user for whom the consents are searched is not provided by the URL but instead, it is only checked within the system if the user is logged in. For proper REST notation, the user should be provided in the URL. 
- Overall, more tests, checks, and recovery strategies need to be installed to avoid e.g. problems, where a user is registered twice and MongoDB simply throws an exception.