const fileSizeParser = require('filesize-parser');
const _ = require("lodash");
const path = require("path");
const {DTO} = require("./dto")
const {RequestData} = require("./request-data");

/**
 * @typedef {object} ValidationStrategy
 * @prop {"none" | "all" | "first"} [validationStrategy="all"]
 */

class ControllerFactory {
    redirect = false;
    #ghost = false;
    #endpoints = [];
    #protection = {
        enabled: false,
        rule: null
    };
    data = {};
    #mws = [];
    #MW_PRIORITIES = {
        "CRITICAL": 0,
        "HIGH": 1,
        "MEDIUM": 2,
        "LOW": 3
    }
    constructor(){}


    #mw_main(req, res, next){
        if(!req["nessa:data"]){
            req["nessa:data"] = new RequestData(req, res, next)
        }
        next()
    }

    getInfo(){
        return {
            mw: [{mw: this.#mw_main}, ...this.#mws.sort((a,b) => a.priority - b.priority)],
            endpoints: this.#endpoints,
            ghost: this.#ghost
        }
    }

    /**
     * @param {string | null} rule
     * @returns {this} 
     */
    Protected(rule = null, options = {in: "body", mode: "slice"}){
        this.#protection.enabled = true;
        this.#protection.rule = rule;
        this.#mws.push({priority: this.#MW_PRIORITIES.CRITICAL, mw: this.#mw_isAuth});
        if(rule){
            this.#mws.push({priority: this.#MW_PRIORITIES.HIGH, mw: this.#mw_aclCheck(rule, options)});
        }
        return this;
    }

    /**
     * @param {string} path 
     * @return {this}
     */
    Get(path){
        this.#endpoints.push({
            path, method: "get"
        })
        return this;
    }

    /**
     * @param {string} path 
     * @return {this}
     */
    Post(path){
        this.#endpoints.push({
            path, method: "post"
        })
        return this;
    }

    /**
     * @param {string} path 
     * @return {this}
     */
    Patch(path){
        this.#endpoints.push({
            path, method: "patch"
        })
        return this;
    }

    /**
     * @param {string} path 
     * @return {this}
     */
    Delete(path){
        this.#endpoints.push({
            path, method: "delete"
        })
        return this;
    }
 
    /**
     * @template P
     * @template {string} K
     * @param {K} name 
     * @param {{dto: new() => P} & ValidationStrategy} options
     * @returns {this & {data: Record<K, P>}}}
     */
    Params(name, options){
        this.#mws.push({priority: this.#MW_PRIORITIES.MEDIUM, mw: this.#mw_applyDto("params", name, options.dto)})
        this.#mws.push({priority: this.#MW_PRIORITIES.LOW, mw: this.#mw_applyValidation(name, options?.validationStrategy || "all")})
        return this;
    }

    

    /**
     * @template Q
     * @template {string} K
     * @param {K} name 
     * @param {{dto: new() => Q} & ValidationStrategy} options
     * @returns {this & {data: Record<K, Q>}}}
     */
    Query(name, options){
        this.#mws.push({priority: this.#MW_PRIORITIES.MEDIUM, mw: this.#mw_applyDto("query", name, options.dto)})
        this.#mws.push({priority: this.#MW_PRIORITIES.LOW, mw: this.#mw_applyValidation(name, options?.validationStrategy || "all")})
        return this;
    }

    /**
     * @template B
     * @template {string} K
     * @param {K} name 
     * @param {{dto: new() => B} & ValidationStrategy} options
     * @returns {this & {data: Record<K, B>}}}
     */
    Body(name, options){
        this.#mws.push({priority: this.#MW_PRIORITIES.MEDIUM, mw: this.#mw_applyDto("body", name, options.dto)})
        this.#mws.push({priority: this.#MW_PRIORITIES.LOW, mw: this.#mw_applyValidation(name, options?.validationStrategy || "all")})
        return this;
    }

    /**
     * @template {string} K
     * @param {K} name
     * @param {{accept: string[], maxSize: string, required: boolean}} [options={accept: [], maxSize: "0", required: false}]
     * @returns {this & {data: Record<K, import("express-fileupload").UploadedFile>}}
     */
    File(name, options = {accept: [], maxSize: "0", required: false}){
        this.#mws.push({priority: this.#MW_PRIORITIES.LOW, mw: this.#mw_readFiles(name, options)})
        return this;
    }

    /**
     * 
     * @param {string} to
     * @param {{internal: boolean}} [options={internal: true}] 
     */
    Redirect(to, options = {internal: true}){
        this.redirect = {to, options};
        // this.#mws.push({priority: this.#MW_PRIORITIES.LOW, mw: this.#mw_redirect(to)})
        return this;
    }

    /**
     * @template C
     * @param {C} controller 
     * @param {keyof C} method 
     * @param {{mwStrategy: "child-first" | "parent-first" | (mw: object) => Array<Function>}} options
     */
    Ghost(controller, method, options = {mwStrategy: "child-first"}){
        this.#ghost = {controller, method, options};
        return this;
    }

    /**
     * @template M
     * @param {new() => M} mw 
     * @param {keyof M} name
     * @param {{priority?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW", args?: Object<any>}} [options = {priority: "LOW", args: null}]
     * @returns {this}
     */
    mw(mw, name, options = {priority: "LOW", args: {}}){
        this.#mws.push({
            priority: options.priority && options.priority in this.#MW_PRIORITIES ? this.#MW_PRIORITIES[options.priority] : this.#MW_PRIORITIES.LOW, 
            mw: mw,
            name, 
            args: options.args
        })
        return this;
    }
    
    async #mw_isAuth(req, res, next){
        const authMW = req.app.get("nessa:auth-mw");
        if(authMW){
            return await authMW(req, res, next)
        }
        next();
    }

    #mw_applyDto(place, key, dto){
        return (req, res, next) => {
            const data = req[place];
            const createdDto = new dto();
            createdDto.fill(data)
            req["nessa:data"].data[key] = createdDto;
            // this.data[key] = createdDto;
            next();
        }
    }

    #mw_applyValidation(place, strategy){
        if(strategy === "none") return (req, res, next) => next()
        return async (req, res, next) => {
            const obj = req["nessa:data"].data[place];
            obj.sanitize()
            try {
                const result = await obj.validate(strategy)
                if(!result.status){
                    const template = req.app.get("nessa:validation-error-template")
                    return res.status(template.status).json(template.body(result.errors))
                }
                next();
                
            } catch (error) {
                console.log(error);
                next();
            }
        }
    }

    #mw_aclCheck(rule, options){
        return (req, res, next) => {
            const acl = req["nessa:acl-instance"];
            if (acl && rule) {
                const role = _.get(req, acl.pathToRole);
                const [entity, action] = rule.split(":");
                const can = acl.can(role, entity, action);
                if (can) {
                    if (can.withFields) {
                        try {
                            const sanitized = can.checkFields(req[options.in], { mode: options.mode })
                            req[options.in] = sanitized;
                            return next()
                        } catch (error) {
                            return res.status(401).json(acl.errorTemplate(error.message))
                        }
                    } else {
                        return next()
                    }
                }
                return res.status(401).json(acl.errorTemplate(rule))
            } else {
                next()
            }
        }
    }

    #mw_readFiles(place, options){
        return (req, res, next) => {
            const errors = []
            const file = req?.files && place in req.files ? req.files[place] : null;
            if(file){
                if(options.accept.length){
                    if(!options.accept.includes(path.extname(file.name))){
                        errors.push(`${place}.not_accepted_ext`)
                    }
                }
    
                if(options.maxSize && options.maxSize !== "0"){
                    const maxSize = fileSizeParser(options.maxSize)
                    if(maxSize < file.size){
                        errors.push(`${place}.maxSize`)
                    }
                }
            } else {
                if(options.required){
                    errors.push(`${place}.required`)
                }
            }

            if(errors.length){
                const template = req.app.get("nessa:validation-error-template")
                return res.status(template.status).json(template.body(errors))
            }
            this.data[place] = file;
            next()
        }
    }

    /**
     * @returns {RequestData & Pick<this, "data">}
     */
    build(){
        return this
    }
}

exports.ControllerFactory = ControllerFactory;
