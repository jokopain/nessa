class Repo {
    repo = [];
    constructor(){}

    /**
     * 
     * @param {object} options 
     * @param {string} options.alias 
     * @param {object | Symbol} options.actions 
     * @param {object<[key: string]: array<string | Symbol>>} [options.field = {}] 
     * @returns {Repo}
     */
    createRule(options){
        this.repo.push(options)
        return this;
    }

}

module.exports = Repo;