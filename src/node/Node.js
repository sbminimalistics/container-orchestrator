'use strict';

const spawn = require("cross-spawn");
const request = require('request');

let Node = (function() {
    let verbose = false;
    function NodeInternal(options) {
        //options = {id, host, port, capacity, spawnNewServer = false}
        if (verbose) console.log(`>Node instantiate using id: ${options.id}`);
        this._id = options.id.toString();
        this._host = options.host.toString();
        this._port = Number(options.port);
        this._capacity = Number(options.capacity);
        if (options.spawnNewServer == null) options.spawnNewServer = false;

        Object.defineProperty(this, "id", {
            get: function() {
                return this._id;
            }
        });
        Object.defineProperty(this, "address", {
            get: function() {
                return `${this._host}:${this._port}`;
            }
        });
        Object.defineProperty(this, "json", {
            get: function() {
                return {
                    "id": this._id,
                    "host": this._host,
                    "port": this._port,
                    "capacity": this._capacity
                };
            }
        });

        if (options.spawnNewServer) {
            spawn("node", ["./src/node/remoteServer/server.js", "host", this._host, "port", this._port], { stdio: "inherit" });
        }
    }

    NodeInternal.prototype.join = function(targetAddress, createInstance) {
        return new Promise((res, rej) => {
            request.post(`http://${this.address}/nodes/${targetAddress}`, (error, response, body) => {
                if (error != null) rej(error)
                else res(body)
            })
        });
    }

    return NodeInternal;
})();

exports = module.exports = Node;
