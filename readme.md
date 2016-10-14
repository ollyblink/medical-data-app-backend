This is full stack implementation of popular MEAN stack technologies fully based on TypeScript.
It includes Angular 2 as backend and MongoDB (Mongoose framework), Node.js (ExpressJS as framework).

### Installation  Guide

1. `git clone https://github.com/dajk/MEAN2.git`
2. `cd MEAN2`
3. `npm install`
4. `typings install`

-

For development purposes, you should have installed MongoDB locally and run it..

### Dev Guide

1. `mongod` -> 1st terminal to run the mongo server  
2. `npm start` -> 2nd terminal to run the server (nodemon in our case)
!!Beware: it's an https server, thus, it will only work once the certificate was added. So after start, in a browser like Chrome, 
go to https://localhost:8080 -> advanced -> Proceed to localhost (unsafe). Afterwards, queries can be sent via e.g. postman.
3. `npm test` -> runs test suite. Not all tests work (xit'ed) --> they work when ran alone, not with other tests. Have not found the dependency yet.

# medical-data-app-backend
