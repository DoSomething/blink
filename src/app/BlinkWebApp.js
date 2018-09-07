'use strict';

const changeCase = require('change-case');
const http = require('http');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
const logger = require('../../config/logger');
const Promise = require('bluebird');

const ApiWebController = require('../web/controllers/ApiWebController');
const EventsWebController = require('../web/controllers/EventsWebController');
const ToolsWebController = require('../web/controllers/ToolsWebController');
const WebHooksWebController = require('../web/controllers/WebHooksWebController');
const unauthorized401Handler = require('../web/middleware/errorHandlers/401');
const forbidden403Handler = require('../web/middleware/errorHandlers/403');
const generateRequestId = require('../web/middleware/generateRequestId');
const enforceHttpsMiddleware = require('../web/middleware/enforce-https');
const BlinkApp = require('./BlinkApp');

class BlinkWebApp extends BlinkApp {
  constructor(config) {
    super(config);
    this.web = {};

    // Dynamically create and assign controllers.
    this.web.controllers = this.initControllers([
      ApiWebController,
      EventsWebController,
      ToolsWebController,
      WebHooksWebController,
    ]);

    // Define routing.
    this.web.router = this.initRouter();

    // Configure web sever.
    this.web.app = this.initWebApp();
  }

  initRouter() {
    const router = new Router();

    // ApiWeb router
    const apiWebRouter = this.web.controllers.apiWebController.getRouter();
    router.use(apiWebRouter.routes());

    // Tools router
    const toolsRouter = this.web.controllers.toolsWebController.getRouter();
    router.use(toolsRouter.routes());

    // Events router
    const eventsRouter = this.web.controllers.eventsWebController.getRouter();
    router.use(eventsRouter.routes());

    // Webhooks router
    const webhooksRouter = this.web.controllers.webHooksWebController.getRouter();
    router.use(webhooksRouter.routes());

    router.redirect('/', 'api.index');

    return router;
  }

  initControllers(controllerClasses) {
    const controllerMapping = {};
    controllerClasses.forEach((controllerClass, i) => {
      const router = new Router();

      // Construct new controller.
      const controller = new controllerClasses[i](this, router);

      /**
       * Use camelcased controller class name as a map key.
       * NOTE: Classes use camelCase but are capitalized, example: SuperClass.
       * This step normalizes the name to standard camelCase syntax: superClass.
       */
      const mappingKey = changeCase.camelCase(controllerClass.name);
      // Add worker to mapping
      controllerMapping[mappingKey] = controller;
    });
    return controllerMapping;
  }

  initWebApp() {
    const app = new Koa();

    // Setup web app env from local config.
    // https://github.com/koajs/koa/blob/master/docs/api/index.md#settings
    app.env = this.config.app.env;

    // Web proxy
    // https://github.com/koajs/koa/blob/master/docs/api/index.md#settings
    app.proxy = this.config.web.proxy;

    // -------- Setup web middleware --------

    // Enforce https
    app.use(enforceHttpsMiddleware(this.config.app.forceHttps));

    // Generate unique request id.
    app.use(generateRequestId);

    // Parse incoming request bodies in a middleware before your handlers,
    // available under the req.body property.
    // TODO: Might make sense to move to web/middleware.
    app.use(bodyParser({
      onerror: (err, ctx) => {
        // TODO: probably logging needs to be moved to a function.
        const meta = {
          env: this.config.app.env,
          code: 'error_parsing_body',
          request_id: ctx.id,
          method: ctx.request.method,
          host: ctx.request.hostname,
          path: ctx.request.path,
          fwd: ctx.request.ip,
          protocol: ctx.request.protocol,
        };
        logger.warning('Body parsing error.', meta);
        ctx.throw(422, 'Body parsing error.');
      },
    }));


    // Basic Authentication:
    // Custom 401 handling.
    // https://github.com/koajs/basic-auth#example
    app.use(unauthorized401Handler);
    // Custom 403 handling.
    app.use(forbidden403Handler);

    // Inject Koa Router routes and allowed methods.
    app.use(this.web.router.routes());
    app.use(this.web.router.allowedMethods());
    return app;
  }

  async start() {
    await super.start();
    // Start HTTP server
    this.web.server = http.createServer(this.web.app.callback());

    return new Promise((resolve) => {
      // @see https://nodejs.org/docs/latest-v8.x/api/net.html#net_server_listen
      this.web.server.listen(
        this.config.web.bind_port,
        this.config.web.bind_address,
        () => {
          const address = this.web.server.address();
          // TODO: Make sure random port setting gets overriden with actual resolved port.

          // TODO: log process name
          const meta = {
            env: this.config.app.env,
            code: 'web_started',
            host: this.config.web.hostname,
            protocol: 'http',
            port: address.port,
          };

          const readableUrl = `http://${this.config.web.hostname}:${address.port}`;
          logger.debug(`Blink Web is listening on ${readableUrl}`, { meta });

          /**
           * Wait for listening event
           * @see https://groups.google.com/forum/#!topic/nodejs/8huGEo1cWxg
           */
          return resolve(true);
        },
        // TODO: HTTPS?
      );
    });
  }

  async stop() {
    await super.stop();
    const address = this.web.server.address();
    this.web.server.close(() => {
      // TODO: log process name
      const meta = {
        env: this.config.app.env,
        code: 'web_stopped',
        host: this.config.web.hostname,
        protocol: 'http',
        port: address.port,
      };

      logger.debug('Blink Web is stopped', { meta });
    });
  }
}

module.exports = BlinkWebApp;
