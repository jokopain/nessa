const obj = {
    isRequired(value) {
        return !(value === undefined || value === "")
    },
    isObject(val){
        return typeof val === "object"
    },
    isHasProp(val, prop){
        return prop in val
    },
    isPropEqual(val, options){
        return val[options.prop] === options.value
    },
    prop(val, validator, key){
        if(Array.isArray(validator)){
            const results = []
            for (const v of validator) {
                const status = v(val[key])
                results.push({result: status.result, msg: `${key}.${status.msg}`})
            }
            return results
        }
        return validator(val[key])
    },
    parseJSON(val, defaultValue = {}){
        try {
            const parsed = JSON.parse(val)
            return parsed
        } catch (error) {
            return defaultValue
        }
    }
}

module.exports = obj