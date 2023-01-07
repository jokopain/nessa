
const bool = {
    typecastString(val){
        if(val === "true") return true;
        if(val === "false") return false;
        if(val === "null") return null;
        return val
    },
    isRequired(value) {
        return !(value === undefined || value === "")
    },
    isTrue(val){
        return val === true;
    },
    isFalse(val){
        return val === false;
    },
    isTruthy(val){
        return !!val === true;
    },
    isFalsy(val){
        return !!val === false; 
    }
}

module.exports = bool;