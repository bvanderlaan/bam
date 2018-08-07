'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');

const { LibraryProjectDecorator } = require('../../../../lib/projectBuilders/NodeProjectBuilder/decorators/LibraryProjectDecorator');

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
      'docker-compose.test.yml': 'version: \'3.2\'\nservices:\n  my-test-template:\n    environment:\n      - APP_PORT=2082\n',
      'docker-compose.development.yml': 'version: \'3.2\'\nservices:\n  my-test-template:\n    environment:\n      - APP_PORT=2082\n',
    };
    return Promise.resolve({ files: this.files, executables: this.executables });
  },
};

describe('Project builders', () => {
  describe('Node', () => {
    describe('Decorators', () => {
      describe('Library', () => {
        it('should expose the name property', () => {
          const d = new LibraryProjectDecorator(templateMock, latestVersion);
          expect(d.name).to.equal('my-test-template');
        });

        it('should expose the safeName property', () => {
          const d = new LibraryProjectDecorator(templateMock, latestVersion);
          expect(d.safeName).to.equal('myTestTemplate');
        });

        it('should expose the description property', () => {
          const d = new LibraryProjectDecorator(templateMock, latestVersion);
          expect(d.description).to.equal('a test template for testing');
        });

        it('should expose the version property', () => {
          const d = new LibraryProjectDecorator(templateMock, latestVersion);
          expect(d.version).to.equal('1.2.3');
        });

        it('should expose the keywords property', () => {
          const d = new LibraryProjectDecorator(templateMock, latestVersion);
          expect(d.keywords).to.deep.equal(['key', 'worlds', 'fubar']);
        });

        it('should expose the files property', () => {
          const d = new LibraryProjectDecorator(templateMock, latestVersion);
          expect(d.files).to.deep.equal({
            'package.json': '{ "dependencies": {} }',
          });
        });

        it('should expose the executables property', () => {
          const d = new LibraryProjectDecorator(templateMock, latestVersion);
          expect(d.executables).to.deep.equal({
            script: {
              update: 'some bash script',
              test: 'some other bash script',
            },
          });
        });

        describe('package.json', () => {
          it('should add the main property to the package.json', () => {
            const d = new LibraryProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"main": "\.\/index\.js"/);
          });

          it('should add bunyan to the package.json dependencies list', () => {
            const d = new LibraryProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"dependencies": {((.|\n)*)"bunyan": "\^\S+"/);
          });

          it('should add lib/ to the package.json files list', () => {
            const d = new LibraryProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"files": \[((.|\n)*)"lib\/"/);
          });
        });

        describe('docker-compose', () => {
          it('should add LOG_LEVEL at WARN to docker-compose.test.yml', () => {
            const d = new LibraryProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.test.yml')
              .that.match(/\s {6}- LOG_LEVEL=warn/);
          });

          it('should add image to docker-compose.yml', () => {
            const d = new LibraryProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.yml')
              .that.match(/\s {4}image: node:6/);
          });

          it('should set working dir in docker-compose.yml', () => {
            const d = new LibraryProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.yml')
              .that.match(/\s {4}working_dir: \/usr\/src\/app/);
          });

          it('should set node_modules volume dir in docker-compose.yml', () => {
            const d = new LibraryProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.yml')
              .that.match(/\s {6}- node_modules:\/usr\/src\/app\/node_modules/);
          });

          it('should set source volume dir in docker-compose.yml', () => {
            const d = new LibraryProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.yml')
              .that.match(/\s {6}- .:\/usr\/src\/app/);
          });
        });

        it('should add index file', () => {
          const d = new LibraryProjectDecorator(templateMock, latestVersion);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('files')
            .which.has.property('index.js')
            .that.is.a('string');
        });

        it('should add index test file', () => {
          const d = new LibraryProjectDecorator(templateMock, latestVersion);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('files')
            .which.has.property('test')
            .which.has.property('index.unit.js')
            .that.is.a('string');
        });

        it('should add library file', () => {
          const d = new LibraryProjectDecorator(templateMock, latestVersion);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('files')
            .which.has.property('lib')
            .which.has.property('myTestTemplate.js')
            .that.is.a('string');
        });

        it('should add library test file', () => {
          const d = new LibraryProjectDecorator(templateMock, latestVersion);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('files')
            .which.has.property('test')
            .which.has.property('myTestTemplate.unit.js')
            .that.is.a('string');
        });

        it('should add a Readme file', () => {
          const d = new LibraryProjectDecorator(templateMock, latestVersion);
          return expect(d.build()).to.eventually.be.fulfilled
            .and.have.property('files')
            .which.has.property('Readme.md')
            .that.is.a('string');
        });

        it('should update internal state', () => {
          const d = new LibraryProjectDecorator(templateMock, latestVersion);
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
