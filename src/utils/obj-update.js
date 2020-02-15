function objMap(dest, src) {
    Object.keys(src).map((key) => {
        if (src[key] instanceof Object) {
            objMap(src[key], dest[key]);
        } else {
            dest[key] = src[key];
        }
    })
}

module.exports = objMap;