const stringValidators = require("./string");
const boolValidators = require("./bool");
const numberValidators = require("./number");
const arrValidators = require("./arr");
const objValidators = require("./obj");






const operatorBuilders = {
    if(field, conditionFn){
        return {
            $$type: "if",
            field,
            conditionFn,
            thenValidators: [],
            elseValidators: [],
            then(validators = []){
                this.thenValidators = validators
                return this
            },
            else(validators = []){
                this.elseValidators = validators
                return this
            }
        }
    }
}


const validator = {
    string: stringValidators,
    number: numberValidators,
    bool: boolValidators,
    array: arrValidators,
    object: objValidators,
    ...operatorBuilders
}

for (const key in validator) {
    if(key === "if") continue;
    for (const validatorName in validator[key]) {
        const valid = validator[key][validatorName]
        validator[key][validatorName] = (msg = validatorName, options = null) => {
            return (value) => {
                const isValid = valid(value, options, msg);
                if(typeof isValid === "object" && "result" in isValid && "msg" in isValid){
                    return isValid
                } else if (Array.isArray(isValid)){
                    return isValid
                }
                return {result: isValid, msg}
            }
        }
    }
}

exports.Validators = validator;