'use strict';

const LifeRaft = require('liferaft');
const request = require('request');
const Log = require('../../../node_modules/liferaft/log');
const objMap = require("../../utils/obj-update");

let RaftController = (function () {
    const verbose = false;
    
    function RaftController(host, port) {
        if (verbose) console.log(`>RaftController instantiate using host: ${host} port: ${port}`);
        let _host = host.toString();
        let _port = Number(port);
        let _connections = {};

        Object.defineProperty(this, "host", {
            get: function() {
                return _host;
            }
        });
        Object.defineProperty(this, "port", {
            get: function() {
                return _port;
            }
        });
        Object.defineProperty(this, "state", {
            get: function() {
                return LifeRaft.states[_raft.state];
            }
        });
        Object.defineProperty(this, "majority", {
            get: function() {
                return _raft.majority();
            }
        });
        Object.defineProperty(this, "json", {
            get: function() {
                return {
                    "host": _host,
                    "port": _port,
                    "state": this.state
                };
            }
        });
        Object.defineProperty(this, "nodes", {
            get: function() {
                return _raft.nodes;
            }
        });
        Object.defineProperty(this, "connections", {
            set: function(value) {
                objMap(_connections, value);
                if (verbose) console.log(`>RaftController connections set ${JSON.stringify(_connections)}`);
            },
            get: function() {
                return _connections;
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
            if (verbose) console.log(`join on host: ${host} port: ${port}  target url: ${url}`);
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
            if (verbose) console.log(`RaftController dataIN on ${_host}:${_port} data: ${JSON.stringify(jsonData)}`);
            return new Promise((res, rej) => {
                //if (jsonData.data != null) console.log(`jasonData.data.command: ${JSON.stringify(jsonData.data)}`);
                this._raft.emit("data", jsonData, function(data){
                    res(data);
                }.bind(this));
            });
        }

        RaftController.prototype.service = (jsonData) => {
            if (verbose) console.log(`RaftController service on ${_host}:${_port} data: ${JSON.stringify(jsonData)}`);
            return new Promise((res, rej) => {
                this._raft.command(jsonData).then((success) => {
                    console.log(`command success: ${success}`);
                    res(success);
                }).catch((err) => {
                    console.log(`command err: ${err}`);
                    rej(err);
                });
            });
        }

        LifeRaft.prototype.initialize = (options) => {
            if (verbose) console.log(`RaftController LifeRaft instance initialized with options: ${JSON.stringify(options)}`);
        }
        
        this._raft = new LifeRaft(`${_host}:${_port}`, {
            "heartbeat": "1000 millisecond",
            "election min": "2000 millisecond",
            "election max": "6000 millisecond",
            "Log": Log,
            "path": `level_dbs/db_${_port}`
        });
        
        this._raft.on("heartbeat", (data) => {
            if (verbose) console.log(`>RaftController ${_host}:${_port} ++++++++++++++++++ heartbeat data: ${data}`);
        })
        this._raft.on("candidate", (data) => {
            if (verbose) console.log(`>RaftController ${_host}:${_port} candidate`);
        })
        this._raft.on("state change", (data) => {
            if (verbose) console.log(`>RaftController ${_host}:${_port} state change data: ${data}`);
        })
        this._raft.on("join", (data) => {
            if (verbose) console.log(`>RaftController ${_host}:${_port} join data: ${data}`);
        })
        this._raft.on("leader change", (data) => {
            if (verbose) console.log(`>RaftController ${_host}:${_port} leader change data: ${data}`);
        })
        this._raft.on("data", (data) => {
            if (verbose) console.log(`>RaftController on('data' @ ${_host}:${_port} dead-end data: ${JSON.stringify(data)}`);
        })
        this._raft.on("commit", (data) => {
            if (verbose) console.log(`>RaftController on('commit' @ ${_host}:${_port} majority instructed: ${JSON.stringify(data)}`);
        })
    }
    return RaftController;
})();

exports = module.exports = RaftController;
