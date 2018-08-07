'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');

const { ServiceProjectDecorator } = require('../../../../lib/projectBuilders/NodeProjectBuilder/decorators/ServiceProjectDecorator');

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
    'package.json': '{}',
  },
  executables: {
    script: {
      update: 'some bash script',
      test: 'some other bash script',
    },
  },
  build() {
    this.files = {
      'package.json': '{ "dependencies": {}, "devDependencies": {}, "scripts": {} }',
      'docker-compose.yml': 'version: \'3.2\'\nservices:\n  my-test-template:\n    environment:\n      - NODE_ENV=production\n',
      'docker-compose.development.yml': 'version: \'3.2\'\nservices:\n  my-test-template:\n    environment:\n      - NODE_ENV=development\n',
      'docker-compose.test.yml': 'version: \'3.2\'\nservices:\n  my-test-template:\n    environment:\n      - NODE_ENV=test\n',
    };
    return Promise.resolve({ files: this.files, executables: this.executables });
  },
};

describe('Project builders', () => {
  describe('Node', () => {
    describe('Decorators', () => {
      describe('Service', () => {
        it('should expose the name property', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          expect(d.name).to.equal('my-test-template');
        });

        it('should expose the safeName property', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          expect(d.safeName).to.equal('myTestTemplate');
        });

        it('should expose the description property', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          expect(d.description).to.equal('a test template for testing');
        });

        it('should expose the version property', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          expect(d.version).to.equal('1.2.3');
        });

        it('should expose the keywords property', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          expect(d.keywords).to.deep.equal(['key', 'worlds', 'fubar']);
        });

        it('should expose the files property', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          expect(d.files).to.deep.equal({
            'package.json': '{}',
          });
        });

        it('should expose the executables property', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          expect(d.executables).to.deep.equal({
            script: {
              update: 'some bash script',
              test: 'some other bash script',
            },
          });
        });
        describe('package.json', () => {
          it('should add the main property to the package.json', () => {
            const d = new ServiceProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"main": "\.\/src\/server\.js"/);
          });

          it('should set the private property to the package.json', () => {
            const d = new ServiceProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"private": true/);
          });

          it('should add a start NPM command to the package.json scripts list', () => {
            const d = new ServiceProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"scripts": {((.|\n)*)"start": "node \.\/src\/server.js"/);
          });

          it('should add a debug NPM command to the package.json scripts list', () => {
            const d = new ServiceProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"scripts": {((.|\n)*)"debug": "node --inspect \.\/src\/server.js"/);
          });

          it('should add a bench NPM command to the package.json scripts list', () => {
            const d = new ServiceProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"scripts": {((.|\n)*)"bench": ".+"/);
          });

          it('should add bunyan to the package.json dependencies list', () => {
            const d = new ServiceProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"dependencies": {((.|\n)*)"bunyan": "\^\S+"/);
          });

          it('should add express to the package.json dependencies list', () => {
            const d = new ServiceProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"dependencies": {((.|\n)*)"express": "\^\S+"/);
          });

          it('should add body-parser to the package.json dependencies list', () => {
            const d = new ServiceProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"dependencies": {((.|\n)*)"body-parser": "\^\S+"/);
          });

          it('should add heapdump to the package.json dependencies list', () => {
            const d = new ServiceProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"dependencies": {((.|\n)*)"heapdump": "\^\S+"/);
          });

          it('should add nconf to the package.json dependencies list', () => {
            const d = new ServiceProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"dependencies": {((.|\n)*)"nconf": "\^\S+"/);
          });

          it('should add api-bench-runner to the package.json devDependencies list', () => {
            const d = new ServiceProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"devDependencies": {((.|\n)*)"api-bench-runner": "\^\S+"/);
          });

          it('should add api-benchmark to the package.json devDependencies list', () => {
            const d = new ServiceProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"devDependencies": {((.|\n)*)"api-benchmark": "\^\S+"/);
          });

          it('should add chai-json-schema to the package.json devDependencies list', () => {
            const d = new ServiceProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"devDependencies": {((.|\n)*)"chai-json-schema": "\^\S+"/);
          });

          it('should add superagent to the package.json devDependencies list', () => {
            const d = new ServiceProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"devDependencies": {((.|\n)*)"superagent": "\^\S+"/);
          });

          it('should add src/ to the package.json files list', () => {
            const d = new ServiceProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"files": \[((.|\n)*)"src\/"/);
          });

          it('should add script/ to the package.json files list', () => {
            const d = new ServiceProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"files": \[((.|\n)*)"script\/"/);
          });
        });

        describe('docker-compose', () => {
          it('should add APP_PORT to docker-compose.yml', () => {
            const d = new ServiceProjectDecorator(templateMock, latestVersion, 4242);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.yml')
              .that.match(/- APP_PORT=4242/);
          });

          it('should add expose to docker-compose.yml', () => {
            const d = new ServiceProjectDecorator(templateMock, latestVersion, 4242);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.yml')
              .that.match(/expose:\s {6}- '4242'/);
          });

          it('should add ports to docker-compose.development.yml', () => {
            const d = new ServiceProjectDecorator(templateMock, latestVersion, 4242);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.development.yml')
              .that.match(/ports:\s {6}- '4242:4242'/);
          });

          it('should add networks to docker-compose.test.yml', () => {
            const d = new ServiceProjectDecorator(templateMock, latestVersion, 4242);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.test.yml')
              .that.match(/ {4}networks:\s {6}- test_net/);
          });

          it('should define a test network in docker-compose.test.yml', () => {
            const d = new ServiceProjectDecorator(templateMock, latestVersion, 4242);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.test.yml')
              .that.match(/ {0}networks:\s {2}test_net:/);
          });

          it('should add HEAPDUMP to docker-compose.test.yml', () => {
            const d = new ServiceProjectDecorator(templateMock, latestVersion, 4242);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.test.yml')
              .that.match(/environment:\s {6}- HEAPDUMP=disabled/);
          });
        });

        it('should add test/.eslintrc.json file', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('files')
            .which.has.property('test')
            .which.has.property('.eslintrc.json')
            .that.is.a('string');
        });

        it('should add server file', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('files')
            .which.has.property('src')
            .which.has.property('server.js')
            .that.is.a('string');
        });

        it('should add test setup file', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('files')
            .which.has.property('test')
            .which.has.property('index.js')
            .that.is.a('string');
        });

        it('should add bench test setup file', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('files')
            .which.has.property('test')
            .which.has.property('index.bench.js')
            .that.is.a('string');
        });

        it('should add config index file', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('files')
            .which.has.property('src')
            .which.has.property('config')
            .which.has.property('index.js')
            .that.is.a('string');
        });

        it('should add config logger file', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('files')
            .which.has.property('src')
            .which.has.property('config')
            .which.has.property('logger.js')
            .that.is.a('string');
        });

        it('should add config monitoring file', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('files')
            .which.has.property('src')
            .which.has.property('config')
            .which.has.property('monitoring.js')
            .that.is.a('string');
        });

        it('should add status router file', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('files')
            .which.has.property('src')
            .which.has.property('status')
            .which.has.property('status.route.js')
            .that.is.a('string');
        });

        it('should add status controller file', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('files')
            .which.has.property('src')
            .which.has.property('status')
            .which.has.property('status.controller.js')
            .that.is.a('string');
        });

        it('should add status index file', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('files')
            .which.has.property('src')
            .which.has.property('status')
            .which.has.property('index.js')
            .that.is.a('string');
        });

        it('should add status unit test file', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('files')
            .which.has.property('test')
            .which.has.property('status')
            .which.has.property('status.unit.js')
            .that.is.a('string');
        });

        it('should add status system test file', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('files')
            .which.has.property('test')
            .which.has.property('status')
            .which.has.property('status.system.js')
            .that.is.a('string');
        });

        it('should add status bench test file', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('files')
            .which.has.property('test')
            .which.has.property('status')
            .which.has.property('status.bench.js')
            .that.is.a('string');
        });

        it('should add server script', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('executables')
            .which.has.property('script')
            .which.has.property('server')
            .that.is.a('string');
        });

        it('should add bootstrap script', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('executables')
            .which.has.property('script')
            .which.has.property('bootstrap')
            .that.is.a('string');
        });

        it('should add a Readme file', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('files')
            .which.has.property('Readme.md')
            .that.is.a('string');
        });

        it('should update internal state', () => {
          const d = new ServiceProjectDecorator(templateMock, latestVersion);
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
