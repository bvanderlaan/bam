'use strict';

const { stripIndent } = require('common-tags');

const compose = require('../../composeService');
const npmService = require('../npmService');
const { ProjectDecorator } = require('./ProjectDecorator');


// /////////////////////////////////////////
// Private Methods
// /////////////////////////////////////////
function sortObjectKeys(obj) {
  return Object.keys(obj).sort().reduce((newObj, key) => {
    // eslint-disable-next-line no-param-reassign
    newObj[key] = obj[key];
    return newObj;
  }, {});
}

function getRandomPort(min, max) {
  const minPort = Math.ceil(min);
  const maxPort = Math.floor(max);
  return Math.floor(Math.random() * ((maxPort - minPort) + 1)) + minPort;
}

// PACKAGE.JSON ///////////////////////////
function updatePackageJson() {
  const packageJson = JSON.parse(this.files['package.json']);
  packageJson.main = './src/server.js';
  packageJson.files = packageJson.files || [];
  packageJson.files.push('src/');
  packageJson.files.push('script/');
  packageJson.scripts.start = 'node ./src/server.js';
  packageJson.scripts.debug = 'node --inspect ./src/server.js';
  packageJson.scripts.bench = 'node_modules/.bin/api-bench-runner test/**/*.bench.js --reporter default,html -o reports/benchmarks.html --setup test/index.bench.js';
  packageJson.private = true;

  const prodDeps = [
    'express-request-id',
    'bunyan',
    'common-tags',
    'express',
    'express-bunyan-logger',
    'body-parser',
    'helmet',
    'heapdump',
    'nconf',
    'swagger-jsdoc',
    'swagger-ui-express',
    'js-yaml',
  ];

  const devDeps = [
    'api-benchmark',
    'api-bench-runner',
    'chai-json-schema',
    'superagent',
    'uuid',
  ];

  return npmService.addDependencies(prodDeps, this.latestVersion)
    .then((deps) => {
      Object.assign(packageJson.dependencies, deps);
      packageJson.dependencies = sortObjectKeys(packageJson.dependencies);
    })
    .then(() => npmService.addDependencies(devDeps, this.latestVersion))
    .then((deps) => {
      Object.assign(packageJson.devDependencies, deps);
      packageJson.devDependencies = sortObjectKeys(packageJson.devDependencies);
    })
    .then(() => {
      this.files['package.json'] = JSON.stringify(packageJson, null, 2);
    });
}

// DOCKER ////////////////////////////////
function updateDocker() {
  const baseCompose = compose.toJson(this.files['docker-compose.yml']);
  baseCompose.services[this.name].environment = baseCompose.services[this.name].environment || [];
  baseCompose.services[this.name].environment.push(`APP_PORT=${this.port}`);
  baseCompose.services[this.name].environment.sort();
  baseCompose.services[this.name].expose = [`${this.port}`];
  this.files['docker-compose.yml'] = compose.toCompose(baseCompose);

  const testCompose = compose.toJson(this.files['docker-compose.test.yml']);
  testCompose.services[this.name].environment = [
    'HEAPDUMP=disabled',
  ];
  testCompose.services[this.name].networks = ['test_net'];
  testCompose.networks = {
    test_net: undefined,
  };
  this.files['docker-compose.test.yml'] = compose.toCompose(testCompose);

  const devCompose = compose.toJson(this.files['docker-compose.development.yml']);
  devCompose.services[this.name].ports = [`${this.port}:${this.port}`];
  devCompose.services[this.name].environment.push(`APP_PUBLIC_PATH=http://localhost:${this.port}/`);
  devCompose.services[this.name].environment.sort();

  this.files['docker-compose.development.yml'] = compose.toCompose(devCompose);
}

// ESLINT ///////////////////////////////
function updateESLint() {
  const contents = stripIndent`
  {
    "extends": "@vanderlaan/eslint-config-vanderlaan/test",
    "globals": {
      "rootSuite": false,
      "suite": false,
      "service": false,
      "route": false,
      "options": false
    },
    "rules": {
      "func-names": "off" // mocha some times needs a function vs. an arrow function
    }
  }`;
  this.files.test = this.files.test || {};
  this.files.test['.eslintrc.json'] = contents;
}

// SOURCE ///////////////////////////////
function createStatusRoute() {
  const contents = {
    tests: {
      unit: stripIndent`
      'use strict';

      const chai = require('chai');
      const sinon = require('sinon');
      const sinonChai = require('sinon-chai');

      const { controller: statusController } = require('../../src/status');

      const { expect } = chai;
      chai.use(sinonChai);

      function createResponse() {
        const res = {
          json: sinon.stub(),
          status: sinon.stub(),
        };
        res.status.returns(res);

        return res;
      }

      describe('Unit :: Status Route', () => {
        it('should set status to 200', () => {
          const res = createResponse();
          const next = sinon.stub();

          statusController.get({}, res, next);

          expect(res.status, 'status').to.have.been.calledOnce;
          expect(res.status, 'status').to.have.been.calledWith(200);
        });

        it('should set body to json', () => {
          const res = createResponse();
          const next = sinon.stub();

          statusController.get({}, res, next);

          expect(res.json, 'json').to.have.been.calledOnce;
          expect(res.json, 'json').to.have.been.calledWith({
            name: '@vanderlaan/${this.name}',
            version: sinon.match.string,
            message: 'up and running',
          });
        });

        it('should not call next', () => {
          const res = createResponse();
          const next = sinon.stub();

          statusController.get({}, res, next);

          expect(next, 'next').to.have.not.been.called;
        });
      });`,

      system: stripIndent`
      'use strict';

      const chai = require('chai');
      const chaiAsPromised = require('chai-as-promised');
      const chaiJson = require('chai-json-schema');
      const request = require('superagent');

      const server = require('../../test');

      const { expect } = chai;

      chai.use(chaiAsPromised);
      chai.use(chaiJson);

      describe('System :: Status Route', () => {
        it('should respond with 200', () => (
          expect(request.get(\`\${server.url}/status\`))
            .to.eventually.be.fulfilled
            .and.have.property('status', 200)
        ));

        it('should respond with json', () => {
          const statusJsonSchema = {
            type: 'object',
            required: ['version', 'name', 'message'],
            properties: {
              name: {
                type: 'string',
              },
              version: {
                type: 'string',
              },
              message: {
                type: 'string',
              },
            },
          };
          return expect(request.get(\`\${server.url}/status\`))
            .to.eventually.be.fulfilled
            .and.have.property('body')
            .then(body => expect(body).to.be.jsonSchema(statusJsonSchema));
        });
      });`,

      bench: stripIndent`
      'use strict';

      suite('Status Route', () => {
        suite('Multiple requests in Parallel', () => {
          options({
            runMode: 'parallel',
            minSamples: 400,
            maxTime: 20,
          });

          route('status', {
            method: 'get',
            route: 'status',
            expectedStatusCode: 200,
            maxMean: 0.2, // 200ms
          });
        });

        suite('Multiple requests in Sequence', () => {
          options({
            runMode: 'sequential',
            minSamples: 400,
            maxTime: 20,
          });

          route('status', {
            method: 'get',
            route: 'status',
            expectedStatusCode: 200,
            maxMean: 0.12, // 120ms
          });
        });
      });`,
    },

    index: stripIndent`
    'use strict';

    const controller = require('./status.controller');
    const route = require('./status.route');

    module.exports = {
      controller,
      route,
    };`,

    controller: stripIndent`
    'use strict';

    const { name, version } = require('../../package.json');

    /**
     * @swagger
     * tags:
     *   - name: status
     *     description: Is the service in a good state
     */

    module.exports = {
      /**
       * @swagger
       * /api/status:
       *   get:
       *     description: |
       *       The service will offer a status endpoint which can be accessed via a HTTP GET request.
       *       It will return a status 200 and a body message if the service is in a good state.
       *     tags:
       *       - status
       *     responses:
       *       200:
       *         description: OK
       *         content:
       *           application/json:
       *             schema:
       *               type: object
       *               properties:
       *                 name:
       *                   type: string
       *                   description: The name of the service.
       *                   example: "@vanderlaan/${this.name}"
       *                 version:
       *                   type: string
       *                   description: The version of the service.
       *                   example: "1.0.0"
       *                 message:
       *                   type: string
       *                   description: The status message describing the state of the service.
       *                   example: "up and running"
       */
      get(req, res) {
        res.status(200).json({
          name,
          version,
          message: 'up and running',
        });
      },
    };`,

    route: stripIndent`
    'use strict';

    const express = require('express');

    const statusController = require('./status.controller');

    const router = express.Router();

    router.get('/status', statusController.get);

    module.exports = router;`,
  };

  this.files.src = this.files.src || {};
  this.files.src.status = this.files.src.status || {};
  this.files.src.status['index.js'] = contents.index;
  this.files.src.status['status.controller.js'] = contents.controller;
  this.files.src.status['status.route.js'] = contents.route;

  this.files.test = this.files.test || {};
  this.files.test.status = this.files.test.status || {};
  this.files.test.status['status.unit.js'] = contents.tests.unit;
  this.files.test.status['status.system.js'] = contents.tests.system;
  this.files.test.status['status.bench.js'] = contents.tests.bench;
}

function createEntryPoint() {
  const contents = {
    config: {
      config: stripIndent`
      'use strict';

      const nconf = require('nconf');

      module.exports = nconf.use('memory')
        .env({
          separator: '__',
          lowerCase: true,
          parseValues: true,
        })
        .defaults({
          app_public_path: 'http://${this.name}:8080',
          app_port: 8080,
          heapdump: 'enable',
          log_level: 'warn',
        });`,
      logger: stripIndent`
      'use strict';

      const bunyan = require('bunyan');
      const nconf = require('nconf');

      const { name, version } = require('../../package.json');

      module.exports.log = {};
      module.exports.init = (options = {}) => {
        const log = module.exports.log;

        // Don't init twice
        if (Object.keys(log).length === 0) {
          const level = nconf.get('log_level');
          const loggingOptions = {
            level,
            name,
            version,
          };

          const logger = bunyan.createLogger(loggingOptions);
          Object.assign(log, logger);
          Object.setPrototypeOf(log, Object.getPrototypeOf(logger));
        }

        return log;
      };`,
      monitoring: stripIndent`
      'use strict';

      const nconf = require('nconf');

      function enableHeapDump() {
        if (nconf.get('heapdump') === 'enable') {
          // eslint-disable-next-line global-require
          require('heapdump');
        }
      }

      module.exports = () => {
        enableHeapDump();
      };`,
      swagger: stripIndent`
      'use strict';

      const { oneLine } = require('common-tags');
      const swaggerJSDoc = require('swagger-jsdoc');

      const nconf = require('./index');
      const { description, version } = require('../../package.json');

      const title = '${this.name}';

      const options = {
        definition: {
          openapi: '3.0.1',
          servers: [
            { url: nconf.get('app_public_path') },
          ],
          info: {
            description,
            version,
            title,
          },
        },
        apis: ['./src/config/swagger.js', './**/*.controller.js', './**/*.model.js'],
      };

      /**
       * @swagger
       * components:
       *   schemas:
       *     Error:
       *       type: object
       *       properties:
       *         message:
       *           type: string
       *           description: A human readable description of what went wrong
       *           example: The passed in parameter limit must be a number
       *         moreInfo:
       *           type: string
       *           description: A link to this help documentation
       *           example: http://mysite.com/docs
       *   responses:
       *     ServerError:
       *       description: |
       *         If something goes wrong and the service can not perform the requested
       *         operation it will return a 500 response; the body will include a
       *         description of what went wrong and a link to the help documentation.
       *       content:
       *         application/json:
       *           schema:
       *             $ref: "#/components/schemas/Error"
       *           example:
       *             message: Failed to retrieve data from database
       *             moreInfo: http://mysite.com/docs
       */

      module.exports = {
        options: {
          customSiteTitle: title,
          customCss: oneLine\`
          .topbar { display: none }
          tr.response:not(:last-child) { border-bottom: 1px solid rgba(59,65,81,.2) }
          tr.response td.response-col_description { padding-bottom: 5px; }
          .swagger-ui .response-col_description__inner div.markdown,
          .swagger-ui .response-col_description__inner div.renderedMarkdown {
            background-color: transparent;
          }
          .swagger-ui .opblock-description-wrapper {
            font-size: 10.5pt;
          }
          .swagger-ui .response-col_description__inner div.markdown,
          .swagger-ui .response-col_description__inner div.markdown p,
          .swagger-ui .response-col_description__inner div.renderedMarkdown,
          .swagger-ui .response-col_description__inner div.renderedMarkdown p {
            color: #000000;
            font-size: 12pt;
            font-style: normal;
            font-weight: normal;
            font-family: Open Sans,sans-serif;
            padding: 0px;
          }
          .swagger-ui .parameters-col_description dev.markdown p {
            margin: 0px;
          }
          .swagger-ui .model-box {
            display: block;
          }
          .swagger-ui table.model tbody tr td {
            padding-bottom: 8px;
          }\`,
        },

        spec() {
          const securitySpec = {
            securitySchemes: {
              bearerToken: {
                description: 'The authorization header is expected to contain the Bearer token (a JWT prefixed with \\'Bearer \\') of the user whose favourite resources we are acting on.',
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
              },
            },
          };
          const oas = swaggerJSDoc(options);
          oas.components = oas.components || {};
          Object.assign(oas.components, securitySpec);
          return oas;
        },
      };`,
    },
    setup: {
      test: stripIndent`
      'use strict';

      const { expect } = require('chai');

      let server;

      module.exports = {};

      before('Starting Server', function (done) {
        this.timeout(15000);
        server = require('../src/server'); // eslint-disable-line global-require
        server.once('ready', () => {
          module.exports.url = \`\${server.url}/api\`;
          console.log('Server is listening', server.url); // eslint-disable-line no-console
          done();
        });
      });

      after('Closing Server', (done) => {
        if (!server) {
          done();
        }

        server.close((err) => {
          expect(err, 'Error shutting down the server').to.not.exist;
          console.log('Server shutdown'); // eslint-disable-line no-console
          done();
        });
      });`,
      bench: stripIndent`
      'use strict';

      const { expect } = require('chai');

      rootSuite(() => {
        let server;

        before((done) => {
          process.env.LOG_LEVEL = 'fatal';
          server = require('../src/server'); // eslint-disable-line global-require
          server.once('ready', () => {
            module.exports.url = \`\${server.url}/api\`;
            console.log('Server is listening', server.url); // eslint-disable-line no-console
            done();
          });
        });
        after((done) => {
          server.close((err) => {
            expect(err, 'Error shutting down the server').to.not.exist;
            console.log('Server shutdown'); // eslint-disable-line no-console
            done();
          });
        });

        service('${this.name}', () => \`\${server.url}/api/\`);
      });`,
    },
    tests: {
      serverSystem: stripIndent`
      'use strict';

      const chai = require('chai');
      const chaiAsPromised = require('chai-as-promised');
      const chaiJson = require('chai-json-schema');
      const request = require('superagent');

      const server = require('../test');
      const { description, version } = require('../package.json');

      const { expect } = chai;

      chai.use(chaiAsPromised);
      chai.use(chaiJson);

      describe('System ::', () => {
        let token;
        // TODO: generate a token

        describe('Invalid Route', () => {
          describe('Non-Existing GET route', () => {
            it('should respond with 404', () => {
              const req = request.get(\`\${server.url}/v1/hello\`)
                .set('Authorization', \`Bearer \${token}\`);

              return expect(req)
                .to.eventually.be.rejected
                .and.have.property('status', 404);
            });

            it('should respond with body with error object', () => {
              const req = request.get(\`\${server.url}/v1/hello\`)
                .set('Authorization', \`Bearer \${token}\`);

              return expect(req)
                .to.eventually.be.rejected
                .and.have.property('response')
                .which.has.property('body')
                .that.deep.equals({
                  moreInfo: 'http://${this.name}:8080/docs/',
                  message: 'Not Found: Cannot GET /api/v1/hello',
                });
            });
          });

          describe('Non-Existing DELETE route', () => {
            it('should respond with 404', () => {
              const req = request.delete(\`\${server.url}/v1/hello\`)
                .set('Authorization', \`Bearer \${token}\`);

              return expect(req)
                .to.eventually.be.rejected
                .and.have.property('status', 404);
            });

            it('should respond with body with error object', () => {
              const req = request.delete(\`\${server.url}/v1/hello\`)
                .set('Authorization', \`Bearer \${token}\`);

              return expect(req)
                .to.eventually.be.rejected
                .and.have.property('response')
                .which.has.property('body')
                .that.deep.equals({
                  moreInfo: 'http://${this.name}:8080/docs/',
                  message: 'Not Found: Cannot DELETE /api/v1/hello',
                });
            });
          });

          describe('Non-Existing non-versioned GET route', () => {
            it('should respond with 404', () => {
              const req = request.get(\`\${server.url}/hello\`)
                .set('Authorization', \`Bearer \${token}\`);

              return expect(req)
                .to.eventually.be.rejected
                .and.have.property('status', 404);
            });

            it('should respond with body with error object', () => {
              const req = request.get(\`\${server.url}/hello\`)
                .set('Authorization', \`Bearer \${token}\`);

              return expect(req)
                .to.eventually.be.rejected
                .and.have.property('response')
                .which.has.property('body')
                .that.deep.equals({
                  moreInfo: 'http://${this.name}:8080/docs/',
                  message: 'Not Found: Cannot GET /api/hello',
                });
            });
          });
        });

        describe('OAS', () => {
          describe('Fetch JSON OAS', () => {
            it('should respond with 200', () => {
              const req = request.get(\`\${server.url.replace('/api', '')}/docs.json\`);

              return expect(req)
                .to.eventually.be.fulfilled
                .and.have.property('status', 200);
            });

            it('should respond with JSON OAS in body', () => {
              const req = request.get(\`\${server.url.replace('/api', '')}/docs.json\`);

              return expect(req)
                .to.eventually.be.fulfilled
                .and.have.property('body')
                .which.has.property('info')
                .that.deep.equals({
                  description,
                  version,
                  title: '${this.name}',
                });
            });
          });

          describe('Fetch YAML OAS', () => {
            it('should respond with 200', () => {
              const req = request.get(\`\${server.url.replace('/api', '')}/docs.yaml\`);

              return expect(req)
                .to.eventually.be.fulfilled
                .and.have.property('status', 200);
            });

            it('should respond with YAML OAS in body', () => {
              const req = request.get(\`\${server.url.replace('/api', '')}/docs.yaml\`);

              const pattern = \`(?:description: \${description}\\\\n\\\\s+version: \${version}\\\\n\\\\s+title: ${this.name})\`;
              const regex = new RegExp(pattern);

              return expect(req)
                .to.eventually.be.fulfilled
                .and.have.property('text')
                .which.match(regex);
            });
          });
        });
      });`,
    },
    createServer: stripIndent`
    'use strict';

    const fs = require('fs');
    const http = require('http');
    const https = require('https');
    const nconf = require('nconf');

    const { log } = require('./config/logger');

    const certPath = nconf.get('https_certificate');
    const keyPath = nconf.get('https_key');

    module.exports = {
      create(app) {
        if (certPath) {
          if (!keyPath) {
            throw Error('MissingTLSKey');
          }

          const credentials = {
            cert: fs.readFileSync(certPath, 'utf8'),
            key: fs.readFileSync(keyPath, 'utf8'),
          };

          log.info('Creating TLS server');
          return https.createServer(credentials, app);
        }

        log.info('Creating non-TLS server');
        return http.createServer(app);
      },

      get protocol() {
        return certPath ? 'https' : 'http';
      },
    };`,
    server: stripIndent`
    'use strict';

    const nconf = require('./config');
    const log = require('./config/logger').init();
    require('./config/monitoring')();

    const bodyParser = require('body-parser');
    const express = require('express');
    const requestAuditor = require('express-bunyan-logger');
    const helmet = require('helmet');
    const swaggerUi = require('swagger-ui-express');
    const yaml = require('js-yaml');
    const { URL } = require('url');

    const addRequestId = require('express-request-id');

    const { name } = require('../package.json');
    const { create: createServer, protocol } = require('./createServer');
    const { route: statusRoute } = require('./status');
    const { options: swaggerOptions, spec } = require('./config/swagger');

    const port = nconf.get('app_port');
    const app = express();
    const swaggerSpec = spec();
    const swaggerSpecYaml = yaml.dump(swaggerSpec);

    app.use(helmet());
    app.set('etag', false);

    app.use('/api', statusRoute);

    app.use('/docs/', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));
    app.get('/docs.json', (req, res) => {
      res.status(200).json(swaggerSpec);
    });
    app.get('/docs.yaml', (req, res) => {
      res.setHeader('Content-Type', 'text/plain');
      res.send(swaggerSpecYaml);
    });

    app.use(addRequestId({ attributeName: 'requestId' }));

    const auditOptions = {
      genReqId(req) {
        return req.requestId;
      },
      logger: log,
      obfuscate: ['req-headers.authorization', 'req-headers.cookie'],
      format: ':method :url HTTP/:http-version :status-code :response-time ms',
    };
    app.use(requestAuditor(auditOptions));
    app.use(bodyParser.urlencoded({
      extended: true,
    }));
    app.use(bodyParser.json());

    // TODO: Insert new routes here

    app.use('*', (req, res) => (
      res.status(404).json({
        moreInfo: new URL('/docs/', nconf.get('app_public_path')),
        message: \`Not Found: Cannot \${req.method} \${req.originalUrl}\`,
      })
    ));

    app.use((err, req, res, next) => {
      if (res.headersSent) {
        return next(err);
      }

      req.log.warn({ err }, 'Unable to handle request');

      return res.status(400).json({
        moreInfo: new URL('/docs/', nconf.get('app_public_path')),
        message: \`Bad Request: \${err.message}\`,
      });
    });

    const server = createServer(app);

    function beforeTerminate(cause, level = 'info', err = undefined) {
      log[level]({ err, cause, url: server.url }, \`----- \${name} server shut down -----\`);
      const exitCode = err ? 1 : 0;
      setTimeout(() => process.exit(exitCode), 1000);
    }

    server.once('close', () => beforeTerminate('closed'));
    process.once('SIGTERM', () => beforeTerminate('SIGTERM'));
    process.once('uncaughtException', err => beforeTerminate('uncaughtException', 'fatal', err));
    process.once('unhandledRejection', err => beforeTerminate('unhandledRejection', 'fatal', err));

    Promise.resolve()
      .then(() => {
        server.listen(port, '0.0.0.0', () => {
          const { address, port: p } = server.address();
          server.url = \`\${protocol}://\${address}:\${p}\`;
          log.info({ url: server.url }, \`----- \${name} server is online -----\`);
          server.emit('ready');
        });
      });

    module.exports = server;`,
  };

  this.files.src = this.files.src || {};
  this.files.src['server.js'] = contents.server;
  this.files.src['createServer.js'] = contents.createServer;

  this.files.test = this.files.test || {};
  this.files.test['index.js'] = contents.setup.test;
  this.files.test['index.bench.js'] = contents.setup.bench;
  this.files.test['server.system.js'] = contents.tests.serverSystem;

  this.files.src.config = this.files.src.config || {};
  this.files.src.config['index.js'] = contents.config.config;
  this.files.src.config['logger.js'] = contents.config.logger;
  this.files.src.config['monitoring.js'] = contents.config.monitoring;
  this.files.src.config['swagger.js'] = contents.config.swagger;
}

function createReadMe() {
  const contents = stripIndent`
# ${this.name}
${this.description}

## Usage

The ${this.name} service has an HTTP RESTful API.
It also hosts interactive documentation for its RESTful APIs at its \`/docs\` route.
For details on how to use the APIs start the ${this.name} service and navigate to its \`/docs\` route.

### Installation

To install ${this.name} in a non-Containerized environment you need to setup a server running Node.js.

The server _should_ be able to be any OS with support for Node.js.
The only real requirement ${this.name} has is that the platform can run a modern version of Node.js reliably.

#### Install Node.js
The version of Node.js which ${this.name} supports is \`v8.x\` and has been tested against \`v8.11.1\`.
See [How to install Node.js v8.x on Ubuntu 18](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-18-04#installing-using-a-ppa) and use the \`https://deb.nodesource.com/setup_8.x\` script to install Node.js.

> TL;DR - Here is a summary of the Node.js install commands:
> \`\`\`
> $ sudo apt-get update
> $ curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
> $ sudo apt-get install nodejs
> $ sudo apt-get install build-essential
> $ node --version
> \`\`\`

The above will install the latest version of the \`v8.x\` branch of node. To get more control over the minor version (lets say you want to install \`v8.11.1\` instead of the latest) you could look at using [NVM](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-18-04#installing-using-nvm) or some other Node installation mechanism.

#### Install ${this.name}

Download ${this.name} from the [GitHub repository](https://github.com/bvanderlaan/${this.name}) to the servers file system.
Next run the bootstrap script located in the source you just downloaded: \`script/bootstrap\`

That will install the the required dependencies.

#### Starting ${this.name}

Assuming you have set the appropriate environment variables as described below and setup any required data stores you should be ready to start ${this.name} for the first time.

> **Note:** If you want ${this.name} to be hosted over HTTPS you need to set the \`HTTPS_CERTIFICATE\` and \`HTTPS_KEY\` environment variables. See _Encrypting Service Communications_ below for more information.

You can start ${this.name} via the NPM \`start\` command.

\`\`\`
$ NODE_ENV="production" npm start
\`\`\`

You should be able to use process managers such as [Docker](https://www.docker.com/) or [PM2](https://www.npmjs.com/package/pm2) to run multiple instances of ${this.name} per server.

### Environment Variables

When ${this.name} starts up it will read a number of environment variables to allow for custom configuration of the service.

|Environment Variable|Description                                                                |
|:-------------------|:--------------------------------------------------------------------------|
|APP_PORT            |The port the service will listen on. Defaults to \`8080\`                    |
|APP_PUBLIC_PATH     |The base URL for accessing the service externally. Used by Swagger to call into the API. |
|HEAPDUMP            |Enables support for generating heap dumps. Defaults to \`enabled\`         |
|LOG_LEVEL           |Defines the level of logging to generate. Defaults to \`warn\`             |
|NODE_ENV            |Defines the mode ${this.name} should run under. Defaults to \`development\`|
|HTTPS_CERTIFICATE   |(Optional) The full path to the *.crt file, if not provided then service will be hosted over non-TLS |
|HTTPS_KEY           |(Optional) The full path to the *.key file.                                |


### Request Audit Logging

Each request made to the service will be automatically logged showing the response code, how long it took to responded to the request, and information about the requesting client. The unique request id will also be included in the log.

\`\`\`json
{"name":"@vanderlaan/${this.name}","version":"1.0.0","hostname":"249d8bd4136c","pid":40,"req_id":"ca559742-03c1-4dd2-b9a8-d00416750274","level":30,"remote-address":"127.0.0.1","ip":"127.0.0.1","method":"GET","url":"/status/","referer":"-","user-agent":{"family":"curl","major":"7","minor":"35","patch":"0","device":{"family":"Other","major":"0","minor":"0","patch":"0"},"os":{"family":"Other","major":"0","minor":"0","patch":"0"}},"body":{},"short-body":"{}","http-version":"1.1","response-time":4.972071,"response-hrtime":[0,4972071],"status-code":200,"req-headers":{"user-agent":"curl/7.35.0","host":"localhost:7060","accept":"*/*"},"res-headers":{"x-dns-prefetch-control":"off","x-frame-options":"SAMEORIGIN","strict-transport-security":"max-age=15552000; includeSubDomains","x-download-options":"noopen","x-content-type-options":"nosniff","x-xss-protection":"1; mode=block","content-type":"application/json; charset=utf-8","content-length":"70","etag":"W/\"46-voMKQOs/pa0w1VB/AI4cBhucyhA\""},"req":{"method":"GET","url":"/","headers":"[Circular]","remoteAddress":"127.0.0.1","remotePort":42232},"res":{"statusCode":200,"header":"HTTP/1.1 200 OK\r\nX-DNS-Prefetch-Control: off\r\nX-Frame-Options: SAMEORIGIN\r\nStrict-Transport-Security: max-age=15552000; includeSubDomains\r\nX-Download-Options: noopen\r\nX-Content-Type-Options: nosniff\r\nX-XSS-Protection: 1; mode=block\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: 70\r\nETag: W/\"46-voMKQOs/pa0w1VB/AI4cBhucyhA\"\r\nDate: Wed, 10 Jan 2018 17:42:00 GMT\r\nConnection: keep-alive\r\n\r\n"},"incoming":"<--","msg":"GET /status/ HTTP/1.1 200 4.972071 ms","time":"2018-01-10T17:42:00.264Z","v":0}
\`\`\`

### Encrypting Service Communications

To ensure requests being made to the service are not vulnerable to man-in-the-middle attacks you can enable Transport Layer Security (TLS).
To do this you just need to provide the path to the certificate (\\*.crt) and private key (\\*.key) files.

You do this via the environment variables \`HTTPS_CERTIFICATE\` and \`HTTPS_KEY\`. If you do not provide \`HTTPS_CERTIFICATE\` the service will assume that TLS will be handled by the load balancer and will host the service un-encrypted (HTTP). If you provide \`HTTPS_CERTIFICATE\` then you must also provide \`HTTPS_KEY\` otherwise you will get an error indicating that the key is missing.

If TLS is enabled then the service will only be accessible over HTTPS otherwise it will be hosted over HTTP.

## Development

### Configurable Options

For any options which can be configured at runtime we set reasonable default values in \`./config/index.js\` and allow those values to be overwritten via environment variables.
For development you can overwrite the default configuration values by setting the environment variable in the appropriate \`docker-compose\` file.

When adding new configuration variables:
  * Access the value via \`nconf\`
  * Set reasonable defaults if any apply in \`./config/index.js\`
  * Use the \`environment\` key in the appropriate \`docker-compose\` file to overwrite the default as needed


### Brining up the ${this.name} Container

The ${this.name} service has also been containerized.
You can start the ${this.name} service on your docker host by:

* Navigate into the ${this.name} directory (the one with the docker-compose files): \`cd ${this.name}\`
* Then bring up the container with the \`bam up\` command

If you have any issues regarding \`bam\` being an unknown command you can install it with: \`npm install -g @vanderlaan/bam\`.

You can view the logs generated by the ${this.name} service with the \`bam log ${this.name}\` command.

### Generate Heap Dump

You can enable heap dump generation by setting the \`HEAPDUMP\` environment variable to *enabled*.
As long as that environment variable is set when you bring up the server you can generate a heap dump by passing the \`USR2\` signal to the process running the server.

To do that attach to the container running the server:
\`\`\`
> docker-compose -f docker-compose.development.yml exec ${this.name} /bin/bash
\`\`\`
Or if your using \`bam\`
\`\`\`
> bam attach ${this.name}
\`\`\`

Now find out the process that the server is running on via the \`top\` command:
\`\`\`
# top
\`\`\`

It should show only one \`node\` process which should have an ID of \`42\` but if its a different PID use that value next.
Now you can issue the \`USR2\` signal to the process:
\`\`\`
# kill -USR2 42
\`\`\`

This will generate a new heap dump file in the current working directory of the server (i.e. /usr/src/app) which is being mapped by the docker-compose file to your project directory.
The file by default will be called \`heapdump-<date-time-stamp>.heapsnapshot\`.

### Logging

Each request object (\`req\`) will include a logger object which can be used to generate logs in the controller.

\`\`\`js
module.exports = {
  create(req, res) {
    // create thing
    req.log.info({ thingId: thing.id }, 'New thing created');
    res.status(200).json({...});
  },
};
\`\`\`

The unique request id (\`req.requestId\`) will automatically be attached to the log.

\`\`\`
{"name":"@vanderlaan/${this.name}","version":"1.0.0","hostname":"249d8bd4136c","pid":41,"req_id":"3fe6bca4-9d91-47db-9a7b-f9ed0a5c0186","level":30,"thingId":1234,"msg":"New thing created","time":"2018-01-11T01:48:14.655Z","v":0}
\`\`\`

### Running Tests

To run the tests for \`${this.name}\` use the \`bam test ${this.name}\` command from your docker host.
If you don't have the \`bam\` command installed you can install it with: \`npm install -g @vanderlaan/bam\`.

This command will also calculate code coverage (shown in terminal), generate a test report (XML), and a LCov code coverage report (HTML). The reports are saved in the \`./reports\` folder.

### Style Guide

[The JavaScript Style Guide](https://www.npmjs.com/package/@vanderlaan/eslint-config-vanderlaan) is used for this project so you must comply to that rule set. You can verify your changes are in compliance via the \`npm run lint\` command.

### Contributing

Bug reports and pull requests are welcome. To ensure your contributions are accepted please read and oblige by our [Contribution Guide](.github/CONTRIBUTING.md).
This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](.github/CODE_OF_CONDUCT.md) code of conduct.`;

  this.files['Readme.md'] = contents;
}

// SCRIPTS ///////////////////////////////
function createScripts() {
  const contents = {
    server: stripIndent`
      #!/bin/sh

      # Launch the application and any extra required processes locally.

      set -e

      cd "$(dirname "$0")/.."

      # ensure everything in the app is up to date.
      script/update

      # If no NODE_ENV is set, default to development
      test -z "$NODE_ENV" &&
        NODE_ENV="development"

      # If NODE_INSPECT is truthly launch node with --inspect
      if [ -n "$NODE_INSPECT" ]
      then
        echo "==> Starting the server in debug mode..."
        npm run debug
      else
        echo "==> Starting the server..."
        npm start
      fi`,
    bench: stripIndent`
      #!/bin/sh

      # Run bench mark test suite for application.

      set -e

      cd "$(dirname "$0")/.."

      [ -z "$DEBUG" ] || set -x

      export NODE_ENV="test" # Ensure we are in test environment

      script/reset -f

      echo "===> Running benchmarks..."
      npm run bench`,
    reset: stripIndent`
      #!/bin/sh

      # Reset the application to factory defaults

      set -e

      cd "$(dirname "$0")/.."

      script/update

      # TODO: Add additional reset commands here.`,
    bootstrap: stripIndent`
      #!/bin/sh

      # Resolve all dependencies that the application requires to run.

      set -e

      cd "$(dirname "$0")/.."

      echo "==> Installing Node dependencies..."
      npm install`,
  };

  this.executables.script = this.executables.script || {};
  this.executables.script.server = contents.server;
  this.executables.script.bench = contents.bench;
  this.executables.script.reset = contents.reset;
  this.executables.script.bootstrap = contents.bootstrap;
}

// /////////////////////////////////////////
// Public Methods
// /////////////////////////////////////////

class ServiceProjectDecorator extends ProjectDecorator {
  constructor(projectTemplate, latestVersion, port) {
    super(projectTemplate);

    Object.defineProperty(this, 'port', {
      enumerable: true,
      value: Number.isInteger(port) ? port : getRandomPort(1000, 9999),
    });

    Object.defineProperty(this, 'latestVersion', {
      value: latestVersion,
    });
  }

  build() {
    return this.projectTemplate.build()
      .then(() => updatePackageJson.call(this))
      .then(() => {
        updateDocker.call(this);
        updateESLint.call(this);
        createStatusRoute.call(this);
        createEntryPoint.call(this);
        createReadMe.call(this);
        createScripts.call(this);
      })
      .then(() => ({ files: this.files, executables: this.executables }));
  }
}

module.exports = {
  ServiceProjectDecorator,
};
