class Service {
    constructor(ctx= {}){
        this.db = ctx?.db;
        this.services = ctx?.services;
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
}

exports.Service = Service;