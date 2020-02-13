'use strict';

const LifeRaft = require('liferaft');
const request = require('request');

let RaftController = (function () {
    let verbose = false;
    let write = (url, packet, callback) => {
        request.post(`http://${url}/data`, {json: packet}, (error, response, body) => {
            if (verbose) {
                console.log("RaftController post return body:", body);
            }
            callback(null, body);
        });
    }

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

        this.join = function(url) {
            if (verbose) console.log(`join on host: ${host} port: ${port}  target url: ${url}`);
            _raft.join(url, (function(u){var url2=u; return function(packet, callback){
                request.post(`http://${url2}/data`, {json: packet}, (error, response, body) => {
                    if (verbose) console.log("RaftController ------------> post return body:", JSON.parse(body));
                    callback(null, JSON.parse(body));
                });
            }})(url));
            return Promise.resolve("ok");
        }

        this.data = (jsonData) => {
            if (verbose) console.log(`RaftController dataIN on ${_host}:${_port} data: ${JSON.stringify(jsonData)}`);
            return new Promise((res, rej) => {
                _raft.emit("data", jsonData, function(data){
                    res(data);
                }.bind(this));
            });
        }

        LifeRaft.prototype.initialize = (options) => {
            if (verbose) console.log(`RaftController LifeRaft instance initialized with options: ${JSON.stringify(options)}`);
        }

        const _raft = new LifeRaft(`${_host}:${_port}`, {
            "heartbeat": "1000 millisecond",
            "election min": "3000 millisecond",//'200 millisecond',
            "election max": "6000 millisecond"
        });

        _raft.on("heartbeat", (data) => {
            if (verbose) console.log(`>RaftController ${_host}:${_port} ++++++++++++++++++ heartbeat data: ${data}`);
        })
        _raft.on("candidate", (data) => {
            if (verbose) console.log(`>RaftController ${_host}:${_port} candidate`);
        })
        _raft.on("state change", (data) => {
            if (verbose) console.log(`>RaftController ${_host}:${_port} state change data: ${data}`);
        })
        _raft.on("join", (data) => {
            if (verbose) console.log(`>RaftController ${_host}:${_port} join data: ${data}`);
        })
        _raft.on("leader change", (data) => {
            if (verbose) console.log(`>RaftController ${_host}:${_port} leader change data: ${data}`);
        })
        _raft.on("data", (data) => {
            if (true) console.log(`>RaftController on('data' @ ${_host}:${_port} dead-end data: ${JSON.stringify(data)}`);
        })
    }
    return RaftController;
})();

exports = module.exports = RaftController;
