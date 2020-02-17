'use strict';

const args = process.argv.slice(2);
let host, port;
if (args.indexOf("host") > -1) {
    host = args[args.indexOf("host") + 1];
} else {
    throw(new Error(`given host: ${host} is not valid; node serve must have host defined`));
}
if (args.indexOf("port") > -1) {
    port = args[args.indexOf("port") + 1];
} else {
    throw(new Error(`given port: ${port} is not valid; node serve must run on uniq port`));
}

const verbose = false;
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

if (verbose) console.log(`initialize LifeRaft on ${host}:${port}...`);
const RaftController = require("./RaftController");
const raftController = new RaftController(host, port);
if (verbose) console.log(`...LifeRaft instance created with state: ${raftController.state}`);

if (verbose) console.log('create Node Server RESTful endpoints...');
//setup express middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//RESTful routes setup
const routes = require('./api/routes');
app.use("/", routes(raftController));

//start app listen
app.listen(port);
if (verbose === true) console.log(`...Node Server API server started on port: ${port}`);
