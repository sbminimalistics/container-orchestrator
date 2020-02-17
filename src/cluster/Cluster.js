'use strict';

let Cluster = (function () {
    const verbose = false;
    const objMap = require("../utils/obj-update");

    function Cluster(id, ...nodes) {
        if (verbose) console.log(`>Cluster instantiate using id: ${id}`);
        let _id = id.toString();
        let _nodes = nodes;
        let _connections = {};

        //make initial connections between nodes and populate _connections matrix;
        for (let i = 0; i < _nodes.length; i++) {
            let n0address = _nodes[i].address;
            if (_connections[n0address] == null) {
                _connections[n0address] = {};
            }
            for (let j = 0; j < _nodes.length; j++) {
                let n1address = _nodes[j].address;
                if (verbose) console.log(`join ${this._nodes[i].address} on ${this._nodes[j].address}`);
                if (i != j) {
                    let joinres = _nodes[i].join(_nodes[j].address)
                    .then((data) => {
                        _connections[n0address][n1address] = 1;
                    })
                    .catch((err) => {
                        _connections[n0address][n1address] = 0;
                    });
                }
            }
        }

        Object.defineProperty(this, "id", {
            get: function() {
                return _id;
            }
        });
        Object.defineProperty(this, "json", {
            get: function() {
                return {
                    "id": _id,
                    "nodes": _nodes.map((c) => c.json),
                    "connections": _connections
                };
            }
        });
        Object.defineProperty(this, "connections", {
            get: function() {
                return _connections;
            },
            set: function(val) {
                objMap(_connections, val);
            }
        });
        this.callForService = function () {
            if (verbose) console.log('>Cluster.callForService');
        };
    }
    return Cluster;
})();

exports = module.exports = Cluster;
