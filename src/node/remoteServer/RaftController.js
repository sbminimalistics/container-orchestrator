'use strict';

const LifeRaft = require('liferaft');
const request = require('request');
const Log = require('../../../node_modules/liferaft/log');
const objMap = require("../../utils/obj-update");

let RaftController = (function () {
    const verbose = false;
    
    function RaftController(host, port, clusterURL) {
        if (verbose) console.log(`>RaftController instantiate using host: ${host} port: ${port} clusterURL: ${clusterURL}`);
        this._host = host.toString();
        this._port = Number(port);
        this._clusterURL = clusterURL;
        this._connections = {};

        Object.defineProperty(this, "host", {
            get: function() {
                return this._host;
            }
        });
        Object.defineProperty(this, "port", {
            get: function() {
                return this._port;
            }
        });
        Object.defineProperty(this, "state", {
            get: function() {
                return LifeRaft.states[this._raft.state];
            }
        });
        Object.defineProperty(this, "majority", {
            get: function() {
                return this._raft.majority();
            }
        });
        Object.defineProperty(this, "json", {
            get: function() {
                return {
                    "host": this._host,
                    "port": this._port,
                    "state": this.state
                };
            }
        });
        Object.defineProperty(this, "nodes", {
            get: function() {
                return this._raft.nodes;
            }
        });
        Object.defineProperty(this, "connections", {
            set: function(value) {
                objMap(this._connections, value);
                if (verbose) console.log(`>RaftController connections set ${JSON.stringify(this._connections)}`);
            },
            get: function() {
                return this._connections;
            }
        });
        
        RaftController.prototype.checkConnection = (url) => {
            if (this.connections[url] === 1) {
                return true;
            } else {
                return false;
            }
        }
        
        RaftController.prototype.join = function(url) {
            if (verbose) console.log(`join on host: ${this._host} port: ${this._port}  target url: ${this._url}`);
            this._raft.join(url, (function(u, c){var url2=u; var check = c; return function(packet, callback){
                if (check(url2) === true) {
                    request.post(`http://${url2}/data`, {json: packet}, (error, response, body) => {
                        if (verbose) console.log("RaftController post return body:", JSON.parse(body));
                        callback(null, JSON.parse(body));
                    });
                } else {
                    callback(new Error("connection blocked in configuration"));
                }
            }})(url, this.checkConnection));
            return Promise.resolve("ok");
        }

        RaftController.prototype.data = (jsonData) => {
            if (verbose) console.log(`RaftController dataIN on ${this._host}:${this._port} data: ${JSON.stringify(jsonData)}`);
            return new Promise((res, rej) => {
                this._raft.emit("data", jsonData, function(data){
                    res(data);
                }.bind(this));
            });
        }

        RaftController.prototype.service = (jsonData) => {
            if (verbose) console.log(`RaftController service on ${this._host}:${this._port} data: ${JSON.stringify(jsonData)}`);
            return new Promise((res, rej) => {
                this._raft.command(jsonData).then(() => {
                    console.log(`service command successfully spread`);
                    //TO-DO: implement mechanism that allows to control follower nodes based on their current load;
                    res();
                }).catch((err) => {
                    if (verbose) console.log(`command err: ${err}`);
                    rej(err);
                });
            });
        }

        LifeRaft.prototype.initialize = (options) => {
            if (verbose) console.log(`RaftController LifeRaft instance initialized with options: ${JSON.stringify(options)}`);
        }
        
        this._raft = new LifeRaft(`${this._host}:${this._port}`, {
            "heartbeat": "1000 millisecond",
            "election min": "2000 millisecond",
            "election max": "6000 millisecond",
            "Log": Log,
            "path": `level_dbs/db_${this._port}`
        });
        
        this._raft.on("heartbeat", (data) => {
            if (verbose) console.log(`>RaftController ${this._host}:${this._port} heartbeat data: ${data}`);
        })
        this._raft.on("candidate", (data) => {
            if (verbose) console.log(`>RaftController ${this._host}:${this._port} candidate`);
        })
        this._raft.on("state change", (data) => {
            if (verbose) console.log(`>RaftController ${this._host}:${this._port} state change data: ${data}`);
        })
        this._raft.on("join", (data) => {
            if (verbose) console.log(`>RaftController ${this._host}:${this._port} join data: ${data}`);
        })
        this._raft.on("leader change", (data) => {
            if (verbose) console.log(`>RaftController ${this._host}:${this._port} leader change data: ${data}`);
        })
        this._raft.on("leader", () => {
            if (true) console.log(`>RaftController ${this._host}:${this._port} became a leader; report this back to cluster through: ${this._clusterURL}/leader`);
            request.post(`${this._clusterURL}/leader`, {json: {host: this._host, port: this._port}}, (error, response, body) => {
                if (verbose) console.log("RaftController leader post return body:", body);
            });
        })
        this._raft.on("data", (data) => {
            if (verbose) console.log(`>RaftController on('data' @ ${this._host}:${this._port} dead-end data: ${JSON.stringify(data)}`);
        })
        this._raft.on("commit", (data) => {
            if (verbose) console.log(`>RaftController on('commit' @ ${this._host}:${this._port} majority instructed: ${JSON.stringify(data)}`);
        })
    }
    return RaftController;
})();

exports = module.exports = RaftController;
