This is a complete backend written in Typescript, utilising NodeJS, Express, Passport, MongoDB.
For the frontend part, see https://github.com/ollyblink/medical-data-app-frontend.git

### Installation  Guide

1. `git clone https://github.com/ollyblink/medical-data-app-backend.git`
2. `cd medical-data-app-backend`
3. `npm install`
4. `typings install`
 

For development purposes, you should have installed MongoDB locally and run it..

### Dev Guide

1. `mongod` -> 1st terminal to run the mongo server  
2. `npm start` -> 2nd terminal to compile typescript files and run the server (nodemon in our case)
!!Beware: it's an https server, thus, it will only work once the certificate was added. So after start, in a browser like Chrome, 
go to https://localhost:8080 -> advanced -> Proceed to localhost (unsafe). Afterwards, queries can be sent via e.g. postman.
3. `npm test` -> runs test suite. Not all tests work (xit'ed) --> they work when ran alone, not with other tests. Have not found the dependency issue yet.

# medical-data-app-backend
