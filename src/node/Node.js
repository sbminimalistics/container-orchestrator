'use strict';

let Node = (function () {
    let verbose = true;
    function Node(id) {
        if (verbose) console.log(`>Node instantiate using id: ${id}`);
        let _id = id.toString();
        /*
        Object.defineProperty(this, "id", {
            get: function() {
                return _id;
            }
        });
        this.callForService = function () {
            if (verbose) console.log('>Node.callForService');
        };
        */
    }
    return Node;
})();

exports = module.exports = Node;
