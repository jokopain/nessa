
const bool = {
    typecastString(val){
        if(val === "true") return true;
        if(val === "false") return false;
        if(val === "null") return null;
        return val
    }
}

module.exports = bool;