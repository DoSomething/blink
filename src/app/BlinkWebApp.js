'use strict';

const changeCase = require('change-case');
const http = require('http');
const Koa = require('koa');
const auth = require('koa-basic-auth');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
const logger = require('winston');

const ApiWebController = require('../web/controllers/ApiWebController');
const EventsWebController = require('../web/controllers/EventsWebController');
const ToolsWebController = require('../web/controllers/ToolsWebController');
const WebHooksWebController = require('../web/controllers/WebHooksWebController');
const basicAuthCustom401 = require('../web/middleware/basicAuthCustom401');
const generateRequestId = require('../web/middleware/generateRequestId');
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
    // Define controller shortcuts for convenience.
    const {
      apiWebController,
      toolsWebController,
      webHooksWebController,
      eventsWebController,
    } = this.web.controllers;

    const router = new Router();
    router.get('root', '/', apiWebController.welcome);
    router.get('api.v1', '/api/v1', apiWebController.v1);
    router.get('api.index', '/api', apiWebController.index);
    router.get('api.v1', '/api/v1', apiWebController.v1);
    router.get('api.v1.tools', '/api/v1/tools', toolsWebController.index);
    router.post('api.v1.tools.fetch', '/api/v1/tools/fetch', toolsWebController.fetch);

    // Events
    router.get('api.v1.events', '/api/v1/events', eventsWebController.index);
    router.post(
      'api.v1.events.user-create',
      '/api/v1/events/user-create',
      eventsWebController.userCreate,
    );
    router.post(
      'api.v1.events.user-signup',
      '/api/v1/events/user-signup',
      eventsWebController.userSignup,
    );
    router.post(
      'api.v1.events.user-signup-post',
      '/api/v1/events/user-signup-post',
      eventsWebController.userSignupPost,
    );
    router.post(
      'api.v1.events.quasar-relay',
      '/api/v1/events/quasar-relay',
      eventsWebController.quasarRelay,
    );

    // Webhooks
    router.get('api.v1.webhooks', '/api/v1/webhooks', webHooksWebController.index);
    router.post(
      'api.v1.webhooks.customerio-email-activity',
      '/api/v1/webhooks/customerio-email-activity',
      webHooksWebController.customerioEmailActivity,
    );
    router.post(
      'api.v1.webhooks.customerio-sms-broadcast',
      '/api/v1/webhooks/customerio-sms-broadcast',
      webHooksWebController.customerioSmsBroadcast,
    );
    router.post(
      'api.v1.webhooks.gambit-chatbot-mdata',
      '/api/v1/webhooks/gambit-chatbot-mdata',
      webHooksWebController.gambitChatbotMdata,
    );
    router.post(
      'api.v1.webhooks.moco-message-data',
      '/api/v1/webhooks/moco-message-data',
      webHooksWebController.mocoMessageData,
    );
    router.post(
      'api.v1.webhooks.twilio-sms-broadcast',
      '/api/v1/webhooks/twilio-sms-broadcast',
      webHooksWebController.twilioSmsBroadcast,
    );
    router.post(
      'api.v1.webhooks.twilio-sms-inbound',
      '/api/v1/webhooks/twilio-sms-inbound',
      webHooksWebController.twilioSmsInbound,
    );
    return router;
  }

  initControllers(controllerClasses) {
    const controllerMapping = {};
    controllerClasses.forEach((controllerClass, i) => {
      // Construct new controller.
      const controller = new controllerClasses[i](this);
      // Use camelcased controller name as a map key.
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
    app.use(basicAuthCustom401);
    // Enable auth.
    app.use(auth({
      name: this.config.app.auth.name,
      pass: this.config.app.auth.password,
    }));

    // Inject Koa Router routes and allowed methods.
    app.use(this.web.router.routes());
    app.use(this.web.router.allowedMethods());
    return app;
  }

  async start() {
    await super.start();
    // Start HTTP server
    this.web.server = http.createServer(this.web.app.callback());
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
        logger.debug(`Blink Web is listening on ${readableUrl}`, meta);
      },
    );
    // TODO: HTTPS?
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

      logger.debug('Blink Web is stopped', meta);
    });
  }
}

module.exports = BlinkWebApp;
