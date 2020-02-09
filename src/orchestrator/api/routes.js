'use strict';

const express = require('express');
const orchestrator = require('../Orchestrator');
const verbose = false;

const router = express.Router();
router.param("cluster_id", (req, res, next, id) => {
    req.cluster = orchestrator.findCluster(req.params.cluster_id.toString());
    next();
});
router.route("/clusters").get((req, res) => {
    if (verbose) console.log(`orchestrator router /clusters`);
    let r = orchestrator.clusters;
    res.json(r);
});

module.exports = router;
