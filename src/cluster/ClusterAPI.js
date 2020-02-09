'use strict';

const express = require('express');
const app = express();
const port = process.env.PORT || 80;
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', function(req, res) {
    console.log(`ping ${req.route}`);
    res.end(`cluster`);
});

var routes = require('./api/routes/routes');
routes(app);

app.listen(port);

console.log('todo list RESTful API server started on: ' + port);
