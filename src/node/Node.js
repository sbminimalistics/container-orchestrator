'use strict';

const spawn = require("cross-spawn");

let Node = (function () {
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
        Object.defineProperty(this, "json", {
            get: function() {
                return {
                    "id": _id
                };
            }
        });
        /*
        this.node = function () {
        */

        if (spawnNewServer) {
            spawn("node", ["./src/node/remoteServer/server.js", "port", _port], { stdio: "inherit" });
        }
    }
    return Node;
})();

exports = module.exports = Node;
