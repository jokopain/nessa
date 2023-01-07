const _ = require("lodash");

class Can {
    entity = "";
    action = "";
    role = "";
    fields = {};
    withFields = false;
    constructor(rule){
        this.entity = rule.entity;
        this.action = rule.action;
        this.role = rule.role;
        this.fields = rule?.fields || this.fields;
        if(this.fields && Object.keys(this.fields).length){
            this.withFields = true;
        }
    }

    checkFields(obj, options){
        const {mode = "sanitize"} = options;
        const result = {};
        const fieldKeys = Object.keys(this.fields)
        for (const key of fieldKeys) {
            const isFiledExist = _.has(obj, key);
            if(isFiledExist && this.fields[key].includes("field_edit")){
                result[key] = _.get(obj, key)
            } else {
                if(mode === "error"){
                    throw new Error(key)
                }
            }
        }
        return result;
    }
}


module.exports = Can;