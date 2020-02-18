'use strict';

let Cluster = (function () {
    const verbose = false;
    const request = require('request');
    const objMap = require("../utils/obj-update");

    function Cluster(id, ...nodes) {
        if (verbose) console.log(`>Cluster instantiate using id: ${id}`);
        this._id = id.toString();
        this._nodes = nodes;
        this._connections = {};
        this._lastServiceCall = {};
        this._leader; //{id: string, address: string}

        //make initial connections between nodes and populate _connections matrix;
        for (let i = 0; i < this._nodes.length; i++) {
            this._nodes[i].clusterId = this._id;
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
                return new Promise((res, rej) => {
                    let result = {
                        "id": this._id,
                        "nodes": [],
                        "connections": this._connections
                    };
                    let promises = [];
                    this._nodes.map((node) => promises.push(node.json));
                    Promise.all(promises).then((answers) => {
                        answers.map((ans) => {
                            result.nodes.push(ans);
                        });
                        res(result);
                    });
                });
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
        Object.defineProperty(this, "leader", {
            get: function() {
                return this._leader;
            },
            set: function(val) {
                this._leader = val;
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
        if (verbose) console.log(`>Cluster.callForService req data: ${JSON.stringify(data)} leader: ${JSON.stringify(this._leader)}`);
        this._lastServiceCall = data;
        if (this._leader != null) {
            request.post(`http://${this._leader.host}:${this._leader.port}/service`, {json: data}, (error, response, body) => {
                if (verbose) console.log(`>Cluster.callForService forwarded to http://${this._leader.host}:${this._leader.port}/service returned body: ${body}`);
            });
        }
    };

    Cluster.prototype.addNode = function (data) {
        if (verbose) console.log(`>Cluster.addNodes req data: ${JSON.stringify(data)}`);
        //TO-DO: implement functionality that allows to add a new node and join it to already existing ones.
    };

    return Cluster;
})();

exports = module.exports = Cluster;
