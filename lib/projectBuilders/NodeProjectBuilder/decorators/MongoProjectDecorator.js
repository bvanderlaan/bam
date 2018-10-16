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

// PACKAGE.JSON ///////////////////////////
function updatePackageJson() {
  const packageJson = JSON.parse(this.files['package.json']);
  const prodDeps = [
    'mongoose',
    'mongo-sanitize',
  ];

  if (this.addUsersModel) {
    prodDeps.push('bcrypt');
  }

  return npmService.addDependencies(prodDeps, this.latestVersion)
    .then((deps) => {
      Object.assign(packageJson.dependencies, deps);
      packageJson.dependencies = sortObjectKeys(packageJson.dependencies);
    })
    .then(() => {
      this.files['package.json'] = JSON.stringify(packageJson, null, 2);
    });
}

// DOCKER ////////////////////////////////
function updateDocker() {
  const baseCompose = compose.toJson(this.files['docker-compose.yml']);
  baseCompose.services.mongo = {
    image: 'mongo:4.1',
    expose: ['27017'],
  };
  baseCompose.services[this.name].depends_on = baseCompose.services[this.name].depends_on || [];
  baseCompose.services[this.name].depends_on.push('mongo');

  baseCompose.services[this.name].environment = baseCompose.services[this.name].environment || [];
  baseCompose.services[this.name].environment.push('MONGO_CONTACT_POINT=mongo');
  baseCompose.services[this.name].environment.sort();

  this.files['docker-compose.yml'] = compose.toCompose(baseCompose);

  const testCompose = compose.toJson(this.files['docker-compose.test.yml']);
  testCompose.services.mongo_test = {
    image: 'mongo:4.1',
    expose: ['27017'],
    networks: ['test_net'],
  };
  testCompose.services[this.name].depends_on = testCompose.services[this.name].depends_on || [];
  testCompose.services[this.name].depends_on.push('mongo_test');

  testCompose.services[this.name].environment = testCompose.services[this.name].environment || [];
  testCompose.services[this.name].environment.push('MONGO_CONTACT_POINT=mongo_test');
  testCompose.services[this.name].environment.sort();

  this.files['docker-compose.test.yml'] = compose.toCompose(testCompose);
}

// README ////////////////////////////////
function updateReadme() {
  const t = this.files['Readme.md'].replace(/\|Environment Variable\|Description +\|\s\|:-+\|:-+\|\s((?:\|.*\|\s)*)/gm, (table) => {
    const rows = table.split('\n').filter(r => r.length);

    const newTable = [];
    // header
    newTable.push(rows.shift());
    // |:---|:---|
    newTable.push(rows.shift());

    rows.push('|MONGO_CONTACT_POINT           |The host name or IP address of the Mongo node       |');
    rows.sort();

    return newTable.concat(rows).join('\n');
  })
    .replace(/> TBD - Please fill in the rest./, line => (stripIndent`
#### Mongo
${this.name} uses Mongo for storing its data.

To tell ${this.name} where to find the Mongo server use the \`MONGO_CONTACT_POINT\` environment variable by setting it to the ip/host name for the node.

${this.name} will create the required tables and run any migrations to the data schemas when it boots up.

${line}`));

  this.files['Readme.md'] = t;
}

// CONFIG //////////////////////////////////
function updateConfig() {
  this.files.src.config['mongo.js'] = stripIndent`
  'use strict';

  const nconf = require('../config');

  module.exports = {
    get url() {
      return nconf.get('node_env') === 'test'
       ? 'mongodb://mongo_test:27017/${this.safeName}'
       : 'mongodb://mongo:27017/${this.safeName}';
    },
  };`;
}

// SOURCE /////////////////////////////////

function updateSource() {
  const c = this.files.src['server.js'].replace(/const \{ options: swaggerOptions, spec \} = require\('\.\/config\/swagger'\);/, match => (
    `${match}\nconst { url: mongoURL } = require('./config/mongo');\n`
  ))
    .replace(/const express = require\('express'\);/, match => (
      `${match}\nconst mongoose = require('mongoose');\n`
    ))
    .replace(/const app = express\(\);/, match => (
      `${match}\n\nmongoose.connect(mongoURL, { useNewUrlParser: true });\nmongoose.Promise = global.Promise;\n`
    ));

  this.files.src['server.js'] = c;
}

function addUsers() {
  this.files.src.users = {
    'index.js': stripIndent`
      'use strict';

      const { getModel, createModel } = require('./user.model');

      module.exports = () => (
        {
          get User() {
            return getModel();
          },
        }
      );`,
    'user.model.js': stripIndent`
      'use strict';

      const bcrypt = require('bcrypt');
      const mongoose = require('mongoose');

      /**
       * @swagger
       * components:
       *   schemas:
       *     User:
       *       type: object
       *       required:
       *         - displayName
       *         - email
       *         - password
       *       properties:
       *         id:
       *           type: string
       *           description: A unique ID for the user
       *           example: 7b52608f-897b-41d4-8599-fef76dcaecf1
       *         displayName:
       *           type: string
       *           description: The users display name, the name we show in the app
       *         email:
       *           type: string
       *           description: The users email, used for notifications
       *         password:
       *           type: string
       *           description: The users password, used for logging in and not stored in plain text
       */

      const schema = mongoose.Schema({
        display_name: {
          type: String,
          unique: false,
          required: true,
        },
        local: {
          email: {
            type: String,
            unique: true,
            required: true,
          },
          password: {
            type: String,
            required: true,
          },
        },
      });

      schema.pre('save', function (next) {
        if (this.isModified('local.password')) {
          return bcrypt.genSalt(8)
            .then(salt => bcrypt.hash(this.local.password, salt, null))
            .then((hash) => {
              this.local.password = hash;
              next();
            })
            .catch(next);
        }
        return next();
      });

      schema.methods.validatePassword = function (password) {
        return bcrypt.compareSync(password, this.local.password);
      };

      module.exports = {
        getModel() {
          return mongoose.model('User', schema);
        },
      };`,
  };
}

// /////////////////////////////////////////
// Public Methods
// /////////////////////////////////////////

class MongoProjectDecorator extends ProjectDecorator {
  constructor(projectTemplate, latestVersion, options = {}) {
    super(projectTemplate);

    const opt = Object.assign({ keyspaces: '' }, options);

    Object.defineProperty(this, 'latestVersion', {
      value: latestVersion,
    });

    Object.defineProperty(this, 'addUsersModel', {
      enumerable: true,
      value: !!opt.needsUsers,
    });
  }
  build() {
    return this.projectTemplate.build()
      .then(() => updatePackageJson.call(this))
      .then(() => {
        updateDocker.call(this);
        updateReadme.call(this);
        updateConfig.call(this);
        updateSource.call(this);

        if (this.addUsersModel) {
          addUsers.call(this);
        }
      })
      .then(() => ({ files: this.files, executables: this.executables }));
  }
}

module.exports = {
  MongoProjectDecorator,
};
