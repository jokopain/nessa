const _ = require("lodash");

exports.addRuleByAlias = (repo, rules, alias) => {
    let localRules = [...rules]
    const rule = repo.find(r => r.alias === alias);
    if(rule){
        const existRule = localRules.find(r => r.action === rule.action && r.entityName === rule.entityName);
        if(existRule){
            localRules = localRules.filter(r => r.alias !== existRule.alias)
            localRules.push({
                ..._.merge(rule, existRule),
                alias: `${existRule.alias}&&${rule.alias}`
            })
        } else {
            localRules.push(rule)
        }
    }
    return localRules;
}