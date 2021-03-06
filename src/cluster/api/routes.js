'use strict';

const express = require('express');
const verbose = false;
const router = express.Router({mergeParams: true});

router.route("/nodes").post((req, res) => {
    if (verbose) console.log(`cluster router '/nodes' POST`);
    req.cluster.addNode(req.body).then((data) => {
        res.json(data);
    });
}).delete((req, res) => {
    if (verbose) console.log(`cluster router '/nodes' DELETE`);
    req.cluster.removeNode(req.body).then((data) => {
        res.json(data);
    });
});
router.route("/leader").post((req, res) => {
    if (verbose) console.log(`cluster router '/leader' POST`);
    req.cluster.leader = req.body;
});
router.route("/service").post((req, res) => {
    if (verbose) console.log(`cluster router '/service' POST`);
    res.json(req.cluster.callForService(req.body));
}).get((req, res) => {
    if (verbose) console.log(`cluster router '/service' GET ..return the last service`);
    res.json(req.cluster.lastServiceCall);
});
router.route("/state").get((req, res) => {
    if (verbose) console.log(`cluster router '/state' GET`);
    req.cluster.json.then((data) => {
        res.json(data);
    });
});
router.route("/stats").get((req, res) => {
    if (verbose) console.log(`cluster router '/stats' GET`);
    req.cluster.json.then((data) => {
        res.json(data);
    });
});
router.route("/connections").get((req, res) => {
    if (verbose) console.log(`cluster router '/connections' GET`);
    res.json(req.cluster.connections);
}).put((req, res) => {
    if (verbose) console.log(`cluster router '/connections' PUT req.body: ${JSON.stringify(Object.keys(req.body))}`);
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
