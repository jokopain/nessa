const ApiResponse = require("./response");
const {ControllerFactory} = require("./controller-factory");
const {RequestData} = require("./request-data")

class Controller {
    ctx = {
        response: {},
        request: {},
        next: null,
        services: {},
        db: null
    }
    /** @type {import("../acl")} */
    acl = null

    constructor(ctx){
        this.setCtx(ctx)
    }


    static get Define(){
        return new ControllerFactory()
    }

    setCtx({req, res, next, services, db}){
        this.ctx = {
            response: res,
            request: req,
            next: next,
            services,
            db
        }
        this.session = req.session;
        this.acl = "nessa:acl-instance" in this.ctx.request ? this.ctx.request["nessa:acl-instance"] : null
        return this;
    }

    send(data, status){
        return this.ctx.response.status(status).send(data)
    }

    sendFile(file){
        return this.ctx.response.sendFile(file);
    }

    /**
     * @template T
     * @param {new() => T} service 
     * @returns {T}
     */
    injectService(service){
        const s = new service({db: this.ctx.db, services: this.ctx.services})
        return s
    }

    /**
     * @template T
     * @param {() => T} modelCreator
     * @returns {T}
     */
    injectModel(modelCreator){
        const model = modelCreator(this.ctx.db.sequelize, this.ctx.db.Sequelize.DataTypes)
        if(model.associate){
            model.associate(this.ctx.db)
        }
        return model
    }

    response(data = {}, status = 200){
        if(data instanceof ApiResponse){
            return this.ctx.response.status(data.statusCode).json(data.body).end()
        }
        return this.ctx.response.status(status).json(data).end()
    }

    static collect(){
        const endpoints = [];
        for (const key in this) {
            if(this[key] instanceof ControllerFactory){
                endpoints.push({name: key, factory: this[key]})
            }
        }
        return endpoints
    }

}

exports.Controller = Controller;
