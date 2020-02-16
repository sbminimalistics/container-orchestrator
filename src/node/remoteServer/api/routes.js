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
        controller.join(`${req.params.url}`, true).then((data) => {
            if (verbose) console.log(`remote server router join returned: ${data}`);
            controller.connections = JSON.parse(`{"${req.params.url}": 1}`);
            res.send("ok");
        }).catch((err) => {
            res.status(403).send(err);
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
            res.json(JSON.stringify(data));
        })
    });

    //The main instruction push endpoint. This is how Cluster updates it's nodes.
    router.route("/service").post((req, res) => {
        if (verbose) console.log(`remote server router '/service' data: ${JSON.stringify(req.body)}`);
        controller.service(req.body).then((data) => {
            if (verbose) console.log(`router '/data' return to ${req.body.address} data: ${JSON.stringify(data)}`);
            res.json(controller.json);
        }).catch((err) => {
            res.status(500).send(err);
        });
    });

    router.route("/status").get((req, res) => {
        if (verbose) console.log(`remote server router '/status'`);
        res.status(200).send("status");
    });

    router.use((req, res, next) => {
        res.status(500).send("endpoint not found!");
    });

    return router;
}

module.exports = nodeRouter;
