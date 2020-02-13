'use strict';

const LifeRaft = require('liferaft');
const request = require('request');

let RaftController = (function () {
    let verbose = true;
    let write = (url, packet, callback) => {
        request.post(`http://${url}/data`, {json: packet}, (error, response, body) => {
            if (verbose) {
                //console.log("error:", error);
                //console.log("statusCode:", response.statusCode);
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
                    callback(null, body);
                });
            }})(url));
            return Promise.resolve("ok");
            /*
            return new Promise((res, rej) => {
                let n = _raft.join(url, function(packet, callback){
                    if (verbose) console.log(`RaftController 'join' write ${host}:${port} -> ${url} packet: ${JSON.stringify(packet)}`);
                    write(url, packet, callback);
                }.bind(this));
                //console.log(n);
                res(n);
            });
            */
        }

        this.data = (jsonData) => {
            if (verbose) console.log(`RaftController dataIN on ${_host}:${_port} data: ${JSON.stringify(jsonData)}`);
            return new Promise((res, rej) => {
                _raft.emit("data", jsonData, function(data){
                    //.write(data);
                    //console.log(`RaftController callback after "data" emit data: ${JSON.stringify(data)}`);
                    //console.log(`RaftController callback after "data" emit _raft: ${_raft.nodes} _raft.nodes.length: ${_raft.nodes.length}`);
                    //for(var i=0; i<_raft.nodes.length; i++) {
                        //console.log(`_raft.address: ${_raft.address} _raft.nodes[i].address: ${_raft.nodes[i].address}`);
                        //write(_raft.nodes[i].address, data, (err, data2)=>{console.log(`nested callback with data: ${data}`)})
                    //}
                    res(data);
                  }.bind(this));
                /*
                _raft.emit("data", jsonData, function (packet, callback) {
                    if (verbose) console.log(`RaftController 'data' write ${host}:${port} -> ${jsonData.address} packet: ${JSON.stringify(packet)}`);
                    res(packet);
                }.bind(this));
                */
            });
        }

        LifeRaft.prototype.initialize = (options) => {
            if (verbose) console.log(`RaftController LifeRaft instance initialized with options: ${JSON.stringify(options)}`);
        }

        const _raft = new LifeRaft(`${_host}:${_port}`, {
            "heartbeat": "500 millisecond",
            "election min": "1500 millisecond",//'200 millisecond',
            "election max": "3000 millisecond"
            //"threshold": "8 s"
            //"write": (packet, callback) => {this.write(`${packet.address}`, packet, callback);}
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
            if (true) console.log(`>RaftController ${_host}:${_port} leader change data: ${data}`);
        })
        _raft.on("data", (data) => {
            console.log(`>RaftController on('data' dead-end`);
            /*
            if (true) console.log(`>RaftController ${_host}:${_port} ++++ data ++++ data: ${JSON.stringify(data)}`);
            if (data) {
                write(data.address, data, (err, data) => {
                    console.log(`on 'data' write callback err:${err} data:${data}`);
                    _raft.emit("data", data);
                })
            } else {
                console.log("no data.. stop the chain!");
            }
            */
        })
    }
    return RaftController;
})();

exports = module.exports = RaftController;
