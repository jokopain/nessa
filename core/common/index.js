const {Decorator} = require("../decorator");
const {ControllerFactory} = require("../controller-factory");

/**
 * @template T
 * @param {object} decorators 
 * @param {object} decorators.query
 * @param {new() => T} decorators.query.dto 
 * @param {string} decorators.query.key 
 * @returns {{
 *  query: T 
 * }}
 */



/**
 * @returns {Pick<ControllerFactory, "data">}
 */
exports.define = (cb) => {
    return new ControllerFactory()
}

exports.GET = (endpoint = "/") => {
    return new Decorator({
        type: "general::route",
        options: {
            method: "get",
            endpoint
        }
    })
}

exports.POST = (endpoint = "/") => {
    return new Decorator({
        type: "general::route",
        options: {
            method: "post",
            endpoint
        }
    })
}

exports.protector = (rule = null, options = {in: "body", mode: "slice"}) => {
    return new Decorator({
        type: "mw::protection",
        options: {rule, options}
    })
}

exports.schema = (schema) => {
    return new Decorator({
        type: "mw::validation-schema",
        options: {schema}
    })
}

exports.params = (key = "params") => {
    return new Decorator({
        type: "ctx::params",
        options: {key}
    })
}

exports.body = (key = "body") => {
    return new Decorator({
        type: "ctx::body",
        options: {key}
    })
}

exports.query = (key = "query", options = {}) => {
    return new Decorator({
        type: "ctx::query",
        options: {key, ...options}
    })
}