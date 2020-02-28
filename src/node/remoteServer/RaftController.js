'use strict';

const LifeRaft = require('liferaft');
const request = require('request');
const Log = require('../../../node_modules/liferaft/log');
const objMap = require("../../utils/obj-update");

let RaftController = (function () {
    const verbose = false;

    function RaftController(host, port, clusterURL, capacity) {
        if (verbose) console.log(`> RaftController instantiate using host: ${host} port: ${port} clusterURL: ${clusterURL}`);
        this._host = host.toString();
        this._port = Number(port);
        this._clusterURL = clusterURL;
        this._capacity = capacity;
        this._load = 0;
        this._connections = {};
        this._servicePromiseResolve = this._servicePromiseReject = null;
        this._nodeMetrics = {};
        this._pendingRedistribution = false;
        this._loadLookupTable = {};

        this._raft = new LifeRaft(`${this._host}:${this._port}`, {
            "heartbeat": "1000 millisecond",
            "election min": "2000 millisecond",
            "election max": "6000 millisecond",
            "Log": Log,
            "path": `./level_dbs/db_${this._port}`
        });

        this._raft.on("heartbeat", (data) => {
            if (verbose) console.log(`> RaftController ${this._host}:${this._port} heartbeat data: ${JSON.stringify(data)}`);
        });
        this._raft.on("candidate", (data) => {
            if (verbose) console.log(`> RaftController ${this._host}:${this._port} candidate`);
        });
        this._raft.on("state change", (data) => {
            if (verbose) console.log(`> RaftController ${this._host}:${this._port} state change data: ${data}`);
        });
        this._raft.on("join", (data) => {
            if (this._raft.state !== 1) return;
            if (verbose) console.log(`> RaftController join on ${this._host}:${this._port}`);
            this._raft.packet("append").then((packet) => {
                request.post(`http://${data.address}/data`, {json: packet}, (error, response, body) => {
                    if (verbose) console.log(`RaftController join>packet>request>callback err: ${error} resp: ${response}`);
                    if (body.metrics != null) {
                        this.parseMetrics(data.address, body.metrics);
                    }
                    this.redistributeLoad().then((data) => {
                        console.log(`> RaftController load redistribution success after join on ${this._host}:${this._port}`);
                    }).catch((err) => {});
                });
            })
        });
        this._raft.on("leave", (data) => {
            if (verbose) console.log(`> RaftController ${this._host}:${this._port} leave data: ${JSON.stringify(data)}`);
            if (this._raft.state !== 1) return;
            this.redistributeLoad().then((data) => {
                console.log(`> RaftController load redistribution success after leave on ${this._host}:${this._port}`);
            }).catch((err) => {});
        });
        this._raft.on("leader change", (data) => {
            if (verbose) console.log(`> RaftController ${this._host}:${this._port} leader change data: ${data}`);
        });
        this._raft.on("leader", () => {
            console.log(`> RaftController ${this._host}:${this._port} became a leader; report this back to the cluster through: ${this._clusterURL}/leader`);
            this._pendingRedistribution = true;
            request.post(`${this._clusterURL}/leader`, {json: {host: this._host, port: this._port}}, (error, response, body) => {
                if (verbose) console.log("> RaftController leader post return body:", body);
            });
        });
        this._raft.on("data", (data) => {
            if (verbose) console.log(`> RaftController on('data' @ ${this._host}:${this._port} dead-end data: ${JSON.stringify(data)}`);
            if (this._raft.state !== 1) return;
            if (this._pendingRedistribution && Object.keys(this._nodeMetrics).length >= this._raft.nodes.length) {
                this._pendingRedistribution = false;
                this.redistributeLoad().then((data) => {
                    console.log(`> RaftController load redistribution success after leader elected on ${this._host}:${this._port} data: ${data}`);
                }).catch((err) => {});
            }
        });
        this._raft.on("commit", (data) => {
            if (verbose) console.log(`> RaftController on('commit' @ ${this._host}:${this._port} majority instructed: ${JSON.stringify(data)}`);
            this._raft.log.getLastInfo().then((data)=>{
                //We wait for the LEADER to fire 'commit'.
                if (this._raft.state === 1) {
                    this._pendingRedistribution = true;
                    if (this._servicePromiseResolve != null) {
                        this._servicePromiseResolve({status: "ok", log_index: data.index});
                        this.clearServicePromiseReferences();
                    }
                } else {
                    if (this._servicePromiseReject != null) {
                        this._servicePromiseReject({status: "fail; not any more the leader"});
                        this.clearServicePromiseReferences();
                    }
                }
            });
        });
        this._raft.on("rpc", (data) => {
            if (verbose) console.log(`> RaftController on('rpc' @ ${this._host}:${this._port} majority instructed: ${JSON.stringify(data)}`);
            if (data.type != null && data.type == "load distribution") {
                this._loadLookupTable = data.services;
                this._load = 0;
                Object.keys(this._loadLookupTable).map(key => this._loadLookupTable[key]).map((service) => {
                    this._load += service[this.address] ? service[this.address] : 0;
                });
                if (verbose) console.log(`> RaftController ${this._host}:${this._port} load: ${this._load} of ${this._capacity}`)
            }
        });
    }

    RaftController.prototype = {
        get host() {
            return this._host;
        },
        get port() {
            return this._port;
        },
        get address() {
            return `${this._host}:${this._port}`;
        },
        get state() {
            return this._raft.state;
            //return LifeRaft.states[this._raft.state];
        },
        get majority() {
            return this._raft.majority();
        },
        get json() {
            return {
                "host": this._host,
                "port": this._port,
                "state": this.state,
                "capacity": this._capacity,
                "load": this._load
            };
        },
        get nodes() {
            return this._raft.nodes;
        },
        set connections(value) {
            objMap(this._connections, value);
            if (verbose) console.log(`> RaftController connections set ${JSON.stringify(this._connections)}`);
        },
        get connections() {
            return this._connections;
        },
        get loadLookupTable() {
            return this._loadLookupTable;
        }
    }

    RaftController.prototype.clearServicePromiseReferences = function (url) {
        this._servicePromiseResolve = this._servicePromiseReject = null;
    }

    RaftController.prototype.checkConnection = function (url) {
        if (this._connections[url] === 1) {
            return true;
        } else {
            return false;
        }
    }

    RaftController.prototype.parseMetrics = function (address, data) {
        this._nodeMetrics[address] = data;
        if (verbose) console.log(`> RaftController parseMetrics of client: ${address} data: ${JSON.stringify(data)}`);
    }

    RaftController.prototype.join = function (url) {
        if (verbose) console.log(`join on host: ${this._host} port: ${this._port}  target url: ${url}`);
        this._raft.join(url, (function(u, c, m){var url2=u; var check = c; var metrics = m; return function(packet, callback){
            if (check(url2) === true) {
                request.post(`http://${url2}/data`, {json: packet}, (error, response, body) => {
                    if (verbose) console.log(`> RaftController post return body: ${body}`);
                    if (body == null) return callback(error);
                    try {
                        if (body.metrics != null) {
                            metrics(url2, body.metrics);
                        }
                    } catch (e) {
                        console.log(`error: ${e}`);
                    }
                    if (body.type === "heartbeat ack") {
                        if (verbose) console.log(`> RaftController 'heartbeat ack' on write`);
                    } else {
                        callback(error, error != null ? error : body);
                    }
                });
            } else {
                callback(new Error("connection blocked in configuration"));
            }
        }})(url, this.checkConnection.bind(this), this.parseMetrics.bind(this)));
        return Promise.resolve("ok");
    }

    RaftController.prototype.leave = function (url) {
        if (verbose) console.log(`leave on host: ${this._host} port: ${this._port}  target url: ${url}`);
        delete this._connections[url];
        delete this._nodeMetrics[url];
        this._raft.leave(url);
        return Promise.resolve("ok");
    }

    RaftController.prototype.data = function (jsonData) {
        if (verbose) console.log(`> RaftController dataIN on ${this._host}:${this._port} data: ${JSON.stringify(jsonData)}`);
        return new Promise((res, rej) => {
            this._raft.emit("data", jsonData, function(data){
                if (data instanceof Object) {
                    data.metrics = {
                        "capacity": this._capacity,
                        "load": this._load //short-circut load value;
                    }
                }
                res(data);
            }.bind(this));
        });
    }

    RaftController.prototype.service = function (jsonData) {
        if (verbose) console.log(`> RaftController service on ${this._host}:${this._port} data: ${JSON.stringify(jsonData)}`);
        return new Promise((res, rej) => {
            this._servicePromiseResolve = res;
            this._servicePromiseReject = rej;
            this._raft.command(jsonData).then(() => {
                //TO-DO: implement mechanism that allows to control follower nodes based on their current load;
                return this.redistributeLoad();
            }).catch((err) => {
                if (verbose) console.log(`command err: ${err}`);
                rej(err);
            });
        });
    }

    RaftController.prototype.redistributeLoad = function () {
        if (this._raft.state !== 1) return Promise.reject("redistributeLoad canceled; not a leader");
        if (verbose) console.log(`> RaftController redistributeLoad invoked on the leader running at: ${this._host}:${this._port}`);
        return new Promise((res, rej) => {
            var loadDistribution = {"type": "load distribution"};
            loadDistribution["services"] = {};
            var selfMetrics = {};
            selfMetrics[this.address] = {"capacity": this._capacity, "load": this._load};
            var metrics = Object.assign({}, this._nodeMetrics, selfMetrics);
            var capacityAvailable = Object.keys(metrics).reduce((ca, key) => {
                return ca + (metrics[key].capacity - metrics[key].load);
            }, 0);
            this._raft.log.getEntriesAfter(0).then((entries) => {
                for (var i = 0; i < entries.length; i++) {
                    if (entries[i].command.service_id != null) {
                        var service = entries[i].command;
                        var serviceDistribution = {};
                        Object.keys(metrics).forEach((key) => {
                            serviceDistribution[key] = Math.round(service.replicas/capacityAvailable * (metrics[key].capacity - metrics[key].load));
                        });
                        loadDistribution.services[entries[i].command.service_id] = serviceDistribution;
                    }
                }
                if (verbose) console.log(`> RaftController load distribution table: ${JSON.stringify(loadDistribution)}`);
                this._loadLookupTable = loadDistribution.services;
                this._raft.message(LifeRaft.CHILD, loadDistribution);
                res({"status": "ok"});
            });
        });
    }

    RaftController.prototype.rpc = function (jsonData) {
        return new Promise((res, rej) => {
            this._raft.packet("rpc", jsonData).then((packet) => {
                if (verbose) console.log(`exec packet created this._raft: ${this._raft}`);
                if (verbose) console.log(`send RemoteProcedureCall type of message to all our followers`);
                this._raft.message(3/*1-leader,3-follower*/, packet);
                //this rpc call (packet type 'exec') might be used to invoke some commands without waiting acknowledgement;
                res({"status": "rpc ok!"});
            })
        });
    }

    RaftController.prototype.getDeployed = function (jsonData) {
        return new Promise((res, rej) => {
            this._raft.log.getLastEntry().then((data)=>{
                res(data);
            });
        });
    }

    RaftController.prototype.getNodesCount = function (data) {
        return new Promise((res, rej) => {
            res(this._raft.nodes.length);
        });
    }

    LifeRaft.prototype.initialize = function (options) {
        if (verbose) console.log(`> RaftController LifeRaft instance initialized with options: ${JSON.stringify(options)}`);
        this.log.getLastEntry().then((data)=>{
            if (verbose) console.log(`last raft log entry data: ${JSON.stringify(data)}`);
        });
    };

    return RaftController;
})();

exports = module.exports = RaftController;
