'use strict';

const express = require('express');
const verbose = false;

const nodeRouter = (controller) => {
    const router = express.Router();
    router.route("/").get((req, res, next) => {
        if (verbose) console.log(`remote server node router '/' json:${JSON.stringify(controller.json)}`);
        res.json(controller.json);
    });
    router.route("/nodes/:url").put((req, res) => {
        if (verbose) console.log(`remote server router '/nodes/:url' url: ${req.params.url}`);
        controller.join(`${req.params.url}`);
        res.send("added");
    });
    router.route("/majority").get((req, res) => {
        if (verbose) console.log(`remote server router '/majority'`);
        res.json({majority: controller.majority});
    });
    router.route("/data").post((req, res) => {
        if (verbose) console.log(`remote server router '/data' data: ${JSON.stringify(req.body)}`);
        controller.data(req.body).then((data) => {
            res.json(data);
        })
    });
    router.use((req, res, next) => {
        res.status(500).send("endpoint not found!");
    });

    return router;
}

module.exports = nodeRouter;
