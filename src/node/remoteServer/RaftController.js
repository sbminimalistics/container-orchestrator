'use strict';

const LifeRaft = require('liferaft');
const request = require('request');
const Log = require('../../../node_modules/liferaft/log');
const objMap = require("../../utils/obj-update");

let RaftController = (function () {
    const verbose = false;

    function RaftController(host, port, clusterURL, capacity) {
        if (verbose) console.log(`>RaftController instantiate using host: ${host} port: ${port} clusterURL: ${clusterURL}`);
        this._host = host.toString();
        this._port = Number(port);
        this._clusterURL = clusterURL;
        this._capacity = capacity;
        this._connections = {};
        this._servicePromiseResolve = this._servicePromiseReject = null;

        this._raft = new LifeRaft(`${this._host}:${this._port}`, {
            "heartbeat": "1000 millisecond",
            "election min": "2000 millisecond",
            "election max": "6000 millisecond",
            "Log": Log,
            "path": `level_dbs/db_${this._port}`
        });

        this._raft.on("heartbeat", (data) => {
            if (verbose) console.log(`>RaftController ${this._host}:${this._port} heartbeat data: ${data}`);
        });
        this._raft.on("candidate", (data) => {
            if (verbose) console.log(`>RaftController ${this._host}:${this._port} candidate`);
        });
        this._raft.on("state change", (data) => {
            if (verbose) console.log(`>RaftController ${this._host}:${this._port} state change data: ${data}`);
        });
        this._raft.on("join", (data) => {
            if (verbose) console.log(`>RaftController ${this._host}:${this._port} join data: ${data}`);
        });
        this._raft.on("leave", (data) => {
            if (verbose) console.log(`>RaftController ${this._host}:${this._port} leave data: ${JSON.stringify(data)}`);
            this.redistributeLoad().then((data) => {
                console.log(`load redistribution success on ${this._host}:${this._port}`);
            }).catch((err) => {});
        });
        this._raft.on("leader change", (data) => {
            if (verbose) console.log(`>RaftController ${this._host}:${this._port} leader change data: ${data}`);
        });
        this._raft.on("leader", () => {
            if (true) console.log(`>RaftController ${this._host}:${this._port} became a leader; report this back to cluster through: ${this._clusterURL}/leader`);
            request.post(`${this._clusterURL}/leader`, {json: {host: this._host, port: this._port}}, (error, response, body) => {
                if (verbose) console.log("RaftController leader post return body:", body);
            });
            this.redistributeLoad().then((data) => {
                console.log(`load redistribution success on ${this._host}:${this._port}`);
            }).catch((err) => {});
        });
        this._raft.on("data", (data) => {
            if (verbose) console.log(`>RaftController on('data' @ ${this._host}:${this._port} dead-end data: ${JSON.stringify(data)}`);
        });
        this._raft.on("commit", (data) => {
            if (verbose) console.log(`>RaftController on('commit' @ ${this._host}:${this._port} majority instructed: ${JSON.stringify(data)}`);
            this._raft.log.getLastInfo().then((data)=>{
                if (verbose) console.log(`last message in the log on host: ${this._host} getLastEntry data: ${JSON.stringify(data)}`);
                //We wait for the LEADER to fire 'commit'.
                if (this._raft.state === 1) {
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
    }

    RaftController.prototype = {
        get host() {
            return this._host;
        },
        get port() {
            return this._port;
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
                "state": this.state
            };
        },
        get nodes() {
            return this._raft.nodes;
        },
        set connections(value) {
            objMap(this._connections, value);
            if (verbose) console.log(`>RaftController connections set ${JSON.stringify(this._connections)}`);
        },
        get connections() {
            return this._connections;
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

    RaftController.prototype.join = function (url) {
        if (verbose) console.log(`join on host: ${this._host} port: ${this._port}  target url: ${url}`);
        this._raft.join(url, (function(u, c){var url2=u; var check = c; return function(packet, callback){
            if (check(url2) === true) {
                request.post(`http://${url2}/data`, {json: packet}, (error, response, body) => {
                    if (verbose) console.log("RaftController post return body:", JSON.parse(body));
                    callback(error, error != null ? error : JSON.parse(body));
                });
            } else {
                callback(new Error("connection blocked in configuration"));
            }
        }})(url, this.checkConnection.bind(this)));
        return Promise.resolve("ok");
    }

    RaftController.prototype.leave = function (url) {
        if (verbose) console.log(`leave on host: ${this._host} port: ${this._port}  target url: ${url}`);
        this._raft.leave(url);
        delete this._connections[url];
        return Promise.resolve("ok");
    }

    RaftController.prototype.data = function (jsonData) {
        if (verbose) console.log(`RaftController dataIN on ${this._host}:${this._port} data: ${JSON.stringify(jsonData)}`);
        return new Promise((res, rej) => {
            this._raft.emit("data", jsonData, function(data){
                res(data);
            }.bind(this));
        });
    }

    RaftController.prototype.service = function (jsonData) {
        if (verbose) console.log(`RaftController service on ${this._host}:${this._port} data: ${JSON.stringify(jsonData)}`);
        return new Promise((res, rej) => {
            this._raft.command(jsonData).then(() => {
                //TO-DO: implement mechanism that allows to control follower nodes based on their current load;
                this._servicePromiseResolve = res;
                this._servicePromiseReject = rej;
            }).catch((err) => {
                if (verbose) console.log(`command err: ${err}`);
                rej(err);
            });
        });
    }

    RaftController.prototype.redistributeLoad = function () {
        if (this._raft.state !== 1) return Promise.reject("redistributeLoad canceled; not a leader");
        console.log(`RaftController redistributeLoad invoked on the leader running at: ${this._host}:${this._port}`);
        return new Promise((res, rej) => {
            //TO-DO: implement mechanism that re-calculates how many replicas to deploy on each node connected;
            res("ok");
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
        if (verbose) console.log(`RaftController LifeRaft instance initialized with options: ${JSON.stringify(options)}`);
        this.log.getLastEntry().then((data)=>{
            if (verbose) console.log(`last raft log entry data: ${JSON.stringify(data)}`);
        });
    };

    return RaftController;
})();

exports = module.exports = RaftController;
