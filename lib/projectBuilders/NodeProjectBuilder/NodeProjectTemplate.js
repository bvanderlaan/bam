'use strict';

const { stripIndent } = require('common-tags');

const npmService = require('./npmService');


// /////////////////////////////////////////
// Private Methods
// /////////////////////////////////////////

// GIT ///////////////////////////////////
function createGitIgnore() {
  const contents = stripIndent`
  node_modules/
  reports/
  .vscode/
  npm-debug.log`;

  this.files['.gitignore'] = contents;
}

function createGitAttributes() {
  const contents = stripIndent`
  script/* text eol=lf`;

  this.files['.gitattributes'] = contents;
}

function createLicense() {
  const contents = stripIndent`
  The MIT License (MIT)

  Copyright (c) 2018 Scott IT London

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.`;

  this.files.LICENSE = contents;
}

// GITHUB ////////////////////////////////
function createGitHub() {
  const enforcerEmail = 'brad.vanderlaan@gmail.com';
  const gitHub = {
    codeOfConduct: stripIndent`
    # Contributor Covenant Code of Conduct

    ## Our Pledge

    In the interest of fostering an open and welcoming environment, we as contributors and maintainers pledge to making participation in our project and our community a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

    ## Our Standards

    Examples of behavior that contributes to creating a positive environment include:

    * Using welcoming and inclusive language
    * Being respectful of differing viewpoints and experiences
    * Gracefully accepting constructive criticism
    * Focusing on what is best for the community
    * Showing empathy towards other community members

    Examples of unacceptable behavior by participants include:

    * The use of sexualized language or imagery and unwelcome sexual attention or advances
    * Trolling, insulting/derogatory comments, and personal or political attacks
    * Public or private harassment
    * Publishing others' private information, such as a physical or electronic address, without explicit permission
    * Other conduct which could reasonably be considered inappropriate in a professional setting

    ## Our Responsibilities

    Project maintainers are responsible for clarifying the standards of acceptable behavior and are expected to take appropriate and fair corrective action in response to any instances of unacceptable behavior.

    Project maintainers have the right and responsibility to remove, edit, or reject comments, commits, code, wiki edits, issues, and other contributions that are not aligned to this Code of Conduct, or to ban temporarily or permanently any contributor for other behaviors that they deem inappropriate, threatening, offensive, or harmful.

    ## Scope

    This Code of Conduct applies both within project spaces and in public spaces when an individual is representing the project or its community. Examples of representing a project or community include using an official project e-mail address, posting via an official social media account, or acting as an appointed representative at an online or offline event. Representation of a project may be further defined and clarified by project maintainers.

    ## Enforcement

    Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team at ${enforcerEmail}. The project team will review and investigate all complaints, and will respond in a way that it deems appropriate to the circumstances. The project team is obligated to maintain confidentiality with regard to the reporter of an incident. Further details of specific enforcement policies may be posted separately.

    Project maintainers who do not follow or enforce the Code of Conduct in good faith may face temporary or permanent repercussions as determined by other members of the project's leadership.

    ## Attribution

    This Code of Conduct is adapted from the [Contributor Covenant][homepage], version 1.4, available at [http://contributor-covenant.org/version/1/4][version]

    [homepage]: http://contributor-covenant.org
    [version]: http://contributor-covenant.org/version/1/4/
    `,
    issueTemplate: stripIndent`
    ## Description of Issue

    ### Steps to reproduce the behaviour

    ### Expected behaviour

    ### Actual behaviour

    `,
    prTemplate: stripIndent`
    ## Description of Change

    Fixes issue (provide link):

    Depends on:

    `,
    contributing: stripIndent`
    # Contributing to ${this.name}
    First Thanks for helping out :+1::tada: we really appreciate it :tada::+1:

    The following is a set of guidelines for contributing to the ${this.name} project. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

    ## Pull Requests
    All Pull Requests are welcome but to ensure they get committed please make sure you include the following in your PR:

    * Brief description of the issue
    * Results from the automated tests
    * Ensure that tests are updated or new tests are added to properly cover the change in question
    * Impacted areas of application for test focus
    * If dependencies on another PR, include a reference number and describe the dependency
    * End all files with a newline

    ## Environment Variables
    For any options which need to be dynamically set at run time such as URLs to dependant services, port values, or logging levels ensure you do the following:

    * Update the [README](../Readme.md) so we have a single list of all environment variables
    * Use nconf to access the environment variables, do not access them via \`process.env\` direction
    * If the variable has a reasonable default set it in [config](../src/config/index.js) which defines the defaults via \`nconf.defaults(...)\`.
      * **Do not** store secrets in [config](../src/config/index.js)
    * Use the \`docker-compose\` files to set environment specific (i.e. prod, dev, test) values
      * Only list environment variables whose values you are explicitly setting; if you can use the default don't add it to the compose file

    ## Style guides
    ### Git Commit Messages

    * Use the imperative mood ("Add feature" not "Added feature", "Move cursor to..." not "Moves cursor to...")
    * Limit the first line to 72 characters or less
    * Limit each line in the body of the commit to 80 characters or less
    * Reference issues and pull requests liberally after the first line
    * When only changing documentation, include \`[ci skip]\` in the commit description
    * Consider starting the commit message with an applicable emoji:
      * :art: \`:art:\` when improving the format/structure of the code
      * :racehorse: \`:racehorse:\` when improving performance
      * :non-potable_water: \`:non-potable_water:\` when plugging memory leaks
      * :memo: \`:memo:\` when writing docs
      * :penguin: \`:penguin:\` when fixing something on Linux
      * :apple: \`:apple:\` when fixing something on macOS
      * :checkered_flag: \`:checkered_flag:\` when fixing something on Windows
      * :bug: \`:bug:\` when fixing a bug
      * :fire: \`:fire:\` when removing code or files
      * :green_heart: \`:green_heart:\` when fixing the CI build
      * :white_check_mark: \`:white_check_mark:\` when adding tests
      * :lock: \`:lock:\` when dealing with security
      * :arrow_up: \`:arrow_up:\` when upgrading dependencies
      * :arrow_down: \`:arrow_down:\` when downgrading dependencies
      * :shirt: \`:shirt:\` when removing linter warnings

    ### JavaScript

    All JavaScript must adhere to the [Style Guide](https://www.npmjs.com/package/@vanderlaan/eslint-config-vanderlaan) which is a variant of the Airbnb JavaScript Style Guide.

    #### Special Considerations

    * As we don't use \`babel\` you _must_ use the \`use strict\` pragma.
    * Prefer the object spread operator (\`{...anotherObj}\`) to \`Object.assign()\`
    * Prefer the array spread operator (\`[...array]\`) to \`Array.concat()\`
    * Prefer array destruction in promises (\`.then(([a, b, c]) => {..})\`) to non-standard \`.spread((a, b, c) => {..})\`
    * Prefer Arrow Functions (\`() => console.log('hello')\`) to named or anonymous functions (\`function() { console.log('world'); }\`)
    * Prefer Class syntax vs. function constructors/Prototype
    * Inline \`export\`s with expressions whenever possible
      \`\`\`js
      // Use this:
      module.exports = {
        property1: 'hello world',
        myFunction() {..}
      };

      // Instead of:
      const Lib = {
        property1: 'hello world',
        myFunction() {..}
      }

      module.exports = Lib
      \`\`\`
    * Prefer named exports vs. default exports in order to support _tree shaking_ (\`const { ClassName } = require('my-module');\`)
      \`\`\`js
      // Use this:
      class ClassName {
      }

      module.exports = {
        ClassName,
      };

      // Instead of:
      module.exports = class ClassName {
      }
      \`\`\`
    * Place requires in the following order:
      * Built in Node Modules (such as \`path\`)
      * NPM Modules (such as \`sinon-chai\`)
      * Local Modules (using relative paths)
    * Sort all requires in alphabetical order. For local modules sort first by path followed by file name.
    #### :white_check_mark:Good Example
      \`\`\`js
      // good
      const b = require('./b');
      const c = require('./c');
      const a = require('../lib/a');
      \`\`\`
    #### :x:Bad Example
      \`\`\`js
      // bad
      const a = require('../lib/a');
      const c = require('./c');
      const b = require('./b');
      \`\`\`

    ### Tests

    * Include thoughtfully-worded, well-structured [Mocha](https://github.com/mochajs/mocha) tests in the \`./test\` folder.
      * The \`./test\` folder structure should mimic the production folder (i.e. \`./src\`)
    * Tests should be categorized as Unit, Integration, System, and Benchmark. To allow for easy glob patterns mark unit tests with the \`*.unit.js\` extension, integration tests with the \`*.integration.js\` extension, System tests with \`*.system.js\` extension and Benchmark tests with the \`*.bench.js\` extension.
    * The test file should have the same name as the production file it is testing say for the proper file extension (i.e. \`*.unit.js\`, \`*.system.js\`)
    * Testing private functions is discouraged. Needing to test a private function is usually an indication that your service has too many responsibilities and should be split up.
    * Tests should use arrow functions and should never use \`this\`
    * Tests should be using the \`sinon-chai\` expectations for consistency paired with \`chai-as-promised\`
      * Please see the helpful notes here around [testing promises](http://imaginativethinking.ca/heck-test-async-code-mocha/)
    * Tests must follow the pattern _setup - run - assert - destroy_, a describe should still work if it is marked as \`.only\`
    * Treat \`describe\` as a noun or situation.
    * Treat \`it\` as a statement about state or how an operation _should_ change state.

    #### :white_check_mark:Good Example
      \`\`\`js
      describe('GET User Route', () => {
        describe('when user found', () => {
          it('should return 200', () => {...});
          it('should return the user object', () => {...});
        });
        describe('when user not found', () => {
          it('should return 404', () => {...});
        });
      });
      \`\`\`

      #### :x:Bad Example
      \`\`\`js
      describe('GET User Route', () => {
        it('when user found return 200', () => {...});
        it('when user not found return 404', () => {...});
        it('when user found return the user object', () => {...});
      });
      \`\`\`

    ## Additional Notes

    ### Git Branches

    * Branch names should be all lower case. This avoids communication issues when multiple people need to access the same branch, _Check out proj 1234_ is that \`Proj-1234\`, \`proj-1234\` or \`PROJ-1234\`, and also prevents accidental duplication; branch \`proj-1234\` is not the same as \`Proj-1234\` but both can exist. Sticking to lower case saves on confusion.
    * Branch names should be under 50 characters. This makes checking them out and using various git commands easier: less typing.
    * Branch names should use kebab case (snake case but use dash \`-\` instead of underscore \`_\`). A dash stands out more and is not lost by an underline; also to type a dash you only need to push one key.
    * Branch names ideally should include a description of the change to make it easier to know what each branch does without having to look up each issue. The description should be as short as possible.
      * :white_check_mark:**Great Example**: \`proj-1234-type-error-on-update\`
      * :ballot_box_with_check:**Good Example**: \`type-error-on-update\`
      * :x:**Bad Example**: \`this-fixes-a-type-error-on-update\`
      * :x:**Horrible Example**: \`Fixes_typeError_on-update\`
    `,
  };

  this.files['.github'] = {};
  this.files['.github']['CODE_OF_CONDUCT.md'] = gitHub.codeOfConduct;
  this.files['.github']['CONTRIBUTING.md'] = gitHub.contributing;
  this.files['.github']['ISSUE_TEMPLATE.md'] = gitHub.issueTemplate;
  this.files['.github']['PULL_REQUEST_TEMPLATE.md'] = gitHub.prTemplate;
}

// PACKAGE.JSON //////////////////////////
function createPackageJson() {
  const packageJson = {
    name: `@vanderlaan/${this.name}`,
    version: this.version,
    description: this.description,
    main: '',
    repository: {
      type: 'git',
      url: `https://github.com/bvanderlaan/${this.name}`,
    },
    engines: {
      node: '>=8.11.4',
      npm: '~5.6.0',
    },
    keywords: this.keywords,
    license: 'MIT',
    scripts: {
      test: 'JUNIT_REPORT_PATH=./reports/test-report.xml node_modules/.bin/istanbul cover --dir=reports/coverage _mocha -- --reporter mocha-jenkins-reporter --recursive \'test/**/!(*.bench).js\'',
      watch: 'npm test -- --watch',
      lint: 'node_modules/.bin/eslint ./; true',
      'ci-lint': 'mkdir -p ./reports && node_modules/.bin/eslint -f checkstyle ./ > ./reports/checkstyle.xml; true',
    },
    dependencies: {},
    devDependencies: {},
  };

  const devDependencies = [
    '@vanderlaan/eslint-config-vanderlaan',
    'chai',
    'chai-as-promised',
    'istanbul',
    'mocha',
    'mocha-jenkins-reporter',
    'sinon',
    'sinon-chai',
  ];

  return npmService.addDependencies(devDependencies, this.latestVersion)
    .then((deps) => {
      Object.assign(packageJson.devDependencies, deps);
      this.files['package.json'] = JSON.stringify(packageJson, null, 2);
    });
}

// NVM ///////////////////////////////////
function createNVMRC() {
  const contents = 'v8.11.4';

  this.files['.nvmrc'] = contents;
}

// DOCKER ////////////////////////////////
function createDockerIgnore() {
  const contents = stripIndent`
  .git/
  reports/
  .vscode/
  test/
  node_modules/`;

  this.files['.dockerignore'] = contents;
}

function createDockerFile() {
  const contents = stripIndent`
  FROM node:8-alpine

  # The node image removes these packages as they are only needed to build node not to run it
  # Since we update npm package at start up will need these in the image
  RUN apk add --no-cache \
    bash \
    curl \
    gcc \
    g++ \
    make \
    nano \
    python

  # Create directory for the application
  ENV WORKDIR=/usr/src/app
  RUN mkdir -p $WORKDIR
  WORKDIR $WORKDIR

  # Copy required files for install and bootstrap image
  COPY script/ script/
  COPY ./package.json $WORKDIR/
  RUN script/bootstrap

  # Reset npm logging to default levels
  ENV NPM_CONFIG_LOGLEVEL warn

  # Copy application
  COPY . $WORKDIR

  # Run server
  CMD [ "script/server" ]`;

  this.files.Dockerfile = contents;
}

function createDockerComposeDev() {
  this.files['docker-compose.development.yml'] = stripIndent`
    version: '3.2'
    services:
      ${this.name}:
        volumes:
          - .:/usr/src/app
          - node_modules:/usr/src/app/node_modules
        environment:
          - LOG_LEVEL=debug`;
}

function createDockerComposeTest() {
  this.files['docker-compose.test.yml'] = stripIndent`
    version: '3.2'
    services:
      ${this.name}:
        volumes:
          - .:/usr/src/app
          - node_modules:/usr/src/app/node_modules
          - ./reports:/usr/src/app/reports`;
}

function createDockerComposeBase() {
  this.files['docker-compose.yml'] = stripIndent`
    version: '3.2'
    services:
      ${this.name}:
        build: .

    volumes:
      node_modules:`;
}

// ESLINT ////////////////////////////////
function createESLintIgnore() {
  const contents = stripIndent`
  reports/
  build/
  node_modules/`;

  this.files['.eslintignore'] = contents;
}

function createESLintRC() {
  const contents = stripIndent`
  {
    "extends": "@vanderlaan/eslint-config-vanderlaan",
    "rules": {
      "strict": 0
    }
  }`;

  this.files['.eslintrc.json'] = contents;
}

function createTestESLintRC() {
  const contents = stripIndent`
  {
    "extends": "@vanderlaan/eslint-config-vanderlaan/test"
  }`;

  this.files.test = {};
  this.files.test['.eslintrc.json'] = contents;
}

// SCRIPTS ///////////////////////////////

function createTest() {
  const contents = stripIndent`
  #!/bin/sh

  # Run test suite for application. Optionally pass in a path to an
  # individual test file to run a single test.

  set -e

  cd "$(dirname "$0")/.."

  export NODE_ENV="test" # Ensure we are in test environment

  ./script/update

  echo "===> Running tests..."

  if [ -n "$1" ]; then
    # pass arguments to test call. This is useful for calling a single test.
    npm test -- \${@}
  else
    npm test
  fi`;

  this.executables.script = this.executables.script || {};
  this.executables.script.test = contents;
}

function createLinterCheck() {
  const contents = stripIndent`
  #!/bin/sh

  # Run linter checks for application.

  set -e

  cd "$(dirname "$0")/.."

  export NODE_ENV="test" # Ensure we are in test environment

  ./script/update

  echo "===> Running linter checks..."
  npm run lint`;

  this.executables.script = this.executables.script || {};
  this.executables.script.lint = contents;
}

function createUpdate() {
  const contents = stripIndent`
  #!/bin/sh

  # Update the application and its dependencies.

  set -e

  cd "$(dirname "$0")/.."

  echo "==> Removing old dependencies..."
  npm prune

  echo "==> Updating dependencies..."
  npm update`;

  this.executables.script = this.executables.script || {};
  this.executables.script.update = contents;
}

// /////////////////////////////////////////
// Public Methods
// /////////////////////////////////////////

class NodeProjectTemplate {
  constructor(options, latestVersion) {
    const defaults = {
      keywords: '',
    };
    const opt = Object.assign(defaults, options);

    Object.defineProperty(this, 'latestVersion', {
      value: latestVersion,
    });

    Object.defineProperty(this, 'name', {
      enumerable: true,
      value: opt.name,
    });

    Object.defineProperty(this, 'safeName', {
      enumerable: true,
      value: opt.name && opt.name.replace(/-([a-z])/g, g => g[1].toUpperCase()),
    });

    Object.defineProperty(this, 'description', {
      enumerable: true,
      value: opt.description,
    });

    Object.defineProperty(this, 'version', {
      enumerable: true,
      value: opt.version,
    });

    Object.defineProperty(this, 'keywords', {
      enumerable: true,
      value: opt.keywords.split(',').map(s => s.trim())
        .filter(k => k.length),
    });

    Object.defineProperty(this, 'files', {
      enumerable: true,
      value: {},
    });

    Object.defineProperty(this, 'executables', {
      enumerable: true,
      value: {},
    });
  }

  build() {
    if (!this.name || !this.description || !this.version) {
      return Promise.reject(new Error('InvalidInput'));
    }

    return Promise.resolve()
      .then(() => {
        createGitIgnore.call(this);
        createGitAttributes.call(this);
        createLicense.call(this);
        createGitHub.call(this);

        createNVMRC.call(this);

        createDockerIgnore.call(this);
        createDockerFile.call(this);
        createDockerComposeDev.call(this);
        createDockerComposeTest.call(this);
        createDockerComposeBase.call(this);

        createESLintIgnore.call(this);
        createESLintRC.call(this);
        createTestESLintRC.call(this);
      })
      .then(() => createPackageJson.call(this))
      .then(() => {
        createTest.call(this);
        createLinterCheck.call(this);
        createUpdate.call(this);
      })
      .then(() => ({ files: this.files, executables: this.executables }));
  }
}

module.exports = {
  NodeProjectTemplate,
};
