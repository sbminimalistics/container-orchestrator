'use strict';

const express = require('express');
const verbose = true;
const router = express.Router({mergeParams: true});

router.route("/service").post((req, res) => {
    if (verbose) console.log(`cluster router '/service' post`);
    req.cluster.callForService(req.body);
    res.json(req.cluster);
}).get((req, res) => {
    if (verbose) console.log(`cluster router '/service' get ..return the last service`);
    res.json(req.cluster.lastServiceCall);
});
router.route("/state").get((req, res) => {
    if (verbose) console.log(`cluster router '/state'`);
    res.json(req.cluster);
});
router.route("/stats").get((req, res) => {
    if (verbose) console.log(`cluster router '/stats'`);
    res.json(req.cluster.json);
});
router.route("/connections").get((req, res) => {
    if (verbose) console.log(`cluster router '/connections'`);
    res.json(req.cluster.connections);
}).put((req, res) => {
    if (verbose) console.log(`cluster router '/connections' req.body: ${JSON.stringify(Object.keys(req.body))}`);
    req.cluster.connections = req.body;
    res.json(req.cluster.connections);
});
router.use((req, res, next) => {
    if (verbose) console.log(`cluster 'not found'`);
    if (req.cluster != null) {
        res.json(req.cluster.json);
    } else {
        res.status(500).send("not found!");
    }
});

module.exports = router;
