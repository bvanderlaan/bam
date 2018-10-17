'use strict';

const { stripIndent, stripIndents } = require('common-tags');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');

const { MongoProjectDecorator } = require('../../../../lib/projectBuilders/NodeProjectBuilder/decorators');

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
      '.eslintrc.json': '  "strict": 0',
      'docker-compose.yml': 'version: \'3.2\'\nservices:\n  my-test-template:\n    environment:\n      - APP_PORT=2082\n',
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
        'server.js': stripIndents`const { options: swaggerOptions, spec } = require('./config/swagger');
          const express = require('express');
          const app = express();`,
      },
    };
    return Promise.resolve({ files: this.files, executables: this.executables });
  },
};

describe('Project builders', () => {
  describe('Node', () => {
    describe('Decorators', () => {
      describe('Mongo', () => {
        it('should expose the name property', () => {
          const d = new MongoProjectDecorator(templateMock, latestVersion);
          expect(d.name).to.equal('my-test-template');
        });

        it('should expose the safeName property', () => {
          const d = new MongoProjectDecorator(templateMock, latestVersion);
          expect(d.safeName).to.equal('myTestTemplate');
        });

        it('should expose the description property', () => {
          const d = new MongoProjectDecorator(templateMock, latestVersion);
          expect(d.description).to.equal('a test template for testing');
        });

        it('should expose the version property', () => {
          const d = new MongoProjectDecorator(templateMock, latestVersion);
          expect(d.version).to.equal('1.2.3');
        });

        it('should expose the keywords property', () => {
          const d = new MongoProjectDecorator(templateMock, latestVersion);
          expect(d.keywords).to.deep.equal(['key', 'worlds', 'fubar']);
        });

        it('should expose the files property', () => {
          const d = new MongoProjectDecorator(templateMock, latestVersion);
          expect(d.files).to.deep.equal({
            'package.json': '{ "dependencies": {} }',
          });
        });

        it('should expose the executables property', () => {
          const d = new MongoProjectDecorator(templateMock, latestVersion);
          expect(d.executables).to.deep.equal({
            script: {
              update: 'some bash script',
              test: 'some other bash script',
            },
          });
        });

        describe('package.json', () => {
          it('should add mongoose to the package.json dependencies list', () => {
            const d = new MongoProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"dependencies": {((.|\n)*)"mongoose": "\^\S+"/);
          });
        });

        describe('docker-compose', () => {
          it('should add mongo to docker-compose.test.yml', () => {
            const d = new MongoProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.test.yml')
              .that.match(/image: mongo/);
          });

          it('should add dependency on mongo to service in docker-compose.test.yml', () => {
            const d = new MongoProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.test.yml')
              .that.match(/depends_on:\s {6}- mongo_test/);
          });

          it('should add mongo to docker-compose.yml', () => {
            const d = new MongoProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.yml')
              .that.match(/image: mongo/);
          });

          it('should add dependency on mongo to service in docker-compose.yml', () => {
            const d = new MongoProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.yml')
              .that.match(/depends_on:\s {6}- mongo/);
          });

          it('should add MONGO_CONTACT_POINT to services environment variable key in docker-compose.test.yml', () => {
            const d = new MongoProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.test.yml')
              .that.match(/MONGO_CONTACT_POINT=mongo_test/);
          });

          it('should add MONGO_CONTACT_POINT to services environment variable key in docker-compose.yml', () => {
            const d = new MongoProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.yml')
              .that.match(/MONGO_CONTACT_POINT=mongo/);
          });
        });

        describe('Readme', () => {
          it('should add MONGO_CONTACT_POINT to Readme\'s environment variable table', () => {
            const d = new MongoProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('Readme.md')
              .that.match(/MONGO_CONTACT_POINT/);
          });
        });

        describe('Source', () => {
          it('should import mongoose', () => {
            const d = new MongoProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('src')
              .which.has.property('server.js')
              .that.match(/const mongoose = require\('mongoose'\);/);
          });

          it('should import code to get mongo URL', () => {
            const d = new MongoProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('src')
              .which.has.property('server.js')
              .that.match(/const \{ url: mongoURL \} = require\('\.\/config\/mongo'\);/);
          });

          it('should call code to connect to Mongo', () => {
            const d = new MongoProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('src')
              .which.has.property('server.js')
              .that.match(/mongoose.connect\(mongoURL, { useNewUrlParser: true }\);/);
          });

          it('should set mongoose to use Native Promises', () => {
            const d = new MongoProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('src')
              .which.has.property('server.js')
              .that.match(/mongoose\.Promise = global\.Promise;/);
          });
        });

        it('should update internal state', () => {
          const d = new MongoProjectDecorator(templateMock, latestVersion);
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
