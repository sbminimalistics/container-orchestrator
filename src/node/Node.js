'use strict';

const spawn = require("cross-spawn");
const request = require('request');

let Node = (function() {
    let verbose = false;
    function Node(options) {
        //options = {id, host, port, capacity, spawnNewServer = false}
        if (verbose) console.log(`>Node instantiate using id: ${id}`);
        let _id = options.id.toString();
        let _host = options.host.toString();
        let _port = Number(options.port);
        let _capacity = Number(options.capacity);
        if (options.spawnNewServer == null) options.spawnNewServer = false;

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
                    "id": _id,
                    "host": _host,
                    "port": _port,
                    "capacity": _capacity
                };
            }
        });
        Node.prototype.join = (address, createInstance) => {
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

        if (options.spawnNewServer) {
            spawn("node", ["./src/node/remoteServer/server.js", "host", _host, "port", _port], { stdio: "inherit" });
        }
    }
    return Node;
})();

exports = module.exports = Node;
