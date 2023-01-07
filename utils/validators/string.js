const _stringValidator = require('validator');
const listOfSanitizers = require("../list-of-sanitizers")
/**
 * @typedef {object} CustomValidators
 * @prop {Function<(value: any) => boolean>} isRequired
 * @prop {Function<(value: string, arr: string[]) => boolean>} isOneOf
 */


/**
 * @typedef {"blacklist" | "escape" | "ltrim" | "normalizeEmail" | "rtrim" | "stripLow" | "toBoolean" | "toDate" | "toFloat" | "toInt" | "trim" | "unescape" | "whitelist"} Sanitizers
 */

/**
 * @typedef { Omit<import("validator").default, Sanitizers> } OnlyValidators
 */

/**
 * @type {OnlyValidators & CustomValidators}
 */
const validators = {
    isRequired(value) {
        return !(value === undefined || value === "" || typeof value !== "string" || value === "undefined")
    },
    isOneOf(val, arr) {
        return arr.includes(val)
    }
}

const stringValidator ={}
for (const key in _stringValidator) {
    stringValidator[key] = (val, options = undefined) => {
        return _stringValidator[key](val || "", options || undefined)
    }
}

for (const key in stringValidator) {
    if(listOfSanitizers.includes(key)) continue;
    // const valid = stringValidator[key]
    validators[key] =  stringValidator[key]
}

module.exports = validators;