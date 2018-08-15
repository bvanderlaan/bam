'use strict';

const { stripIndent, stripIndents } = require('common-tags');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');

const { PassportProjectDecorator } = require('../../../../lib/projectBuilders/NodeProjectBuilder/decorators');

const { expect } = chai;
chai.use(chaiAsPromised);
chai.use(sinonChai);

function latestVersion() {
  return Promise.resolve('1.2.3');
}

const templateMock = {
  name: 'my-test-template',
  safeName: 'myTestTemplate',
  description: 'a test template for testing',
  version: '1.2.3',
  keywords: ['key', 'worlds', 'fubar'],
  files: {
    'package.json': '{ "dependencies": {} }',
  },
  executables: {
    script: {
      update: 'some bash script',
      test: 'some other bash script',
    },
  },
  build() {
    this.files = {
      'package.json': '{ "dependencies": {} }',
      'docker-compose.test.yml': 'version: \'3.2\'\nservices:\n  my-test-template:\n    environment:\n      - APP_PORT=2082\n',
      'docker-compose.development.yml': 'version: \'3.2\'\nservices:\n  my-test-template:\n    environment:\n      - APP_PORT=2082\n',
      'Readme.md': '|Environment Variable|Description                                                                |\n|:-------------------|:--------------------------------------------------------------------------|\n|APP_PORT            |The port the service will listen on. Defaults to `8080`                  |\n',
      src: {
        config: {
          'index.js': stripIndent`
          'use strict';

          const nconf = require('nconf');

          module.exports = nconf.use('memory')
            .env({
              separator: ':',
              lowerCase: true,
              parseValues: true,
            })
            .defaults({
              app_port: 8080,
              heapdump: 'enable',
              log_level: 'warn',
            });
          `,
        },
        'server.js': stripIndents`const helmet = require('helmet');
          const { options: swaggerOptions, spec } = require('./config/swagger');
          app.use(addRequestId({ attributeName: 'requestId' }));`,
      },
    };
    this.executables = {
      script: {
        test: stripIndent`
        set -e

        cd "$(dirname "$0")/.."

        [ -z "$DEBUG" ] || set -x

        export NODE_ENV="test" # Ensure we are in test environment

        echo "Running Setup..."
        `,
        setup: stripIndent`
        set -e

        cd "$(dirname "$0")/.."

        # TODO: Add additional setup commands here.
        `,
        reset: stripIndent`
        set -e

        cd "$(dirname "$0")/.."

        # TODO: Add additional reset commands here.
        `,
      },
    };
    return Promise.resolve({ files: this.files, executables: this.executables });
  },
};

describe('Project builders', () => {
  describe('Node', () => {
    describe('Decorators', () => {
      describe('Passport', () => {
        it('should expose the name property', () => {
          const d = new PassportProjectDecorator(templateMock, latestVersion);
          expect(d.name).to.equal('my-test-template');
        });

        it('should expose the safeName property', () => {
          const d = new PassportProjectDecorator(templateMock, latestVersion);
          expect(d.safeName).to.equal('myTestTemplate');
        });

        it('should expose the description property', () => {
          const d = new PassportProjectDecorator(templateMock, latestVersion);
          expect(d.description).to.equal('a test template for testing');
        });

        it('should expose the version property', () => {
          const d = new PassportProjectDecorator(templateMock, latestVersion);
          expect(d.version).to.equal('1.2.3');
        });

        it('should expose the keywords property', () => {
          const d = new PassportProjectDecorator(templateMock, latestVersion);
          expect(d.keywords).to.deep.equal(['key', 'worlds', 'fubar']);
        });

        it('should expose the files property', () => {
          const d = new PassportProjectDecorator(templateMock, latestVersion);
          expect(d.files).to.deep.equal({
            'package.json': '{ "dependencies": {} }',
          });
        });

        it('should expose the executables property', () => {
          const d = new PassportProjectDecorator(templateMock, latestVersion);
          expect(d.executables).to.deep.equal({
            script: {
              update: 'some bash script',
              test: 'some other bash script',
            },
          });
        });

        describe('package.json', () => {
          it('should add passport to the package.json dependencies list', () => {
            const d = new PassportProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"dependencies": {((.|\n)*)"passport": "\^\S+"/);
          });

          it('should add passport-local to the package.json dependencies list', () => {
            const d = new PassportProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"dependencies": {((.|\n)*)"passport-local": "\^\S+"/);
          });

          it('should add passport-jwt to the package.json dependencies list', () => {
            const d = new PassportProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"dependencies": {((.|\n)*)"passport-jwt": "\^\S+"/);
          });
        });

        describe('docker-compose', () => {
          it('should add JWT_SECRET to services environment variable key in docker-compose.test.yml', () => {
            const d = new PassportProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.test.yml')
              .that.match(/JWT_SECRET=my-secret-shhhh/);
          });

          it('should add JWT_SECRET to services environment variable key in docker-compose.development.yml', () => {
            const d = new PassportProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.development.yml')
              .that.match(/JWT_SECRET=my-secret-shhhh/);
          });
        });

        describe('Readme', () => {
          it('should add JWT_SECRET to Readme\'s environment variable table', () => {
            const d = new PassportProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('Readme.md')
              .that.match(/JWT_SECRET/);
          });
        });

        describe('Config', () => {
          it('should add the passport.js file', () => {
            const d = new PassportProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('src')
              .which.has.property('config')
              .that.has.property('passport.js');
          });
        });

        describe('Source', () => {
          it('should import code to setup passport', () => {
            const d = new PassportProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('src')
              .which.has.property('server.js')
              .that.match(/const passport = require\('.\/config\/passport'\)\(\);/);
          });

          it('should initialize passport', () => {
            const d = new PassportProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('src')
              .which.has.property('server.js')
              .that.match(/app.use\(passport\.initialize\(\)\);/);
          });
        });

        it('should update internal state', () => {
          const d = new PassportProjectDecorator(templateMock, latestVersion);
          return expect(d.build()).to.eventually.be.fulfilled
            .then(({ files, executables }) => {
              expect(files, 'files').to.deep.equals(d.files);
              expect(executables, 'executables').to.deep.equals(d.executables);
            });
        });
      });
    });
  });
});
