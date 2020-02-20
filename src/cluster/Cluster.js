'use strict';

let Cluster = (function () {
    const verbose = false;
    const request = require('request');
    const objMap = require("../utils/obj-update");
    /*
        https://www.npmjs.com/package/uuid is a dependency that generates
        Universally Unique IDentifier (UUID)
        https://www.ietf.org/rfc/rfc4122.txt
        We will be using v1 (time-based version) of the standard
    */
    const uuidv1 = require('uuid/v1');

    function Cluster(id, ...nodes) {
        if (verbose) console.log(`>Cluster instantiate using id: ${id}`);
        this._id = id.toString();
        this._nodes = nodes;
        this._connections = {};
        this._pendingServices = [];
        this._serviceInSpread;
        this._spreadServices = [];
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
    }

    Cluster.prototype = {
        get id() {
            return this._id;
        },
        get json() {
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
        },
        get connections() {
            return this._connections;
        },
        set connections(val) {
            objMap(this._connections, val);
        },
        get leader() {
            return this._leader;
        },
        set leader(val) {
            this._leader = val;
            this.executeNextService();
        },
        get lastServiceCall() {
            console.log(`lastServiceCall: ${JSON.stringify(this._lastServiceCall)}`);
            return this._pendingServices.length > 0 ? this._services[0] : {};
        }
    }

    /*
        CallForService is invoked from REST router's /service POST endpoint.
        ServiceData is a json object with the following structure:
        {
            "container": {
                "uniq_id": 0,
                "label": "modified description"
            },
            "replicas": 99
        }
    */
    Cluster.prototype.callForService = function (serviceData) {
        if (verbose) console.log(`>Cluster.callForService req data: ${JSON.stringify(serviceData)} leader: ${JSON.stringify(this._leader)}`);
        var targetService = this.checkIfServiceForTheSameContainerExists(serviceData);
        if (targetService === null) {
            serviceData.status = Cluster.serviceStates.PENDING;
            serviceData.service_id = uuidv1();
            console.log(`about to unshift ${JSON.stringify(serviceData)} into this._pendingServices: ${JSON.stringify(this._pendingServices)}`);
            this._pendingServices.unshift(serviceData);
            targetService = serviceData;
        }
        if (this._leader != null) {
            this.executeNextService();
        }
        return targetService;
    };

    /*
        Check if there is a pending service dedicated to the same container.
        If that is the case, we will only update the definition of the container
        and the number of replicas service aims to deploy.
    */
    Cluster.prototype.checkIfServiceForTheSameContainerExists = function (serviceData) {
        console.log(`>Cluster.checkIfServiceForTheSameContainerExists this._pendingServices: ${JSON.stringify(this._pendingServices)}`);
        if (verbose) console.log(`>Cluster.checkIfServiceForTheSameContainerExists req data: ${JSON.stringify(serviceData)}`);
        for (var i = 0; i < this._pendingServices.length; i++) {
            if (this._pendingServices[i].container.uniq_id == serviceData.container.uniq_id) {
                if (this._pendingServices[i].status == Cluster.serviceStates.PENDING) {
                    objMap(this._pendingServices[i], serviceData);
                    return this._pendingServices[i];
                }
            }
        }
        return null;
    }

    /*
        executeNextService is called every time the previous service is finished.
        It is also invoked when new leader reports itself to this Cluster class.
    */
    Cluster.prototype.executeNextService = function () {
        if (verbose) console.log(`executeNextService this._serviceInSpread != null: ${this._serviceInSpread != null} this._pendingServices.length: ${this._pendingServices.length}`);
        //stop proceeding if there is a service already in execution;
        if (this._serviceInSpread != null) return false;
        //stop proceeding if there is no service pending;
        if (this._pendingServices.length == 0) return false;

        this._serviceInSpread = this._pendingServices.pop();
        this._serviceInSpread.status = Cluster.serviceStates.SPREADING;
        request.post(`http://${this._leader.host}:${this._leader.port}/service`, {json: this._serviceInSpread}, (error, response, body) => {
            if (error) {
                console.log(`reattempt the same service call`);
            } else if (response != null) {
                console.log(`service successfully sent to the LEADER of this cluster; response body: ${JSON.stringify(body)}`);
            }
            this._serviceInSpread.status = Cluster.serviceStates.EXECUTED;
            this._spreadServices.push(this._serviceInSpread);
            this._serviceInSpread = null;
            if (verbose) console.log(`>Cluster.callForService forwarded to http://${this._leader.host}:${this._leader.port}/service returned body: ${body}`);
        });
    }

    Cluster.prototype.addNode = function (data) {
        if (verbose) console.log(`>Cluster.addNodes req data: ${JSON.stringify(data)}`);
        //TO-DO: implement functionality that allows to add a new node and join it to already existing ones.
    };

    Cluster.serviceStates = {
        PENDING: "spreading pending",
        SPREADING: "spreading",
        EXECUTED: "executed",
    }

    return Cluster;
})();

exports = module.exports = Cluster;
