const ExpressRouter = require('express').Router;
const EndpointBuilder = require("./EndpointBuilder")
class Router {
    routes = [];
    prefix = "/";

    constructor(prefix) {
        this.prefix = prefix;
        this.router = ExpressRouter();
    }

    _addEndpoint(endpoint){
        this.routes.push(endpoint)
    }

    _generateEndpoint(endpoint){
        return `${this.prefix}${endpoint}`
    }

    /**
     * 
     * @param {*} endpoint 
     * @returns {EndpointBuilder}
     */
    post(endpoint) {
        return new EndpointBuilder(this, "post", this._generateEndpoint(endpoint))
    }

     /**
     * 
     * @param {*} endpoint 
     * @returns {EndpointBuilder}
     */
    get(endpoint) {
        return new EndpointBuilder(this, "get", this._generateEndpoint(endpoint))
    }

    patch(endpoint) {
        return new EndpointBuilder(this, "patch", this._generateEndpoint(endpoint))
    }

    delete(endpoint) {
        return new EndpointBuilder(this, "delete", this._generateEndpoint(endpoint))
    }

}


module.exports = Router;