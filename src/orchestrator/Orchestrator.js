'use strict';

let Orchestrator = function () {
    let verbose = false;
    function Orchestrator(id) {
        if (verbose) console.log(`>Orchestrator instantiate using id: ${id}`);
        let _clusters = [];
        let _id = id;

        Object.defineProperty(this, "id", {
            get: function() {
                return _id;
            }
        });
        Object.defineProperty(this, "clusters", {
            get: function() {
                return {
                    "metadata": {
                        count: _clusters.length
                    },
                    "results": _clusters.map((c) => c.json)
                };
            }
        });

        this.findCluster = function (id) {
            if (verbose) console.log(`>Orchestrator.findCluster id:${id}`);
            let res;
            _clusters.forEach((cluster) => {
                if (cluster.id === id) {
                    return res = cluster.json;
                }
            })
            return res;
        };

        this.addCluster = function (cluster) {
            if (verbose) console.log(`>Orchestrator.addCluster`);
            if (cluster.id != null) {
                if (this.findCluster(cluster.getId) == null) {
                    _clusters.push(cluster);
                }
            }
            if (verbose) console.log(`>Orchestrator.addCluster total clusters: ${_clusters.length}`);
        };
    }

    return Orchestrator;
}();

exports = module.exports = new Orchestrator(0);
