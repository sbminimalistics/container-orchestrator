'use strict';

let Cluster = (function () {
    let verbose = false;
    function Cluster(id) {
        if (verbose) console.log(`>Cluster instantiate using id: ${id}`);
        let _id = id.toString();
        Object.defineProperty(this, "id", {
            get: function() {
                return _id;
            }
        });
        Object.defineProperty(this, "json", {
            get: function() {
                return {
                    "id": _id,
                    "nodes": []
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
