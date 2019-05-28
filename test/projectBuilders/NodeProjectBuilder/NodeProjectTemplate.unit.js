'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');

const { NodeProjectTemplate } = require('../../../lib/projectBuilders/NodeProjectBuilder/NodeProjectTemplate');

const { expect } = chai;
chai.use(chaiAsPromised);
chai.use(sinonChai);

function latestVersion() {
  return Promise.resolve('1.2.3');
}

describe('Project builders', () => {
  describe('Node Project Template', () => {
    it('should expose the name property', () => {
      const t = new NodeProjectTemplate({ name: 'my-test-template' }, latestVersion);
      expect(t.name).to.equal('my-test-template');
    });

    it('should expose the safeName property', () => {
      const t = new NodeProjectTemplate({ name: 'my-test-template' }, latestVersion);
      expect(t.safeName).to.equal('myTestTemplate');
    });

    it('should expose the description property', () => {
      const t = new NodeProjectTemplate({ description: 'a test template for testing' }, latestVersion);
      expect(t.description).to.equal('a test template for testing');
    });

    it('should expose the version property', () => {
      const t = new NodeProjectTemplate({ version: '1.2.3' }, latestVersion);
      expect(t.version).to.equal('1.2.3');
    });

    it('should expose the keywords property', () => {
      const t = new NodeProjectTemplate({ keywords: 'key,worlds, fubar' }, latestVersion);
      expect(t.keywords).to.deep.equal(['key', 'worlds', 'fubar']);
    });

    it('should expose the files property', () => {
      const t = new NodeProjectTemplate({}, latestVersion);
      expect(t.files).to.deep.equal({});
    });

    it('should expose the executables property', () => {
      const t = new NodeProjectTemplate({}, latestVersion);
      expect(t.executables).to.deep.equal({});
    });

    describe('Build', () => {
      describe('when no options are provided', () => {
        it('should reject', () => {
          const t = new NodeProjectTemplate({}, latestVersion);
          return expect(t.build()).to.eventually.be.rejectedWith('InvalidInput');
        });
      });

      describe('when no name is provided', () => {
        it('should reject', () => {
          const options = {
            description: 'a test template for testing',
            version: '1.2.3',
          };
          const t = new NodeProjectTemplate(options, latestVersion);
          return expect(t.build()).to.eventually.be.rejectedWith('InvalidInput');
        });
      });

      describe('when no description is provided', () => {
        it('should reject', () => {
          const options = {
            name: 'my-test-template',
            version: '1.2.3',
          };
          const t = new NodeProjectTemplate(options, latestVersion);
          return expect(t.build()).to.eventually.be.rejectedWith('InvalidInput');
        });
      });

      describe('when no version is provided', () => {
        it('should reject', () => {
          const options = {
            name: 'my-test-template',
            description: 'a test template for testing',
          };
          const t = new NodeProjectTemplate(options, latestVersion);
          return expect(t.build()).to.eventually.be.rejectedWith('InvalidInput');
        });
      });

      describe('when all required options are provided', () => {
        it('should return a hash of files and executables', () => {
          const options = {
            name: 'my-test-template',
            description: 'a test template for testing',
            version: '1.2.3',
          };
          const t = new NodeProjectTemplate(options, latestVersion);
          return expect(t.build()).to.eventually.be.fulfilled
            .then(({ files, executables }) => {
              expect(files).to.be.an('object');
              expect(executables).to.be.an('object');
            });
        });

        describe('package.json', () => {
          it('should set package.json name property', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('package.json')
                  .which.matches(/"name": "@vanderlaan\/my-test-template",/);
              });
          });

          it('should set package.json description property', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('package.json')
                  .which.matches(/"description": "a test template for testing",/);
              });
          });

          it('should set package.json version property', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('package.json')
                  .which.matches(/"version": "1.2.3",/);
              });
          });

          it('should set package.json repository property', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('package.json')
                  .which.matches(/"repository": {\s+"type": "git",\s+"url": "https:\/\/github.com\/bvanderlaan\/my-test-template"\s+}/);
              });
          });

          it('should set package.json license property', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('package.json')
                  .which.matches(/"license": "MIT"/);
              });
          });

          it('should not set package.json keywords property if none given', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('package.json')
                  .which.matches(/"keywords": \[\]/);
              });
          });

          it('should set package.json keywords property if given', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
              keywords: 'hello, world, fu,bar',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('package.json')
                  .which.matches(/"keywords": \[\n\s+"hello",\n\s+"world",\n\s+"fu",\n\s+"bar"\n\s+\]/);
              });
          });

          it('should add a ci-lint NPM command to the package.json scripts list', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('package.json')
                  .which.matches(/"scripts": {((.|\n)*)"ci-lint": ".+"/);
              });
          });

          it('should add a test NPM command to the package.json scripts list', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('package.json')
                  .which.matches(/"scripts": {((.|\n)*)"test": ".+"/);
              });
          });

          it('should add a watch NPM command to the package.json scripts list', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('package.json')
                  .which.matches(/"scripts": {((.|\n)*)"watch": ".+"/);
              });
          });

          it('should add a lint NPM command to the package.json scripts list', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('package.json')
                  .which.matches(/"scripts": {((.|\n)*)"lint": ".+"/);
              });
          });

          it('should add a eslint-config-vanderlaan to the package.json devDependencies list', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('package.json')
                  .which.matches(/"devDependencies": {((.|\n)*)"@vanderlaan\/eslint-config-vanderlaan": "\^1.2.3"/);
              });
          });

          it('should add a chai to the package.json devDependencies list', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('package.json')
                  .which.matches(/"devDependencies": {((.|\n)*)"chai": "\^1.2.3"/);
              });
          });

          it('should add a chai-as-promised to the package.json devDependencies list', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('package.json')
                  .which.matches(/"devDependencies": {((.|\n)*)"chai-as-promised": "\^1.2.3"/);
              });
          });

          it('should add a sinon to the package.json devDependencies list', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('package.json')
                  .which.matches(/"devDependencies": {((.|\n)*)"sinon": "\^1.2.3"/);
              });
          });

          it('should add a sinon-chai to the package.json devDependencies list', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('package.json')
                  .which.matches(/"devDependencies": {((.|\n)*)"sinon-chai": "\^1.2.3"/);
              });
          });

          it('should add a mocha to the package.json devDependencies list', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('package.json')
                  .which.matches(/"devDependencies": {((.|\n)*)"mocha": "\^1.2.3"/);
              });
          });

          it('should add a nyc to the package.json devDependencies list', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('package.json')
                  .which.matches(/"devDependencies": {((.|\n)*)"nyc": "\^1.2.3"/);
              });
          });
        });

        describe('GitHub', () => {
          it('should add a Code Of Conduct', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('.github')
                  .which.has.property('CODE_OF_CONDUCT.md')
                  .that.is.a('string');
              });
          });

          it('should add a Contributing Guide lines', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('.github')
                  .which.has.property('CONTRIBUTING.md')
                  .that.is.a('string');
              });
          });

          it('should add a Issue Template', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('.github')
                  .which.has.property('ISSUE_TEMPLATE.md')
                  .that.is.a('string');
              });
          });

          it('should add a PR Template', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('.github')
                  .which.has.property('PULL_REQUEST_TEMPLATE.md')
                  .that.is.a('string');
              });
          });
        });

        describe('Git', () => {
          it('should add a .gitignore file', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('.gitignore')
                  .and.is.a('string');
              });
          });

          it('should add a .gitattributes file', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('.gitattributes')
                  .and.is.a('string');
              });
          });
        });

        describe('docker', () => {
          it('should add a .dockerignore file', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('.dockerignore')
                  .and.is.a('string');
              });
          });

          it('should add a Dockerfile', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('Dockerfile')
                  .and.is.a('string');
              });
          });

          it('should add a docker-compose.yml file', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('docker-compose.yml')
                  .and.is.a('string');
              });
          });

          it('should add a docker-compose.development.yml file', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('docker-compose.development.yml')
                  .and.is.a('string');
              });
          });

          it('should add a docker-compose.test.yml file', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('docker-compose.test.yml')
                  .and.is.a('string');
              });
          });
        });

        describe('ESLint', () => {
          it('should add a .eslintignore file', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('.eslintignore')
                  .and.is.a('string');
              });
          });

          it('should add a .eslintrc.json file', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('.eslintrc.json')
                  .and.is.a('string');
              });
          });

          it('should add a test .eslintrc.json file', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ files }) => {
                expect(files).to.have.property('test')
                  .which.has.property('.eslintrc.json')
                  .that.is.a('string');
              });
          });
        });

        describe('Scripts', () => {
          it('should add a test script', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ executables }) => {
                expect(executables).to.have.property('script')
                  .which.has.property('test')
                  .that.is.a('string');
              });
          });

          it('should add a update script', () => {
            const options = {
              name: 'my-test-template',
              description: 'a test template for testing',
              version: '1.2.3',
            };
            const t = new NodeProjectTemplate(options, latestVersion);
            return expect(t.build()).to.eventually.be.fulfilled
              .then(({ executables }) => {
                expect(executables).to.have.property('script')
                  .which.has.property('update')
                  .that.is.a('string');
              });
          });
        });
      });
    });
  });
});
