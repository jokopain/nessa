
/**
 * @typedef {object} NumberSanitizers
 * @prop {Function<(value: any) => boolean>} isNum
 */

/**
 * @type {NumberSanitizers}
 */
const number = {
    toInt(val, radix = 10){
        if(typeof val === "number") return val
        return parseInt(val, radix)
    }
}

module.exports = number;