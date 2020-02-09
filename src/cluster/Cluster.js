'use strict';

let Cluster = (function () {
    let verbose = false;
    function Cluster(id, ...nodes) {
        if (verbose) console.log(`>Cluster instantiate using id: ${id}`);
        let _id = id.toString();
        let _nodes = nodes;
        Object.defineProperty(this, "id", {
            get: function() {
                return _id;
            }
        });
        Object.defineProperty(this, "json", {
            get: function() {
                return {
                    "id": _id,
                    "nodes": _nodes.map((c) => c.json)
                };
            }
        });
        this.callForService = function () {
            if (verbose) console.log('>Cluster.callForService');
        };
    }
    return Cluster;
})();

exports = module.exports = Cluster;
