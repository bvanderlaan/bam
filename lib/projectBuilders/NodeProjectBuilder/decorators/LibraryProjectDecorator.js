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

// PACKAGE.JSON //////////////////////
function updatePackageJson() {
  const packageJson = JSON.parse(this.files['package.json']);
  packageJson.main = './index.js';
  packageJson.files = packageJson.files || [];
  packageJson.files.push('lib/');

  return npmService.addDependencies(['bunyan'], this.latestVersion)
    .then((deps) => {
      Object.assign(packageJson.dependencies, deps);
      packageJson.dependencies = sortObjectKeys(packageJson.dependencies);
    })
    .then(() => {
      this.files['package.json'] = JSON.stringify(packageJson, null, 2);
    });
}

// DOCKER ///////////////////////////
function updateDocker() {
  const baseCompose = compose.toJson(this.files['docker-compose.yml']);
  delete baseCompose.services[this.name].build;
  baseCompose.services[this.name].image = 'node:6';
  baseCompose.services[this.name].working_dir = '/usr/src/app';
  baseCompose.services[this.name].volumes = baseCompose.services[this.name].volumes || [];
  baseCompose.services[this.name].volumes.push('.:/usr/src/app');
  baseCompose.services[this.name].volumes.push('node_modules:/usr/src/app/node_modules');
  this.files['docker-compose.yml'] = compose.toCompose(baseCompose);

  const testCompose = compose.toJson(this.files['docker-compose.test.yml']);
  delete testCompose.services[this.name].volumes;
  testCompose.services[this.name].environment = testCompose.services[this.name].environment || [];
  testCompose.services[this.name].environment.push('LOG_LEVEL=warn');
  testCompose.services[this.name].environment.sort();
  this.files['docker-compose.test.yml'] = compose.toCompose(testCompose);

  const devCompose = compose.toJson(this.files['docker-compose.development.yml']);
  delete devCompose.services[this.name].volumes;
  this.files['docker-compose.development.yml'] = compose.toCompose(devCompose);

  // Remove Docker file as no Docker Image will be needed to this service
  // The Docker setup is just to run test and linter with our existing tooling.
  delete this.files.Dockerfile;
}

// SOURCE ///////////////////////////
function createEntryPoint() {
  const className = this.safeName.charAt(0).toUpperCase() + this.safeName.slice(1);
  const indexContents = stripIndent`
  'use strict';

  const ${className} = require('./lib/${this.safeName}');

  module.exports = {
    init(options) {
      if (options.log) {
        const { log } = new ${className}({ log: options.log });
        Object.defineProperty(module.exports.${this.safeName}, 'log', {
          value: log,
        });
      }
      return module.exports;
    },

    ${this.safeName}: new ${className}(),
  };`;

  const libContents = stripIndent`
  'use strict';

  const bunyan = require('bunyan');

  const { name, version } = require('../package.json');

  let promiseLib = Promise;

  function hasPromiseMethod(obj, method) {
    return obj[method] || obj.prototype[method];
  }

  function createLogger(logger) {
    if (logger) {
      return logger.child({
        component: name,
        componentVersion: version,
      });
    }

    const log = bunyan.createLogger({ name, version });
    log.warn('No logger passed in, defaulting to terminal logging');
    return log;
  }

  module.exports = class ${className} {
    constructor(options = {}) {
      Object.defineProperty(this, 'log', {
        enumerable: true,
        configurable: true,
        value: createLogger(options.log),
      });

      Object.defineProperty(this, 'Promise', {
        enumerable: true,
        get: () => promiseLib,
        set: (lib) => {
          if ((typeof lib !== 'function')
              || !lib.prototype
              || !hasPromiseMethod(lib, 'then')
              || !hasPromiseMethod(lib, 'catch')
              || !hasPromiseMethod(lib, 'all')) {
            throw new Error('InvalidPromiseLib');
          }
          promiseLib = lib;
        },
      });
    }

    // TODO: Implement Lib
    // Note: Use 'this.Promise' to access the current Promise lib
    //   This way consumers can tell you which Promise lib to use as long
    //   as your just using API's defined in the A+ spec.
  };`;

  const testLibContents = stripIndent`
  'use strict';

  const bunyan = require('bunyan');
  const chai = require('chai');
  const chaiPromise = require('chai-as-promised');
  const sinonChai = require('sinon-chai');
  const sinon = require('sinon');

  const { expect } = chai;
  chai.use(chaiPromise);
  chai.use(sinonChai);

  const ${className} = require('../lib/${this.safeName}');

  describe('${this.name}', () => {
    it('should throw if passed an invalid Promise library', () => {
      const lib = new ${className}();
      expect(() => (lib.Promise = { not: 'a promise lib' }))
        .to.throw('InvalidPromiseLib');
    });

    it('should allow Promise lib to be changed', () => {
      const lib = new ${className}();
      expect(lib.Promise).to.equal(Promise);
      const myPromiseLib = function MyPromise() {};
      myPromiseLib.prototype = {
        hello() {},
        then() {},
        catch() {},
        all() {},
      };
      expect(() => (lib.Promise = myPromiseLib)).to.not.throw();
      expect(lib.Promise).to.equal(myPromiseLib);
    });

    it('should create a child logger if logger passed in', () => {
      const log = bunyan.createLogger({ name: 'test' });
      sinon.spy(log, 'child');
      const lib = new ${className}({ log }); // eslint-disable-line no-unused-vars
      expect(log.child).to.have.been.calledOnce;
      expect(log.child).to.have.been.calledWith({
        component: '@vanderlaan/${this.name}',
        componentVersion: '1.0.0',
      });
    });
  });`;

  const testIndexContents = stripIndent`
  'use strict';

  const bunyan = require('bunyan');
  const chai = require('chai');
  const chaiPromise = require('chai-as-promised');
  const sinonChai = require('sinon-chai');
  const sinon = require('sinon');

  const { expect } = chai;
  chai.use(chaiPromise);
  chai.use(sinonChai);

  const { ${this.safeName}, init } = require('../index');

  describe('${this.name}\\'s Index', () => {
    it('should return an instance of ${className}', () => {
      expect(${this.safeName}).to.exist
        .and.be.an('object');
    });

    it('should create a child logger if logger passed in', () => {
      const log = bunyan.createLogger({ name: 'test' });
      sinon.spy(log, 'child');

      init({ log });

      expect(log.child).to.have.been.calledOnce;
      expect(log.child).to.have.been.calledWith({
        component: '@vanderlaan/${this.name}',
        componentVersion: '1.0.0',
      });
    });
  });`;

  this.files['index.js'] = indexContents;
  this.files.lib = this.files.lib || {};
  this.files.lib[`${this.safeName}.js`] = libContents;
  this.files.test = this.files.test || {};
  this.files.test[`${this.safeName}.unit.js`] = testLibContents;
  this.files.test['index.unit.js'] = testIndexContents;
}

function createReadMe() {
  const contents = stripIndent`
# ${this.name}
${this.description}

## Usage

This library must be initialized prior to use. To do so use the \`init()\` function.

\`\`\`js
const { ${this.safeName} } = require('@vanderlaan/${this.name}').init(options);
\`\`\`

Once Initialized you can access the library simply by requiring it.
\`\`\`js
const { ${this.safeName} } = require('@vanderlaan/${this.name}');
\`\`\`

The supported options are:
* **options.log**: This is a \`bunyan\` logger object.


> TBD - Please fill in the rest.

## Promises

By default the \`${this.name}\` module API's will return *Native ES Promises* for all its async functions. If however your application is using a different Promise implementation as long as it is compatible with the A+ promise spec you can tell \`${this.name}\` to use your promise library of choice via the \`Promise\` property.

\`\`\`js
const BPromise = require('bluebird');
const { ${this.safeName} } = require('@vanderlaan/${this.name}');
${this.safeName}.Promise = BPromise;
\`\`\`

Internally \`${this.name}\` only uses A+ spec'ed Promise APIs so if your Promise library is compatible it will work. This way if your application uses custom promise APIs provided by a special extended promise implementation such as bluebird or Q you can access those APIs directly off of \`${this.name}\`

\`\`\`js
${this.safeName}.doSomething(...)
  .tap(() => console.log('way to go!')); // Tap is not part of A+ and is only available in bluebird or Q
\`\`\`

If you try to set the Promise property to a non-conforming promise library \`${this.name}\` will throw an Error right away (fail fast).

## Development

### Running Tests

To run the tests for \`${this.name}\` use the \`npm test\` command.
Make sure to run \`npm install\` first.

You can have the tests watch for changes and re-run automatically by using the command \`npm run watch\`

This command will also calculate code coverage (shown in terminal), generate a test report (XML), and a LCov code coverage report (HTML). The reports are saved in the \`./reports\` folder.

### Style Guide

[The JavaScript Style Guide](https://www.npmjs.com/package/@vanderlaan/eslint-config-vanderlaan) is used for this project so you must comply to that rule set. You can verify your changes are in compliance via the \`npm run lint\` command.

### Contributing

Bug reports and pull requests are welcome. To ensure your contributions are accepted please read and oblige by our [Contribution Guide](.github/CONTRIBUTING.md).
This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](.github/CODE_OF_CONDUCT.md) code of conduct.`;

  this.files['Readme.md'] = contents;
}

// /////////////////////////////////////////
// Public Methods
// /////////////////////////////////////////

class LibraryProjectDecorator extends ProjectDecorator {
  constructor(projectTemplate, latestVersion) {
    super(projectTemplate);

    Object.defineProperty(this, 'latestVersion', {
      value: latestVersion,
    });
  }
  build() {
    return this.projectTemplate.build()
      .then(() => updatePackageJson.call(this))
      .then(() => {
        updateDocker.call(this);
        createEntryPoint.call(this);
        createReadMe.call(this);
      })
      .then(() => ({ files: this.files, executables: this.executables }));
  }
}

module.exports = {
  LibraryProjectDecorator,
};
