class EndpointBuilder {
    middleware = [];
    protectedRoute = false;
    aclRule = null;
    endpointController = (req, resp) => {
        resp.status(404).send("Not Found")
    }
    validationSchema = null;
    constructor(router, method, endpoint){
        this.router = router;
        this.method = method;
        this.endpoint = endpoint;
    }

    schema(validationSchema){
        this.validationSchema = validationSchema;
        return this;
    }

    controller(endpointController){
        this.endpointController = endpointController;
        return this;
    }

    mw(middleware = []){
        this.middleware = middleware;
        return this;
    }

    protected(rule, options){
        this.protectedRoute = true;
        if(rule){
            this.aclRule = {rule, options: options || { in: "body", mode: "sanitize" }};
        } 
        return this;
    }

    build(){
        this.router._addEndpoint(this)
    }
}

module.exports = EndpointBuilder;