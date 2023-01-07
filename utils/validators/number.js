
/**
 * @typedef {object} NumberValidators
 * @prop {Function<(value: any) => boolean>} isNum
 * @prop {Function<(value: any) => boolean>} min
 * @prop {Function<(value: any) => boolean>} max
 * @prop {Function<(value: string | number, radix?: number) => number>} toInt
 * @prop {Function<(value: any) => boolean>} isRequired
 */

/**
 * @type {NumberValidators}
 */
const number = {
    toInt(val, radix = 1){
        if(typeof val === "number") return val
        return parseInt(val, radix)
    },
    isNum(val){
        if(typeof val !== "number" || isNaN(val)) return false;
        return true
    },
    min(val, min){
        if(min && val < min) return false;
        return true
    },
    max(val, max){
        if(max && val > max) return false;
        return true
    },
    isRequired(value) {
        return !(value === undefined || value === "" || isNaN(value))
    },
}

module.exports = number;