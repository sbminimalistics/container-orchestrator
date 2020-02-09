'use strict';

const args = process.argv.slice(2);
let port;
if (args.indexOf("port") > -1) {
    port = args[args.indexOf("port") + 1];
} else {
    throw(new Error(`given port: ${port} is not valid; node serve must run on uniq port`));
}
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

console.log('create Node Server RESTful endpoints...');

//setup express middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//RESTful routes setup
//const routes = require('./src/orchestrator/api/routes');
//app.use("/", routes);
app.use("/", (req, res) => {res.end("node")});

//start app listen
app.listen(port);
console.log(`...Node Server API server started on port: ${port}`);
