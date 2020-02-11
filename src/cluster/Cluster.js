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

        //make initial connections between nodes
        //for (let i = 1; i < _nodes.length; i++) {
        for (let i = 0; i < _nodes.length; i++) {
            //for (let j = 0; j < _nodes.length; j++) {
                console.log(`call join`);
                if (i != 0) {
                    //_nodes[i].join(_nodes[j].address);
                    _nodes[0].join(_nodes[i].address);
                }
            //}
        }
        //_nodes[0].join(_nodes[1].address);
        //_nodes[0].join(_nodes[2].address);
    }
    return Cluster;
})();

exports = module.exports = Cluster;
