const ApiResponse = require("./response");

class Middleware {

    constructor(ctx){
        this.services = ctx.services;
        this.db = ctx.db;
    }
    
    /**
     * @template T
     * @param {new() => T} service 
     * @returns {T}
     */
    injectService(service){
        const s = new service({db: this.db, services: this.services});
        return s
    }

    /**
     * @template T
     * @param {() => T} modelCreator
     * @returns {T}
     */
    injectModel(modelCreator){
        const model = modelCreator(this.db.sequelize, this.db.Sequelize.DataTypes)
        if(model.associate){
            model.associate(this.db)
        }
        return model
    }

    response(data = {}, status = 200){
        if(data instanceof ApiResponse){
            return this.res.status(data.statusCode).json(data.body)
        }
        return this.res.status(status).json(data)
    }
}

exports.Middleware = Middleware;