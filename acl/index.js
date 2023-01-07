const EntityBuilder = require("./EntityBuilder");
const Can = require("./Can");
const Repo = require("./Repo");
const _ = require("lodash");
const {addRuleByAlias} = require("./utils")

class ACL {
    roles = [];
    entities = {};
    pathToRole = null;
    repo = [];
    rules = {};
    errorTemplate = (error) => ({message: error})
    _event_on_req = (req, res, aclInstance) => aclInstance; 
    constructor(options){
        this.roles = options.roles;
        this.entities = options.entities;
        this.pathToRole = options.pathToRole;
        this.errorTemplate = options.errorTemplate || this.errorTemplate;
        this.init();
    }

    init(){
        for (const role of this.roles) {
            this.rules[role] = [];
        }
        for (const entity of this.entities) {
            this.repo = [...this.repo, ...entity.repo.map(r => ({...r, entityName: entity.name}))];
            for (const role in entity.rules) {
                this.rules[role] = [
                    ...this.rules[role],
                    ...entity.rules[role].map(r => ({...r, entityName: entity.name}))
                ]
            }
        }
        return this;
    }

    static actions = {
        ADD: "add",
        EDIT: "edit",
        REMOVE: "remove", 
        FIND: "find",
        FIND_ONE: "findOne",
        FIELDS_VIEW: "field_view",
        FIELDS_EDIT: "field_edit",
    }

    /**
     * 
     * @param {object} options 
     * @param {string} options.name
     * @param {string[]} options.fields
     * @param {array<string | Symbol>} options.actions
     * @returns {EntityBuilder}
     */
    static entityBuilder(options){
        return new EntityBuilder(options)
    }

    static createRepository(){
        return new Repo()
    }

    can(role, entity, action){
        const rule = this.rules[role].find(r => r.entityName === entity && r.action === action);
        if(rule){
            console.log(role, entity, action, "allowed");
            return new Can(rule)
        } else {
            console.log(role, entity, action, "not-allowed");
            return false
        }
    }

    addRuleByAlias(role, alias){
        this.rules[role] = addRuleByAlias(this.repo, this.rules[role], alias)
        return this;
    }

    onRequest(cb){
        this._event_on_req = cb;
        return this;
    }

    omitNotAvailableFields(entity, action, role, data){
        const rule = this.rules[role].find(r => r.entityName === entity && r.action === action );
        let result = {}
        for (const filedName in rule.fields) {
            if(_.has(data, filedName) && rule.fields[filedName].includes("field_edit")){
                result = _.set(result, filedName, _.get(data, filedName))
            }
        }
        return result;
    }

    clone(){
        const cloned = new ACL({
            roles: this.roles,
            entities: this.entities,
            pathToRole: this.pathToRole,
        })
        cloned.repo = _.cloneDeep(this.repo);
        // cloned.rules = _.cloneDeep(this.rules);
        cloned.onRequest(this._event_on_req)
        cloned.errorTemplate = this.errorTemplate
        cloned.init()
        return cloned
    }

    getRoleGrants(role){
        const rules = this.rules[role];
        const result = []
        
        for (const rule of rules) {
            const formattedRule = {
                entity: rule.entityName,
                action: rule.action
            }
            if(["edit", "add", "findOne"].includes(rule.action)){
                formattedRule.fields = rule.fields
            }
            result.push(formattedRule)    
        }

        return result;
    }
}

module.exports = ACL;