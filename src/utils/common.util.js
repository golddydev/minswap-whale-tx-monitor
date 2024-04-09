const { default: Decimal } = require("decimal.js");

const convertHexCodeToString = (hex) => {
    try {
        let array = [];
        if (!(hex && hex?.length > 0)) {
            return undefined;
        }
        for (let i = 0; i < hex.length; i += 2) {
            array.push(String.fromCharCode('0x' + hex[i] + hex[i + 1]));
        }
        return array.join('');
    } catch (err) {
        return undefined;
    }
}

module.exports = {
    convertHexCodeToString,
}