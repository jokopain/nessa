const { validationResult, checkSchema } = require('express-validator');

const defErrTemplate = {
    status: 200,
    body: (errors) => {
        return {
            error: true,
            data: {
                code: -1,
                messages: errors.map( err => `${err.param}: ${err.msg}`)
            }
        } 
    }
}

class Validator {

    constructor(template = defErrTemplate){
        this.template = template
    }

    static template = defErrTemplate

    static setErrorTemplate(template){
        this.template = template
    }

    static validate(schema){
        return async (req, res, next) => {
            await checkSchema(schema).run(req, res, next)
            const errors = validationResult(req).array();
            if(errors.length) {
                return res.status(this.template.status).json(this.template.body(errors))
            }
            next();
        }
    }

    validate(schema){
        return async (req, res, next) => {
            await checkSchema(schema).run(req, res, next)
            const errors = validationResult(req).array();
            if(errors.length) {
                return res.status(this.template.status).json(this.template.body(errors))
            }
            next();
        }
    }
}

exports.Validator = Validator;
