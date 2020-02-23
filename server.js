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
console.log('setup the main orchestrator...');
const defaultNodeHost = process.env.DEFAULT_HOST || "localhost";
//node (network address) might also be connected later on the fly
orchestrator0.addCluster(
    new Cluster(
        0, //cluster id
        new Node({"id": "node_0", "host": defaultNodeHost, "port": 8001, "capacity": 100, "spawnNewServer": true, "clusterURL": "http://localhost:8000/clusters/0"}), //new node on localhost:8001
        new Node({"id": "node_1", "host": defaultNodeHost, "port": 8002, "capacity": 200, "spawnNewServer": true, "clusterURL": "http://localhost:8000/clusters/0"}), //on localhost:8002
        new Node({"id": "node_2", "host": defaultNodeHost, "port": 8003, "capacity": 50, "spawnNewServer": true, "clusterURL": "http://localhost:8000/clusters/0"}), //on localhost:8003
        new Node({"id": "node_3", "host": defaultNodeHost, "port": 8004, "capacity": 100, "spawnNewServer": true, "clusterURL": "http://localhost:8000/clusters/0"}),
        new Node({"id": "node_4", "host": defaultNodeHost, "port": 8005, "capacity": 100, "spawnNewServer": true, "clusterURL": "http://localhost:8000/clusters/0"})
    )
);
console.log('...orchestrator setup done');

//number of clusters running in parallel is supported; disabling for the sake of simplicity.
/*
orchestrator0.addCluster(
    new Cluster(
        1, //cluster id
        new Node({"id": "node_10", "host": defaultNodeHost, "port": 8011, "capacity": 100, "spawnNewServer": true, "clusterURL": "http://localhost:8000/clusters/1"}), //new node on localhost:8011
        new Node({"id": "node_11", "host": defaultNodeHost, "port": 8012, "capacity": 100, "spawnNewServer": true, "clusterURL": "http://localhost:8000/clusters/1"}), //on localhost:8012
        new Node({"id": "node_12", "host": defaultNodeHost, "port": 8013, "capacity": 100, "spawnNewServer": true, "clusterURL": "http://localhost:8000/clusters/1"}) //on localhost:8013
    )
);
*/

//setup express middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//RESTful routes setup
console.log('create the Main Server RESTful endpoints...');
const clusterRoutes = require('./src/cluster/api/routes');
const orchestratorRoutes = require('./src/orchestrator/api/routes');
app.use("/", orchestratorRoutes);
orchestratorRoutes.use("/clusters/:cluster_id/", clusterRoutes);

//start app listen
app.listen(port);
console.log(`...Main Server API server started on port: ${port}`);
