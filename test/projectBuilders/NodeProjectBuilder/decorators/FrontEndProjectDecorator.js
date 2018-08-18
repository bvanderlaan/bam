'use strict';

const { stripIndent, stripIndents } = require('common-tags');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');

const { FrontEndProjectDecorator } = require('../../../../lib/projectBuilders/NodeProjectBuilder/decorators');

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
      'docker-compose.yml': 'version: \'3.2\'\nservices:\n  my-test-template:\n    environment:\n      - APP_PORT=2082\n',
      'docker-compose.development.yml': 'version: \'3.2\'\nservices:\n  my-test-template:\n    environment:\n      - APP_PORT=2082\n',
      'docker-compose.test.yml': 'version: \'3.2\'\nservices:\n  my-test-template:\n    environment:\n      - APP_PORT=2082\n',
      'Readme.md': '|Environment Variable|Description                                                                |\n|:-------------------|:--------------------------------------------------------------------------|\n|APP_PORT            |The port the service will listen on. Defaults to `8080`                  |\n',
      '.eslintrc.json': 'use these rules',
      '.eslintignore': 'don\'t check these files',
      '.dockerignore': 'do not upload these files',
      Dockerfile: 'image: node',
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
        'server.js': stripIndents`const { options: swaggerOptions, spec } = require('./config/swagger');
          const bodyParser = require('body-parser');
          app.use('/api', statusRoute);
          Promise.resolve()
            .then(() => console.log('all done'));`,
      },
      test: {
        'index.js': 'console.log(\'test\');',
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
      describe('Front End', () => {
        it('should expose the name property', () => {
          const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
          expect(d.name).to.equal('my-test-template');
        });

        it('should expose the safeName property', () => {
          const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
          expect(d.safeName).to.equal('myTestTemplate');
        });

        it('should expose the description property', () => {
          const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
          expect(d.description).to.equal('a test template for testing');
        });

        it('should expose the version property', () => {
          const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
          expect(d.version).to.equal('1.2.3');
        });

        it('should expose the keywords property', () => {
          const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
          expect(d.keywords).to.deep.equal(['key', 'worlds', 'fubar']);
        });

        it('should expose the files property', () => {
          const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
          expect(d.files).to.deep.equal({
            'package.json': '{ "dependencies": {} }',
          });
        });

        it('should expose the executables property', () => {
          const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
          expect(d.executables).to.deep.equal({
            script: {
              update: 'some bash script',
              test: 'some other bash script',
            },
          });
        });

        describe('Move to backend', () => {
          it('should add a backend folder', () => {
            const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('backend')
              .that.is.an('object');
          });

          it('should move the test folder to under the backend folder', () => {
            const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
            return expect(d.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.not.have.property('test');
                expect(files.backend)
                  .to.have.property('test')
                  .which.is.an('object');
              });
          });

          it('should move the script folder to under the backend folder', () => {
            const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
            return expect(d.build()).to.eventually.be.fulfilled
              .then(({ executables }) => {
                expect(executables).to.not.have.property('script');
                expect(executables.backend)
                  .to.have.property('script')
                  .which.is.an('object');
              });
          });

          it('should move the src folder to under the backend folder', () => {
            const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
            return expect(d.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.not.have.property('src');
                expect(files.backend)
                  .to.have.property('src')
                  .which.is.an('object');
              });
          });

          it('should move the .dockerignore file to under the backend folder', () => {
            const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
            return expect(d.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.not.have.property('.dockerignore');
                expect(files.backend)
                  .to.have.property('.dockerignore')
                  .which.is.a('string');
              });
          });

          it('should move the .eslintignore file to under the backend folder', () => {
            const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
            return expect(d.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.not.have.property('.eslintignore');
                expect(files.backend)
                  .to.have.property('.eslintignore')
                  .which.is.a('string');
              });
          });

          it('should move the .eslintrc.json file to under the backend folder', () => {
            const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
            return expect(d.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.not.have.property('.eslintrc.json');
                expect(files.backend)
                  .to.have.property('.eslintrc.json')
                  .which.is.a('string');
              });
          });

          it('should move the docker-compose.yml file to under the backend folder', () => {
            const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
            return expect(d.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('docker-compose.yml');
                expect(files.backend)
                  .to.have.property('docker-compose.yml')
                  .which.is.a('string');
                expect(files.backend['docker-compose.yml'])
                  .to.not.equal(files['docker-compose.yml']);
              });
          });

          it('should move the docker-compose.development.yml file to under the backend folder', () => {
            const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
            return expect(d.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.not.have.property('docker-compose.development.yml');
                expect(files.backend)
                  .to.have.property('docker-compose.development.yml')
                  .which.is.a('string');
              });
          });

          it('should move the docker-compose.test.yml file to under the backend folder', () => {
            const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
            return expect(d.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.not.have.property('docker-compose.test.yml');
                expect(files.backend)
                  .to.have.property('docker-compose.test.yml')
                  .which.is.a('string');
              });
          });

          it('should move the Dockerfile to under the backend folder', () => {
            const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
            return expect(d.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.not.have.property('Dockerfile');
                expect(files.backend)
                  .to.have.property('Dockerfile')
                  .which.is.a('string');
              });
          });

          it('should move the package.json file to under the backend folder', () => {
            const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
            return expect(d.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.not.have.property('package.json');
                expect(files.backend)
                  .to.have.property('package.json')
                  .which.is.a('string');
              });
          });
        });

        describe('docker-compose', () => {
          it('should rename service to api', () => {
            const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.yml')
              .that.match(/services:\s+api:/);
          });

          it('should update build to point to backend folder', () => {
            const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.yml')
              .that.match(/build: \.\/backend/);
          });

          it('should update volume to say backend', () => {
            const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.yml')
              .that.match(/volumes:\s+backend_node_modules:/);
          });

          it('should add frontend volume', () => {
            const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.yml')
              .that.match(/frontend_node_modules:/);
          });
        });

        it('should create a new readme in the root', () => {
          const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('files')
            .which.has.property('Readme.md')
            .that.match(/project has been split up into a _backend_ and a _frontend_./);
        });


        it('should add a frontend folder', () => {
          const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('files')
            .which.has.property('frontend')
            .that.is.an('object');
        });

        it('should update internal state', () => {
          const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
          return expect(d.build()).to.eventually.be.fulfilled
            .then(({ files, executables }) => {
              expect(files, 'files').to.deep.equals(d.files);
              expect(executables, 'executables').to.deep.equals(d.executables);
            });
        });

        describe('Backend', () => {
          describe('package.json', () => {
            it('should add CORS to the package.json dependencies list', () => {
              const d = new FrontEndProjectDecorator(templateMock, latestVersion, 9999);
              return expect(d.build()).to.eventually.be.fulfilled
                .and.have.property('files')
                .that.has.property('backend')
                .which.has.property('package.json')
                .that.match(/"dependencies": {((.|\n)*)"cors": "\^\S+"/);
            });
          });
        });
      });
    });
  });
});
