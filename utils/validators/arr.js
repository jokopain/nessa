
const arr = {
    isRequired(value) {
        return !(value === undefined || value === "" || !Array.isArray(value))
    },
    ofType(value = [], type){
        const incorrect = value.filter(v => typeof v !== type)
        if(incorrect && incorrect.length){
            return false
        }
        return true;
    }
}

module.exports = arr