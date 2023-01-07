const validator = require('validator');
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
 * @typedef { Pick<import("validator").default, Sanitizers> } OnlySanitizers
 */

/**
 * @type {OnlySanitizers}
 */
const stringSanitizers = {}

for (const key in validator) {
    if(!listOfSanitizers.includes(key)) continue;
    stringSanitizers[key] = validator[key]
}

module.exports = stringSanitizers;