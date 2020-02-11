'use strict';

const LifeRaft = require('liferaft');
const request = require('request');

let RaftController = (function () {
    let verbose = true;
    function RaftController(host, port) {
        if (verbose) console.log(`>RaftController instantiate using host: ${host} port: ${port}`);
        let _host = host.toString();
        let _port = Number(port);

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

        this.write = (url, packet, callback) => {
            if (verbose) console.log(`RaftController write on ${_host}:${_port} data packet: ${JSON.stringify(packet)}`);
            request.post(`http://${url}/data`, {json: packet}, (error, response, body) => {
                if (false) { //if (verbose) {
                    console.log("error:", error);
                    console.log("statusCode:", response && response.statusCode);
                    console.log("body:", body);
                }
                callback(null, body);
            });
        }

        this.join = function(url) {
            ///console.log(`join on host: ${host} port: ${port}  target url: ${url}`);
            _raft.join(url, (packet, callback) => {
                //${host} port: ${port}
                console.log(`=============call for WRITE on host: ${url}  target url: ${packet.address}`);
                this.write(packet.address, packet, callback);
            });
        }

        this.data = (jsonData) => {
            //if (verbose) console.log(`RaftController dataIN on ${_host}:${_port} data: ${JSON.stringify(jsonData)}`);
            return new Promise((res, rej) => {
                _raft.once("data", (data) => {
                    //console.log(`RaftController dataOUT on ${_host}:${_port} data: ${JSON.stringify(data)}`);
                    res(data);
                });
                _raft.emit("data", jsonData);
            });
        }

        LifeRaft.prototype.initialize = (options) => {
            console.log(`RaftController LifeRaft initialize options: ${JSON.stringify(options)}`);
        }

        const _raft = new LifeRaft(`${_host}:${_port}`, {
            "election min": "2 second",//'200 millisecond',
            "election max": "5 second",
            "write": (packet, callback) => {this.write(`${packet.address}`, packet, callback);}
        });

        _raft.on("heartbeat", (data) => {
            if (verbose) console.log(`>RaftController ${_host}:${_port} heartbeat`);
        })
        _raft.on("candidate", (data) => {
            if (verbose) console.log(`>RaftController ${_host}:${_port} candidate`);
        })
        _raft.on("state change", (data) => {
            if (verbose) console.log(`>RaftController ${_host}:${_port} state change data: ${data}`);
        })
    }
    return RaftController;
})();

exports = module.exports = RaftController;
