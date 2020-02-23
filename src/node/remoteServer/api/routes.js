'use strict';

const express = require('express');

const nodeRouter = (controller) => {
    const verbose = false;
    const router = express.Router();
    let connections = {};

    router.route("/").get((req, res, next) => {
        if (verbose) console.log(`remote server node router '/' json:${JSON.stringify(controller.json)}`);
        res.json(controller.json);
    });

    router.route("/nodes/:url").post((req, res) => {
        if (verbose) console.log(`remote server router '/nodes/:url' url: ${req.params.url}`);
        controller.join(`${req.params.url}`).then((data) => {
            if (verbose) console.log(`remote server router join returned: ${data}`);
            controller.connections = JSON.parse(`{"${req.params.url}": 1}`);
            res.json({"status": "ok"});
        }).catch((err) => {
            res.status(403).json({"status": err});
        });
    }).delete((req, res) => {
        if (verbose) console.log(`remote server router '/nodes/' url: ${req.params.url}`);
        controller.leave(`${req.params.url}`).then((data) => {
            if (verbose) console.log(`remote server router leave returned: ${data}`);
            res.json({"status": "ok"});
        }).catch((err) => {
            res.status(403).json({"status": err});
        });
    });

    router.route("/majority").get((req, res) => {
        if (verbose) console.log(`remote server router '/majority'`);
        res.json({majority: controller.majority});
    });

    router.route("/connections").post((req, res, next) => {
        if (verbose) console.log(`remote server router '/connections' post data: ${JSON.stringify(req.body)}`);
        controller.connections = req.body;
        next();
    }).all((req, res) => {
        if (verbose) console.log(`remote server router '/connections' get`);
        res.json(controller.connections);
    });

    router.route("/data").post((req, res) => {
        if (verbose) console.log(`remote server router '/data' data: ${JSON.stringify(req.body)}`);
        controller.data(req.body).then((data) => {
            if (verbose) console.log(`router '/data' return to ${req.body.address} data: ${JSON.stringify(data)}`);
            res.json(data);
        });
    });

    //The main instruction push endpoint. This is how Cluster updates it's nodes.
    router.route("/service").post((req, res) => {
        if (verbose) console.log(`remote server router '/service' data: ${JSON.stringify(req.body)}`);
        controller.service(req.body).then((data) => {
            if (verbose) console.log(`router '/data' return to ${req.body.address} data: ${JSON.stringify(data)}`);
            res.json(data);
        }).catch((err) => {
            res.status(500).send(err);
        });
    });

    router.route("/stats").get((req, res) => {
        if (verbose) console.log(`remote server router '/status'`);
        res.json(controller.json);
    });

    router.route("/loadLookupTable").get((req, res) => {
        if (verbose) console.log(`remote server router '/loadLookupTable'`);
        res.json(controller.loadLookupTable);
    });

    router.route("/nodes/count").get((req, res) => {
        if (verbose) console.log(`remote server router '/status2'`);
        controller.getNodesCount(req.body).then((data) => {
            res.json({"count": data});
        });
    });

    router.route("/rpc").post((req, res) => {
        if (verbose) console.log(`remote server router '/rpc'`);
        controller.rpc(req.body).then((data) => {
            res.json(data);
        });
    });

    router.route("/exit").post((req, res) => {
        if (verbose) console.log(`remote server router '/exit'`);
        res.send("exit");
        process.exit();
    });

    router.use((req, res, next) => {
        res.status(500).send("endpoint not found!");
    });

    return router;
}

module.exports = nodeRouter;
