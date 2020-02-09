'use strict';

require('dotenv').config();
const port = process.env.PORT || 80;
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const Cluster = require('./src/cluster/Cluster');
const Node = require('./src/node/Node');
const orchestrator0 = require('./src/orchestrator/Orchestrator');

//add couple of initial clusters
const defaultNodeHost = process.env.DEFAULT_HOST || "localhost";
console.log(`defaultNodeHost: ${defaultNodeHost}`);
orchestrator0.addCluster(new Cluster(0, new Node("node_0", defaultNodeHost, 8001, true)));
orchestrator0.addCluster(new Cluster(1));
orchestrator0.addCluster(new Cluster(99));

console.log('orchestrator setup done!');
console.log('setup RESTful..');

//setup express middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//RESTful routes setup
const clusterRoutes = require('./src/cluster/api/routes');
const orchestratorRoutes = require('./src/orchestrator/api/routes');
app.use("/", orchestratorRoutes);
orchestratorRoutes.use("/clusters/:cluster_id/", clusterRoutes);

//start app listen
app.listen(port);
console.log('RESTful API server started on: ' + port);
