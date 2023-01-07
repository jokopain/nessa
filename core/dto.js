const _ = require("lodash")
class DTO {
    #fieldsToValidate = {};
    /** @type {{[key: string]: function[]}} */
    #fieldsSanitizers = {};

    /**
     * @name registerValidators
     * @param {keyof this} key  
     * @param {() => boolean | [() => boolean, string]} validators 
     * @returns {this}
     */
    registerValidators(key, validators){
        this.#fieldsToValidate[key] = validators;
        return this;
    }

    addSanitizers(key, sanitizers){
        this.#fieldsSanitizers[key] = sanitizers;
        return this;
    }

    sanitize(){
        for (const key in this) {
            if(key in this.#fieldsSanitizers){
                if(Array.isArray(this.#fieldsSanitizers[key])){
                    for ( const sanitizer of this.#fieldsSanitizers[key]) {
                        let sanitized = sanitizer(this[key])
                        if(typeof sanitized === "function"){
                            sanitized = sanitizer(undefined)(this[key])
                        }
                        this[key] = sanitized
                    }
                }
            }
        }
        return this;
    }

    #prepareNested(){
        for (const key in this) {
            if(this[key] instanceof DTO){
                this.#fieldsToValidate[key] = [];
            }
        }
    }

    #prepareConditional(){
        for (const key in this.#fieldsToValidate) {
            if("$$type" in this.#fieldsToValidate[key]){
                const cond = this.#fieldsToValidate[key]
                switch (cond.$$type) {
                    case "if":
                        const status = cond.conditionFn(this[cond.field])
                        if(status) this.#fieldsToValidate[key] = cond.thenValidators;
                        else this.#fieldsToValidate[key] = cond.elseValidators;
                        continue;
                }
            }
        }
    }

    /**
     * @name validate
     * @param {"all" | "first"} strategy
     * @returns {Promise<{status: boolean, errors: string[]}>}
     */
    async validate(strategy = "all"){
        this.#prepareNested()
        this.#prepareConditional()
        const result = {
            status: true,
            errors: []
        }
        for (const key in this.#fieldsToValidate) {
            if(this[key] instanceof DTO){
                let nestedStatus = this[key].validate(strategy);
                if(nestedStatus instanceof Promise) {
                    nestedStatus = await nestedStatus
                }
                if(!nestedStatus.status){
                    result.status = false;
                    result.errors = [...result.errors, ...nestedStatus.errors.map(e => `${key}.${e}`)]
                    if(strategy === "first"){
                        return result
                    }
                }
                continue;
            }
            for (const validator of this.#fieldsToValidate[key]) {
                try {
                    let status = validator(this[key])
                    if(status instanceof Promise) {
                        status = await status
                    }
                    if(Array.isArray(status)){
                        for (const s of status) {
                            if(!s.result){
                                result.status = false;
                                result.errors.push(`${key}.${s.msg}`)
                                if(strategy === "first"){
                                    return result
                                }
                            }
                        }
                    } else {
                        if(!status.result){
                            result.status = false;
                            result.errors.push(`${key}.${status.msg}`)
                            if(strategy === "first"){
                                return result
                            }
                        }
                    }
                    
                } catch (error) {
                    console.log(error);
                }
            }
        }
        return result
    }

    set(key, value){
        const setterName = `set${_.capitalize(key)}`;
        let val = value;
        if(setterName in this && typeof this[setterName] === "function"){
            val = this[setterName].call(this, val);
        }
        this[key] = val;
    }

    /**
     * @name fill
     * @param {Object<any>} data - data to fill
     * @returns {this}
     */
    fill(data){
        for (const key in this) {
            if(this[key] instanceof DTO){
                this[key] = this[key].fill(key in data ? data[key] : {})
                continue
            }
            if(key in data){
                this.set(key, data[key])
            }
        }
        return this;
    }
}

exports.DTO = DTO