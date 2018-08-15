'use strict';

const { stripIndent, stripIndents } = require('common-tags');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');

const { CassandraProjectDecorator } = require('../../../../lib/projectBuilders/NodeProjectBuilder/decorators');

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
        'server.js': stripIndents`const { options: swaggerOptions, spec } = require('./config/swagger');
          Promise.resolve()
            .then(() => console.log('all done'));`,
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
      describe('Cassandra', () => {
        it('should expose the name property', () => {
          const d = new CassandraProjectDecorator(templateMock, latestVersion);
          expect(d.name).to.equal('my-test-template');
        });

        it('should expose the safeName property', () => {
          const d = new CassandraProjectDecorator(templateMock, latestVersion);
          expect(d.safeName).to.equal('myTestTemplate');
        });

        it('should expose the description property', () => {
          const d = new CassandraProjectDecorator(templateMock, latestVersion);
          expect(d.description).to.equal('a test template for testing');
        });

        it('should expose the version property', () => {
          const d = new CassandraProjectDecorator(templateMock, latestVersion);
          expect(d.version).to.equal('1.2.3');
        });

        it('should expose the keywords property', () => {
          const d = new CassandraProjectDecorator(templateMock, latestVersion);
          expect(d.keywords).to.deep.equal(['key', 'worlds', 'fubar']);
        });

        it('should expose the files property', () => {
          const d = new CassandraProjectDecorator(templateMock, latestVersion);
          expect(d.files).to.deep.equal({
            'package.json': '{ "dependencies": {} }',
          });
        });

        it('should expose the executables property', () => {
          const d = new CassandraProjectDecorator(templateMock, latestVersion);
          expect(d.executables).to.deep.equal({
            script: {
              update: 'some bash script',
              test: 'some other bash script',
            },
          });
        });

        describe('Options', () => {
          it('should set the keyspaces property to an empty array by default', () => {
            const d = new CassandraProjectDecorator(templateMock, latestVersion);
            expect(d.keyspaces).to.be.an('array').with.lengthOf(0);
          });

          it('should set the keyspaces property if keyspaces provided', () => {
            const options = {
              keyspaces: 'wishlist,tasks',
            };
            const d = new CassandraProjectDecorator(templateMock, latestVersion, options);
            expect(d.keyspaces).to.deep.equal(['wishlist', 'tasks']);
          });
        });

        describe('package.json', () => {
          it('should add cassandra-driver to the package.json dependencies list', () => {
            const d = new CassandraProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"dependencies": {((.|\n)*)"cassandra-driver": "\^\S+"/);
          });

          it('should add bluebird to the package.json dependencies list', () => {
            const d = new CassandraProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('package.json')
              .that.match(/"dependencies": {((.|\n)*)"bluebird": "\^\S+"/);
          });
        });

        describe('docker-compose', () => {
          it('should add cassandra to docker-compose.test.yml', () => {
            const d = new CassandraProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.test.yml')
              .that.match(/image: cassandra:/);
          });

          it('should add dependency on cassandra to service in docker-compose.test.yml', () => {
            const d = new CassandraProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.test.yml')
              .that.match(/depends_on:\s {6}- cassandra/);
          });

          it('should add CASSANDRA_CONTACT_POINTS to services environment variable key in docker-compose.test.yml', () => {
            const d = new CassandraProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.test.yml')
              .that.match(/CASSANDRA_CONTACT_POINTS=cassandra/);
          });

          it('should add CASSANDRA_CONTACT_POINTS to services environment variable key in docker-compose.development.yml', () => {
            const d = new CassandraProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('docker-compose.development.yml')
              .that.match(/CASSANDRA_CONTACT_POINTS=cassandra/);
          });
        });

        describe('Readme', () => {
          it('should add CASSANDRA_CONTACT_POINTS to Readme\'s environment variable table', () => {
            const d = new CassandraProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('Readme.md')
              .that.match(/CASSANDRA_CONTACT_POINTS/);
          });

          it('should add CASSANDRA_KEYSPACE to Readme\'s environment variable table', () => {
            const d = new CassandraProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('Readme.md')
              .that.match(/CASSANDRA_KEYSPACE/);
          });

          it('should add CASSANDRA_REPLICATION__CLASS to Readme\'s environment variable table', () => {
            const d = new CassandraProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('Readme.md')
              .that.match(/CASSANDRA_REPLICATION__CLASS/);
          });

          it('should add CASSANDRA_REPLICATION__FACTOR to Readme\'s environment variable table', () => {
            const d = new CassandraProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('Readme.md')
              .that.match(/CASSANDRA_REPLICATION__FACTOR/);
          });
        });

        describe('Config', () => {
          it('should not add the Cassandra key spaces to the config file if none given', () => {
            const d = new CassandraProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('src')
              .which.has.property('config')
              .which.has.property('index.js')
              .that.not.match(/cassandra_keyspace/);
          });

          it('should add the Cassandra key spaces to the config file', () => {
            const options = {
              keyspaces: 'hello,world',
            };
            const d = new CassandraProjectDecorator(templateMock, latestVersion, options);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('src')
              .which.has.property('config')
              .which.has.property('index.js')
              .that.match(/cassandra_keyspace/);
          });

          it('should add the Cassandra replication strategy to the config file', () => {
            const options = {
              keyspaces: 'hello,world',
            };
            const d = new CassandraProjectDecorator(templateMock, latestVersion, options);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('src')
              .which.has.property('config')
              .which.has.property('index.js')
              .that.match(/cassandra_replication__class/);
          });

          it('should add the Cassandra replication factor to the config file', () => {
            const options = {
              keyspaces: 'hello,world',
            };
            const d = new CassandraProjectDecorator(templateMock, latestVersion, options);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('src')
              .which.has.property('config')
              .which.has.property('index.js')
              .that.match(/cassandra_replication__factor/);
          });
        });

        describe('Scripts', () => {
          it('should add code to wait for Cassandra to be online to test script', () => {
            const d = new CassandraProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('executables')
              .which.has.property('script')
              .which.has.property('test')
              .that.match(/CASSANDRA_CONTACT_POINTS/);
          });

          it('should add code to wait for Cassandra to be online to reset script', () => {
            const d = new CassandraProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('executables')
              .which.has.property('script')
              .which.has.property('reset')
              .that.match(/CASSANDRA_CONTACT_POINTS/);
          });

          it('should add code to drop Cassandra to reset script', () => {
            const d = new CassandraProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('executables')
              .which.has.property('script')
              .which.has.property('reset')
              .that.match(/node script\/drop.cassandra.js/);
          });

          it('should add Cassandra drop script', () => {
            const d = new CassandraProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('script')
              .which.has.property('drop.cassandra.js')
              .that.is.a('string');
          });
        });

        describe('Source', () => {
          it('should import code to create keyspaces and tables in Cassandra', () => {
            const d = new CassandraProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('src')
              .which.has.property('server.js')
              .that.match(/const \{ setup: setupCassie \} = require\('.\/config\/cassandra'\);/);
          });

          it('should call code to create keyspaces and tables in Cassandra', () => {
            const d = new CassandraProjectDecorator(templateMock, latestVersion);
            return expect(d.build()).to.eventually.be.fulfilled
              .and.have.property('files')
              .which.has.property('src')
              .which.has.property('server.js')
              .that.match(/.+(\r\n|\r|\n).+(\r\n|\r|\n)(\r\n|\r|\n)Promise\.resolve\(\)(\r\n|\r|\n) {2}\.then\(\(\) => setupCassie\(\)\)(\r\n|\r|\n)\.then\(\(\) => console\.log\('all done'\)\);/);
          });
        });

        it('should update internal state', () => {
          const d = new CassandraProjectDecorator(templateMock, latestVersion);
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
