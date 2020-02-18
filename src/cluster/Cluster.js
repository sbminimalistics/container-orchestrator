'use strict';

let Cluster = (function () {
    const verbose = false;
    const objMap = require("../utils/obj-update");

    function Cluster(id, ...nodes) {
        if (verbose) console.log(`>Cluster instantiate using id: ${id}`);
        this._id = id.toString();
        this._nodes = nodes;
        this._connections = {};
        this._lastServiceCall = {};

        //make initial connections between nodes and populate _connections matrix;
        for (let i = 0; i < this._nodes.length; i++) {
            let n0address = this._nodes[i].address;
            if (this._connections[n0address] == null) {
                this._connections[n0address] = {};
            }
            for (let j = 0; j < this._nodes.length; j++) {
                let n1address = this._nodes[j].address;
                if (verbose) console.log(`join ${this._nodes[i].address} on ${this._nodes[j].address}`);
                if (i != j) {
                    let joinres = this._nodes[i].join(this._nodes[j].address)
                    .then((data) => {
                        this._connections[n0address][n1address] = 1;
                    })
                    .catch((err) => {
                        this._connections[n0address][n1address] = 0;
                    });
                }
            }
        }

        Object.defineProperty(this, "id", {
            get: function() {
                return this._id;
            }
        });
        Object.defineProperty(this, "json", {
            get: function() {
                return {
                    "id": this._id,
                    "nodes": this._nodes.map((c) => c.json),
                    "connections": this._connections
                };
            }
        });
        Object.defineProperty(this, "connections", {
            get: function() {
                return this._connections;
            },
            set: function(val) {
                objMap(this._connections, val);
            }
        });
    }

    Cluster.prototype = {
        get lastServiceCall() {
            console.log(`lastServiceCall: ${JSON.stringify(this._lastServiceCall)}`);
            return this._lastServiceCall;
        }
    }

    Cluster.prototype.callForService = function (data) {
        if (verbose) console.log(`>Cluster.callForService req data: ${JSON.stringify(data)}`);
        this._lastServiceCall = data;
    };

    return Cluster;
})();

exports = module.exports = Cluster;
