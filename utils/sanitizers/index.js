const stringSanitizers = require("./string");
const boolSanitizers = require("./bool");
const numberSanitizers = require("./number");
const arrSanitizers = require("./arr");
const objSanitizers = require("./obj");


const sanitizers = {
    string: stringSanitizers,
    number: numberSanitizers,
    bool: boolSanitizers,
    array: arrSanitizers,
    object: objSanitizers,
}

for (const type in sanitizers) {
    for (const sanitizerName in sanitizers[type]) {
        const sanitize = sanitizers[type][sanitizerName]
        sanitizers[type][sanitizerName] = (options = undefined) => value => sanitize(value, options)
    }
}

exports.Sanitizers = sanitizers;