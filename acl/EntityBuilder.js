const {addRuleByAlias} = require("./utils")

class EntityBuilder {
    name = "";
    fields = [];
    actions = [];
    repo = [];
    rules = {};
    constructor(options){
        this.name = options.name;
        this.fields = options?.fields || [];
        this.actions = options.actions;
        this.repo = options?.repository?.repo || [];
    }


    /**
     * 
     * @param {object} options 
     * @param {string} options.alias 
     * @param {object | Symbol} options.actions 
     * @param {object<[key: string]: array<string | Symbol>>} [options.field = {}] 
     * @returns 
     */
    createRule(options){
        this.repo.push(options)
        return this;
    }


    /**
     * 
     * @param {string} role 
     * @param {string[]} rules 
     */
    grant(role, rules){
        if(!(role in this.rules) || !Array.isArray(this.rules[role])) this.rules[role] = [];
        for (const ruleToAdd of rules) {
            this.rules[role] = addRuleByAlias(this.repo, this.rules[role], ruleToAdd)
        }
        return this;
    }


}


module.exports = EntityBuilder;