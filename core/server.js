const express = require('express');
const ExpressRouter = require('express').Router;
const bodyParser = require('body-parser');
const morgan = require("morgan");
const cors = require('cors');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const https = require('https');
const fs = require('fs');
const sessions = require('express-session');
const SessionStore = require('connect-session-sequelize')(sessions.Store);
const {Middleware} = require("./middleware")
const {UrlParser} = require("url-params-parser");

/**
 * NESS Rest API Server
 * NodeJs Express Sequelize Session
 */
class NESSARestAPI {
    endpoints = [];
    protectionMW = (req, res, next) => next()
    acl = null
    services = {}
    config = {
        db: null,
        cors: {
            origins: ["http://localhost"]
        },
        name: "My",
        host: "0.0.0.0",
        port: 8080,
        accessLogStream: null,
        session: null,
        secret: "someSuperSecret",
        ssl: {
            cert: null,
            key: null
        },
        logger: console.log,
        validationErrorTemplate: null,
        controllers: []
    }
    constructor(config) {
        this.app = express()
        this.config = { ...this.config, ...config };
        if(this.config.services){
            this.services = this.config.services
        }

        this.app.set("Secret", this.config.secret);
        this.app.use(cookieParser());

        this.initCORS(this.config.cors)

        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json());
        this.app.use(morgan('dev'));

        this.app.use(fileUpload({
            createParentPath: true
        }));
        this.app.disable('etag');
        this.config.db.sequelize.authenticate()
        this.use = this.app.use.bind(this.app)
        this.static = express.static;

        if (this.config.session) {
            this.initSession(this.config.session)
        }
    }

    setProtection(protection){
        if (protection) {
            this.initProtection(protection)
        }
        return this;
    }

    /**
     * @template M
     * @param {new() => M} mw 
     * @param {keyof M} name
     * @returns {this}
     */
    addMW(mw, name){
        return this.#withErrorHandling((req, res, next) => {
            const m = new mw({services: this.services, db: this.config.db});
            m.res = res
            m.next = next
            return m[name].call(m, req, mw.args)
        })
    }

    initProtection(protection){
        if (protection.mw) {
            this.app.set("nessa:auth-mw", protection.mw)
        }
        if (protection.acl) {
            this.acl = protection.acl
            this.app.use(async (req, res, next) => {
                let acl = this.acl._event_on_req(req, res, this.acl.clone())
                if (acl instanceof Promise) {
                    acl = await acl
                }
                req["nessa:acl-instance"] = acl;
                next()
            })
        }
    }

    initCORS(config){
        const allowlist = config.origins
        this.app.use(cors((req, callback) => {
            const corsOptions = {
                credentials: true
            };
            if (allowlist.indexOf(req.header('Origin')) !== -1) {
                corsOptions.origin = true  // reflect (enable) the requested origin in the CORS response
            } else {
                corsOptions.origin = false // disable CORS for this request
            }
            callback(null, corsOptions) // callback expects two parameters: error and options
        }))
    }

    initSession(config) {
        const { store, settings } = config
        const sequelizeSessionStore = new SessionStore({...store, db: this.config.db.sequelize});
        this.app.use(sessions({
            store: sequelizeSessionStore,
            ...settings
        }))
        sequelizeSessionStore.sync()
    }

    setLogger(logger) {
        this.config.logger = logger;
        this.logger = this.config.logger;
        return this;
    }

    setAccessLogFilePath(pathToLog) {
        this.config.accessLogStream = pathToLog;
        this.app.use(morgan('combined', {
            stream: fs.createWriteStream(
                this.config.accessLogStream, { flags: 'a' }
            )
        }));
        return this;
    }

    setSchemaValidationErrorTemplate(template) {
        this.config.validationErrorTemplate = template;
        this.app.set("nessa:validation-error-template", template);
        return this;
    }

    addService(name, service) {
        this.config.services[name] = service;
        this.app.set("nessa:services", this.config.services)
        return this;
    }

    ssl(options) {
        const { key = null, cert = null } = options;
        this.config.ssl = { key, cert }
        return this;
    }

    #withErrorHandling(cb){
        return async (req, res, next) => {
            try {
                return await cb(req, res, next)
            } catch (error) {
                this.config.logger(error)
                if(!res.finished){
                    res.status(500).json({
                        success: false,
                        message: "error.internal_server",
                        payload: null
                    })
                }
            }
        }
    }

    controllerMethodCreator(controller, method){
        return this.#withErrorHandling(async (req, res, next) => {
            const controllerInstance = new controller({req, res, next, services: this.services, db: this.config.db})
            return await controllerInstance[method.name].call(controllerInstance, req["nessa:data"])
        })
    }


    initMW(mw){
        return this.#withErrorHandling((req, res, next) => {
            const m = new mw.mw({
                services: this.services, 
                db: this.config.db
            })
            m.res = res;
            m.next = next;
            return m[mw.name].call(m, req, mw.args)
        })
    }

    buildMws(mws){
        return mws.map(mw => (mw.mw && mw.mw.prototype instanceof Middleware) ? this.initMW(mw) : mw.mw)
    }

    buildControllers(controllers){
        for (const controller of controllers) {
            const router = ExpressRouter({mergeParams: true});
            const methods = controller.collect()
            for (const method of methods) {
                const info = method.factory.getInfo();
                if(Array.isArray(info.endpoints)){
                    for (const endpoint of info.endpoints) {
                        let controllerMethod;
                        let mws = [];
                        if(info.ghost){
                            const ghostController = info.ghost.controller;
                            const ghostMethods = ghostController.collect()
                            const ghostMethod = ghostMethods.find(m => m.name === info.ghost.method);
                            if(ghostMethod){
                                const ghostInfo = ghostMethod.factory.getInfo()
                                controllerMethod = this.controllerMethodCreator(ghostController, ghostMethod)
                                if(info.ghost.options.mwStrategy === "child-first"){
                                    mws = this.buildMws([...ghostInfo.mw, ...info.mw])
                                } else if (info.ghost.options.mwStrategy === "parent-first") {
                                    mws = this.buildMws([...info.mw, ...ghostInfo.mw])
                                } else if (typeof info.ghost.options.mwStrategy === "function") {
                                    mws = this.buildMws(info.ghost.options.mwStrategy([...info.mw, ...ghostInfo.mw]))
                                }
                            } else {
                                throw new Error(`Method: ${info.ghost.method} not found on ${info.ghost.controller.name} controller`)
                            }

                        } else if (method.factory.redirect) {
                            controllerMethod = this.buildRedirect(controller, method, endpoint) 
                            mws = [...this.buildMws(info.mw)]
                            
                        } else {
                            controllerMethod = this.controllerMethodCreator(controller, method)
                            mws = [...this.buildMws(info.mw)]

                        }
                        router[endpoint.method](
                            endpoint.path, 
                            mws,
                            controllerMethod
                        )
                        
                    }
                }
            }
            this.app.use(controller.routePrefix, router);
        }
    }

    buildRedirect(controller, method, endpoint){
        return this.#withErrorHandling(async (req, res, next) => {
            if(method.factory.redirect.internal){
                req.url = method.factory.redirect;
                return req.app.handle(req, res);
            } else {
                const incomingUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
                const endpointUrl = `${controller.routePrefix}${endpoint.path}`
                const urlParser = UrlParser(incomingUrl, endpointUrl)
                let to = method.factory.redirect.to;
                for (const key in urlParser.namedParams) {
                    if(to.includes(`:${key}`)){
                        to = to.replace(`:${key}`, urlParser.namedParams[key]);
                    }
                }                
                return res.redirect(to + urlParser.search)
            }
        })
    }


    start() {
        this.buildControllers(this.config.controllers)
        try {
            /* SSL */
            const key = fs.readFileSync(this.config.ssl.key);
            const cert = fs.readFileSync(this.config.ssl.cert);
            https.createServer({ key, cert }, this.app).listen(this.config.port, this.config.host);
            this.logger("Running HTTPS server");
        } catch (error) {
            this.app.listen(this.config.port, this.config.host);
            this.logger("Running HTTP server");
        }
        this.logger(this.config.name + " REST API server started on: " + this.config.port);
        this.app.use(function (req, res) {
            res.status(404).send({ url: req.originalUrl + ' not found' })
        });
    }
}

module.exports = NESSARestAPI