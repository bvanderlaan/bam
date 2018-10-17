'use strict';

const { stripIndent } = require('common-tags');

const compose = require('../../composeService');
const npmService = require('../npmService');
const { ProjectDecorator } = require('./ProjectDecorator');

// /////////////////////////////////////////
// Private Methods
// /////////////////////////////////////////
const sortObjectKeys = obj => (
  Object.keys(obj)
    .sort()
    .reduce((newObj, key) => Object.assign(newObj, { [key]: obj[key] }), {})
);

// DOCKER ////////////////////////////////
function updateDocker() {
  const baseCompose = compose.toJson(this.files.backend['docker-compose.yml']);
  const devCompose = compose.toJson(this.files.backend['docker-compose.development.yml']);

  baseCompose.services[this.name].environment = baseCompose.services[this.name].environment || [];
  devCompose.services[this.name].environment = devCompose.services[this.name].environment || [];
  baseCompose.services[this.name].environment = [
    ...baseCompose.services[this.name].environment,
    ...devCompose.services[this.name].environment,
  ];
  baseCompose.services[this.name].environment.sort();

  baseCompose.services[this.name].ports = baseCompose.services[this.name].ports || [];
  devCompose.services[this.name].ports = devCompose.services[this.name].ports || [];
  baseCompose.services[this.name].ports = [
    ...baseCompose.services[this.name].ports,
    ...devCompose.services[this.name].ports,
  ];
  baseCompose.services[this.name].ports.sort();

  baseCompose.services[this.name].build = './backend';
  baseCompose.services[this.name].volumes = [
    './backend:/usr/src/app',
    'backend_node_modules:/usr/src/app/node_modules',
  ];
  baseCompose.volumes = {
    backend_node_modules: undefined,
    frontend_node_modules: undefined,
  };
  baseCompose.services.api = baseCompose.services[this.name];
  delete baseCompose.services[this.name];

  this.files['docker-compose.yml'] = compose.toCompose(baseCompose);
}

// README ////////////////////////////////
function createReadMe() {
  const contents = stripIndent`
# ${this.name}
${this.description}

## Usage

The ${this.name} project has been split up into a _backend_ and a _frontend_.
The [backend](./backend/Readme.md) service has an HTTP RESTful API.
The [frontned](./frontend/Readme.md) hosts a web application.
For details on each check their Readme's.

## Development

### Brining up the ${this.name} Containers

The ${this.name} service and web app have been containerized.
You can start the ${this.name} service and web app on your docker host by:

* Navigate into the ${this.name} directory (the one with the docker-compose file): \`cd ${this.name}\`
* Then bring up the containers with the \`bam up\` command

If you have any issues regarding \`bam\` being an unknown command you can install it with: \`npm install -g @vanderlaan/bam\`.

You can view the logs generated by the ${this.name} service and web app with the \`bam log\` command.
If you want to just view the service logs then run the \`bam log api\` command and if you just want to view the web app logs then run the \`bam log app\` command.

### Style Guide

[The JavaScript Style Guide](https://www.npmjs.com/package/@vanderlaan/eslint-config-vanderlaan) is used for this project so you must comply to that rule set. You can verify your changes are in compliance via the \`npm run lint\` command.

### Contributing

Bug reports and pull requests are welcome. To ensure your contributions are accepted please read and oblige by our [Contribution Guide](.github/CONTRIBUTING.md).
This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](.github/CODE_OF_CONDUCT.md) code of conduct.`;

  this.files['Readme.md'] = contents;
}

// BACKEND FOLDER ///////////////////////
function backendFolder() {
  this.files.backend = {
    src: this.files.src,
    test: this.files.test,
    '.dockerignore': this.files['.dockerignore'],
    '.nvmrc': this.files['.nvmrc'],
    '.eslintignore': this.files['.eslintignore'],
    '.eslintrc.json': this.files['.eslintrc.json'],
    'docker-compose.development.yml': this.files['docker-compose.development.yml'],
    'docker-compose.test.yml': this.files['docker-compose.test.yml'],
    'docker-compose.yml': this.files['docker-compose.yml'],
    Dockerfile: this.files.Dockerfile,
    'package.json': this.files['package.json'],
    'Readme.md': this.files['Readme.md'],
  };
  delete this.files.src;
  delete this.files.test;
  delete this.files['.dockerignore'];
  delete this.files['.eslintignore'];
  delete this.files['.eslintrc.json'];
  delete this.files['docker-compose.development.yml'];
  delete this.files['docker-compose.test.yml'];
  delete this.files.Dockerfile;
  delete this.files['package.json'];

  this.executables.backend = {
    script: this.executables.script,
  };
  delete this.executables.script;
}

// FRONTEND FOLDER //////////////////////
function frontendFolder() {
  this.files.frontend = {

  };
}

// PACKAGE.JSON ///////////////////////////
function updateBackendPackageJson() {
  const packageJson = JSON.parse(this.files.backend['package.json']);

  const prodDeps = [
    'cors',
  ];

  return npmService.addDependencies(prodDeps, this.latestVersion)
    .then((deps) => {
      Object.assign(packageJson.dependencies, deps);
      packageJson.dependencies = sortObjectKeys(packageJson.dependencies);
    })
    .then(() => {
      this.files.backend['package.json'] = JSON.stringify(packageJson, null, 2);
    });
}

// SOURCE /////////////////////////////////

function updateSource() {
  const c = this.files.backend.src['server.js'].replace(/const bodyParser = require\('body-parser'\);/, match => (
      `${match}\nconst cors = require('cors');\n`
    ))
    .replace(/app.use\('\/api', statusRoute\);/, match => (
      `app.use(cors({\n  origin: 'http://localhost:${this.port}',\n  operationSuccessStatus: 200,\n}));\n\n${match}\n`
    ));

  this.files.backend.src['server.js'] = c;
}

// /////////////////////////////////////////
// Public Methods
// /////////////////////////////////////////

class FrontEndProjectDecorator extends ProjectDecorator {
  constructor(projectTemplate, latestVersion, port) {
    super(projectTemplate);

    Object.defineProperty(this, 'latestVersion', {
      value: latestVersion,
    });

    Object.defineProperty(this, 'port', {
      value: port,
    });
  }

  build() {
    return this.projectTemplate.build()
      .then(() => {
        backendFolder.call(this);
        frontendFolder.call(this);
        updateDocker.call(this);
        createReadMe.call(this);
        updateBackendPackageJson.call(this);
        updateSource.call(this);
      })
      .then(() => ({
        files: this.files,
        executables: this.executables,
        backend: {
          files: this.files.backend,
          executables: this.executables.backend,
        },
        frontend: {
          files: this.files.frontend,
          executables: this.executables.frontend,
        },
      }));
  }
}

module.exports = {
  FrontEndProjectDecorator,
};