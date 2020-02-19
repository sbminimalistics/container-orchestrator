function objMap(dest, src) {
    Object.keys(src).map((key) => {
        if (src[key] instanceof Object) {
            objMap(dest[key], src[key]);
        } else {
            dest[key] = src[key];
        }
    })
}

module.exports = objMap;
