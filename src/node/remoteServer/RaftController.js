'use strict';

const LifeRaft = require('liferaft');
const request = require('request');

let RaftController = (function () {
    let verbose = false;
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
            _raft.join(url);
        }

        LifeRaft.prototype.write = (packet, callback) => {
            _raft.nodes.forEach((node) => {
                console.log(`RaftController write data packet: ${JSON.stringify(packet)}`);
                request.post(`http://${node.address}/data`, JSON.stringify(packet), (error, response, body) => {
                    if (verbose) {
                        console.log('error:', error);
                        console.log('statusCode:', response && response.statusCode);
                        console.log('body:', body);
                    }
                    callback(null, body);
                });
            });
        }
        LifeRaft.prototype.data = (packet) => {
            console.log(`data packet: ${packet}`);
            _raft.emit("data", packet);
        }
        LifeRaft.prototype.initialize = (options) => {
            console.log(`RaftController LifeRaft initialize options: ${JSON.stringify(options)}`);
        }

        const _raft = new LifeRaft(`${_host}:${_port}`, {
            "election min": "3 second",//'200 millisecond',
            "election max": "10 second"
        });
        _raft.on("heartbeat", (data) => {
            if (verbose) console.log(`>RaftController heartbeat`);
        })
        _raft.on("candidate", (data) => {
            if (verbose) console.log(`>RaftController candidate`);
        })
    }
    return RaftController;
})();

exports = module.exports = RaftController;
