'use strict';

const express = require('express');
const verbose = true;
const router = express.Router({mergeParams: true});

router.route("/leader").post((req, res) => {
    if (verbose) console.log(`cluster router '/leader' post`);
    req.cluster.leader = req.body;
});
router.route("/service").post((req, res) => {
    if (verbose) console.log(`cluster router '/service' post`);
    req.cluster.callForService(req.body);
    req.cluster.json.then((data) => {
        res.json(data);
    });
}).get((req, res) => {
    if (verbose) console.log(`cluster router '/service' get ..return the last service`);
    res.json(req.cluster.lastServiceCall);
});
router.route("/state").get((req, res) => {
    if (verbose) console.log(`cluster router '/state'`);
    req.cluster.json.then((data) => {
        res.json(data);
    });
});
router.route("/stats").get((req, res) => {
    if (verbose) console.log(`cluster router '/stats'`);
    req.cluster.json.then((data) => {
        res.json(data);
    });
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
    if (verbose) console.log(`such endpoint is not defined; fallback to default`);
    if (req.cluster != null) {
        req.cluster.json.then((data) => {
            res.json(data);
        });
    } else {
        res.status(500).send("not found!");
    }
});

module.exports = router;
