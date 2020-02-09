'use strict';

const express = require('express');
const verbose = false;

const router = express.Router({mergeParams: true});
router.route("/").get((req, res, next) => {
    if (verbose) console.log(`cluster router '/' id:${req.params.cluster_id} cluster:${JSON.stringify(req.cluster)}`);
    if (req.cluster != null) {
        res.json(req.cluster);
    } else {
        next();
    }
});
router.route("/service").get((req, res) => {
    if (verbose) console.log(`cluster router '/service' id:${req.params.cluster_id} cluster:${JSON.stringify(req.cluster)}`);
    res.json(req.cluster);
});
router.route("/state").get((req, res) => {
    if (verbose) console.log(`cluster router '/state'`);
    res.json(req.cluster);
});
router.route("/stats").get((req, res) => {
    if (verbose) console.log(`cluster router '/stats'`);
    res.json(req.cluster);
});
router.use((req, res, next) => {
    if (verbose) console.log(`cluster 'not found'`);
    if (req.cluster != null) {
        res.json(req.cluster);
    } else {
        res.status(500).send("not found!");
    }
});

module.exports = router;
