
const arr = {
    parseJSON(val, defaultValue = []){
        try {
            const parsed = JSON.parse(val)
            return parsed
        } catch (error) {
            return defaultValue
        }
    }
}

module.exports = arr