'use strict';

const spawn = require("cross-spawn");
const request = require('request');

let Node = (function() {
    let verbose = false;
    function Node(id, host, port, spawnNewServer = false) {
        if (verbose) console.log(`>Node instantiate using id: ${id}`);
        let _id = id.toString();
        let _host = host.toString();
        let _port = Number(port);

        Object.defineProperty(this, "id", {
            get: function() {
                return _id;
            }
        });
        Object.defineProperty(this, "address", {
            get: function() {
                //return `${_host.includes("http") ? "" : "http://"}${_host}:${_port}`;
                return `${_host}:${_port}`;
            }
        });
        Object.defineProperty(this, "json", {
            get: function() {
                return {
                    "id": _id
                };
            }
        });
        this.join = (address, createInstance) => {
            console.log(`Node(${this.address}) join ${address}`);
            return new Promise((res, rej) => {
                request.post(`http://${this.address}/nodes/${address}`, (error, response, body) => {
                    if (verbose) {
                        console.log("Node error:", error, "statusCode:", response && response.statusCode);
                        console.log("Node body:", body);
                    }
                    if (error != null) rej(error)
                    else res(body)
                })
            });
        }
        /*
        this.node = function () {
        */

        if (spawnNewServer) {
            spawn("node", ["./src/node/remoteServer/server.js", "host", _host, "port", _port], { stdio: "inherit" });
        }
    }
    return Node;
})();

exports = module.exports = Node;
